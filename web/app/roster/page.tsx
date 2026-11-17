import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { availableOn, getShift, rangeShifts, rosterOptions, type RosterFilter, type RosterShift } from "@/lib/roster/queries";
import { SLOTS, addDays, addMonths, clockLabel, monthGrid, periodOf, weekStart, type Period } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { shiftReceipts, shiftTravel } from "@/lib/carer/travel";
import { fileHref } from "@/lib/files";
import { attendedAction, cancelShiftAction, copyShiftAction, deleteShiftAction, saveEventAction, saveShiftAction, sendRosterAction } from "./actions";
import { dayEvents, type DayEvent } from "@/lib/roster/events";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const ROLES = [["en", "EN"], ["rn", "RN"], ["pca", "PCA"], ["dsw", "DSW"], ["cleaner", "CL"], ["student_nurse", "Student nurse"]] as const;
const VIEWS = [["all", "Everyone"], ["participant", "Participant"], ["location", "Location"], ["carer", "Carer"]] as const;
const SLOT_LABEL = Object.fromEntries(SLOTS.map((s) => [s.value, s.short]));
const PERIODS: [Period, string][] = [["am", "AM"], ["pm", "PM"], ["ns", "NS"]];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const dayTitle = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" }).format(d);
  return `${f({ weekday: "short" })}, ${f({ month: "short" })} ${ordinal(d.getUTCDate())}`;
};
const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const total = (list: RosterShift[]) => list.reduce((a, s) => a + (s.cancelled ? 0 : Number(s.revenue ?? 0)), 0);
const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);

