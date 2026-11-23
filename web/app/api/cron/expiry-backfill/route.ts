import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { ACCOUNT_DOCS, DOCS } from "@/lib/compliance/docs";
import { readExpiry } from "@/lib/compliance/expiryReader";
import { copied, fromStorage } from "@/lib/files";
import { melbMidnight } from "@/lib/forms/fields";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// One-off (23 Nov 2026): each carer's latest CPR, first aid, WWCC and insurance record that has a file but no
// expiry is read again. A printed expiry is used, otherwise the issue date + 12 months (CPR), 3 years (first aid)
// or 5 years (WWCC). A WWCC card number is filled in when the record has none. AHPRA and NDIS screening too.
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
  const keys = ["ahpra", "wwcc", "insurance", "ndis_screening", "cpr", "first_aid"];
  const defs = [...DOCS, ...ACCOUNT_DOCS].filter((x) => keys.includes(x.key)).sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key));
  for (const d of defs) {
    if (left <= 0) break;
    const col = d.uploadCol!;
    const recs = await sql<{ id: string; file: string }[]>`
      select x.id, x.file from (
        select distinct on (t.carer) t.id,
               ${d.uploadIsArray ? sql`(t.${sql(col)})[array_length(t.${sql(col)}, 1)]` : sql`t.${sql(col)}`} as file, t.${sql(d.expiryCol!)} as expiry
          from ${sql(`app.${d.table}`)} t join app.users u on u.id = t.carer and u.active
         order by t.carer, t.created_at desc) x
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
          const reading = await readExpiry(f.bytes, f.mime, d.ai!.label, d.ai!.fallbackMonths, today, d.ai!.fromIssueOnly ?? false, d.numberLabel);
          if (d.numberCol && reading?.documentNumber && reading.reason !== "document_type_mismatch") {
            await sql`update ${sql(`app.${d.table}`)} set ${sql(d.numberCol)} = ${reading.documentNumber} where id = ${r.id} and coalesce(${sql(d.numberCol)}, '') = ''`;
          }
          if (reading?.reason === "document_type_mismatch") {
            result = "not this document";
            // Wrong CPR / first aid documents are taken off, so the carer is asked to upload the right one (Paul, 23 Nov).
            if (d.key === "cpr" || d.key === "first_aid") {
              await sql`insert into ${sql(`app.${d.table}`)} (carer) select carer from ${sql(`app.${d.table}`)} where id = ${r.id}`;
              result = "not this document (removed)";
            }
          }
          else if (reading?.expiryDate) {
            await sql`update ${sql(`app.${d.table}`)} set ${sql(d.expiryCol!)} = ${melbMidnight(reading.expiryDate)}, updated_at = now() where id = ${r.id}`;
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
