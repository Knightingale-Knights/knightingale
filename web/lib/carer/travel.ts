// Travel logs and receipts a carer adds to their own NDIS shift.
import { sql } from "@/lib/db";
import { myShift } from "./data";
import { drivingKm, MapsError } from "./maps";
import { readReceipt, type ReceiptReading } from "./receiptReader";
import { isoDate } from "@/lib/invoicing/rules";

type Tx = typeof sql;
export class TravelError extends Error {}

export const MAX_KM = 500;
export const MAX_RECEIPT_BYTES = 3.5 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

async function ownNdisShift(carer: string, shiftId: string, now: Date) {
  const s = await myShift(carer, shiftId);
  if (!s) throw new TravelError("We couldn't find this shift.");
  if (s.kind !== "ndis") throw new TravelError("Travel and receipts are for NDIS shifts.");
  if (s.cancelled) throw new TravelError("This shift has been cancelled.");
  if (!s.start_at || !s.end_at) throw new TravelError("This shift has no times. Please contact the office.");
  // Only on the day of the shift (Melbourne time). An overnight shift can also add them until it ends.
  const onDay = isoDate(now) === s.day || (now >= s.start_at && now <= s.end_at);
  if (!onDay) throw new TravelError("Travel and receipts can only be added on the day of the shift.");
  const [p] = await sql<{ participant: string }[]>`select participant from app.shifts where id = ${shiftId}`;
  return { ...s, participant: p.participant };
}

export type TravelLog = { id: string; from: string | null; to: string | null; km: number; invoiced: boolean; at: Date };

export async function shiftTravel(shiftId: string): Promise<TravelLog[]> {
  return sql<TravelLog[]>`
    select l.id, l.start_location->>'address' as from, l.end_location->>'address' as to, coalesce(l.distance, 0) as km,
           (coalesce(l.invoiced, false) or exists (select 1 from app.invoice_travel x where x.shift_log_id = l.id)) as invoiced, l.created_at as at
      from app.shift_logs l
     where l.shift = ${shiftId} or exists (select 1 from app.shifts_travel t where t.shifts_id = ${shiftId} and t.shift_logs_id = l.id)
     order by l.created_at`;
}

/** Works out the driving distance and logs it against the shift (Bubble's From / To travel log). */
export async function addTravel(carer: string, shiftId: string, from: string, to: string, now = new Date(), km?: (a: string, b: string) => Promise<number>) {
  const a = from.trim().slice(0, 300);
  const b = to.trim().slice(0, 300);
  if (a.length < 3 || b.length < 3) throw new TravelError("Enter where you travelled from and to.");
  const s = await ownNdisShift(carer, shiftId, now);
  let distance: number;
  try {
    distance = await (km ?? drivingKm)(a, b);
  } catch (e) {
    throw new TravelError(e instanceof MapsError ? e.message : "We couldn't work out the distance. Please try again.");
  }
  if (distance <= 0) throw new TravelError("Those addresses are the same place.");
  if (distance > MAX_KM) throw new TravelError(`That's over ${MAX_KM} km. Please contact the office.`);
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const [row] = await tx<{ id: string }[]>`
      insert into app.shift_logs (carer, participant, shift, date, distance, start_location, end_location, log_type, invoiced, created_by)
      values (${carer}, ${s.participant}, ${shiftId}, ${now}, ${distance}, ${sql.json({ address: a })}, ${sql.json({ address: b })}, 'travel', false, ${carer})
      returning id`;
    await tx`insert into app.shifts_travel (shifts_id, shift_logs_id) values (${shiftId}, ${row.id}) on conflict do nothing`;
    return { id: row.id, km: distance };
  });
}

/** A carer can remove their own travel log until it has been invoiced. */
export async function removeTravel(carer: string, logId: string) {
  const [l] = await sql<{ invoiced: boolean }[]>`
    select (coalesce(l.invoiced, false) or exists (select 1 from app.invoice_travel x where x.shift_log_id = l.id)) as invoiced
      from app.shift_logs l where l.id = ${logId} and l.carer = ${carer}`;
  if (!l) throw new TravelError("We couldn't find that travel.");
  if (l.invoiced) throw new TravelError("That travel has been invoiced. Please contact the office.");
  await sql`delete from app.shift_logs where id = ${logId}`;
}

