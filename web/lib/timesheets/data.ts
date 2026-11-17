// Timesheets: every carer's shifts in a date range, with hours by pay rate, receipts and travel.
import { sql } from "@/lib/db";
import { addDays } from "@/lib/roster/rules";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { TRAVEL_RATE } from "@/lib/invoicing/rules";

export type SheetShift = {
  id: string; carer: string; carer_name: string; day: string; kind: "ndis" | "residential";
  start_time: number | null; end_time: number | null; hours: number; roles: string[] | null;
  attended: boolean; has_note: boolean; in_at: Date | null; out_at: Date | null;
  pay_name: string | null; pay_rate: number | null; receipts: number; travel_km: number; who: string | null;
};

export type PayLine = { name: string; rate: number | null; hours: number; pay: number | null };
export type Sheet = {
  carer: string; name: string; shifts: SheetShift[];
  residential: PayLine[]; ndis: PayLine[]; receipts: number; travelKm: number; travel: number; hours: number;
};

/** Shifts from `from` to `to` (both included), not cancelled, with a carer. */
export async function timesheets(from: string, to: string, q = ""): Promise<Sheet[]> {
  const like = q ? `%${q.toLowerCase()}%` : null;
  const rows = await sql<SheetShift[]>`
    select s.id, s.carer, trim(concat_ws(' ', c.first_name, c.last_name)) as carer_name, ${melbDay("s.date")} as day,
           case when s.participant is not null then 'ndis' else 'residential' end as kind,
           s.start_time, s.end_time, coalesce(s.hours, 0)::float8 as hours, s.roles,
           coalesce(s.attended, false) as attended,
           (s.progress_note is not null or exists (select 1 from app.progress_notes n where n.shift = s.id)) as has_note,
           coalesce(s.attend_start, s.check_in_time) as in_at, coalesce(s.attend_end, s.check_out_time) as out_at,
           case when s.participant is not null then n.carer_pay_name else r.name end as pay_name,
           case when s.participant is not null then n.carer_pay else r.carer_pay end::float8 as pay_rate,
           coalesce(s.receipts_total, 0)::float8 as receipts,
           coalesce((select sum(coalesce(l.distance, 0)) from app.shift_logs l
                      where l.shift = s.id or exists (select 1 from app.shifts_travel t where t.shifts_id = s.id and t.shift_logs_id = l.id)), 0)::float8 as travel_km,
           coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), lo.name) as who
      from app.shifts s
      join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations lo on lo.id = s.location
      left join app.ndis_price_items n on n.id = s.ndis_pricing
      left join app.residential_prices r on r.id = s.res_pricing
     where s.date >= ${fromDay(from)} and s.date < ${fromDay(addDays(to, 1))}
       and not coalesce(s.cancelled, false)
       and (${like}::text is null or lower(concat_ws(' ', c.first_name, c.last_name)) like ${like})
     order by c.first_name, c.last_name, s.date, s.start_time`;

  const sheets = new Map<string, Sheet>();
  for (const r of rows) {
    const sh = sheets.get(r.carer) ?? {
      carer: r.carer, name: r.carer_name || "(no name)", shifts: [], residential: [], ndis: [], receipts: 0, travelKm: 0, travel: 0, hours: 0,
    };
    sh.shifts.push(r);
    const lines = r.kind === "ndis" ? sh.ndis : sh.residential;
    const name = r.pay_name ?? "No pay rate";
    let line = lines.find((l) => l.name === name && l.rate === r.pay_rate);
    if (!line) lines.push((line = { name, rate: r.pay_rate, hours: 0, pay: 0 }));
    line.hours += r.hours;
    line.pay = line.rate == null ? null : (line.pay ?? 0) + r.hours * line.rate;
    sh.receipts += r.receipts;
    sh.travelKm += r.travel_km;
    sh.hours += r.hours;
    sheets.set(r.carer, sh);
  }
  for (const sh of sheets.values()) sh.travel = sh.travelKm * TRAVEL_RATE;
  return [...sheets.values()];
}
