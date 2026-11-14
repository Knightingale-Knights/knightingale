import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { availableOn, getShift, rosterOptions, weekShifts, type RosterFilter, type RosterShift } from "@/lib/roster/queries";
import { SLOTS, addDays, clockLabel, weekStart } from "@/lib/roster/rules";
import { isoDate, roleLabel } from "@/lib/invoicing/rules";
import { attendedAction, cancelShiftAction, copyShiftAction, deleteShiftAction, saveShiftAction } from "./actions";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const ROLES = [["en", "EN"], ["rn", "RN"], ["pca", "PCA"], ["dsw", "DSW"], ["cleaner", "CL"], ["student_nurse", "Student nurse"]] as const;
const VIEWS = [["all", "Everyone"], ["participant", "Participant"], ["location", "Location"], ["carer", "Carer"]] as const;
const SLOT_LABEL = Object.fromEntries(SLOTS.map((s) => [s.value, s.label]));

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export default async function Roster({ searchParams }: { searchParams: Promise<SP> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const week = weekStart(sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : today);
  const view = (VIEWS.find(([k]) => k === sp.view)?.[0] ?? "all") as (typeof VIEWS)[number][0];
  const filter: RosterFilter = view === "all" || !sp.who ? {} : { [view]: sp.who };

  const [opts, shifts] = await Promise.all([rosterOptions(), weekShifts(week, filter)]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const keep = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ week, view, ...(sp.who ? { who: sp.who } : {}), ...extra });
    return `/roster?${p}`;
  };
  const whoOptions = view === "participant" ? opts.participants : view === "location" ? opts.locations : view === "carer" ? opts.carers : [];
  const panel = sp.edit ? "edit" : sp.new ? "new" : null;

  return (
    <div className="shell">
      <TopBar section="/roster" email={staff.email}>
        <Link href={keep({ new: "ndis", day: days[0] < today ? today : days[0] })}>+ NDIS shift</Link>
        <Link href={keep({ new: "residential", day: days[0] < today ? today : days[0] })}>+ Residential shift</Link>
      </TopBar>

      <main className={`page wide ${panel ? "with-panel" : ""}`}>
        <div>
          {sp.msg && <p className="banner ok">{sp.msg}</p>}
          {sp.warn && <p className="banner warn">{sp.warn}</p>}
          {sp.error && <p className="banner error">{sp.error}</p>}

          <form className="row" method="get">
            <input type="hidden" name="week" value={week} />
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
            <div className="weeknav">
              <Link href={keep({ week: addDays(week, -7) })} aria-label="Previous week">←</Link>
              <strong>{dayLabel(week)} – {dayLabel(addDays(week, 6))}</strong>
              <Link href={keep({ week: addDays(week, 7) })} aria-label="Next week">→</Link>
              <Link href={keep({ week: weekStart(today) })}>This week</Link>
            </div>
          </form>

          <div className="week">
            {days.map((day) => {
              const list = shifts.filter((s) => s.day === day);
              return (
                <section key={day} className={`day ${day === today ? "today" : ""}`}>
                  <header>
                    <span>{dayLabel(day)}</span>
                    <Link href={keep({ new: "ndis", day })} title="New shift on this day">+</Link>
                  </header>
                  {list.length === 0 && <p className="none">No shifts</p>}
                  {list.map((s) => <ShiftCard key={s.id} s={s} href={keep({ edit: s.id })} active={s.id === sp.edit} />)}
                </section>
              );
            })}
          </div>
          <p className="lede">{shifts.length} shifts this week · {shifts.filter((s) => !s.carer && !s.cancelled).length} without a carer</p>
        </div>

        {panel === "edit" && sp.edit && <EditPanel id={sp.edit} opts={opts} close={keep({})} week={week} view={view} who={sp.who} />}
        {panel === "new" && (
          <ShiftForm
            opts={opts} close={keep({})} week={week} view={view} who={sp.who}
            kind={sp.new === "residential" ? "residential" : "ndis"} day={sp.day ?? today}
            free={await availableOn(sp.day ?? today)}
          />
        )}
      </main>
    </div>
  );
}

function ShiftCard({ s, href, active }: { s: RosterShift; href: string; active: boolean }) {
  const who = s.kind === "ndis" ? s.participant_name : s.location_name;
  return (
    <Link href={href} className={`shift ${s.kind} ${s.cancelled ? "cancelled" : ""} ${!s.carer ? "open" : ""} ${s.requested_by && !s.carer ? "requested" : ""} ${active ? "active" : ""}`}>
      <span className="time">{clockLabel(s.start_time)}–{clockLabel(s.end_time)}</span>
      <span className="who">{who || "—"}</span>
      <span className="carer">{s.carer_name || "No carer yet"}</span>
      <span className="meta">
        {roleLabel(s.roles)}
        {s.attended && " · attended"}
        {s.invoiced && " · invoiced"}
        {s.cancelled && " · cancelled"}
        {s.requested_by && ` · requested by ${s.requested_by}`}
      </span>
    </Link>
  );
}

type Opts = Awaited<ReturnType<typeof rosterOptions>>;
type Ctx = { opts: Opts; close: string; week: string; view: string; who?: string };

function Keep({ week, view, who }: { week: string; view: string; who?: string }) {
  return (
    <>
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="view" value={view} />
      {who && <input type="hidden" name="who" value={who} />}
    </>
  );
}

function ShiftForm({
  opts, close, week, view, who, kind, day, shift, free,
}: Ctx & {
  kind: "ndis" | "residential"; day: string;
  shift?: Awaited<ReturnType<typeof getShift>>;
  free?: Awaited<ReturnType<typeof availableOn>>;
}) {
  const ndis = kind === "ndis";
  const items = ndis ? opts.ndisItems : opts.resPrices;
  const role = shift?.roles?.[0] ?? (ndis ? "dsw" : "en");
  const freeIds = new Set((free ?? []).map((f) => f.carer));
  return (
    <aside className="panel">
      <header>
        <h2>{shift ? "Edit shift" : ndis ? "New NDIS shift" : "New residential shift"}</h2>
        <Link href={close} aria-label="Close">✕</Link>
      </header>
      <form action={saveShiftAction} className="stack">
        <Keep week={week} view={view} who={who} />
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
  const free = await availableOn(shift.day);
  const nextWeek = Array.from({ length: 7 }, (_, i) => addDays(shift.day, i + 1));
  return (
    <div className="panel-stack">
      <ShiftForm {...ctx} kind={shift.kind} day={shift.day} shift={shift} free={free} />
      <aside className="panel slim">
        <p className="figures">
          Fee ${Number(shift.fee ?? 0).toFixed(2)} · Wage ${Number(shift.wage ?? 0).toFixed(2)} · Revenue ${Number(shift.revenue ?? 0).toFixed(2)}
        </p>
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
