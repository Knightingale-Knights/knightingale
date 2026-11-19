import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { Portrait, hoursLabel } from "@/components/CarerCells";
import { CARER_ROLES, availableCarers, isRole } from "@/lib/carers/data";
import { isoDate } from "@/lib/invoicing/rules";
import { missReasons, missesOn } from "@/lib/carers/misses";
import { MissSelect } from "./MissSelect";

export const dynamic = "force-dynamic";

const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const longDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export default async function Availability({ searchParams }: { searchParams: Promise<{ date?: string; role?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const date = validDay(sp.date) ?? today;
  const role = isRole(sp.role) ? sp.role : null;
  const [rows, reasons, misses] = await Promise.all([availableCarers(date, today, role), missReasons(), missesOn(date)]);
  const href = (r: string | null) => `/availability?${new URLSearchParams({ date, ...(r ? { role: r } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/availability" /></TopBar>
      <main>
        <h1>Availability</h1>
        <p className="lede">{longDay(date)} · {rows.length} carer{rows.length === 1 ? "" : "s"} available{role ? ` · ${role.toUpperCase()}` : ""}</p>
        <div className="row filters">
          <form className="search">
            {role && <input type="hidden" name="role" value={role} />}
            <input type="date" name="date" defaultValue={date} />
            <button className="secondary">Show</button>
          </form>
          <nav className="role-filter">
            {CARER_ROLES.map(([k, l]) => <Link key={k} href={href(role === k ? null : k)} className={role === k ? "on" : ""}>{l}</Link>)}
          </nav>
        </div>
        {rows.length === 0 ? (
          <p className="empty">Nobody has marked themselves available on this day.</p>
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
                      {(["AM", "PM", "NS"] as const).map((p) => (
                        <td key={p} className="period-cell">{r.periods.includes(p) ? <span className="tick">{p}</span> : <span className="dash">–</span>}</td>
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