export default async function Roster({ searchParams }: { searchParams: Promise<SP> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const mode = sp.mode === "day" ? "day" : "month";
  const date = validDay(sp.date) ?? today;
  const view = (VIEWS.find(([k]) => k === sp.view)?.[0] ?? "all") as (typeof VIEWS)[number][0];
  const filter: RosterFilter = view === "all" || !sp.who ? {} : { [view]: sp.who };

  const [from, to] = mode === "month" ? monthGrid(date) : [date, addDays(date, 1)];
  const [opts, shifts, events] = await Promise.all([
    rosterOptions(),
    rangeShifts(from, to, filter),
    mode === "day" && (view === "all" || view === "participant") ? dayEvents(date, view === "participant" ? sp.who : undefined) : Promise.resolve([] as DayEvent[]),
  ]);
  const keep = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ mode, date, view, ...(sp.who ? { who: sp.who } : {}), ...extra });
    return `/roster?${p}`;
  };
  const whoOptions = view === "participant" ? opts.participants : view === "location" ? opts.locations : view === "carer" ? opts.carers : [];
  const panel = sp.edit ? "edit" : null;
  const popup = sp.new ? "shift" : sp.event === "new" ? "event" : null;
  const newDay = date < today ? today : date;
  const month = date.slice(0, 7);
  const dayForDayView = mode === "month" && today.slice(0, 7) === month ? today : date;
  const shown = mode === "month" ? shifts.filter((s) => s.day.startsWith(month)) : shifts;

  return (
    <div className="shell">
      <TopBar section="/roster" email={staff.email}>
        <Link href={keep({ new: "ndis", day: newDay })}>+ Create shift</Link>
        <Link href={keep({ event: "new", day: newDay })}>+ Create event</Link>
      </TopBar>

      <main className={`page wide ${panel ? "with-panel" : ""} ${mode === "month" ? "roster-month" : ""}`}>
        <div>
          {sp.msg && <p className="banner ok">{sp.msg}</p>}
          {sp.warn && <p className="banner warn">{sp.warn}</p>}
          {sp.error && <p className="banner error">{sp.error}</p>}

          <form className="row" method="get">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="date" value={date} />
            <label>
              Show
              <select name="view" defaultValue={view}>
                {VIEWS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            {view !== "all" && (
              <label className="grow">
                {VIEWS.find(([k]) => k === view)![1]}
                <select name="who" defaultValue={sp.who ?? ""}>
                  <option value="">Choose…</option>
                  {whoOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
            )}
            <button type="submit" className="secondary">Apply</button>
          </form>

          <div className="cal">
            <div className="cal-modes">
              <Link href={keep({ mode: "month" })} className={mode === "month" ? "on" : ""}>Month</Link>
              <Link href={keep({ mode: "day", date: dayForDayView })} className={mode === "day" ? "on" : ""}>Day</Link>
            </div>
            <div className="cal-nav">
              <Link href={keep({ date: mode === "month" ? addMonths(date, -1) : addDays(date, -1) })} aria-label="Previous">‹</Link>
              <h2>
                {mode === "month"
                  ? `${MONTH_NAMES[Number(month.slice(5)) - 1]}${month.slice(0, 4) !== today.slice(0, 4) ? ` ${month.slice(0, 4)}` : ""}`
                  : dayTitle(date)}
              </h2>
              <Link href={keep({ date: mode === "month" ? addMonths(date, 1) : addDays(date, 1) })} aria-label="Next">›</Link>
            </div>

            {mode === "month" ? (
              <MonthGrid from={from} to={to} month={month} today={today} shifts={shifts} href={(d) => keep({ mode: "day", date: d })} />
            ) : (
              <DayView shifts={shifts} events={events} active={sp.edit} href={(id) => keep({ edit: id })} newHref={keep({ new: "ndis", day: date })} />
            )}
          </div>

          <p className="lede">
            {shown.length} shift{shown.length === 1 ? "" : "s"} {mode === "month" ? "this month" : "this day"} · {shown.filter((s) => !s.carer && !s.cancelled).length} without a carer
          </p>
          {view === "participant" && sp.who && (
            <form action={sendRosterAction} className="row tight">
              <input type="hidden" name="mode" value={mode} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="week" value={weekStart(mode === "day" ? date : dayForDayView)} />
              <input type="hidden" name="view" value={view} />
              <input type="hidden" name="who" value={sp.who} />
              <button className="secondary">Email the roster for the week of {dayLabel(weekStart(mode === "day" ? date : dayForDayView))}</button>
            </form>
          )}
        </div>

        {panel === "edit" && sp.edit && <EditPanel id={sp.edit} opts={opts} close={keep({})} mode={mode} date={date} view={view} who={sp.who} />}
      </main>

      {popup && (
        <div className="modal-back">
          <Link href={keep({})} className="modal-shade" aria-label="Close" />
          {popup === "shift" ? (
            <ShiftForm
              opts={opts} close={keep({})} mode={mode} date={date} view={view} who={sp.who}
              kind={sp.new === "residential" ? "residential" : "ndis"} day={validDay(sp.day) ?? newDay}
              free={await availableOn(validDay(sp.day) ?? newDay)}
              toggle={(k) => keep({ new: k, day: validDay(sp.day) ?? newDay })}
            />
          ) : (
            <EventForm
              opts={opts} close={keep({})} mode={mode} date={date} view={view} who={sp.who}
              day={validDay(sp.day) ?? newDay} participant={view === "participant" ? sp.who : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}

const OpenIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

function MonthGrid({ from, to, month, today, shifts, href }: {
  from: string; to: string; month: string; today: string; shifts: RosterShift[]; href: (day: string) => string;
}) {
  const days: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d);
  return (
    <>
      <div className="cal-head">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="cal-grid">
        {days.map((day) => {
          const list = shifts.filter((s) => s.day === day);
          const open = list.filter((s) => !s.carer && !s.cancelled).length;
          return (
            <Link key={day} href={href(day)} className={`cal-cell ${day.startsWith(month) ? "" : "out"}`}>
              <span className={`num ${day === today ? "today" : ""}`}>{Number(day.slice(8))}</span>
              <span className="amt">{list.length ? money(total(list)) : "\u00a0"}</span>
              {open > 0 && <span className="open">{open} open</span>}
              <span className="go"><OpenIcon /></span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function DayView({ shifts, events, active, href, newHref }: {
  shifts: RosterShift[]; events: DayEvent[]; active?: string; href: (id: string) => string; newHref: string;
}) {
  const forShift = (s: RosterShift) => (s.kind === "ndis" && s.participant ? events.filter((e) => e.participant === s.participant) : []);
  return (
    <>
      <p className="cal-total">{money(total(shifts))}</p>
      {events.length > 0 && (
        <section className="period events">
          <h3>Events</h3>
          <div className="period-list">
            {events.map((e) => (
              <div key={e.id} className="erow">
                <span className="etime">{clockLabel(e.time)}</span>
                <span className="ewhat">{e.details}</span>
                <span className="who">({e.participant_name || "?"}){e.address ? ` · ${e.address}` : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {PERIODS.map(([p, label]) => {
        const list = shifts.filter((s) => periodOf(s.start_time) === p);
        return (
          <section key={p} className="period">
            <h3>{label}</h3>
            <div className="period-list">
              {list.length === 0 && <p className="none">No shifts. <Link href={newHref}>Add one</Link></p>}
              {list.map((s) => <ShiftRow key={s.id} s={s} events={forShift(s)} href={href(s.id)} active={s.id === active} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}

function ShiftRow({ s, events, href, active }: { s: RosterShift; events: DayEvent[]; href: string; active: boolean }) {
  const who = s.kind === "ndis" ? s.participant_name : s.location_name;
  const name = s.carer ? s.carer_first ?? s.carer_name ?? "Carer" : "No carer yet";
  return (
    <Link href={href} className={`srow ${s.kind} ${s.cancelled ? "cancelled" : ""} ${!s.carer ? "open" : ""} ${active ? "active" : ""}`}>
      {s.carer_photo ? <img className="ava" src={fileHref(s.carer_photo)} alt="" loading="lazy" /> : <span className="ava blank">{s.carer ? name[0] : "?"}</span>}
      <span className="name">{name}</span>
      <span className="who">({who || "?"})</span>
      <span className="plus" aria-hidden="true">+</span>
      <span className="time">
        {clockLabel(s.start_time)}–{clockLabel(s.end_time)}
        {s.cancelled ? " · cancelled" : s.requested_by && !s.carer ? " · requested" : ""}
      </span>
      {events.length > 0 && (
        <span className="sevents">{events.map((e) => `${clockLabel(e.time)} ${e.details ?? ""}`).join(" · ")}</span>
      )}
    </Link>
  );
}

type Opts = Awaited<ReturnType<typeof rosterOptions>>;
type Ctx = { opts: Opts; close: string; mode: string; date: string; view: string; who?: string };

function Keep({ mode, date, view, who }: { mode: string; date: string; view: string; who?: string }) {
  return (
    <>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="view" value={view} />
      {who && <input type="hidden" name="who" value={who} />}
    </>
  );
}

function ShiftForm({
  opts, close, mode, date, view, who, kind, day, shift, free, toggle,
}: Ctx & {
  kind: "ndis" | "residential"; day: string; toggle?: (k: "ndis" | "residential") => string;
  shift?: Awaited<ReturnType<typeof getShift>>;
  free?: Awaited<ReturnType<typeof availableOn>>;
}) {
  const ndis = kind === "ndis";
  const items = ndis ? opts.ndisItems : opts.resPrices;
  const role = shift?.roles?.[0] ?? (ndis ? "dsw" : "en");
  const freeIds = new Set((free ?? []).map((f) => f.carer));
  return (
    <aside className={toggle ? "panel modal" : "panel"}>
      <header>
        <h2>{shift ? "Edit shift" : "Create shift"}</h2>
        <Link href={close} aria-label="Close">✕</Link>
      </header>
      {toggle && (
        <nav className="kind-toggle">
          <Link href={toggle("ndis")} className={ndis ? "on" : ""}>NDIS</Link>
          <Link href={toggle("residential")} className={!ndis ? "on" : ""}>Residential</Link>
        </nav>
      )}
      <form action={saveShiftAction} className="stack">
        <Keep mode={mode} date={date} view={view} who={who} />
        <input type="hidden" name="kind" value={kind} />
        {shift && <input type="hidden" name="id" value={shift.id} />}
        {ndis ? (
          <label>Participant
            <select name="participant" defaultValue={shift?.participant ?? ""} required>
              <option value="" disabled>Choose…</option>
              {opts.participants.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        ) : (
          <label>Location
            <select name="location" defaultValue={shift?.location ?? ""} required>
              <option value="" disabled>Choose…</option>
              {opts.locations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}
        <label>{ndis ? "NDIS item" : "Rate"}
          <select name="price_item" defaultValue={(ndis ? shift?.ndis_pricing : shift?.res_pricing) ?? ""} required>
            <option value="" disabled>Choose…</option>
            {items.map((o) => (
              <option key={o.id} value={o.id}>{o.name}{o.rate != null ? ` · $${Number(o.rate).toFixed(2)}/h` : ""}</option>
            ))}
          </select>
        </label>
        <div className="pair">
          <label>Date<input type="date" name="day" defaultValue={shift?.day ?? day} required /></label>
          <label>Role
            <select name="role" defaultValue={role}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="pair">
          <label>Start<input name="start" placeholder="09:30" defaultValue={shift ? clockLabel(shift.start_time) : ""} required /></label>
          <label>End<input name="end" placeholder="14:30" defaultValue={shift ? clockLabel(shift.end_time) : ""} required /></label>
          <label>Hours<input name="hours" inputMode="decimal" placeholder="auto" defaultValue={shift?.hours ?? ""} /></label>
        </div>
        <label>Carer
          <select name="carer" defaultValue={shift?.carer ?? ""}>
            <option value="">No carer yet</option>
            {free && free.length > 0 && (
              <optgroup label="Available that day">
                {opts.carers.filter((c) => freeIds.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            )}
            <optgroup label={free?.length ? "Everyone else" : "Carers"}>
              {opts.carers.filter((c) => !freeIds.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          </select>
        </label>
        {!ndis && <label>Supervisor<input name="supervisor" defaultValue={shift?.supervisor ?? ""} /></label>}
        <label>Notes<textarea name="notes" rows={2} defaultValue={shift?.notes ?? ""} /></label>
        {!shift && <label>Repeat weekly until (optional)<input type="date" name="repeat_until" /></label>}
        {shift?.invoiced ? (
          <p className="banner warn">This shift has been invoiced, so it can&apos;t be changed.</p>
        ) : (
          <button type="submit">{shift ? "Save changes" : "Create shift"}</button>
        )}
      </form>
      {free && free.length > 0 && !shift && (
        <div className="free">
          <h3>Available on {dayLabel(day)}</h3>
          <ul>
            {free.map((f) => <li key={f.carer}>{f.name} <span>{f.slots.map((s) => SLOT_LABEL[s] ?? s).join(", ")}</span></li>)}
          </ul>
        </div>
      )}
    </aside>
  );
}

async function EditPanel({ id, ...ctx }: Ctx & { id: string }) {
  const shift = await getShift(id);
  if (!shift) return <aside className="panel"><p className="empty">That shift no longer exists.</p></aside>;
  const [free, travel, receipts] = await Promise.all([availableOn(shift.day), shiftTravel(id), shiftReceipts(id)]);
  const nextWeek = Array.from({ length: 7 }, (_, i) => addDays(shift.day, i + 1));
  return (
    <div className="panel-stack">
      <ShiftForm {...ctx} kind={shift.kind} day={shift.day} shift={shift} free={free} />
      <aside className="panel slim">
        <p className="figures">
          Fee ${Number(shift.fee ?? 0).toFixed(2)} · Wage ${Number(shift.wage ?? 0).toFixed(2)} · Revenue ${Number(shift.revenue ?? 0).toFixed(2)}
        </p>
        {(travel.length > 0 || receipts.files.length > 0 || Number(receipts.total ?? 0) > 0) && (
          <div className="extras-admin">
            {travel.map((t) => (
              <p key={t.id} className="hint">Travel {Number(t.km).toFixed(1)} km: {t.from} → {t.to}{t.invoiced ? " (invoiced)" : ""}</p>
            ))}
            {receipts.files.map((r) => (
              <p key={r.id} className="hint">
                Receipt <a href={`/receipts/${r.id}`} target="_blank" rel="noreferrer">{r.merchant ?? r.file_name}</a>{" "}
                {r.total != null ? `$${Number(r.total).toFixed(2)}` : ""}{r.needs_review ? " (check total)" : ""}
              </p>
            ))}
            {Number(receipts.total ?? 0) > 0 && <p className="hint">Receipts total ${Number(receipts.total).toFixed(2)}{receipts.oldFiles ? ` (incl. ${receipts.oldFiles} from Bubble)` : ""}</p>}
          </div>
        )}
        {!shift.invoiced && (
          <>
            <form action={attendedAction} className="pair end">
              <Keep {...ctx} />
              <input type="hidden" name="id" value={id} />
              <label>Attended from<input name="attend_start" defaultValue={clockLabel(shift.start_time)} /></label>
              <label>to<input name="attend_end" defaultValue={clockLabel(shift.end_time)} /></label>
              <button className="secondary">{shift.attended ? "Update" : "Mark attended"}</button>
            </form>
            <form action={copyShiftAction}>
              <Keep {...ctx} />
              <input type="hidden" name="id" value={id} />
              <p className="label">Copy to</p>
              <div className="chips">
                {nextWeek.map((d) => (
                  <label key={d} className="chip"><input type="checkbox" name="copy_day" value={d} />{dayLabel(d)}</label>
                ))}
              </div>
              <button className="secondary">Copy shift</button>
            </form>
            <div className="row tight">
              <form action={cancelShiftAction}>
                <Keep {...ctx} />
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="cancel" value={shift.cancelled ? "0" : "1"} />
                <button className="secondary">{shift.cancelled ? "Restore shift" : "Cancel shift"}</button>
              </form>
              <details className="confirm">
                <summary>Delete</summary>
                <form action={deleteShiftAction}>
                  <Keep {...ctx} />
                  <input type="hidden" name="id" value={id} />
                  <button className="link danger">Confirm delete</button>
                </form>
              </details>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function EventForm({ opts, close, mode, date, view, who, day, participant }: Ctx & { day: string; participant?: string }) {
  return (
    <aside className="panel modal">
      <header>
        <h2>Create event</h2>
        <Link href={close} aria-label="Close">✕</Link>
      </header>
      <form action={saveEventAction} className="stack">
        <Keep mode={mode} date={date} view={view} who={who} />
        <label>Who
          <select name="participant" defaultValue={participant ?? ""} required>
            <option value="" disabled>Choose a participant…</option>
            {opts.participants.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label>What<textarea name="details" rows={2} placeholder="Physio appointment" required /></label>
        <div className="pair">
          <label>When<input type="date" name="day" defaultValue={day} required /></label>
          <label>Time<input name="time" placeholder="13:00" required /></label>
        </div>
        <label>Where<input name="where" placeholder="59 Monroe Street" /></label>
        <details className="recurring">
          <summary>Recurring?</summary>
          <label>Repeat weekly until<input type="date" name="repeat_until" /></label>
        </details>
        <div className="modal-actions">
          <Link href={close} className="button secondary">Cancel</Link>
          <button type="submit">Create</button>
        </div>
      </form>
    </aside>
  );
}
