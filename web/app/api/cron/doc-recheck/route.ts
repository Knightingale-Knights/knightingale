import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { docDef, type AccountDocKey } from "@/lib/compliance/docs";
import { readExpiry } from "@/lib/compliance/expiryReader";
import { fileBytes } from "@/lib/compliance/fileBytes";
import { removeDoc } from "@/lib/compliance/data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// One-off (23 Nov 2026): every car insurance document on file, and every qualification certificate of an active
// carer, is read again. Anything that isn't car insurance, or isn't a Cert III / IV or nursing qualification,
// is removed so the carer is asked for the right one. Each file is noted in app.doc_recheck so it's read once.
const BATCH = 16;
const AT_ONCE = 4;
const OK_MIME = /^(application\/pdf|image\/(png|jpeg|gif|webp))$/;

type Job = { carer: string; doc: AccountDocKey; file: string };

async function check(j: Job, today: string): Promise<string> {
  const d = docDef(j.doc)!;
  const f = await fileBytes(j.file);
  if (!f) return "no file";
  if (!OK_MIME.test(f.mime)) return `unsupported ${f.mime}`;
  const r = await readExpiry(f.bytes, f.mime, d.ai!.label, d.ai!.fallbackMonths, today);
  if (!r) return "no reading";
  if (r.reason === "document_type_mismatch") {
    await removeDoc(j.carer, j.doc, j.doc === "certificate" ? [j.file] : undefined);
    return `removed: ${r.mismatchReason ?? r.documentType ?? "wrong document"}`.slice(0, 300);
  }
  if (r.reason?.startsWith("ai_")) throw new Error(r.reason);
  return `ok${r.documentType ? `: ${r.documentType}` : ""}`.slice(0, 300);
}

export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());

  // The WWCC documents the expiry backfill found weren't a WWCC card (before it removed them itself).
  for (const w of await sql<{ record_id: string; carer: string }[]>`
    select b.record_id, t.carer from app.expiry_backfill b join app.wwcc_checks t on t.id = b.record_id where b.result = 'not this document'`) {
    await removeDoc(w.carer, "wwcc");
    await sql`update app.expiry_backfill set result = 'not this document (removed)' where record_id = ${w.record_id}`;
  }

  const jobs = await sql<Job[]>`
    select * from (
      select x.carer, 'insurance' as doc, x.file from (
        select distinct on (t.carer) t.carer, t.insurance as file from app.identity_documents t order by t.carer, t.created_at desc) x
       where coalesce(x.file, '') <> ''
      union all
      select y.carer, 'certificate', unnest(y.transcript) from (
        select distinct on (t.carer) t.carer, t.transcript from app.qualifications t
          join app.users u on u.id = t.carer and u.active and u.account_type = 'carer'
         order by t.carer, t.created_at desc) y
    ) j
    where coalesce(j.file, '') <> '' and not exists (select 1 from app.doc_recheck r where r.doc = j.doc and r.file = j.file)
    limit ${BATCH}`;
  const done: string[] = [];
  for (let i = 0; i < jobs.length; i += AT_ONCE) {
    await Promise.all(jobs.slice(i, i + AT_ONCE).map(async (j) => {
      let result: string;
      try { result = await check(j, today); } catch (e) {
        console.error("doc recheck", j.file, e);
        return; // tried again next run
      }
      await sql`insert into app.doc_recheck (carer, doc, file, result) values (${j.carer}, ${j.doc}, ${j.file}, ${result}) on conflict do nothing`;
      done.push(`${j.doc} ${j.carer}: ${result}`);
    }));
  }
  console.log("doc recheck", done);
  return NextResponse.json({ ok: true, done, left: jobs.length === BATCH });
}
