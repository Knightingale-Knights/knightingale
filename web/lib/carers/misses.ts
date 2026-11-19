// Missed calls and opportunities on days a carer said they were available (the dropdown on the
// Availability page). One per carer per day, kept for a future reliability score.
import { sql } from "@/lib/db";

export type Reason = { value: string; display: string };

/** The reasons to choose from: option set "miss_reason" (add rows there for new reasons). */
export function missReasons() {
  return sql<Reason[]>`select value, display from app.option_values where set_key = 'miss_reason' order by sort, display`;
}

/** Each carer's recorded miss on the day. */
export async function missesOn(day: string): Promise<Record<string, string>> {
  const rows = await sql<{ carer: string; reason: string }[]>`select carer, reason from app.carer_misses where day = ${day}::date`;
  return Object.fromEntries(rows.map((r) => [r.carer, r.reason]));
}

/** Records (or clears, with an empty reason) the carer's miss on the day. */
export async function setMiss(carer: string, day: string, reason: string, by: string) {
  if (!reason) {
    await sql`delete from app.carer_misses where carer = ${carer} and day = ${day}::date`;
    return;
  }
  const [ok] = await sql`select 1 from app.option_values where set_key = 'miss_reason' and value = ${reason}`;
  if (!ok) throw new Error("That isn't one of the reasons.");
  await sql`
    insert into app.carer_misses (carer, day, reason, created_by) values (${carer}, ${day}::date, ${reason}, ${by})
    on conflict (carer, day) do update set reason = excluded.reason, created_by = excluded.created_by, updated_at = now()`;
}

export type MissCount = { total: number; byReason: Record<string, number> };

/** Misses per carer in the last 90 days, with a count per reason. */
export async function missCounts(): Promise<Record<string, MissCount>> {
  const rows = await sql<{ carer: string; reason: string; n: number }[]>`
    select carer, reason, count(*)::int as n from app.carer_misses
     where day > (now() at time zone 'Australia/Melbourne')::date - 90 group by carer, reason`;
  const out: Record<string, MissCount> = {};
  for (const r of rows) {
    const c = (out[r.carer] ??= { total: 0, byReason: {} });
    c.total += r.n;
    c.byReason[r.reason] = r.n;
  }
  return out;
}
