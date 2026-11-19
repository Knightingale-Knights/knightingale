// The participant's list documents: Points of Care (Shift Duties) and their Carers, as in Bubble's popups.
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

/** The participant's carers (Bubble's User.carers list). */
export function participantCarers(participant: string) {
  return sql<Person[]>`
    select u.id, coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, '(no name)') as name
      from app.users_carers uc join app.users u on u.id = uc.users_id
     where uc.owner_id = ${participant} order by u.first_name, u.last_name`;
}

/** Active carers not yet on the participant's list. */
export function otherCarers(participant: string) {
  return sql<Person[]>`
    select u.id, coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, '(no name)') as name
      from app.users u
     where u.account_type = 'carer' and u.active
       and not exists (select 1 from app.users_carers uc where uc.owner_id = ${participant} and uc.users_id = u.id)
     order by u.first_name, u.last_name`;
}

export async function addCarers(participant: string, carers: string[]) {
  if (!carers.length) return;
  await sql`
    insert into app.users_carers (owner_id, users_id)
    select ${participant}::uuid, c from unnest(${carers}::uuid[]) c
     where not exists (select 1 from app.users_carers uc where uc.owner_id = ${participant} and uc.users_id = c)`;
}

export async function removeCarer(participant: string, carer: string) {
  await sql`delete from app.users_carers where owner_id = ${participant} and users_id = ${carer}`;
}
