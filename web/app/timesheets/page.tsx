import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { timesheets, type PayLine, type Sheet, type SheetShift } from "@/lib/timesheets/data";
import { addDays, clockLabel, payWeekStart } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { deleteTimesheetShiftAction, payAction } from "./actions";
import { payDraft } from "@/lib/payroll/pay";
import { PayFields } from "./PayFields";

export const dynamic = "force-dynamic";

const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hrs = (n: number) => `${Number(n.toFixed(2))} h`;
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const clock = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" }).format(new Date(d)) : "";

export default async function Timesheets({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; q?: string; msg?: string; warn?: string; error?: string; pay?: string; paid?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const from = validDay(sp.from) ?? payWeekStart(today);
  const to = validDay(sp.to) ?? addDays(payWeekStart(today), 6);
  const q = (sp.q ?? "").trim();
  const sheets = from <= to ? await timesheets(from, to, q) : [];
  const shifts = sheets.reduce((a, s) => a + s.shifts.length, 0);
  const hours = sheets.reduce((a, s) => a + s.hours, 0);
  const payFor = sp.pay ? sheets.find((x) => x.carer === sp.pay) : undefined;
  const span = (f: string, t: string) => `/timesheets?${new URLSearchParams({ from: f, to: t, ...(q ? { q } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/timesheets" email={staff.email}>
        <Link href={span(addDays(from, -7), addDays(to, -7))}>‹ Previous pay week</Link>
        <Link href={span(payWeekStart(today), addDays(payWeekStart(today), 6))}>This pay week</Link>
        <Link href={span(addDays(from, 7), addDays(to, 7))}>Next pay week ›</Link>
      </TopBar>
      <main className="page wide">
        <h1>Timesheets</h1>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        {sp.paid && (
          <div className="popup-back clear" role="dialog" aria-modal="true">
            <Link href={span(from, to)} className="modal-shade clear" aria-label="Close" scroll={false} />
            <div className="popup">
              <h2>Payslip saved</h2>
              <p>{sp.paid}&apos;s payslip has been saved. They can see it in their Payslips.</p>
              <Link href={span(from, to)} className="big button" scroll={false}>Done</Link>
            </div>
          </div>
        )}
        {sp.warn && <p className="banner warn">{sp.warn}</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
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
              <Link className="button secondary sheet-pay" href={`${span(from, to)}&pay=${s.carer}`} scroll={false}>Pay</Link>
            </div>
            <div className="sheet-shifts">
              {s.shifts.map((x) => <ShiftCard key={x.id} s={x} keep={{ from, to, q }} />)}
            </div>
          </section>
        ))}
      </main>
      {payFor && <PayPopup sheet={payFor} from={from} to={to} q={q} close={span(from, to)} error={sp.error} />}
    </div>
  );
}

async function PayPopup({ sheet, from, to, q, close, error }: { sheet: Sheet; from: string; to: string; q: string; close: string; error?: string }) {
  const gross = [...sheet.residential, ...sheet.ndis].reduce((a, l) => a + (l.pay ?? 0), 0);
  const unpriced = [...sheet.residential, ...sheet.ndis].filter((l) => l.pay == null).reduce((a, l) => a + l.hours, 0);
  const d = await payDraft(sheet.carer, from, to, { gross, hours: sheet.hours, reimbursements: sheet.receipts + sheet.travel });
  const first = sheet.name.split(" ")[0].toUpperCase();
  return (
    <div className="popup-back clear">
      <Link href={close} className="modal-shade clear" aria-label="Close" scroll={false} />
      <form action={payAction} className="popup pay-popup">
        <h2>{first}&apos;s pay</h2>
        {error && <p className="banner error">{error}</p>}
        {d.already && <p className="banner warn">{sheet.name.split(" ")[0]} already has a payslip for this pay period.</p>}
        {unpriced > 0 && <p className="banner warn">{Number(unpriced.toFixed(2))} h have no pay rate and aren&apos;t in the gross pay.</p>}
        <input type="hidden" name="carer" value={sheet.carer} />
        <input type="hidden" name="name" value={sheet.name} />
        <input type="hidden" name="from" value={from} />
        <input type="hidden" name="to" value={to} />
        {q && <input type="hidden" name="q" value={q} />}
        <PayFields d={d} notes={{ gross: "From the shifts in this pay period", tax: d.taxNote, reimbursements: `Travel ${money(sheet.travel)} + receipts ${money(sheet.receipts)}` }} />
        <label>Pay period start<input type="date" name="start" defaultValue={d.start} required /></label>
        <label>Pay period end<input type="date" name="end" defaultValue={d.end} required /></label>
        <label>Payment date<input type="date" name="paid" defaultValue={d.paid} required /></label>
        <button className="big" disabled={d.already}>Submit</button>
        <Link href={close} className="link popup-later" scroll={false}>Cancel</Link>
      </form>
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

function ShiftCard({ s, keep }: { s: SheetShift; keep: { from: string; to: string; q: string } }) {
  const actual = s.in_at || s.out_at ? `${clock(s.in_at)} – ${clock(s.out_at)}` : "–";
  return (
    <div className={`sheet-shift ${s.kind}`}>
      <details className="sheet-delete">
        <summary aria-label="Delete shift">✕</summary>
        <form action={deleteTimesheetShiftAction}>
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="from" value={keep.from} />
          <input type="hidden" name="to" value={keep.to} />
          {keep.q && <input type="hidden" name="q" value={keep.q} />}
          <button className="link danger">Delete this shift</button>
        </form>
      </details>
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
