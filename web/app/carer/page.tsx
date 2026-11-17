import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myShifts, myShiftsBetween, type CarerShift } from "@/lib/carer/data";
import { addDays, addMonths, clockLabel, monthGrid } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "./CarerNav";
import { CheckPopup } from "./check";
import { dueCheck } from "@/lib/carer/rules";

export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayTitle = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);

function status(s: CarerShift) {
  if (s.cancelled) return "Cancelled";
  if (s.attend_end) return s.kind === "ndis" && !s.note_submitted ? "Progress note needed" : "Done";
  if (s.attend_start) return "Checked in";
  return null;
}
const needsNote = (s: CarerShift) => status(s) === "Progress note needed";

export default async function MyShifts({ searchParams }: { searchParams: Promise<{ date?: string; month?: string; details?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const day = validDay(sp.date);
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : (day ?? today).slice(0, 7);
  const [from, to] = monthGrid(`${month}-01`);
  const [near, shifts] = await Promise.all([myShifts(me.id, today), myShiftsBetween(me.id, day ?? from, day ? addDays(day, 1) : to)]);
  const now = Date.now();
  const due = near.map((s) => ({ s, kind: dueCheck(s, now) })).find((d) => d.kind);

  return (
    <div className="carer with-side">
      <CarerNav on="shifts" name={me.name} />
      {due && (
        <CheckPopup kind={due.kind!} shiftId={due.s.id} title={`${due.s.place ?? "Your shift"}, ${clockLabel(due.s.start_time)}–${clockLabel(due.s.end_time)}`} detail={due.s.address_text ?? ""} />
      )}
      <main className="carer-main">
        {!me.approved && <p className="banner ok">Thanks for applying! We&apos;re reviewing your application and will be in touch. Keep your documents up to date in the Documents tab.</p>}
        {day ? <DayList day={day} today={today} shifts={shifts} /> : <MonthCal month={month} from={from} to={to} today={today} shifts={shifts} />}
      </main>
      {day && sp.details && <Details s={shifts.find((s) => s.id === sp.details && s.kind === "ndis")} close={`/carer?date=${day}`} />}
    </div>
  );
}

function MonthCal({ month, from, to, today, shifts }: { month: string; from: string; to: string; today: string; shifts: CarerShift[] }) {
  const days: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d);
  const first = `${month}-01`;
  return (
    <div className="cal carer-cal">
      <div className="cal-nav">
        <Link href={`/carer?month=${addMonths(first, -1).slice(0, 7)}`} aria-label="Previous month">‹</Link>
        <h2>{MONTHS[Number(month.slice(5)) - 1]}{month.slice(0, 4) !== today.slice(0, 4) ? ` ${month.slice(0, 4)}` : ""}</h2>
        <Link href={`/carer?month=${addMonths(first, 1).slice(0, 7)}`} aria-label="Next month">›</Link>
      </div>
      <div className="cal-head">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="cal-grid">
        {days.map((d) => {
          const list = shifts.filter((s) => s.day === d && !s.cancelled);
          return (
            <Link key={d} href={`/carer?date=${d}`} className={`cal-cell ${d.startsWith(month) ? "" : "out"} ${list.length ? "has" : ""}`}>
              <span className={`num ${d === today ? "today" : ""}`}>{Number(d.slice(8))}</span>
              {list.slice(0, 2).map((s) => <span key={s.id} className="amt">{clockLabel(s.start_time)}</span>)}
              {list.length > 2 && <span className="amt">+{list.length - 2} more</span>}
              {list.some(needsNote) && <span className="open">Note due</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DayList({ day, today, shifts }: { day: string; today: string; shifts: CarerShift[] }) {
  return (
    <>
      <div className="cal-nav">
        <Link href={`/carer?date=${addDays(day, -1)}`} aria-label="Previous day">‹</Link>
        <h2>{day === today ? "Today" : dayTitle(day)}</h2>
        <Link href={`/carer?date=${addDays(day, 1)}`} aria-label="Next day">›</Link>
      </div>
      <p className="lede"><Link href={`/carer?month=${day.slice(0, 7)}`}>← Back to the month</Link></p>
      {shifts.length === 0 && <p className="empty">No shifts on this day.</p>}
      {shifts.map((s) => (
        <div key={s.id} className={`cshift-row ${s.cancelled ? "cancelled" : ""}`}>
          <Link href={`/carer/shift/${s.id}`} className="cshift">
            <span className="when">{clockLabel(s.start_time)}–{clockLabel(s.end_time)}</span>
            <span className="where">{s.place ?? "Shift"}</span>
            {s.address_text && <span className="status muted">{s.address_text}</span>}
            {status(s) && <span className={`status ${needsNote(s) ? "todo" : ""}`}>{status(s)}</span>}
          </Link>
          {s.kind === "ndis" && <Link href={`/carer?date=${day}&details=${s.id}`} className="button secondary details-btn">Details</Link>}
        </div>
      ))}
    </>
  );
}

/** NDIS shift details popup. Contents to come. */
function Details({ s, close }: { s?: CarerShift; close: string }) {
  if (!s) return null;
  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup">
        <h2>{s.place ?? "Shift"}</h2>
        <p className="when">{dayTitle(s.day)} · {clockLabel(s.start_time)}–{clockLabel(s.end_time)}</p>
        {s.address_text && <p className="hint">{s.address_text}</p>}
        <p className="hint">More details for this shift will appear here.</p>
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}
