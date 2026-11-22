import { sql } from "@/lib/db";
import { addDays, clashes, hoursBetween, parseClock, price, slotsFor, weeklyDates, type ShiftKind } from "./rules";
import { carerBookings, fromDay, melbDay } from "./queries";
import { rosterProblems } from "@/lib/compliance/data";

type Tx = typeof sql;

export type ShiftInput = {
  kind: ShiftKind;
  day: string; // yyyy-mm-dd
  start: string;
  end: string;
  hours: string; // blank = work it out from the times
  carer: string | null;
  participant: string | null; // NDIS
  location: string | null; // residential
  priceItem: string; // ndis_price_items.id (NDIS) or residential_prices.id (residential)
  role: string;
  notes: string;
  supervisor: string;
  repeatUntil: string | null; // new shifts only: repeat weekly up to this day
};

export type SaveResult = { ids: string[]; warnings: string[] };

const ROLE = /^[a-z_]+$/;

function validate(i: ShiftInput) {
  const start = parseClock(i.start);
  const end = parseClock(i.end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.day)) throw new Error("Choose a date.");
  if (start == null || end == null) throw new Error("Enter start and end times like 09:30.");
  if (i.kind === "ndis" && !i.participant) throw new Error("Choose a participant.");
  if (i.kind === "residential" && !i.location) throw new Error("Choose a location.");
  if (!i.priceItem) throw new Error(i.kind === "ndis" ? "Choose an NDIS item." : "Choose a rate.");
  if (!ROLE.test(i.role)) throw new Error("Choose a role.");
  const hours = i.hours.trim() === "" ? hoursBetween(start, end) : Number(i.hours);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error("Hours must be between 0 and 24.");
  return { start, end, hours };
}

async function priceItem(tx: Tx, kind: ShiftKind, id: string) {
  const rows = kind === "ndis"
    ? await tx<{ rate: number | null; hourly_revenue: number | null; carer_pay: number | null }[]>`
        select item_price as rate, hourly_revenue, carer_pay from app.ndis_price_items where id = ${id}`
    : await tx<{ rate: number | null; hourly_revenue: number | null; carer_pay: number | null }[]>`
        select rate, hourly_revenue, carer_pay from app.residential_prices where id = ${id}`;
  if (!rows[0]) throw new Error("That price item no longer exists.");
  return rows[0];
}

/** Address and coordinator come from the participant (NDIS) or location (residential), as in Bubble. */
async function context(tx: Tx, i: ShiftInput) {
  if (i.kind === "ndis") {
    const [p] = await tx<{ address: unknown; coordinator: string | null }[]>`
      select address, coordinator from app.users where id = ${i.participant} and account_type = 'participant'`;
    if (!p) throw new Error("That participant no longer exists.");
    return p;
  }
  const [l] = await tx<{ address: unknown }[]>`select address from app.locations where id = ${i.location}`;
  if (!l) throw new Error("That location no longer exists.");
  return { address: l.address, coordinator: null };
}

async function clashWarnings(tx: Tx, carer: string | null, day: string, start: number, end: number, excludeId: string | null, ndis = false) {
  if (!carer) return [];
  const others = await carerBookings(carer, day, excludeId, tx);
  const me = { id: "new", day, start_time: start, end_time: end };
  const hit = others.filter((o) => clashes(me, o));
  const out = hit.length ? [`This carer already has ${hit.length > 1 ? `${hit.length} shifts` : "a shift"} overlapping ${day}.`] : [];
  const docs = await rosterProblems(carer, day, ndis, tx);
  if (docs.length) out.push(`Check this carer's documents: ${docs.join(", ")}.`);
  return out;
}

/** Marks the carer's matching availability slots as taken. */
async function takeSlots(tx: Tx, carer: string | null, day: string, start: number, end: number) {
  if (!carer) return;
  await tx`
    update app.availability set accepted = 'YES', available = false
     where carer = ${carer} and date >= ${fromDay(day)} and date < ${fromDay(addDays(day, 1))}
       and shift = any(${slotsFor(start, end)}::text[])`;
}

