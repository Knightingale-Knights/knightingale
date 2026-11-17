// Everything a carer can read or change. Every query is scoped to the signed-in carer.
import { sql } from "@/lib/db";
import { addDays, slotsFor, SLOTS } from "@/lib/roster/rules";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { CheckError, NOTE_FIELDS, assertCanCheck, onShiftDay, type Position } from "./rules";
import { fillNoteFields } from "./noteFields";

type Tx = typeof sql;

// Shift start and end as real times, worked out in Melbourne local time (safe across daylight saving).
const startAt = () => sql.unsafe(`((s.date at time zone 'Australia/Melbourne') + make_interval(hours => (s.start_time / 100)::int, mins => (s.start_time % 100)::int)) at time zone 'Australia/Melbourne'`);
const endAt = () => sql.unsafe(`((s.date at time zone 'Australia/Melbourne') + make_interval(days => case when s.end_time <= s.start_time then 1 else 0 end, hours => (s.end_time / 100)::int, mins => (s.end_time % 100)::int)) at time zone 'Australia/Melbourne'`);

export type CarerShift = {
  id: string; day: string; start_time: number | null; end_time: number | null; start_at: Date | null; end_at: Date | null;
  kind: "ndis" | "residential"; place: string | null; address_text: string | null; address: { lat?: number; lng?: number } | null;
  notes: string | null; cancelled: boolean; attend_start: Date | null; attend_end: Date | null;
  note_id: string | null; note_submitted: boolean;
  participant: string | null; participant_name: string | null; wage: number | null; has_logins: boolean;
};

const shiftSelect = () => sql`
  s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time, ${startAt()} as start_at, ${endAt()} as end_at,
  case when s.participant is null then 'residential' else 'ndis' end as kind,
  coalesce(split_part(p.first_name, ' ', 1), l.name) as place,
  s.address->>'address' as address_text, s.address, s.notes, coalesce(s.cancelled, false) as cancelled,
  s.attend_start, s.attend_end, n.id as note_id, coalesce(n.submit, false) as note_submitted,
  s.participant, nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '') as participant_name, s.wage::float8 as wage,
  exists (select 1 from app.location_logins ll where ll.location = s.location) as has_logins`;

const shiftJoins = () => sql`
  left join app.users p on p.id = s.participant
  left join app.locations l on l.id = s.location
  left join lateral (select pn.id, pn.submit from app.progress_notes pn where pn.shift = s.id order by pn.created_at desc limit 1) n on true`;

/** The carer's shifts from a week ago to four weeks ahead. */
export async function myShifts(carer: string, today: string): Promise<CarerShift[]> {
  return sql<CarerShift[]>`
    select ${shiftSelect()} from app.shifts s ${shiftJoins()}
     where s.carer = ${carer} and s.date >= ${fromDay(addDays(today, -7))} and s.date < ${fromDay(addDays(today, 28))}
     order by s.date, s.start_time`;
}

/** The carer's shifts from `from` up to (not including) `to`. */
export async function myShiftsBetween(carer: string, from: string, to: string): Promise<CarerShift[]> {
  return sql<CarerShift[]>`
    select ${shiftSelect()} from app.shifts s ${shiftJoins()}
     where s.carer = ${carer} and s.date >= ${fromDay(from)} and s.date < ${fromDay(to)}
     order by s.date, s.start_time`;
}

export async function myShift(carer: string, id: string, tx: Tx = sql): Promise<CarerShift | null> {
  const [s] = await tx<CarerShift[]>`select ${shiftSelect()} from app.shifts s ${shiftJoins()} where s.id = ${id} and s.carer = ${carer}`;
  return s ?? null;
}

export type LeecareLogin = { id: string; username: string | null; password: string | null };

/** Leecare logins for the location of one of the carer's residential shifts, on the day of that shift only. */
export async function myLeecareLogins(carer: string, id: string, now = new Date()): Promise<LeecareLogin[]> {
  const s = await myShift(carer, id);
  if (!s || s.kind !== "residential" || s.cancelled || !onShiftDay(s, now)) return [];
  return sql<LeecareLogin[]>`
    select ll.id, ll.username, ll.password from app.location_logins ll
      join app.shifts sh on sh.location = ll.location
     where sh.id = ${id} and sh.carer = ${carer}
     order by ll.username`;
}

// ---- check in / out ---------------------------------------------------------

