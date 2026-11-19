// A carer's own statistics for their Stats dashboard: money (from payslips), shifts, people and places,
// time with us and reliability. Shifts that were cancelled or are still to come don't count.
import { sql } from "@/lib/db";
import { CULTURE_KEYS } from "@/lib/culture/videos";

export type CarerStats = {
  gross_all: number; tax_all: number; net_all: number; hours_all: number; super_all: number; travel_all: number;
  gross_fy: number; tax_fy: number;
  shifts_all: number; shifts_fy: number; shifts_week: number;
  missed: number; declined: number; places: number; people: number;
  first_day: string | null; busiest_day: string | null;
  checkins: number; on_time: number; notes: number; medals: number;
  top: { name: string; n: number }[];
  months: { month: string; gross: number }[];
  weeks: string[];
};

/** 1 July of the current Australian financial year, as YYYY-MM-DD. */
export function fyStart(today: string) {
  const y = Number(today.slice(0, 4));
  return Number(today.slice(5, 7)) >= 7 ? `${y}-07-01` : `${y - 1}-07-01`;
}

/** Longest run of back-to-back weeks with at least one shift (weeks given as their Monday, YYYY-MM-DD). */
export function longestWeekRun(weeks: string[]) {
  const t = [...new Set(weeks)].map((w) => Date.parse(`${w}T00:00:00Z`)).sort((a, b) => a - b);
  let best = 0, run = 0;
  for (let i = 0; i < t.length; i++) {
    run = i > 0 && t[i] - t[i - 1] === 7 * 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export async function carerStats(carer: string, today: string): Promise<CarerStats> {
  const fy = fyStart(today);
  const [row] = await sql<Omit<CarerStats, "top" | "months" | "weeks" | "medals">[]>`
    with s as (
      select s.*, (s.date at time zone 'Australia/Melbourne')::date as d
        from app.shifts s
       where s.carer = ${carer} and coalesce(s.cancelled, false) = false and s.date < now()
    ), p as (select * from app.payslips where carer = ${carer})
    select
      coalesce((select sum(gross_pay) from p), 0)::float8 as gross_all,
      coalesce((select sum(tax) from p), 0)::float8 as tax_all,
      coalesce((select sum(net_pay) from p), 0)::float8 as net_all,
      coalesce((select sum(hours_worked) from p), 0)::float8 as hours_all,
      coalesce((select sum(super) from p), 0)::float8 as super_all,
      coalesce((select sum(travel) from p), 0)::float8 as travel_all,
      coalesce((select sum(gross_pay) from p where (payment_date at time zone 'Australia/Melbourne')::date >= ${fy}), 0)::float8 as gross_fy,
      coalesce((select sum(tax) from p where (payment_date at time zone 'Australia/Melbourne')::date >= ${fy}), 0)::float8 as tax_fy,
      (select count(*)::int from s) as shifts_all,
      (select count(*)::int from s where d >= ${fy}) as shifts_fy,
      (select count(*)::int from s where s.date >= now() - interval '7 days') as shifts_week,
      (select count(*)::int from app.missed_shifts_carers m where m.users_id = ${carer}) as missed,
      (select count(*)::int from public.sms_adhoc_offers o
         join public.nurses n on n.id = o.nurse_id
         join app.users u on u.bubble_id = n.bubble_user_id
        where u.id = ${carer} and o.status = 'declined') as declined,
      (select count(distinct location)::int from s where location is not null) as places,
      (select count(distinct participant)::int from s where participant is not null) as people,
      (select to_char(min(d), 'YYYY-MM-DD') from s) as first_day,
      (select to_char(d, 'FMDay') from s group by 1 order by count(*) desc, 1 limit 1) as busiest_day,
      (select count(*)::int from s where check_in_time is not null and start_time is not null and start_time < 2400) as checkins,
      (select count(*)::int from s
        where check_in_time is not null and start_time is not null and start_time < 2400
          and (check_in_time at time zone 'Australia/Melbourne')
              <= d + make_interval(mins => (floor(start_time / 100) * 60 + mod(start_time, 100))::int + 5)) as on_time,
      (select count(*)::int from app.progress_notes where carer = ${carer}) as notes`;

  const [top, months, weeks, culture] = await Promise.all([
    sql<{ name: string; n: number }[]>`
      select coalesce(nullif(l.name, ''), nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')) as name, count(*)::int as n
        from app.shifts s left join app.locations l on l.id = s.location left join app.users p on p.id = s.participant
       where s.carer = ${carer} and coalesce(s.cancelled, false) = false and s.date < now()
       group by 1 having coalesce(nullif(l.name, ''), nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')) is not null
       order by 2 desc, 1 limit 3`,
    sql<{ month: string; gross: number }[]>`
      select to_char(date_trunc('month', payment_date at time zone 'Australia/Melbourne'), 'YYYY-MM') as month, sum(gross_pay)::float8 as gross
        from app.payslips
       where carer = ${carer} and payment_date >= date_trunc('month', now() at time zone 'Australia/Melbourne') - interval '11 months'
       group by 1 order by 1`,
    sql<{ w: string }[]>`
      select distinct to_char(date_trunc('week', s.date at time zone 'Australia/Melbourne'), 'YYYY-MM-DD') as w
        from app.shifts s where s.carer = ${carer} and coalesce(s.cancelled, false) = false and s.date < now()`,
    sql<Record<string, boolean | null>[]>`
      select c.* from app.users u join app.care_culture_checklists c on c.id = u.care_culture where u.id = ${carer}`,
  ]);
  const medals = culture[0] ? CULTURE_KEYS.filter((k) => culture[0][k]).length : 0;
  return { ...row, top, months, weeks: weeks.map((x) => x.w), medals };
}