/** Frees slots this carer no longer needs on that day (no other live shift covers them). */
async function releaseSlots(tx: Tx, carer: string | null, day: string) {
  if (!carer) return;
  const still = await tx<{ start_time: number; end_time: number }[]>`
    select start_time, end_time from app.shifts
     where carer = ${carer} and not coalesce(cancelled, false) and start_time is not null and end_time is not null
       and date >= ${fromDay(day)} and date < ${fromDay(addDays(day, 1))}`;
  const kept = new Set(still.flatMap((s) => slotsFor(s.start_time, s.end_time)));
  await tx`
    update app.availability set accepted = 'pending', available = true
     where carer = ${carer} and accepted = 'YES'
       and date >= ${fromDay(day)} and date < ${fromDay(addDays(day, 1))}
       and not (shift = any(${[...kept]}::text[]))`;
}

/** Locks the shift for a change. Invoiced shifts can still be edited by staff, but not deleted. */
async function assertEditable(tx: Tx, id: string, allowInvoiced = true) {
  const [s] = await tx<{ invoiced: boolean; carer: string | null; day: string }[]>`
    select (coalesce(invoiced, false) or exists (select 1 from app.invoice_shifts x where x.shift_id = s.id)) as invoiced,
           carer, ${melbDay("date")} as day
      from app.shifts s where id = ${id} for update`;
  if (!s) throw new Error("That shift no longer exists.");
  if (s.invoiced && !allowInvoiced) throw new Error("This shift is on an invoice, so it can't be deleted. Void the invoice first.");
  return s;
}

export async function createShifts(i: ShiftInput, createdBy: string | null): Promise<SaveResult> {
  const { start, end, hours } = validate(i);
  const days = weeklyDates(i.day, i.repeatUntil);
  return sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const p = price(hours, await priceItem(t, i.kind, i.priceItem));
    const ctx = await context(t, i);
    const recurring = days.length > 1 ? `weekly until ${days[days.length - 1]}` : null;
    const ids: string[] = [];
    const warnings: string[] = [];
    for (const day of days) {
      warnings.push(...(await clashWarnings(t, i.carer, day, start, end, null, i.kind === "ndis")));
      const [row] = await t<{ id: string }[]>`
        insert into app.shifts (
          date, start_time, end_time, hours, rate, fee, revenue, wage, roles,
          carer, participant, coordinator, location, address,
          ndis_pricing, res_pricing, notes, supervisor, recurring,
          accepted, cancelled, attended, invoiced, csv, created_by,
          abn, gst_code, registration)
        values (
          ${fromDay(day)}, ${start}, ${end}, ${hours}, ${p.rate}, ${p.fee}, ${p.revenue}, ${p.wage}, ${[i.role]}::text[],
          ${i.carer}, ${i.kind === "ndis" ? i.participant : null}, ${ctx.coordinator},
          ${i.kind === "residential" ? i.location : null}, ${ctx.address ? sql.json(ctx.address as never) : null},
          ${i.kind === "ndis" ? i.priceItem : null}, ${i.kind === "residential" ? i.priceItem : null},
          ${i.notes || null}, ${i.supervisor || null}, ${recurring},
          true, false, false, false, false, ${createdBy},
          '50405424095', 'P2', '4053437425')
        returning id`;
      ids.push(row.id);
      await takeSlots(t, i.carer, day, start, end);
    }
    return { ids, warnings: [...new Set(warnings)] };
  });
}

