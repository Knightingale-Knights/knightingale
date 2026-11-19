// Admin carer lists: active carers and who is available on a day.
import { sql } from "@/lib/db";
import { addDays, SLOTS } from "@/lib/roster/rules";
import { fromDay } from "@/lib/roster/queries";

export const CARER_ROLES = [["rn", "RN"], ["en", "EN"], ["dsw", "DSW"], ["pca", "PCA"]] as const;
export type CarerRole = (typeof CARER_ROLES)[number][0];
export const isRole = (v?: string): v is CarerRole => CARER_ROLES.some(([k]) => k === v);

/** Bubble's availability options, shown as roster periods. */
export const PERIOD_OF_SLOT: Record<string, "AM" | "PM" | "NS"> = {
  "0600___1400": "AM",
  "night__2200___0715_": "PM",
  "1500 - 2230": "PM",
  "night__11pm___7am_": "NS",
  "2000 - 0600": "NS",
};

export type CarerRow = {
  id: string; first_name: string | null; last_name: string | null; photo: string | null;
  phone: string | null; email: string | null; roles: string[] | null; hours7: number;
};

/** Hours on the carer's shifts that started in the last 7 days. */
const hours7 = (today: string) => sql`
  coalesce((select sum(coalesce(s.hours, 0)) from app.shifts s
             where s.carer = u.id and not coalesce(s.cancelled, false)
               and s.date >= ${fromDay(addDays(today, -7))} and s.date < now()), 0)`;

/** Active carers with an approved account. */
export async function activeCarers(today: string, q: string, role: CarerRole | null): Promise<CarerRow[]> {
  const like = q ? `%${q.toLowerCase()}%` : null;
  return sql<CarerRow[]>`
    select u.id, u.first_name, u.last_name, u.profile_photo as photo, u.phone_number as phone, u.email, u.roles,
           ${hours7(today)} as hours7
      from app.users u
     where u.account_type = 'carer' and coalesce(u.active, false) and coalesce(u.account_status, false)
       and (${like}::text is null or lower(concat_ws(' ', u.first_name, u.last_name, u.email, u.phone_number)) like ${like})
       and (${role}::text is null or ${role} = any(u.roles))
     order by u.first_name, u.last_name`;
}

export type AvailRow = CarerRow & { periods: ("AM" | "PM" | "NS")[] };

/** Active carers who marked themselves available on the day and aren't already rostered on it. */
export async function availableCarers(day: string, today: string, role: CarerRole | null): Promise<AvailRow[]> {
  const rows = await sql<(CarerRow & { slots: string[] })[]>`
    select u.id, u.first_name, u.last_name, u.profile_photo as photo, u.phone_number as phone, u.email, u.roles,
           ${hours7(today)} as hours7, array_agg(distinct a.shift) as slots
      from app.availability a join app.users u on u.id = a.carer
     where a.date >= ${fromDay(day)} and a.date < ${fromDay(addDays(day, 1))}
       and coalesce(a.available, false)
       and u.account_type = 'carer' and coalesce(u.active, false) and coalesce(u.account_status, false)
       and (${role}::text is null or ${role} = any(u.roles))
       -- Already rostered that day: not available any more (comes back if the shift is cancelled or moved).
       and not exists (select 1 from app.shifts s
                         where s.carer = u.id and not coalesce(s.cancelled, false)
                           and s.date >= ${fromDay(day)} and s.date < ${fromDay(addDays(day, 1))})
     group by u.id
     order by u.first_name, u.last_name`;
  const order = ["AM", "PM", "NS"] as const;
  return rows.map(({ slots, ...r }) => ({
    ...r,
    periods: order.filter((p) => (slots ?? []).some((s) => PERIOD_OF_SLOT[s] === p)),
  }));
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Admin: turns one of the carer's AM / PM / NS slots on or off for the day (Availability page). */
export async function adminSetSlot(carer: string, day: string, period: "AM" | "PM" | "NS", on: boolean, by: string) {
  const meta = SLOTS.find((s) => s.short === period);
  if (!meta || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Unknown day or time slot.");
  // Every Bubble option that shows as this period (older ones included), so turning it off clears them all.
  const values = Object.entries(PERIOD_OF_SLOT).filter(([, p]) => p === period).map(([v]) => v);
  await sql.begin(async (tx) => {
    const existing = await tx<{ id: string }[]>`
      select id from app.availability
       where carer = ${carer} and shift = any(${values}::text[]) and date >= ${fromDay(day)} and date < ${fromDay(addDays(day, 1))}
       for update`;
    if (!on) {
      if (existing.length) await tx`delete from app.availability where id = any(${existing.map((e) => e.id)}::uuid[])`;
      return;
    }
    if (existing.length) {
      await tx`update app.availability set available = true, updated_at = now() where id = any(${existing.map((e) => e.id)}::uuid[])`;
      return;
    }
    const [u] = await tx<{ first: string | null; phone: string | null; role: string | null }[]>`
      select split_part(trim(first_name), ' ', 1) as first, phone_number as phone, roles[1] as role from app.users where id = ${carer}`;
    if (!u) throw new Error("That carer no longer exists.");
    await tx`
      insert into app.availability (carer, date, shift, shift_text, available, accepted, role, nurse_name, nurse_phone, weekday, priority, created_by)
      values (${carer}, ${fromDay(day)}, ${meta.value}, ${meta.label}, true, 'pending', ${u.role}, ${u.first}, ${u.phone},
              ${WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]}, 0, ${by})`;
  });
}
