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
import { phoneVariants } from "@/lib/texts/rules";
import { availableCarers } from "@/lib/carers/data";
import { slotsFor } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";

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

// ---- Carers texting Klarra about their own shifts (move one, or ask for a replacement) ----


/** The active carer texting from this number. */
export async function carerByPhone(phone: string): Promise<Person & { first: string }> {
  const variants = phoneVariants(String(phone ?? ""));
  if (!variants.length) throw new Error("Unknown number.");
  const rows = await sql<(Person & { first: string })[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name, coalesce(nullif(trim(first_name), ''), 'there') as first
      from app.users
     where account_type = 'carer' and coalesce(active, false)
       and regexp_replace(coalesce(phone_number, ''), '[\\s().-]', '', 'g') in ${sql(variants)}
     limit 2`;
  if (rows.length !== 1) throw new Error(rows.length ? "More than one carer has this number." : "No carer has this number.");
  return rows[0];
}

/** The texting carer's own live shifts between two days (inclusive). */
export async function carerShifts(a: { phone: string; from: string; to?: string }) {
  const c = await carerByPhone(a.phone);
  if (!DAY.test(a.from) || (a.to && !DAY.test(a.to))) throw new Error("Dates must be YYYY-MM-DD.");
  const shifts = (await findShiftsFor(c.id, a.from, a.to ?? a.from)).filter((s) => !s.cancelled);
  return { carer: c.name, shifts };
}

async function findShiftsFor(carer: string, from: string, to: string): Promise<FoundShift[]> {
  const rows = await sql<(Omit<FoundShift, "start" | "end"> & { start_time: number | null; end_time: number | null })[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer,
           nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '') as participant,
           l.name as location, coalesce(s.cancelled, false) as cancelled, coalesce(s.attended, false) as attended
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations l on l.id = s.location
     where s.carer = ${carer} and s.date >= ${fromDay(from)} and s.date < ${fromDay(to)} + interval '1 day'
     order by s.date, s.start_time limit 30`;
  return rows.map(({ start_time, end_time, ...r }) => ({ ...r, start: clock(parseClock(start_time)), end: clock(parseClock(end_time)) }));
}

/** A shift that belongs to the texting carer and can still be changed. */
async function ownShift(phone: string, id: string) {
  const c = await carerByPhone(phone);
  const s = await getShift(String(id ?? ""));
  if (!s || s.carer !== c.id) throw new Error("That isn't one of your shifts.");
  if (s.cancelled) throw new Error("That shift is cancelled.");
  if (s.attend_start) throw new Error("You've already checked in to that shift.");
  return { c, s };
}

/** The carer moves their own shift (another day and/or other times). */
export async function carerMove(a: { phone: string; id: string; day?: string; start?: string; end?: string }) {
  const { s } = await ownShift(a.phone, a.id);
  const today = isoDate(new Date());
  if ((a.day || s.day) < today) throw new Error("A shift can't be moved to a day that's already gone.");
  return editShift({ id: s.id, day: a.day, start: a.start, end: a.end });
}

/** Minutes from now until a shift on `day` starting at `start` (Melbourne time). */
function minutesUntil(day: string, start: number) {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(start / 100), start % 100);
  const off = (new Date(guess).getTime() - new Date(new Date(guess).toLocaleString("en-US", { timeZone: "Australia/Melbourne" })).getTime());
  return Math.round((guess + off - Date.now()) / 60000);
}

/** The shift the carer can't do, how soon it starts, and who could cover it (best first). */
export async function replacementInfo(a: { phone: string; id: string }) {
  const { c, s } = await ownShift(a.phone, a.id);
  const start = parseClock(s.start_time) ?? 0;
  const end = parseClock(s.end_time) ?? start;
  const role = (s.roles ?? [])[0] ?? null;
  const slots = new Set<string>(slotsFor(start, end));
  const today = isoDate(new Date());
  const free = (await availableCarers(s.day, today, (role as never) ?? null)).filter((r) => r.id !== c.id);
  const ids = free.map((r) => r.id);
  // Who has the carer's slot ticked for that day, and who has worked with this participant or site before.
  const [slotRows, pastRows] = ids.length ? await Promise.all([
    sql<{ carer: string; shift: string }[]>`
      select carer, shift from app.availability
       where carer = any(${ids}::uuid[]) and coalesce(available, false)
         and date >= ${fromDay(s.day)} and date < ${fromDay(s.day)} + interval '1 day'`,
    sql<{ carer: string; n: number }[]>`
      select carer, count(*)::int as n from app.shifts
       where carer = any(${ids}::uuid[]) and not coalesce(cancelled, false)
         and (${s.participant}::uuid is not null and participant = ${s.participant} or ${s.location}::uuid is not null and location = ${s.location})
       group by carer`,
  ]) : [[], []];
  const fits = new Set(slotRows.filter((r) => slots.has(r.shift)).map((r) => r.carer));
  const past = new Map(pastRows.map((r) => [r.carer, r.n]));
  const candidates = free
    .filter((r) => fits.has(r.id) && r.phone)
    .sort((x, y) => (past.get(y.id) ?? 0) - (past.get(x.id) ?? 0) || x.hours7 - y.hours7)
    .map((r) => ({ id: r.id, name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(), first: (r.first_name ?? "").trim() || "there", phone: r.phone }));
  return {
    shift: { id: s.id, day: s.day, start: clock(start), end: clock(end), role, participant: s.participant_name || null, location: s.location_name || null },
    carer: c.name, carer_first: c.first, minutes_until: minutesUntil(s.day, start), candidates,
  };
}

/** Gives the shift to the carer who said yes, if it still belongs to the carer who asked for cover. */
export async function reassignShift(a: { id: string; from_carer: string; to_carer: string }) {
  const s = await getShift(String(a.id ?? ""));
  if (!s || s.cancelled) throw new Error("That shift no longer exists.");
  if (s.carer !== a.from_carer) throw new Error("That shift has already been changed.");
  if (s.attend_start) throw new Error("The carer has already checked in.");
  const i: ShiftInput = {
    kind: s.kind as ShiftInput["kind"], day: s.day, start: clock(parseClock(s.start_time)), end: clock(parseClock(s.end_time)),
    hours: s.hours == null ? "" : String(s.hours), carer: a.to_carer, participant: s.participant, location: s.location,
    priceItem: (s.kind === "ndis" ? s.ndis_pricing : s.res_pricing) ?? "", role: (s.roles ?? [])[0] ?? "",
    notes: s.notes ?? "", supervisor: s.supervisor ?? "", repeatUntil: null,
  };
  const since = new Date();
  const r = await updateShift(s.id, i);
  const warnings = [...r.warnings];
  try {
    await mirrorShifts([s.id]);
    await mirrorAvailability(since);
  } catch (e) {
    warnings.push(`Saved, but Bubble was not updated: ${(e as Error).message}`);
  }
  await pushShifts([s.id]);
  return { id: s.id, warnings };
}
