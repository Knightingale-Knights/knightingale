// Daily business metrics. In Bubble a shift's "revenue" is the profit and its "fee" is what the client is charged.
import { sql } from "@/lib/db";
import { fromDay, melbDay } from "@/lib/roster/queries";

export type DayMetrics = { day: string; ndis: number; aged: number; profit: number; revenue: number; shifts: number; carers: number };
export type Totals = Omit<DayMetrics, "day">;

/** One row per day from `from` up to (not including) `to`; cancelled shifts left out. */
export async function dailyMetrics(from: string, to: string) {
  const rows = await sql<DayMetrics[]>`
    select ${melbDay("s.date")} as day,
           coalesce(sum(s.revenue) filter (where s.participant is not null), 0)::float8 as ndis,
           coalesce(sum(s.revenue) filter (where s.participant is null), 0)::float8 as aged,
           coalesce(sum(s.revenue), 0)::float8 as profit,
           coalesce(sum(s.fee), 0)::float8 as revenue,
           count(*)::int as shifts,
           count(distinct s.carer)::int as carers
      from app.shifts s
     where s.date >= ${fromDay(from)} and s.date < ${fromDay(to)} and not coalesce(s.cancelled, false)
     group by 1`;
  return new Map(rows.map((r) => [r.day, r]));
}

/** Totals over a period; carers are counted once however many days they worked. */
export async function periodTotals(from: string, to: string): Promise<Totals> {
  const [t] = await sql<Totals[]>`
    select coalesce(sum(revenue) filter (where participant is not null), 0)::float8 as ndis,
           coalesce(sum(revenue) filter (where participant is null), 0)::float8 as aged,
           coalesce(sum(revenue), 0)::float8 as profit,
           coalesce(sum(fee), 0)::float8 as revenue,
           count(*)::int as shifts,
           count(distinct carer)::int as carers
      from app.shifts
     where date >= ${fromDay(from)} and date < ${fromDay(to)} and not coalesce(cancelled, false)`;
  return t;
}
