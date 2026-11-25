import { isoDate } from "@/lib/invoicing/rules";
import { carerStats, fyStart, longestWeekRun } from "@/lib/carer/stats";
import { CULTURE_KEYS } from "@/lib/culture/videos";

const money = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const num = (n: number) => Math.round(n).toLocaleString("en-AU");
const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
const longDate = (d: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const monthLabel = (m: string) => new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

function Tile({ label, value, note, big }: { label: string; value: string; note?: string; big?: boolean }) {
  return (
    <div className={`stat-tile${big ? " big" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

/** A carer's stats (their My Stats page, and the office's Stats tab on Compliance). */
export async function StatsBody({ carer }: { carer: string }) {
  const today = isoDate(new Date());
  const s = await carerStats(carer, today);
  const fyLabel = `since 1 July ${fyStart(today).slice(0, 4)}`;
  const days = s.first_day ? Math.max(1, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${s.first_day}T00:00:00Z`)) / 86_400_000)) : 0;
  const run = longestWeekRun(s.weeks);
  const onTime = s.checkins ? Math.round((s.on_time / s.checkins) * 100) : null;

  // Last 12 months of gross pay, one bar per month (months with no pay show as empty).
  const months: { month: string; gross: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - i);
    const m = d.toISOString().slice(0, 7);
    months.push({ month: m, gross: s.months.find((x) => x.month === m)?.gross ?? 0 });
  }
  const peak = Math.max(1, ...months.map((m) => m.gross));

  return (
    <>
        <section className="stat-hero">
          <span className="stat-label">Total earned with us</span>
          <span className="stat-hero-value">{money(s.gross_all)}</span>
          <span className="stat-note">{money(s.gross_fy)} {fyLabel}</span>
        </section>

        <h2 className="stat-head">Money</h2>
        <div className="stat-grid">
          <Tile label="Take-home pay" value={money(s.net_all)} />
          <Tile label="Tax paid" value={money(s.tax_all)} note={`${money(s.tax_fy)} ${fyLabel}`} />
          <Tile label="Super earned" value={money(s.super_all)} />
          <Tile label="Travel reimbursed" value={money(s.travel_all)} />
          <Tile label="Hours worked" value={num(s.hours_all)} />
        </div>

        <figure className="stat-chart" aria-label="Gross pay by month, last 12 months">
          <figcaption className="stat-label">Gross pay, last 12 months</figcaption>
          <div className="stat-bars">
            {months.map((m) => (
              <div key={m.month} className="stat-bar" title={`${monthLabel(m.month)}: ${money(m.gross)}`} tabIndex={0}>
                <span className="stat-tip">{money(m.gross)}</span>
                <i style={{ height: `${(m.gross / peak) * 100}%` }} />
                <small>{monthLabel(m.month).slice(0, 1)}</small>
              </div>
            ))}
          </div>
        </figure>

        <h2 className="stat-head">Shifts</h2>
        <div className="stat-grid">
          <Tile label="Shifts this financial year" value={num(s.shifts_fy)} big />
          <Tile label="Shifts in the last week" value={num(s.shifts_week)} big />
          <Tile label="Shifts all time" value={num(s.shifts_all)} />
          <Tile label="Missed shifts" value={num(s.missed)} />
          <Tile label="Shift offers declined" value={num(s.declined)} />
          {s.busiest_day && <Tile label="Busiest day" value={s.busiest_day} />}
        </div>

        <h2 className="stat-head">People and places</h2>
        <div className="stat-grid">
          <Tile label="People you've cared for" value={num(s.people)} big />
          <Tile label="Places you've worked" value={num(s.places)} big />
        </div>
        {s.top.length > 0 && (
          <ol className="stat-top">
            {s.top.map((t, i) => <li key={t.name}><span className="rank">{i + 1}</span><span>{t.name}</span><span className="n">{plural(t.n, "shift")}</span></li>)}
          </ol>
        )}

        <h2 className="stat-head">Time with us</h2>
        <div className="stat-grid">
          <Tile label="First shift" value={s.first_day ? longDate(s.first_day) : "Coming soon"} />
          <Tile label="Days with Knightingale" value={num(days)} />
          <Tile label="Longest run" value={plural(run, "week")} note="in a row with a shift" />
        </div>

        <h2 className="stat-head">Reliability</h2>
        <div className="stat-grid">
          <Tile label="On-time check-ins" value={onTime == null ? "-" : `${onTime}%`} note={s.checkins ? `${num(s.on_time)} of ${num(s.checkins)} check-ins` : undefined} big />
          <Tile label="Progress notes written" value={num(s.notes)} />
          <Tile label="Culture of Care medals" value={`${s.medals} of ${CULTURE_KEYS.length}`} note={s.medals === CULTURE_KEYS.length ? "🎖️ All done" : undefined} />
        </div>
    </>
  );
}
