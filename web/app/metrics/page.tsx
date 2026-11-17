import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { dailyMetrics, periodTotals, type Totals } from "@/lib/metrics/data";
import { addDays, addMonths, monthGrid } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY: Totals = { ndis: 0, aged: 0, profit: 0, revenue: 0, shifts: 0, carers: 0 };

export default async function Metrics({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : today.slice(0, 7);
  const first = `${month}-01`;
  const [from, to] = monthGrid(first);
  const next = addMonths(first, 1);
  const weeks: string[] = [];
  for (let d = from; d < to; d = addDays(d, 7)) weeks.push(d);

  const [days, monthTotals, weekTotals] = await Promise.all([
    dailyMetrics(from, to),
    periodTotals(first, next),
    Promise.all(weeks.map((w) => periodTotals(w, addDays(w, 7)))),
  ]);
  const top = Math.max(1, ...[...days.values()].filter((d) => d.day.startsWith(month)).map((d) => d.profit));
  const margin = monthTotals.revenue ? (monthTotals.profit / monthTotals.revenue) * 100 : 0;

  return (
    <div className="shell">
      <TopBar section="/metrics" email={staff.email}>
        <Link href={`/metrics?month=${addMonths(first, -1).slice(0, 7)}`}>‹ Previous month</Link>
        <Link href="/metrics">This month</Link>
        <Link href={`/metrics?month=${next.slice(0, 7)}`}>Next month ›</Link>
      </TopBar>
      <main className="page wide">
        <h1>{MONTHS[Number(month.slice(5)) - 1]} {month.slice(0, 4)}</h1>
        <div className="summary">
          <div><span>NDIS profit</span><strong>{money(monthTotals.ndis)}</strong></div>
          <div><span>Aged care profit</span><strong>{money(monthTotals.aged)}</strong></div>
          <div className="total"><span>Profit</span><strong>{money(monthTotals.profit)}</strong></div>
          <div><span>Revenue</span><strong>{money(monthTotals.revenue)}</strong></div>
          <div><span>Margin</span><strong>{margin.toFixed(1)}%</strong></div>
          <div><span>Shifts</span><strong>{monthTotals.shifts}</strong></div>
          <div><span>Carers</span><strong>{monthTotals.carers}</strong></div>
        </div>

        <div className="metrics">
          <div className="metrics-head">{["M", "T", "W", "T", "F", "S", "S", "Week"].map((d, i) => <span key={i}>{d}</span>)}</div>
          {weeks.map((w, wi) => (
            <div key={w} className="metrics-week">
              {Array.from({ length: 7 }, (_, i) => addDays(w, i)).map((day) => {
                const m = days.get(day) ?? { ...EMPTY, day };
                const inMonth = day.startsWith(month);
                const shade = inMonth ? 0.15 + 0.85 * Math.min(1, m.profit / top) : 0;
                return (
                  <Link key={day} href={`/roster?mode=day&date=${day}`} className={`metric-day ${inMonth ? "" : "out"} ${day === today ? "today" : ""}`}>
                    <span className="num" style={inMonth ? { background: `rgba(26, 25, 23, ${shade.toFixed(2)})`, color: shade > 0.45 ? "var(--paper)" : "var(--ink)" } : undefined}>
                      {Number(day.slice(8))}
                    </span>
                    <Cells t={m} />
                  </Link>
                );
              })}
              <div className="metric-day week">
                <span className="num">Week {wi + 1}</span>
                <Cells t={weekTotals[wi]} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Cells({ t }: { t: Totals }) {
  return (
    <dl>
      <dt>NDIS</dt><dd>{money(t.ndis)}</dd>
      <dt>Aged</dt><dd>{money(t.aged)}</dd>
      <dt className="strong">Profit</dt><dd className="strong">{money(t.profit)}</dd>
      <dt>Revenue</dt><dd>{money(t.revenue)}</dd>
      <dt>Shifts</dt><dd>{t.shifts}</dd>
      <dt>Carers</dt><dd>{t.carers}</dd>
    </dl>
  );
}
