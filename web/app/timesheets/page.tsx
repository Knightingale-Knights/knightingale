import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { timesheets, type PayLine, type SheetShift } from "@/lib/timesheets/data";
import { addDays, clockLabel, weekStart } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hrs = (n: number) => `${Number(n.toFixed(2))} h`;
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const clock = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" }).format(new Date(d)) : "";

export default async function Timesheets({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; q?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const from = validDay(sp.from) ?? weekStart(today);
  const to = validDay(sp.to) ?? addDays(weekStart(today), 6);
  const q = (sp.q ?? "").trim();
  const sheets = from <= to ? await timesheets(from, to, q) : [];
  const shifts = sheets.reduce((a, s) => a + s.shifts.length, 0);
  const hours = sheets.reduce((a, s) => a + s.hours, 0);
  const span = (f: string, t: string) => `/timesheets?${new URLSearchParams({ from: f, to: t, ...(q ? { q } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/timesheets" email={staff.email}>
        <Link href={span(addDays(from, -7), addDays(to, -7))}>‹ Previous week</Link>
        <Link href={span(weekStart(today), addDays(weekStart(today), 6))}>This week</Link>
        <Link href={span(addDays(from, 7), addDays(to, 7))}>Next week ›</Link>
      </TopBar>
      <main className="page wide">
        <h1>Timesheets</h1>
        <form className="row filters">
          <label>From<input type="date" name="from" defaultValue={from} /></label>
          <label>To<input type="date" name="to" defaultValue={to} /></label>
          <label className="grow">Carer<input name="q" defaultValue={q} placeholder="Search by name" /></label>
          <button className="secondary">Show</button>
        </form>
        {from > to && <p className="banner error">The From date is after the To date.</p>}
        <p className="lede">{sheets.length} carer{sheets.length === 1 ? "" : "s"} · {shifts} shift{shifts === 1 ? "" : "s"} · {hrs(hours)}</p>
        {sheets.length === 0 && from <= to && <p className="empty">No shifts in this period.</p>}
        {sheets.map((s) => (
          <section key={s.carer} className="sheet">
            <div className="sheet-totals">
              <h2><Link href={`/compliance/${s.carer}`}>{s.name}</Link></h2>
              <p className="lede">{s.shifts.length} shift{s.shifts.length === 1 ? "" : "s"} · {hrs(s.hours)}</p>
              <Lines title="Residential" lines={s.residential} />
              <Lines title="NDIS" lines={s.ndis} />
              <h3>Receipts</h3>
              <p className="sheet-figure">{money(s.receipts)}</p>
              <h3>Travel</h3>
              <p className="sheet-figure">{money(s.travel)} <span>{Number(s.travelKm.toFixed(1))} km</span></p>
            </div>
            <div className="sheet-shifts">
              {s.shifts.map((x) => <ShiftCard key={x.id} s={x} />)}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function Lines({ title, lines }: { title: string; lines: PayLine[] }) {
  return (
    <>
      <h3>{title}</h3>
      {lines.length === 0 ? <p className="sheet-none">None</p> : (
        <table className="lines pay">
          <tbody>
            {lines.map((l) => (
              <tr key={`${l.name}-${l.rate}`}>
                <td>{l.name}</td>
                <td className="num">{l.rate != null ? `${money(l.rate)}/h` : ""}</td>
                <td className="num">{hrs(l.hours)}</td>
                <td className="num">{l.pay != null ? money(l.pay) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function ShiftCard({ s }: { s: SheetShift }) {
  const actual = s.in_at || s.out_at ? `${clock(s.in_at)} – ${clock(s.out_at)}` : "–";
  return (
    <div className={`sheet-shift ${s.kind}`}>
      <p className="role">{(s.roles ?? []).map((r) => r.toUpperCase()).join(", ")} · {s.kind === "ndis" ? "NDIS" : "Residential"}</p>
      <p className="who">{s.who ?? ""}</p>
      <p className={s.has_note ? "tick" : "tick no"}>{s.has_note ? "✓" : "✗"} Progress note</p>
      <p className={s.attended ? "tick" : "tick no"}>{s.attended ? "✓" : "✗"} Attended</p>
      <p className="when">{dayLabel(s.day)}</p>
      <p className="actual">{actual}</p>
      <p className="planned">{clockLabel(s.start_time)} – {clockLabel(s.end_time)} · {hrs(s.hours)}</p>
      <p className="planned">Travel: {s.travel_km ? `${Number(s.travel_km.toFixed(1))} km` : "–"}{s.receipts ? ` · Receipts ${money(s.receipts)}` : ""}</p>
      <Link href={`/roster?${new URLSearchParams({ mode: "day", date: s.day, edit: s.id })}`} className="button secondary">Edit</Link>
    </div>
  );
}
