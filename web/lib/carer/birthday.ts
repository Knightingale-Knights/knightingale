import { sql } from "@/lib/db";

/** The carer's first name if today (Melbourne) is their birthday, else null. */
export async function birthdayName(id: string): Promise<string | null> {
  const [r] = await sql<{ first_name: string | null }[]>`
    select first_name from app.users
     where id = ${id} and date_of_birth is not null
       and to_char(date_of_birth at time zone 'Australia/Melbourne', 'MM-DD') = to_char(now() at time zone 'Australia/Melbourne', 'MM-DD')`;
  return r ? (r.first_name ?? "").trim() || "you" : null;
}
