// Admin participant list and profile header.
import { sql } from "@/lib/db";

export type ParticipantRow = {
  id: string; first_name: string | null; last_name: string | null; photo: string | null;
  phone: string | null; email: string | null; coordinator: string | null; coordinator_id: string | null; active: boolean;
};

const BASE = sql`
  select p.id, p.first_name, p.last_name, p.profile_photo as photo, p.phone_number as phone, p.email,
         nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as coordinator, c.id as coordinator_id, coalesce(p.active, false) as active
    from app.users p left join app.users c on c.id = p.coordinator_2`;

/** Users marked as participants. */
export async function participants(q: string, active: boolean): Promise<ParticipantRow[]> {
  const like = q ? `%${q.toLowerCase()}%` : null;
  return sql<ParticipantRow[]>`
    ${BASE}
     where p.account_type = 'participant' and coalesce(p.active, false) = ${active}
       and (${like}::text is null or lower(concat_ws(' ', p.first_name, p.last_name, p.email, p.phone_number)) like ${like})
     order by p.first_name, p.last_name`;
}

export async function participant(id: string): Promise<ParticipantRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await sql<ParticipantRow[]>`${BASE} where p.id = ${id} and p.account_type = 'participant'`;
  return row ?? null;
}
