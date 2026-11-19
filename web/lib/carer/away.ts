// Carers telling us they're away (holiday or sick). If they're rostered in that time, Paul is emailed at once;
// the Saturday Klarra check also lists any shift still rostered while a carer is away.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail } from "@/lib/postmark";
import { addDays } from "@/lib/roster/rules";
import { bubbleNames, bubbleShifts } from "@/lib/klarra/bubble";
import { clock, toSlots, type Slot } from "@/lib/klarra/conflicts";

export type Away = { id: string; from_day: string; to_day: string; reason: "holiday" | "sick"; note: string | null };
export const REASONS = { holiday: "Holiday", sick: "Sick" } as const;

export class AwayError extends Error {}

const isDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
export const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

/** The carer's away periods that haven't finished yet. */
export async function myAway(carer: string, today: string): Promise<Away[]> {
  return sql<Away[]>`
    select id, to_char(from_day, 'YYYY-MM-DD') as from_day, to_char(to_day, 'YYYY-MM-DD') as to_day, reason, note
      from app.carer_away where carer = ${carer} and to_day >= ${today} order by from_day`;
}

/** Every away period touching these days, keyed by the carer's Bubble id (for the Saturday check). */
export async function awayBetween(from: string, to: string) {
  return sql<{ carer_b: string; name: string; from_day: string; to_day: string; reason: string }[]>`
    select coalesce(u.bubble_id, u.id::text) as carer_b, trim(concat_ws(' ', u.first_name, u.last_name)) as name,
           to_char(a.from_day, 'YYYY-MM-DD') as from_day, to_char(a.to_day, 'YYYY-MM-DD') as to_day, a.reason
      from app.carer_away a join app.users u on u.id = a.carer
     where a.to_day >= ${from} and a.from_day < ${to}`;
}

/** Records the period, then emails Paul if the carer is rostered in it. Returns how many shifts clash. */
export async function addAway(carer: { id: string; name: string }, input: { from: string; to: string; reason: string; note: string }, today: string) {
  const { from, to, reason } = input;
  const note = input.note.trim().slice(0, 500) || null;
  if (!isDay(from) || !isDay(to)) throw new AwayError("Please choose the first and last day you're away.");
  if (to < from) throw new AwayError("The last day can't be before the first day.");
  if (to < today) throw new AwayError("Those days have already passed.");
  if (!(reason in REASONS)) throw new AwayError("Please choose holiday or sick.");
  await sql`insert into app.carer_away (carer, from_day, to_day, reason, note) values (${carer.id}, ${from}, ${to}, ${reason}, ${note})`;
  // Saved either way; if Bubble or email is down, the Saturday check still lists the clash.
  return alertIfRostered(carer, { from, to, reason: reason as Away["reason"], note }).catch((e) => (console.error("Away alert failed", e), 0));
}

export async function removeAway(carer: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await sql`delete from app.carer_away where id = ${id} and carer = ${carer}`;
}

async function alertIfRostered(carer: { id: string; name: string }, a: { from: string; to: string; reason: Away["reason"]; note: string | null }) {
  const [u] = await sql<{ b: string | null }[]>`select coalesce(bubble_id, id::text) as b from app.users where id = ${carer.id}`;
  if (!u?.b) return 0;
  const shifts: Slot[] = toSlots(await bubbleShifts(a.from, addDays(a.to, 1), u.b)).filter((s) => s.day >= a.from && s.day <= a.to);
  if (!shifts.length) return 0;
  const nm = await bubbleNames([...new Set(shifts.map((s) => s.who).filter((x): x is string => Boolean(x)))]);
  const period = a.from === a.to ? dayLabel(a.from) : `${dayLabel(a.from)} to ${dayLabel(a.to)}`;
  const text = [
    "Hi Paul,",
    "",
    `${carer.name} has told us they're away (${REASONS[a.reason].toLowerCase()}) ${period}${a.note ? `: "${a.note}"` : "."}`,
    "",
    `They're still rostered on ${shifts.length === 1 ? "this shift" : `these ${shifts.length} shifts`}:`,
    ...shifts.map((s) => `- ${dayLabel(s.day)} ${clock(s.start)}-${clock(s.end)}, ${nm.get(s.who ?? "") ?? "unknown client"}`),
    "",
    "Klarra",
  ].join("\n");
  await sendPlainEmail({ to: env.complianceAlertTo, subject: `Klarra: ${carer.name} is away but rostered (${REASONS[a.reason]})`, text, attachments: [] });
  return shifts.length;
}
