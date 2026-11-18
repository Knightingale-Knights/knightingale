// One participant's shifts, appointments and progress notes by day, for the admin participant calendar.
import { sql } from "@/lib/db";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { addDays } from "@/lib/roster/rules";
import { NOTE_FIELDS } from "@/lib/carer/rules";

export type CalShift = {
  id: string; day: string; start_time: number | null; end_time: number | null;
  carer: string | null; carer_photo: string | null; carer_phone: string | null; note_id: string | null;
};
export type CalAppt = { id: string; day: string; time: string | null; details: string | null; notes: string | null; carer: string | null; address: string | null };
export type CalNote = { id: string; day: string; carer: string | null; summary: string | null } & Record<(typeof NOTE_FIELDS)[number], string | null>;

const range = (col: string, from: string, to: string) => sql`${sql.unsafe(col)} >= ${fromDay(from)} and ${sql.unsafe(col)} < ${fromDay(addDays(to, 1))}`;

export async function calShifts(participant: string, from: string, to: string): Promise<CalShift[]> {
  return sql<CalShift[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer, c.profile_photo as carer_photo, c.phone_number as carer_phone,
           coalesce(
             (select n.id from app.progress_notes n where n.id = s.progress_note and n.participant = s.participant),
             (select n.id from app.progress_notes n where n.shift = s.id order by n.created_at desc limit 1)
           ) as note_id
      from app.shifts s left join app.users c on c.id = s.carer
     where s.participant = ${participant} and coalesce(s.cancelled, false) = false and ${range("s.date", from, to)}
     order by s.date, s.start_time nulls last`;
}

export async function calAppts(participant: string, from: string, to: string): Promise<CalAppt[]> {
  return sql<CalAppt[]>`
    select e.id, ${melbDay("e.date")} as day, nullif(e.time, '') as time, nullif(trim(e.details), '') as details,
           nullif(trim(e.notes), '') as notes, nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer,
           e.address->>'address' as address
      from app.events e left join app.users c on c.id = e.carer
     where e.participant = ${participant} and ${range("e.date", from, to)}
     order by e.date, e.time nulls last`;
}

export async function calNotes(participant: string, from: string, to: string): Promise<CalNote[]> {
  return sql<CalNote[]>`
    select n.id, ${melbDay("coalesce(n.date, n.created_at)")} as day,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer, coalesce(nullif(n.summary, ''), n.progress_note) as summary,
           ${sql.unsafe(NOTE_FIELDS.map((f) => `n.${f}`).join(", "))}
      from app.progress_notes n left join app.users c on c.id = n.carer
     where n.participant = ${participant} and ${range("coalesce(n.date, n.created_at)", from, to)}
     order by coalesce(n.date, n.created_at)`;
}
