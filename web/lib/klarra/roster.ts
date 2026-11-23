// Roster changes Paul asks Klarra for by text: find shifts, move or retime a shift, add a participant event.
// Uses the same functions as the admin roster, so pricing, clash checks, Bubble mirroring and Klarra sync all match.
import { sql } from "@/lib/db";
import { getShift } from "@/lib/roster/queries";
import { updateShift, type ShiftInput } from "@/lib/roster/mutate";
import { createEvents } from "@/lib/roster/events";
import { hoursBetween, parseClock } from "@/lib/roster/rules";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { mirrorAvailability, mirrorEvents, mirrorShifts } from "@/lib/bubble/write";
import { pushShifts } from "@/lib/klarra/push";

type Person = { id: string; name: string };
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "0930" or 930 -> "09:30". */
export const clock = (n: number | null) => (n == null ? "" : `${String(Math.floor(n / 100)).padStart(2, "0")}:${String(n % 100).padStart(2, "0")}`);

/** Every word of the name must appear in the person's full name. One match, or an error listing the choices. */
export async function findPerson(name: string, type: "carer" | "participant"): Promise<Person> {
  const words = String(name ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) throw new Error(`Which ${type}?`);
  const rows = await sql<Person[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name from app.users
     where account_type = ${type} and coalesce(active, true)
       and ${words.reduce((a, w) => sql`${a} and lower(concat_ws(' ', first_name, last_name)) like ${"%" + w + "%"}`, sql`true`)}
     order by first_name, last_name limit 6`;
  if (!rows.length) throw new Error(`No ${type} called ${name}.`);
  if (rows.length > 1) {
    const exact = rows.filter((r) => r.name.toLowerCase().split(/\s+/)[0] === words[0]);
    if (exact.length === 1 && words.length === 1) return exact[0];
    throw new Error(`More than one ${type} matches ${name}: ${rows.map((r) => r.name).join(", ")}. Which one?`);
  }
  return rows[0];
}

export type FoundShift = { id: string; day: string; start: string; end: string; carer: string | null; participant: string | null; location: string | null; cancelled: boolean; attended: boolean };

/** Shifts between from and to (inclusive, Melbourne days) for a carer and/or participant. */
export async function findShifts(a: { carer?: string; participant?: string; from: string; to?: string }): Promise<FoundShift[]> {
  if (!DAY.test(a.from) || (a.to && !DAY.test(a.to))) throw new Error("Dates must be YYYY-MM-DD.");
  if (!a.carer && !a.participant) throw new Error("Give a carer or a participant.");
  const carer = a.carer ? await findPerson(a.carer, "carer") : null;
  const participant = a.participant ? await findPerson(a.participant, "participant") : null;
  const to = a.to ?? a.from;
  const rows = await sql<(Omit<FoundShift, "start" | "end"> & { start_time: number | null; end_time: number | null })[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer,
           nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '') as participant,
           l.name as location, coalesce(s.cancelled, false) as cancelled, coalesce(s.attended, false) as attended
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations l on l.id = s.location
     where s.date >= ${fromDay(a.from)} and s.date < ${fromDay(to)} + interval '1 day'
       and (${carer?.id ?? null}::uuid is null or s.carer = ${carer?.id ?? null})
       and (${participant?.id ?? null}::uuid is null or s.participant = ${participant?.id ?? null})
     order by s.date, s.start_time limit 30`;
  return rows.map(({ start_time, end_time, ...r }) => ({ ...r, start: clock(parseClock(start_time)), end: clock(parseClock(end_time)) }));
}

/** Weekday, Saturday or Sunday: NDIS prices differ, so a move across these is flagged. */
const dayClass = (day: string) => ["sunday", "weekday", "weekday", "weekday", "weekday", "weekday", "saturday"][new Date(`${day}T12:00:00Z`).getUTCDay()];

/** Moves a shift to another day and/or changes its times. Anything not given stays as it is. */
export async function editShift(a: { id: string; day?: string; start?: string; end?: string }) {
  const s = await getShift(String(a.id ?? ""));
  if (!s) throw new Error("That shift no longer exists.");
  if (s.cancelled) throw new Error("That shift is cancelled.");
  if (s.attend_start) throw new Error("The carer has already checked in to that shift, so it can't be moved.");
  const day = a.day || s.day;
  if (!DAY.test(day)) throw new Error("The new date must be YYYY-MM-DD.");
  const oldStart = parseClock(s.start_time);
  const oldEnd = parseClock(s.end_time);
  const start = a.start ? parseClock(a.start) : oldStart;
  const end = a.end ? parseClock(a.end) : oldEnd;
  if (start == null || end == null) throw new Error("Times must be like 09:30.");
  const timesChanged = start !== oldStart || end !== oldEnd;
  // Keep any unpaid break the shift had (hours shorter than its times) when the times change.
  const oldSpan = oldStart != null && oldEnd != null ? hoursBetween(oldStart, oldEnd) : null;
  const breakHours = oldSpan != null && s.hours != null ? Math.max(0, Math.round((oldSpan - Number(s.hours)) * 100) / 100) : 0;
  const hours = timesChanged ? String(Math.round((hoursBetween(start, end) - breakHours) * 100) / 100) : s.hours == null ? "" : String(s.hours);
  const i: ShiftInput = {
    kind: s.kind as ShiftInput["kind"], day, start: clock(start), end: clock(end), hours,
    carer: s.carer, participant: s.participant, location: s.location,
    priceItem: (s.kind === "ndis" ? s.ndis_pricing : s.res_pricing) ?? "",
    role: (s.roles ?? [])[0] ?? "", notes: s.notes ?? "", supervisor: s.supervisor ?? "", repeatUntil: null,
  };
  const since = new Date();
  const r = await updateShift(s.id, i);
  const warnings = [...r.warnings];
  if (s.kind === "ndis" && dayClass(day) !== dayClass(s.day)) warnings.push(`Moved from a ${dayClass(s.day)} to a ${dayClass(day)}: check the NDIS item.`);
  try {
    await mirrorShifts([s.id]);
    await mirrorAvailability(since);
  } catch (e) {
    warnings.push(`Saved, but Bubble was not updated: ${(e as Error).message}`);
  }
  await pushShifts([s.id]);
  return {
    id: s.id,
    before: { day: s.day, start: clock(oldStart), end: clock(oldEnd) },
    after: { day, start: clock(start), end: clock(end), hours: Number(hours || hoursBetween(start, end)) },
    carer: s.carer_name, participant: s.participant_name, warnings,
  };
}

/** Adds an event (appointment) for a participant on one day. */
export async function addEvent(a: { participant: string; details: string; day: string; time: string; where?: string }) {
  const p = await findPerson(a.participant, "participant");
  const ids = await createEvents({ participant: p.id, details: String(a.details ?? "").trim(), day: a.day, time: a.time, where: String(a.where ?? "").trim(), repeatUntil: null }, null);
  const warnings: string[] = [];
  try {
    await mirrorEvents(ids);
  } catch (e) {
    warnings.push(`Saved, but Bubble was not updated: ${(e as Error).message}`);
  }
  return { id: ids[0], participant: p.name, day: a.day, time: a.time, details: a.details, where: a.where ?? "", warnings };
}
