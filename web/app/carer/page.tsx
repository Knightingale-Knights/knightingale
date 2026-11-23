import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myLeecareLogins, myShifts, myShiftsBetween, type CarerShift, type LeecareLogin } from "@/lib/carer/data";
import { addDays, addMonths, clockLabel, monthGrid } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "./CarerNav";
import { CheckButton, CheckPopup } from "./check";
import { checkButton, checkTimes, dueCheck, onShiftDay } from "@/lib/carer/rules";
import { requestSummaryAction } from "./actions";
import { shiftFriends, type Friend } from "@/lib/carer/friends";
import { Portrait } from "@/components/CarerCells";
import { PendingButton } from "@/components/PendingButton";
import { ShiftDetails } from "./ShiftDetails";
import { Birthday } from "./Birthday";
import { birthdayName } from "@/lib/carer/birthday";
import { chatList } from "@/lib/chats/data";
import { dayEvents, type DayEvent } from "@/lib/roster/events";

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

export default async function MyShifts({ searchParams }: { searchParams: Promise<{ date?: string; month?: string; summary?: string; logins?: string; friends?: string; sent?: string; summary_error?: string; details?: string; tab?: string; note?: string; view?: string; done?: string; saved?: string; error?: string; travel?: string; xerror?: string; bday?: string; appts?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const day = validDay(sp.date);
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : (day ?? today).slice(0, 7);
  const [from, to] = monthGrid(`${month}-01`);
  const [near, shifts, bday, chats] = await Promise.all([myShifts(me.id, today), myShiftsBetween(me.id, day ?? from, day ? addDays(day, 1) : to), birthdayName(me.id), chatList(me).catch(() => [])]);
  const unread = new Map(chats.map((c) => [c.participant, c.unread]));
  // Appointments (events) for the participants on this day's shifts.
  const mine = new Set(shifts.filter((s) => s.participant && !s.cancelled).map((s) => s.participant as string));
  const events = new Map<string, DayEvent[]>();
  if (day && mine.size) {
    for (const e of await dayEvents(day).catch(() => [] as DayEvent[])) {
      if (e.participant && mine.has(e.participant)) events.set(e.participant, [...(events.get(e.participant) ?? []), e]);
    }
  }
  const now = Date.now();
  const logins = day && sp.logins ? await myLeecareLogins(me.id, sp.logins) : null;
  const friends = day && sp.friends ? await shiftFriends(me.id, sp.friends) : null;
  const due = near.map((s) => ({ s, kind: dueCheck(s, now) })).find((d) => d.kind);

  return (
    <div className="carer with-side">
      <CarerNav on="shifts" name={me.name} />
      {(bday || sp.bday === "1") && <Birthday name={bday ?? me.name.split(" ")[0]} day={today} preview={sp.bday === "1"} />}
      {due && (
        <CheckPopup kind={due.kind!} shiftId={due.s.id} title={`${due.s.place ?? "Your shift"}, ${clockLabel(due.s.start_time)} – ${clockLabel(due.s.end_time)}`} detail={due.s.address_text ?? ""} />
      )}
      <main className="carer-main">
        <div className="pay-top"><Link href="/carer/payslips" className="button secondary">Payslips</Link></div>
        {day ? <DayList day={day} today={today} shifts={shifts} now={now} unread={unread} events={events} /> : <MonthCal month={month} from={from} to={to} today={today} shifts={shifts} />}
      </main>
      {day && sp.details && <ShiftDetails s={shifts.find((s) => s.id === sp.details)} day={day} tab={sp.tab} email={me.email} msgs={sp} />}
      {day && sp.appts && <AppointmentsPopup s={shifts.find((s) => s.id === sp.appts)} events={events} day={day} today={today} close={`/carer?date=${day}`} />}
      {day && friends && <FriendsPopup s={shifts.find((s) => s.id === sp.friends)} friends={friends} close={`/carer?date=${day}`} />}
      {day && logins && <LoginsPopup s={shifts.find((s) => s.id === sp.logins)} logins={logins} close={`/carer?date=${day}`} />}
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
              {list.length > 0 && <span className="amt pay">{money(list.reduce((a, s) => a + (s.wage ?? 0), 0))}</span>}
              {list.length > 0 && <span className="cal-shifts">{list.length === 1 ? "Shift" : "Shifts"}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DayList({ day, today, shifts, now, unread, events }: { day: string; today: string; shifts: CarerShift[]; now: number; unread: Map<string, number>; events: Map<string, DayEvent[]> }) {
  return (
    <>
      <div className="cal-nav">
        <Link href={`/carer?date=${addDays(day, -1)}`} aria-label="Previous day">‹</Link>
        <h2>{day === today ? "Today" : dayTitle(day)}</h2>
        <Link href={`/carer?date=${addDays(day, 1)}`} aria-label="Next day">›</Link>
      </div>
      <p className="lede"><Link href={`/carer?month=${day.slice(0, 7)}`}>← Back to the month</Link></p>
      {shifts.length === 0 && <p className="empty">No shifts on this day.</p>}
      {shifts.map((s) => <ShiftCard key={s.id} s={s} day={day} now={now} unread={s.participant ? unread.get(s.participant) ?? 0 : 0} appts={s.participant ? events.get(s.participant)?.length ?? 0 : 0} />)}
    </>
  );
}

const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** One shift on the carer's day, laid out like the Bubble card. */
function ShiftCard({ s, day, now, unread = 0, appts = 0 }: { s: CarerShift; day: string; now: number; unread?: number; appts?: number }) {
  const ndis = s.kind === "ndis";
  const check = checkButton(s, now);
  const name = ndis ? s.participant_name ?? s.place : s.place;
  return (
    <div className={`shift-card ${s.cancelled ? "cancelled" : ""}`}>
      {ndis ? <Link href={`/carer?date=${day}&details=${s.id}`} className="shift-card-name">{name ?? "Shift"}</Link> : <span className="shift-card-name">{name ?? "Shift"}</span>}
      {ndis && s.participant && (
        <div className="shift-card-actions">
          <Link href={`/carer/chats/${s.participant}`} className="button secondary chat-btn" aria-label={unread ? `Communication book, ${unread} new` : undefined}>
            Communication book{unread > 0 && <span className="unread-badge">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link href={`/carer?date=${day}&summary=${s.id}`} className="button secondary">About {(name ?? "").split(" ")[0]}</Link>
        </div>
      )}
      {ndis && s.participant && unread > 0 && <p className="unread-note">{unread} new message{unread === 1 ? "" : "s"}</p>}
      <dl className="shift-card-facts">
        <div><dt>Date</dt><dd>{day.slice(8)}/{day.slice(5, 7)}/{day.slice(2, 4)}</dd></div>
        <div><dt>Time</dt><dd>{clockLabel(s.start_time)} – {clockLabel(s.end_time)}</dd></div>
        {s.address_text && <div className="wide"><dt>Address</dt><dd>{s.address_text}</dd></div>}
      </dl>
      {status(s) && <p className={`status ${needsNote(s) ? "todo" : ""}`}>{status(s)}</p>}
      {checkTimes(s) && <p className="shift-card-times">{checkTimes(s)}</p>}
      {s.wage != null && <p className="shift-card-pay">{money(s.wage)}</p>}
      {check && <CheckButton kind={check} shiftId={s.id} />}
      {!ndis && !s.cancelled && s.has_logins && onShiftDay(s, new Date(now)) && (
        <div className="shift-card-actions">
          <Link href={`/carer?date=${day}&logins=${s.id}`} className="button secondary">Leecare logins</Link>
        </div>
      )}
      {!s.cancelled && (
        <div className="shift-card-actions">
          <Link href={`/carer?date=${day}&friends=${s.id}`} className="button secondary">Friends</Link>
          {ndis && appts > 0 && <Link href={`/carer?date=${day}&appts=${s.id}`} className="button secondary appt-btn">Appointment{appts > 1 ? `s (${appts})` : ""}</Link>}
          {ndis && <Link href={`/carer?date=${day}&details=${s.id}`} className="button">Details</Link>}
        </div>
      )}
    </div>
  );
}

/** The participant's appointments (events) on this day. Ones already past are greyed out. */
function AppointmentsPopup({ s, events, day, today, close }: { s?: CarerShift; events: Map<string, DayEvent[]>; day: string; today: string; close: string }) {
  if (!s?.participant) return null;
  const list = events.get(s.participant) ?? [];
  const nowClock = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" }).format(new Date()).replace(":", ""));
  const past = (e: DayEvent) => day < today || (day === today && e.time != null && e.time < nowClock);
  const who = (s.participant_name ?? "").split(" ")[0];
  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup">
        <h2>Appointments</h2>
        <p className="hint">{who ? `${who}'s` : "The participant's"} appointments on {day.slice(8)}/{day.slice(5, 7)}/{day.slice(2, 4)}.</p>
        {list.length === 0 ? <p className="empty">No appointments this day.</p> : (
          <ul className="appts">
            {list.map((e) => (
              <li key={e.id} className={past(e) ? "past" : ""}>
                <span className="appt-time">{e.time != null ? clockLabel(e.time) : "Any time"}</span>
                <span className="appt-info">
                  <b>{e.details || "Appointment"}</b>
                  {e.address && <small>{e.address}</small>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}

/** Friends: carers who have worked with the participant lately, or who are on the same residential shift. */
function FriendsPopup({ s, friends, close }: { s?: CarerShift; friends: Friend[]; close: string }) {
  if (!s) return null;
  const ndis = s.kind === "ndis";
  const who = (s.participant_name ?? s.place ?? "").split(" ")[0];
  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup">
        <h2>Friends</h2>
        <p className="hint">{ndis ? `Carers who have worked with ${who || "this participant"} in the last 30 days.` : `Carers on the same shift as you at ${s.place ?? "this residence"}.`}</p>
        {friends.length === 0 ? (
          <p className="empty">{ndis ? "Nobody else in the last 30 days." : "Nobody else is on this shift."}</p>
        ) : (
          <ul className="friends">
            {friends.map((f) => (
              <li key={f.id}>
                <Portrait photo={f.photo} name={f.name || "?"} />
                <span><b>{f.name || "(no name)"}</b>{f.note && <small>{f.note}</small>}</span>
                {f.phone && <a href={`tel:${f.phone}`} className="button secondary">Call</a>}
                {f.phone && <a href={`sms:${f.phone}`} className="button secondary">Text</a>}
              </li>
            ))}
          </ul>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}

/** Leecare logins for the facility, shown on the day of the shift. */
function LoginsPopup({ s, logins, close }: { s?: CarerShift; logins: LeecareLogin[]; close: string }) {
  if (!s) return null;
  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup">
        <h2>{s.place ?? "Leecare"} logins</h2>
        {logins.length === 0 ? (
          <p className="hint">Logins are only shown on the day of your shift.</p>
        ) : (
          <dl className="logins">
            {logins.map((l) => (
              <div key={l.id}>
                <dt>Username</dt><dd>{l.username ?? "–"}</dd>
                <dt>Password</dt><dd>{l.password ?? "–"}</dd>
              </div>
            ))}
          </dl>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
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
        <h2>About {first}</h2>
        <p>If you are new to working with {first} please tap About {first} for a support summary. It will help you know what to do on your shift, how to provide which supports, and also give you insight into their personality.</p>
        <p>We want to see you succeed. We hope this helps.</p>
        <p>It will be sent to your email: {email}.</p>
        <p>If you have any suggestions on how to make it better, please email <a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a>. We love feedback. We love to improve.</p>
        {sent && <p className="banner ok">{sent}</p>}
        {error && <p className="banner error">{error}</p>}
        {!sent && (
          <form action={requestSummaryAction}>
            <input type="hidden" name="shift" value={s.id} />
            <input type="hidden" name="date" value={day} />
            <PendingButton className="big" pending="Putting it together…">About {first}</PendingButton>
            <p className="hint">It takes about a minute to put together.</p>
          </form>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}
