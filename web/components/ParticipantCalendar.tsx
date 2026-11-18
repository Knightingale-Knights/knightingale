import Link from "next/link";
import { calAppts, calNotes, calShifts, type CalNote } from "@/lib/participants/calendar";
import { addDays, clockLabel } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { EMPTY_NOTE_FIELD, NOTE_FIELDS } from "@/lib/carer/rules";
import { Portrait } from "@/components/CarerCells";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const fmt = (day: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-AU", { ...o, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const monthStart = (day: string) => `${day.slice(0, 7)}-01`;
const addMonths = (day: string, n: number) => {
  const d = new Date(`${monthStart(day)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
const LABELS: Record<(typeof NOTE_FIELDS)[number], string> = {
  general_mood: "General Mood", best_day: "Best Part of the Day", activities_of_daily_living: "Activities of Daily Living",
  food_intake: "Food Intake", fluid_intake: "Fluid Intake", outings: "Outings", housework: "Housework",
  medical_appointments: "Medical Appointments", allied_health: "Allied Health", comms: "Communication", maintenance: "Maintenance",
};

function NoteBody({ n }: { n: CalNote }) {
  const fields = NOTE_FIELDS.filter((f) => n[f]?.trim() && n[f]!.trim().toLowerCase() !== EMPTY_NOTE_FIELD.toLowerCase());
  return (
    <div className="cal-note">
      {n.summary && <section className="coord-note"><h2>Summary</h2><p>{n.summary}</p></section>}
      {fields.map((f) => <section key={f} className="coord-note"><h2>{LABELS[f]}</h2><p>{n[f]}</p></section>)}
    </div>
  );
}

/** A participant's month and day calendar marked for shifts, appointments and progress notes (admin). */
export async function ParticipantCalendar({ participant, view, day: dayIn, base }: { participant: string; view: "month" | "day"; day?: string; base: string }) {
  const today = isoDate(new Date());
  const day = dayIn && /^\d{4}-\d{2}-\d{2}$/.test(dayIn) ? dayIn : today;
  const href = (o: { view?: string; d?: string }) => `${base}?${new URLSearchParams({ view: o.view ?? view, d: o.d ?? day })}#calendar`;
  const first = monthStart(day);
  const last = addDays(addMonths(day, 1), -1);
  const gridFrom = addDays(first, -weekday(first));
  const gridTo = addDays(last, 6 - weekday(last));
  const [rf, rt] = view === "day" ? [day, day] : [gridFrom, gridTo];
  const [shifts, appts, notes] = await Promise.all([calShifts(participant, rf, rt), calAppts(participant, rf, rt), calNotes(participant, rf, rt)]);
  const perDay = new Map<string, number>();
  for (const s of shifts) perDay.set(s.day, (perDay.get(s.day) ?? 0) + 1);
  const apptDays = new Set(appts.map((a) => a.day));
  const noteDays = new Set(notes.map((n) => n.day));
  const cells: string[] = [];
  for (let d = gridFrom; d <= gridTo; d = addDays(d, 1)) cells.push(d);
  const noteById = new Map(notes.map((n) => [n.id, n]));
  const shownNotes = new Set(shifts.map((s) => s.note_id).filter(Boolean));

  return (
    <section id="calendar" className="coord pcal">
      <div className="coord-bar">
        <nav className="coord-tabs">
          <Link href={href({ view: "month" })} className={view === "month" ? "on" : ""}>Month</Link>
          <Link href={href({ view: "day" })} className={view === "day" ? "on" : ""}>Day</Link>
        </nav>
      </div>
      <div className="coord-legend">
        <span><i className="dot shift" />shift</span>
        <span><i className="dot appt" />appointment</span>
        <span><i className="dot note" />progress note</span>
      </div>

      {view === "month" ? (
        <>
          <div className="coord-step">
            <Link href={href({ d: addMonths(day, -1) })} aria-label="Previous month">‹</Link>
            <span>{fmt(first, { month: "long", year: "numeric" })}</span>
            <Link href={href({ d: addMonths(day, 1) })} aria-label="Next month">›</Link>
          </div>
          <div className="coord-month">
            {WEEK.map((w, i) => <span key={i} className="coord-wd">{w}</span>)}
            {cells.map((d) => (
              <Link key={d} href={href({ view: "day", d })}
                className={`coord-day${d.slice(0, 7) !== first.slice(0, 7) ? " out" : ""}${d === today ? " today" : ""}${perDay.get(d) ? " has-shift" : ""}`}>
                <span className={`coord-ring${apptDays.has(d) ? " has-appt" : ""}${noteDays.has(d) ? " has-note" : ""}`}>
                  <span>{Number(d.slice(8))}</span>
                  {perDay.get(d) ? <small>{perDay.get(d)} shift{perDay.get(d) === 1 ? "" : "s"}</small> : <small className="none">›</small>}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="coord-step">
            <Link href={href({ d: addDays(day, -1) })} aria-label="Previous day">‹</Link>
            <span>{fmt(day, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            <Link href={href({ d: addDays(day, 1) })} aria-label="Next day">›</Link>
          </div>
          <div className="coord-shifts">
            <h2>Shifts</h2>
            {shifts.length ? shifts.map((s) => {
              const n = s.note_id ? noteById.get(s.note_id) : undefined;
              return (
                <article key={s.id} className="coord-shift">
                  {s.carer ? <div className="coord-carer"><Portrait photo={s.carer_photo} name={s.carer} /><span>{s.carer}</span></div>
                    : <div className="coord-carer muted">No carer yet</div>}
                  {s.carer_phone && <a className="coord-phone" href={`tel:${s.carer_phone}`}>{s.carer_phone}</a>}
                  <p className="coord-time">{clockLabel(s.start_time)} - {clockLabel(s.end_time)}</p>
                  {n && <details className="cal-more"><summary>Progress Note</summary><NoteBody n={n} /></details>}
                  {appts.length > 0 && (
                    <details className="cal-more"><summary>Appointment{appts.length === 1 ? "" : "s"}</summary>
                      {appts.map((a) => <div key={a.id} className="coord-note"><h2>{a.time ?? "Appointment"}</h2><p>{[a.details, a.address, a.carer ? `Carer: ${a.carer}` : null, a.notes].filter(Boolean).join("\n")}</p></div>)}
                    </details>
                  )}
                </article>
              );
            }) : <p className="hint">No shifts this day.</p>}
          </div>
          {shifts.length === 0 && appts.length > 0 && (
            <div className="coord-shifts appt">
              <h2>Appointments</h2>
              {appts.map((a) => (
                <article key={a.id} className="coord-shift">
                  {a.time && <p className="coord-time">{a.time}</p>}
                  <p className="coord-detail">{[a.details, a.address, a.carer ? `Carer: ${a.carer}` : null, a.notes].filter(Boolean).join("\n")}</p>
                </article>
              ))}
            </div>
          )}
          {notes.filter((n) => !shownNotes.has(n.id)).length > 0 && (
            <div className="coord-shifts note">
              <h2>Progress Notes</h2>
              {notes.filter((n) => !shownNotes.has(n.id)).map((n) => (
                <article key={n.id} className="coord-shift">
                  {n.carer && <p className="coord-time">by {n.carer}</p>}
                  <details className="cal-more"><summary>Read note</summary><NoteBody n={n} /></details>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