export async function checkIn(carer: string, id: string, pos: Position, now = new Date()) {
  return sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    await t`select 1 from app.shifts where id = ${id} for update`;
    const s = await myShift(carer, id, t);
    if (!s) throw new CheckError("We couldn't find this shift.");
    const distance = assertCanCheck("in", s, pos, now.getTime());
    // Aged care: checking in also records the check-out at the scheduled end, as CarerTexts does.
    const autoOut = s.kind === "residential" ? s.end_at : null;
    await t`
      update app.shifts set attended = true, attend_start = ${now}, check_in_time = ${now},
             attend_end = coalesce(${autoOut}, attend_end), check_out_time = coalesce(${autoOut}, check_out_time)
       where id = ${id}`;
    return { distance, autoCheckedOut: Boolean(autoOut) };
  });
}

export async function checkOut(carer: string, id: string, pos: Position, now = new Date()) {
  return sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    await t`select 1 from app.shifts where id = ${id} for update`;
    const s = await myShift(carer, id, t);
    if (!s) throw new CheckError("We couldn't find this shift.");
    const distance = assertCanCheck("out", s, pos, now.getTime());
    await t`update app.shifts set attend_end = ${now}, check_out_time = ${now} where id = ${id}`;
    return { distance };
  });
}

// ---- availability -----------------------------------------------------------

export type Slot = { day: string; slot: string; available: boolean; booked: boolean };

export async function myAvailability(carer: string, from: string, days: number): Promise<Slot[]> {
  return sql<Slot[]>`
    select ${melbDay("date")} as day, shift as slot, coalesce(available, false) as available, accepted = 'YES' as booked
      from app.availability
     where carer = ${carer} and date >= ${fromDay(from)} and date < ${fromDay(addDays(from, days))}`;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Ticks or unticks one slot. A slot that's already been booked can't be removed here. */
export async function setAvailability(carer: { id: string; name: string; phone: string | null; roles: string[] | null }, day: string, slot: string, on: boolean, today: string) {
  const meta = SLOTS.find((s) => s.value === slot);
  if (!meta) throw new Error("Unknown time slot.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < today) throw new Error("Choose today or a later day.");
  await sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const existing = await t<{ id: string; accepted: string | null }[]>`
      select id, accepted from app.availability
       where carer = ${carer.id} and shift = ${slot} and date >= ${fromDay(day)} and date < ${fromDay(addDays(day, 1))}
       for update`;
    if (existing.some((e) => e.accepted === "YES")) throw new Error("You're already booked for that slot. Contact the office to change it.");
    if (on && !existing.length) {
      const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
      await t`
        insert into app.availability (carer, date, shift, shift_text, available, accepted, role, nurse_name, nurse_phone, weekday, priority, created_by)
        values (${carer.id}, ${fromDay(day)}, ${slot}, ${meta.label}, true, 'pending', ${carer.roles?.[0] ?? null},
                ${carer.name.split(" ")[0]}, ${carer.phone}, ${weekday}, 0, ${carer.id})`;
    } else if (!on && existing.length) {
      await t`delete from app.availability where id = any(${existing.map((e) => e.id)}::uuid[])`;
    }
  });
}

// ---- progress notes ---------------------------------------------------------

/** Saves the carer's summary, links it to the shift, then (best effort) sorts it into the note's fields. */
export async function submitNote(carer: string, id: string, summary: string, extra: { comms?: string; bestDay?: string } = {}) {
  const text = summary.trim();
  const comms = (extra.comms ?? "").trim().slice(0, 4000) || "Nothing to report.";
  const bestDay = (extra.bestDay ?? "").trim().slice(0, 4000) || null;
  if (text.length < 20) throw new Error("Please write a little more about the shift.");
  if (text.length > 8000) throw new Error("That's too long. Please keep it under 8,000 characters.");
  const noteId = await sql.begin(async (tx) => {
    const t = tx as unknown as Tx;
    const s = await myShift(carer, id, t);
    if (!s) throw new Error("We couldn't find this shift.");
    if (s.kind !== "ndis") throw new Error("Progress notes are only needed for NDIS shifts.");
    if (s.cancelled) throw new Error("This shift has been cancelled.");
    if (s.note_submitted) throw new Error("A progress note has already been submitted for this shift.");
    const [row] = await t<{ id: string }[]>`
      insert into app.progress_notes (carer, participant, coordinator, shift, date, summary, comms, best_day, submit, created_by)
      select ${carer}, s.participant, s.coordinator, s.id, s.date, ${text}, ${comms}, ${bestDay}, true, ${carer} from app.shifts s where s.id = ${id}
      returning id`;
    await t`update app.shifts set progress_note = ${row.id} where id = ${id}`;
    return row.id;
  });

  let filled = false;
  try {
    const fields = await fillNoteFields(text);
    if (fields) {
      await sql`update app.progress_notes set ${sql(fields, ...NOTE_FIELDS)} where id = ${noteId}`;
      filled = true;
    }
  } catch (e) {
    console.error("note field filling failed", e);
  }
  return { noteId, filled };
}

export const slotsForShift = slotsFor;
