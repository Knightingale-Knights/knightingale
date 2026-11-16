// Participant events (appointments): shown to carers on the shift, to coordinators, and on the admin roster.
import { sql } from "@/lib/db";
import { addDays, parseClock, weeklyDates } from "./rules";
import { fromDay, melbDay } from "./queries";

export type EventInput = { participant: string; details: string; day: string; time: string; where: string; repeatUntil: string | null };

export function checkEvent(i: EventInput) {
  if (!i.participant) throw new Error("Choose who the event is for.");
  if (!i.details) throw new Error("Say what the event is.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.day)) throw new Error("Choose a date.");
  const time = parseClock(i.time);
  if (time == null) throw new Error("Enter the time like 13:30.");
  if (i.repeatUntil && i.repeatUntil < i.day) throw new Error("The repeat end date is before the event.");
  return String(time).padStart(4, "0");
}

/** Creates the event, and weekly copies up to repeatUntil. Returns their ids. */
export async function createEvents(i: EventInput, createdBy: string | null): Promise<string[]> {
  const time = checkEvent(i);
  const days = weeklyDates(i.day, i.repeatUntil, 52);
  return sql.begin(async (tx) => {
    const [p] = await tx<{ id: string; coordinator: string | null }[]>`
      select id, coordinator_2 as coordinator from app.users where id = ${i.participant}`;
    if (!p) throw new Error("That participant no longer exists.");
    const address = i.where ? sql.json({ address: i.where }) : null;
    const ids: string[] = [];
    for (const day of days) {
      const [e] = await tx<{ id: string }[]>`
        insert into app.events (date, time, details, address, participant, coordinator, created_by, done, refused, to_do)
        values (${fromDay(day)}, ${time}, ${i.details}, ${address}, ${p.id}, ${p.coordinator}, ${createdBy}, false, false, false)
        returning id`;
      await tx`insert into app.users_events (users_id, events_id) values (${p.id}, ${e.id})`;
      ids.push(e.id);
    }
    return ids;
  });
}

export type DayEvent = { id: string; participant: string | null; participant_name: string | null; time: number | null; details: string | null; address: string | null };

/** Events from `from` up to (not including) `to`, Melbourne days. */
export async function rangeEvents(from: string, to: string, participant?: string) {
  const rows = await sql<(DayEvent & { day: string; time_text: string | null })[]>`
    select e.id, ${melbDay("e.date")} as day, e.participant, trim(concat_ws(' ', u.first_name, u.last_name)) as participant_name,
           e.time as time_text, e.details, e.address->>'address' as address
      from app.events e left join app.users u on u.id = e.participant
     where e.date >= ${fromDay(from)} and e.date < ${fromDay(to)}
       and (${participant ?? null}::uuid is null or e.participant = ${participant ?? null})
     order by e.date, e.time`;
  return rows.map(({ time_text, ...r }) => ({ ...r, time: parseClock(time_text) }));
}

export const dayEvents = (day: string, participant?: string) => rangeEvents(day, addDays(day, 1), participant);
