import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myShifts, myShiftsBetween, type CarerShift } from "@/lib/carer/data";
import { addDays, addMonths, clockLabel, monthGrid } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "./CarerNav";
import { CheckPopup } from "./check";
import { dueCheck } from "@/lib/carer/rules";
import { requestSummaryAction } from "./actions";
import { PendingButton } from "@/components/PendingButton";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // the support summary takes a while to draft

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

export default async function MyShifts({ searchParams }: { searchParams: Promise<{ date?: string; month?: string; details?: string; summary?: string; sent?: string; summary_error?: string }> }) {
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
      {day && sp.summary && <SummaryRequest s={shifts.find((s) => s.id === sp.summary && s.kind === "ndis")} email={me.email} close={`/carer?date=${day}`} day={day} sent={sp.sent} error={sp.summary_error} />}
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
      {shifts.map((s) => <ShiftCard key={s.id} s={s} day={day} />)}
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
        <p className="when">{dayTitle(s.day)} · {clockLabel(s.start_time)} – {clockLabel(s.end_time)}</p>
        {s.address_text && <p className="hint">{s.address_text}</p>}
        <p className="hint">More details for this shift will appear here.</p>
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}

const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** One shift on the carer's day, laid out like the Bubble card. */
function ShiftCard({ s, day }: { s: CarerShift; day: string }) {
  const ndis = s.kind === "ndis";
  const name = ndis ? s.participant_name ?? s.place : s.place;
  return (
    <div className={`shift-card ${s.cancelled ? "cancelled" : ""}`}>
      <Link href={`/carer/shift/${s.id}`} className="shift-card-name">{name ?? "Shift"}</Link>
      {ndis && s.participant && (
        <div className="shift-card-actions">
          <Link href={`/carer/chats/${s.participant}`} className="button secondary">Communication book</Link>
          <Link href={`/carer?date=${day}&summary=${s.id}`} className="button secondary">{name} support summary</Link>
        </div>
      )}
      <dl className="shift-card-facts">
        <div><dt>Date</dt><dd>{day.slice(8)}/{day.slice(5, 7)}/{day.slice(2, 4)}</dd></div>
        <div><dt>Time</dt><dd>{clockLabel(s.start_time)} – {clockLabel(s.end_time)}</dd></div>
        {s.address_text && <div className="wide"><dt>Address</dt><dd>{s.address_text}</dd></div>}
      </dl>
      {status(s) && <p className={`status ${needsNote(s) ? "todo" : ""}`}>{status(s)}</p>}
      {s.wage != null && <p className="shift-card-pay">{money(s.wage)}</p>}
      <div className="shift-card-actions">
        <Link href={`/carer/shift/${s.id}`} className="button secondary">Open shift</Link>
        {ndis && <Link href={`/carer?date=${day}&details=${s.id}`} className="button">Details</Link>}
      </div>
    </div>
  );
}

/** Asks for the participant's support summary to be emailed to the carer. */
function SummaryRequest({ s, email, close, day, sent, error }: { s?: CarerShift; email: string; close: string; day: string; sent?: string; error?: string }) {
  if (!s) return null;
  const first = (s.participant_name ?? s.place ?? "the participant").split(" ")[0];
  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup">
        <h2>Request {first}&apos;s summary</h2>
        <p>If you are new to working with {first} please request a summary. It will help you know what to do on your shift, how to provide which supports, and also give you insight into their personality.</p>
        <p>We want to see you succeed. We hope this helps.</p>
        <p>It will be sent to your email: {email}.</p>
        <p>If you have any suggestions on how to make it better, please email <a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a>. We love feedback. We love to improve.</p>
        {sent && <p className="banner ok">{sent}</p>}
        {error && <p className="banner error">{error}</p>}
        {!sent && (
          <form action={requestSummaryAction}>
            <input type="hidden" name="shift" value={s.id} />
            <input type="hidden" name="date" value={day} />
            <PendingButton className="big" pending="Putting the summary together…">Request {first}&apos;s summary</PendingButton>
            <p className="hint">It takes about a minute to put together.</p>
          </form>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}
