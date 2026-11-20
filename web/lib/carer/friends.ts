// "Friends" on a carer's shift: who else they can reach out to.
// NDIS shift: carers who worked with the participant in the last 30 days.
// Residential shift: carers on the same shift (same residence, date, start and end time).
import { sql } from "@/lib/db";

export type Friend = { id: string; name: string; photo: string | null; phone: string | null; note: string | null };

export async function shiftFriends(carer: string, shiftId: string): Promise<Friend[] | null> {
  if (!/^[0-9a-f-]{36}$/i.test(shiftId)) return null;
  const [s] = await sql<{ participant: string | null; location: string | null; day: string; start_time: number | null; end_time: number | null }[]>`
    select participant, location, to_char(date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') as day, start_time, end_time
      from app.shifts where id = ${shiftId} and carer = ${carer}`;
  if (!s) return null;
  if (s.participant) {
    return sql<Friend[]>`
      select u.id, trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.profile_photo as photo, u.phone_number as phone,
             count(*) || ' shift' || case when count(*) = 1 then '' else 's' end || ' in the last 30 days' as note
        from app.shifts x join app.users u on u.id = x.carer
       where x.participant = ${s.participant} and x.carer <> ${carer} and not coalesce(x.cancelled, false)
         and x.date >= now() - interval '30 days' and x.date <= now()
       group by u.id order by max(x.date) desc`;
  }
  if (!s.location) return [];
  return sql<Friend[]>`
    select distinct u.id, trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.profile_photo as photo, u.phone_number as phone, null::text as note
      from app.shifts x join app.users u on u.id = x.carer
     where x.location = ${s.location} and x.carer <> ${carer} and not coalesce(x.cancelled, false)
       and to_char(x.date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') = ${s.day}
       and x.start_time is not distinct from ${s.start_time} and x.end_time is not distinct from ${s.end_time}
     order by 2`;
}
