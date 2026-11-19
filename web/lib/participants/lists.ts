// The participant's list pages: Points of Care (Shift Duties), and the carers who worked with them lately.
import { sql } from "@/lib/db";

export type Duty = { id: string; duty: string | null; done: boolean | null };

export function duties(participant: string) {
  return sql<Duty[]>`select id, duty, done from app.shift_duties where participant = ${participant} order by created_at`;
}

export async function addDuty(participant: string, duty: string, by: string) {
  await sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into app.shift_duties ${tx({ participant, duty, done: false, created_by: by })} returning id`;
    await tx`insert into app.users_shift_duties (users_id, shift_duties_id) values (${participant}, ${row.id})`;
  });
}

export async function toggleDuty(participant: string, id: string) {
  await sql`update app.shift_duties set done = not coalesce(done, false), updated_at = now() where id = ${id} and participant = ${participant}`;
}

export async function removeDuty(participant: string, id: string) {
  await sql.begin(async (tx) => {
    await tx`delete from app.users_shift_duties where shift_duties_id = ${id}`;
    await tx`delete from app.shift_duties where id = ${id} and participant = ${participant}`;
  });
}

export type Person = { id: string; name: string };

export type RecentCarer = Person & { shifts: number; last: Date };

/** Carers who worked with the participant in the last 30 days (shifts not cancelled), most recent first. */
export function recentCarers(participant: string) {
  return sql<RecentCarer[]>`
    select u.id, coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, '(no name)') as name,
           count(*)::int as shifts, max(s.date) as last
      from app.shifts s join app.users u on u.id = s.carer
     where s.participant = ${participant} and not coalesce(s.cancelled, false)
       and s.date >= now() - interval '30 days' and s.date <= now()
     group by u.id order by max(s.date) desc`;
}