export async function updateShift(id: string, i: ShiftInput): Promise<SaveResult> {
  const { start, end, hours } = validate(i);
  return sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const before = await assertEditable(t, id);
    const p = price(hours, await priceItem(t, i.kind, i.priceItem));
    const ctx = await context(t, i);
    const warnings = await clashWarnings(t, i.carer, i.day, start, end, id, i.kind === "ndis");
    await t`
      update app.shifts set
        date = ${fromDay(i.day)}, start_time = ${start}, end_time = ${end}, hours = ${hours},
        rate = ${p.rate}, fee = ${p.fee}, revenue = ${p.revenue}, wage = ${p.wage}, roles = ${[i.role]}::text[],
        carer = ${i.carer}, participant = ${i.kind === "ndis" ? i.participant : null}, coordinator = ${ctx.coordinator},
        location = ${i.kind === "residential" ? i.location : null},
        address = ${ctx.address ? sql.json(ctx.address as never) : null},
        ndis_pricing = ${i.kind === "ndis" ? i.priceItem : null}, res_pricing = ${i.kind === "residential" ? i.priceItem : null},
        notes = ${i.notes || null}, supervisor = ${i.supervisor || null}
      where id = ${id}`;
    await releaseSlots(t, before.carer, before.day);
    await takeSlots(t, i.carer, i.day, start, end);
    return { ids: [id], warnings };
  });
}

export async function setCancelled(id: string, cancelled: boolean) {
  await sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const s = await assertEditable(t, id);
    await t`update app.shifts set cancelled = ${cancelled} where id = ${id}`;
    if (cancelled) await releaseSlots(t, s.carer, s.day);
    else {
      const [r] = await t<{ start_time: number; end_time: number }[]>`select start_time, end_time from app.shifts where id = ${id}`;
      await takeSlots(t, s.carer, s.day, r.start_time, r.end_time);
    }
  });
}

export async function deleteShift(id: string) {
  await sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const s = await assertEditable(t, id, false);
    const [{ notes }] = await t<{ notes: number }[]>`select count(*)::int as notes from app.progress_notes where shift = ${id}`;
    if (notes) throw new Error("This shift has a progress note, so cancel it instead of deleting it.");
    await t`delete from app.shifts where id = ${id}`;
    await releaseSlots(t, s.carer, s.day);
  });
}

/** Copies a shift to other days, keeping everything except attendance and invoicing. */
export async function copyShift(id: string, days: string[], createdBy: string | null): Promise<SaveResult> {
  if (!days.length) throw new Error("Choose at least one day to copy to.");
  return sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const [src] = await t<{ carer: string | null; start_time: number; end_time: number; ndis: boolean }[]>`
      select carer, start_time, end_time, participant is not null as ndis from app.shifts where id = ${id}`;
    if (!src) throw new Error("That shift no longer exists.");
    const ids: string[] = [];
    const warnings: string[] = [];
    for (const day of days) {
      warnings.push(...(await clashWarnings(t, src.carer, day, src.start_time, src.end_time, null, src.ndis)));
      const [row] = await t<{ id: string }[]>`
        insert into app.shifts (
          date, start_time, end_time, hours, rate, fee, revenue, wage, roles, carer, participant, coordinator,
          location, address, ndis_pricing, res_pricing, notes, supervisor,
          accepted, cancelled, attended, invoiced, csv, created_by, abn, gst_code, registration)
        select ${fromDay(day)}, start_time, end_time, hours, rate, fee, revenue, wage, roles, carer, participant, coordinator,
               location, address, ndis_pricing, res_pricing, notes, supervisor,
               true, false, false, false, false, ${createdBy}, abn, gst_code, registration
          from app.shifts where id = ${id}
        returning id`;
      ids.push(row.id);
      await takeSlots(t, src.carer, day, src.start_time, src.end_time);
    }
    return { ids, warnings: [...new Set(warnings)] };
  });
}

/** Records attendance times (e.g. when a carer couldn't check in). Times are Melbourne local. */
export async function markAttended(id: string, start: string, end: string) {
  const s = parseClock(start);
  const e = parseClock(end);
  if (s == null || e == null) throw new Error("Enter attendance times like 09:30.");
  await sql`
    update app.shifts x set attended = true,
      attend_start = ((to_char(x.date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') || ' ' || ${String(s).padStart(4, "0")})::timestamp at time zone 'Australia/Melbourne'),
      attend_end = ((to_char(x.date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') || ' ' || ${String(e).padStart(4, "0")})::timestamp at time zone 'Australia/Melbourne')
                   + (case when ${e <= s} then interval '1 day' else interval '0' end)
     where id = ${id}`;
}
