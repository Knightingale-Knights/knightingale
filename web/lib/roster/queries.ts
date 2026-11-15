import { sql } from "@/lib/db";
import { addDays } from "./rules";

// Shift dates are stored as midnight in Melbourne, as Bubble did.
export const melbDay = (col: string) => sql.unsafe(`to_char(${col} at time zone 'Australia/Melbourne', 'YYYY-MM-DD')`);
export const fromDay = (day: string) => sql`((${day}::date)::timestamp at time zone 'Australia/Melbourne')`;

export type RosterShift = {
  id: string; day: string; start_time: number | null; end_time: number | null; hours: number | null;
  kind: "residential" | "ndis"; roles: string[] | null; cancelled: boolean; attended: boolean; invoiced: boolean;
  carer: string | null; carer_name: string | null; participant: string | null; participant_name: string | null;
  location: string | null; location_name: string | null; item_name: string | null; notes: string | null;
  requested_by: string | null; // set when a facility booked it
  revenue: number | null; carer_first: string | null; carer_photo: string | null;
};

export type RosterFilter = { participant?: string; location?: string; carer?: string };

export const weekShifts = (monday: string, f: RosterFilter) => rangeShifts(monday, addDays(monday, 7), f);

/** Shifts from `from` up to (not including) `to`, Melbourne days. */
export async function rangeShifts(from: string, to: string, f: RosterFilter): Promise<RosterShift[]> {
  const where = [
    sql`s.date >= ${fromDay(from)} and s.date < ${fromDay(to)}`,
    f.participant ? sql`s.participant = ${f.participant}` : null,
    f.location ? sql`s.location = ${f.location}` : null,
    f.carer ? sql`s.carer = ${f.carer}` : null,
  ].filter(Boolean);
  return sql<RosterShift[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time, s.hours,
           case when s.location is not null and s.participant is null then 'residential' else 'ndis' end as kind,
           s.roles, coalesce(s.cancelled, false) as cancelled, coalesce(s.attended, false) as attended,
           (coalesce(s.invoiced, false) or exists (select 1 from app.invoice_shifts x where x.shift_id = s.id)) as invoiced,
           s.carer, trim(concat_ws(' ', c.first_name, c.last_name)) as carer_name,
           s.participant, trim(concat_ws(' ', p.first_name, p.last_name)) as participant_name,
           s.location, l.name as location_name, coalesce(n.item_name, r.name) as item_name, s.notes,
           (select coalesce(nullif(trim(concat_ws(' ', fu.first_name, fu.last_name)), ''), 'facility') from app.users fu
             where fu.account_type = 'location'
               and (fu.id = s.created_by or exists (select 1 from app.users_shifts_requested q where q.shifts_id = s.id and q.users_id = fu.id))
             limit 1) as requested_by,
           s.revenue, nullif(trim(c.first_name), '') as carer_first, c.profile_photo as carer_photo
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations l on l.id = s.location
      left join app.ndis_price_items n on n.id = s.ndis_pricing
      left join app.residential_prices r on r.id = s.res_pricing
     where ${where.reduce((a, b) => sql`${a} and ${b}`)}
     order by s.date, s.start_time nulls last`;
}

export type ShiftDetail = RosterShift & {
  ndis_pricing: string | null; res_pricing: string | null; rate: number | null; fee: number | null;
  wage: number | null; revenue: number | null; supervisor: string | null; recurring: string | null;
  attend_start: Date | null; attend_end: Date | null; bubble_id: string | null;
};

export async function getShift(id: string): Promise<ShiftDetail | null> {
  const [s] = await sql<ShiftDetail[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time, s.hours,
           case when s.location is not null and s.participant is null then 'residential' else 'ndis' end as kind,
           s.roles, coalesce(s.cancelled, false) as cancelled, coalesce(s.attended, false) as attended,
           (coalesce(s.invoiced, false) or exists (select 1 from app.invoice_shifts x where x.shift_id = s.id)) as invoiced,
           s.carer, trim(concat_ws(' ', c.first_name, c.last_name)) as carer_name,
           s.participant, trim(concat_ws(' ', p.first_name, p.last_name)) as participant_name,
           s.location, l.name as location_name, null as item_name, s.notes, null as requested_by,
           nullif(trim(c.first_name), '') as carer_first, c.profile_photo as carer_photo,
           s.ndis_pricing, s.res_pricing, s.rate, s.fee, s.wage, s.revenue, s.supervisor, s.recurring,
           s.attend_start, s.attend_end, s.bubble_id
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations l on l.id = s.location
     where s.id = ${id}`;
  return s ?? null;
}

export type Option = { id: string; name: string; extra?: string | null };
export type PriceOption = Option & { rate: number | null; hourly_revenue: number | null; carer_pay: number | null };

export async function rosterOptions() {
  const [carers, participants, locations, ndisItems, resPrices] = await Promise.all([
    sql<(Option & { roles: string[] | null })[]>`
      select id, trim(concat_ws(' ', first_name, last_name)) as name, roles from app.users
       where account_type = 'carer' and coalesce(active, false) order by first_name, last_name`,
    sql<Option[]>`
      select id, trim(concat_ws(' ', first_name, last_name)) as name from app.users
       where account_type = 'participant' and coalesce(active, false) order by first_name, last_name`,
    sql<Option[]>`select id, coalesce(name, '(unnamed)') as name from app.locations order by name`,
    sql<PriceOption[]>`
      select id, coalesce(item_name, item_no, '(unnamed)') as name, item_no as extra,
             item_price as rate, hourly_revenue, carer_pay
        from app.ndis_price_items order by item_name`,
    sql<PriceOption[]>`
      select id, coalesce(name, '(unnamed)') as name, null as extra, rate, hourly_revenue, carer_pay
        from app.residential_prices order by name`,
  ]);
  return { carers, participants, locations, ndisItems, resPrices };
}

/** Carers who ticked a slot as available on a day, for the "who's free" list. */
export async function availableOn(day: string) {
  return sql<{ carer: string; name: string; slots: string[] }[]>`
    select a.carer, trim(concat_ws(' ', u.first_name, u.last_name)) as name, array_agg(distinct a.shift order by a.shift) as slots
      from app.availability a join app.users u on u.id = a.carer
     where a.date >= ${fromDay(day)} and a.date < ${fromDay(addDays(day, 1))}
       and coalesce(a.available, false) and coalesce(u.active, false)
     group by a.carer, u.first_name, u.last_name
     order by u.first_name`;
}

/** The carer's other live shifts from the day before to the day after, for clash checks. */
export async function carerBookings(carer: string, day: string, excludeId: string | null, tx = sql) {
  return tx<{ id: string; day: string; start_time: number; end_time: number }[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time
      from app.shifts s
     where s.carer = ${carer} and not coalesce(s.cancelled, false)
       and s.start_time is not null and s.end_time is not null
       and s.date >= ${fromDay(addDays(day, -1))} and s.date < ${fromDay(addDays(day, 2))}
       and s.id is distinct from ${excludeId}`;
}