export type Receipt = { id: string; file_name: string; total: number | null; merchant: string | null; needs_review: boolean; at: Date };

export async function shiftReceipts(shiftId: string) {
  const files = await sql<Receipt[]>`
    select id, file_name, total, merchant, needs_review, created_at as at from app.receipt_files where shift = ${shiftId} order by created_at`;
  const [s] = await sql<{ total: number | null; old_files: number }[]>`
    select receipts_total as total, coalesce(cardinality(receipts), 0) as old_files from app.shifts where id = ${shiftId}`;
  return { files, total: s?.total ?? null, oldFiles: s?.old_files ?? 0 };
}

/** Keeps the receipt, reads its total, and adds it to the shift's receipts total, as Bubble did. */
export async function addReceipt(
  carer: string, shiftId: string, file: { name: string; type: string; bytes: Buffer }, now = new Date(),
  read: (b: Buffer, m: string) => Promise<ReceiptReading | null> = readReceipt,
) {
  if (!RECEIPT_TYPES.includes(file.type)) throw new TravelError("Upload a photo or a PDF of the receipt.");
  if (!file.bytes.length) throw new TravelError("That file is empty.");
  if (file.bytes.length > MAX_RECEIPT_BYTES) throw new TravelError("That file is too big. Please take a photo of the receipt instead.");
  await ownNdisShift(carer, shiftId, now);
  const r = await read(file.bytes, file.type);
  const name = (file.name || "receipt").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const [row] = await tx<{ id: string }[]>`
      insert into app.receipt_files (shift, carer, file_name, mime, bytes, total, merchant, needs_review, reason, created_at)
      values (${shiftId}, ${carer}, ${name}, ${file.type}, ${file.bytes}, ${r?.total ?? null}, ${r?.merchant ?? null},
              ${r ? r.needsReview : true}, ${r ? r.reason : "not_read"}, ${now})
      returning id`;
    if (r?.total != null && !r.needsReview) {
      await tx`update app.shifts set receipts_total = round((coalesce(receipts_total, 0) + ${r.total})::numeric, 2) where id = ${shiftId}`;
    }
    return { id: row.id, reading: r };
  });
}

/** A carer can delete their own receipt until the shift has been invoiced. Takes its amount off the shift's total. */
export async function removeReceipt(carer: string, id: string) {
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const [f] = await tx<{ shift: string; total: number | null; needs_review: boolean; invoiced: boolean }[]>`
      select r.shift, r.total::float8 as total, coalesce(r.needs_review, true) as needs_review,
             (coalesce(s.invoiced, false) or s.invoice is not null) as invoiced
        from app.receipt_files r join app.shifts s on s.id = r.shift
       where r.id = ${id} and r.carer = ${carer}
       for update of r`;
    if (!f) throw new TravelError("We couldn't find that receipt.");
    if (f.invoiced) throw new TravelError("This shift has been invoiced. Please contact the office.");
    await tx`delete from app.receipt_files where id = ${id}`;
    if (f.total != null && !f.needs_review) {
      await tx`update app.shifts set receipts_total = greatest(0, round((coalesce(receipts_total, 0) - ${f.total})::numeric, 2)) where id = ${f.shift}`;
    }
    return f.shift;
  });
}

/** For the file route: the receipt, if this person may see it (its carer, or staff). */
export async function receiptFile(id: string, viewer: { id: string; role: string }) {
  const [f] = await sql<{ file_name: string; mime: string; bytes: Buffer; carer: string | null }[]>`
    select file_name, mime, bytes, carer from app.receipt_files where id = ${id}`;
  if (!f) return null;
  if (viewer.role !== "admin" && f.carer !== viewer.id) return null;
  return f;
}
