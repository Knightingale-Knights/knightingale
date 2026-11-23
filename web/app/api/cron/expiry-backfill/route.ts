import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { DOCS } from "@/lib/compliance/docs";
import { readExpiry } from "@/lib/compliance/expiryReader";
import { copied, fromStorage } from "@/lib/files";
import { melbMidnight } from "@/lib/forms/fields";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// One-off (23 Nov 2026): each carer's latest CPR and first aid record that has a file but no expiry is read
// again. A printed expiry is used, otherwise the issue date + 12 months (CPR) or 3 years (first aid).
// Runs in small batches; each record is noted in app.expiry_backfill so it is only read once.
const BATCH = 12;
const OK_MIME = /^(application\/pdf|image\/(png|jpeg|gif|webp))$/;

async function fileBytes(url: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const own = url.match(/^\/files\/([0-9a-f-]{36})$/i);
  if (own) {
    const [f] = await sql<{ bytes: Buffer; mime: string }[]>`select bytes, mime from app.compliance_files where id = ${own[1]}`;
    return f ? { bytes: Buffer.from(f.bytes), mime: f.mime } : null;
  }
  const abs = url.startsWith("//") ? `https:${url}` : url;
  const c = (await copied(abs)) ?? (await copied(url));
  const res = c ? await fromStorage(c.path) : await fetch(abs).catch(() => null);
  if (!res || !res.ok) return null;
  const mime = (c?.mime ?? res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  return { bytes: Buffer.from(await res.arrayBuffer()), mime };
}

export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
  const done: string[] = [];
  let left = BATCH;
  for (const d of DOCS.filter((x) => x.key === "cpr" || x.key === "first_aid")) {
    if (left <= 0) break;
    const col = d.uploadCol!;
    const recs = await sql<{ id: string; file: string }[]>`
      select x.id, x.file from (
        select distinct on (t.carer) t.id, t.${sql(col)} as file, t.expiry
          from ${sql(`app.${d.table}`)} t order by t.carer, t.created_at desc) x
       where x.expiry is null and coalesce(x.file, '') <> ''
         and not exists (select 1 from app.expiry_backfill b where b.record_id = x.id)
       limit ${left}`;
    for (const r of recs) {
      left--;
      let result: string;
      try {
        const f = await fileBytes(r.file);
        if (!f) result = "no file";
        else if (!OK_MIME.test(f.mime)) result = `unsupported ${f.mime}`;
        else {
          const reading = await readExpiry(f.bytes, f.mime, d.ai!.label, d.ai!.fallbackMonths, today, d.ai!.fromIssueOnly ?? false);
          if (reading?.reason === "document_type_mismatch") result = "not this document";
          else if (reading?.expiryDate) {
            await sql`update ${sql(`app.${d.table}`)} set expiry = ${melbMidnight(reading.expiryDate)}, updated_at = now() where id = ${r.id}`;
            result = `${reading.expiryDate} (${reading.expirySource})`;
          } else result = reading?.reason ?? "no date found";
        }
      } catch (e) {
        result = `error: ${String((e as Error).message ?? e).slice(0, 120)}`;
      }
      await sql`insert into app.expiry_backfill (record_id, doc, result) values (${r.id}, ${d.key}, ${result}) on conflict do nothing`;
      done.push(`${d.key} ${r.id}: ${result}`);
    }
  }
  console.log("expiry backfill", done);
  return NextResponse.json({ ok: true, done });
}
