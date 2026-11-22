import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { Portrait, hoursLabel } from "@/components/CarerCells";
import { CARER_ROLES, availableCarers, isRole } from "@/lib/carers/data";
import { isoDate } from "@/lib/invoicing/rules";
import { missReasons, missesOn } from "@/lib/carers/misses";
import { MissSelect } from "./MissSelect";
import { slotAction } from "./actions";

export const dynamic = "force-dynamic";

const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const longDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

const PERIODS = ["AM", "PM", "NS"] as const;
type Period = (typeof PERIODS)[number];
const isPeriod = (v?: string): v is Period => PERIODS.includes(v as Period);

export default async function Availability({ searchParams }: { searchParams: Promise<{ date?: string; role?: string; period?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const date = validDay(sp.date) ?? today;
  const role = isRole(sp.role) ? sp.role : null;
  const period = isPeriod(sp.period) ? sp.period : null;
  const [all, reasons, misses] = await Promise.all([availableCarers(date, today, role), missReasons(), missesOn(date)]);
  const rows = period ? all.filter((r) => r.periods.includes(period)) : all;
  const href = (r: string | null, p: Period | null) =>
    `/availability?${new URLSearchParams({ date, ...(r ? { role: r } : {}), ...(p ? { period: p } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/availability" /></TopBar>
      <main>
        <h1>Availability</h1>
        <p className="lede">{longDay(date)} · {rows.length} carer{rows.length === 1 ? "" : "s"} available{role ? ` · ${role.toUpperCase()}` : ""}{period ? ` · ${period}` : ""}</p>
        <div className="row filters">
          <form className="search">
            {role && <input type="hidden" name="role" value={role} />}
            {period && <input type="hidden" name="period" value={period} />}
            <input type="date" name="date" defaultValue={date} />
            <button className="secondary">Show</button>
          </form>
          <nav className="role-filter">
            {PERIODS.map((p) => <Link key={p} href={href(role, period === p ? null : p)} className={period === p ? "on" : ""}>{p}</Link>)}
          </nav>
          <nav className="role-filter">
            {CARER_ROLES.map(([k, l]) => <Link key={k} href={href(role === k ? null : k, period)} className={role === k ? "on" : ""}>{l}</Link>)}
          </nav>
        </div>
        {rows.length === 0 ? (
          <p className="empty">{period || role ? "Nobody matching is available on this day." : "Nobody has marked themselves available on this day."}</p>
        ) : (
          <div className="table-wrap">
            <table className="grid people">
              <thead><tr><th></th><th>Name</th><th className="num">Last 7 days</th><th>Phone</th><th>AM</th><th>PM</th><th>NS</th><th>Missed</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "(no name)";
                  return (
                    <tr key={r.id}>
                      <td className="pic"><Portrait photo={r.photo} name={name} /></td>
                      <td><Link href={`/compliance/${r.id}`}>{name}</Link></td>
                      <td className="num">{hoursLabel(r.hours7)}</td>
                      <td>{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : ""}</td>
                      {PERIODS.map((p) => (
                        <td key={p} className="period-cell">
                          <form action={slotAction}>
                            <input type="hidden" name="carer" value={r.id} /><input type="hidden" name="day" value={date} />
                            <input type="hidden" name="period" value={p} /><input type="hidden" name="on" value={r.periods.includes(p) ? "0" : "1"} />
                            <button className={r.periods.includes(p) ? "slot-btn on" : "slot-btn"} title={r.periods.includes(p) ? `Remove ${p}` : `Add ${p}`}>{r.periods.includes(p) ? p : "–"}</button>
                          </form>
                        </td>
                      ))}
                      <td><MissSelect key={`${r.id}-${date}-${misses[r.id] ?? ""}`} carer={r.id} day={date} value={misses[r.id] ?? ""} reasons={reasons} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
