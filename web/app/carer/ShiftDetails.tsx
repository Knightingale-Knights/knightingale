import Link from "next/link";
import type { ReactNode } from "react";
import type { CarerShift } from "@/lib/carer/data";
import { NOTE_CLOSED, noteOpen, onShiftDay } from "@/lib/carer/rules";
import { shiftReceipts, shiftTravel } from "@/lib/carer/travel";
import { carerIntakeAction, incidentAction, removeReceiptAction, removeTravelAction, requestSummaryAction, travelAction } from "./actions";
import { ReceiptDrop } from "./extras";
import { TripPlanner } from "./TripPlanner";
import { PendingButton } from "@/components/PendingButton";
import { NoteSteps } from "./NoteSteps";
import { RecordFields } from "@/components/RecordForm";
import { INTAKE, intakeFor } from "@/lib/participants/intake";
import { loadOptions, planManagers, readRecord } from "@/lib/forms/fields";
import { INCIDENT_HARM, INCIDENT_TYPES, INJURY_LOCATION, INJURY_NATURE, NOT_NDIS, REPORTABLE_TYPES } from "@/lib/participants/incident";
import { isoDate } from "@/lib/invoicing/rules";
import { sql } from "@/lib/db";

export type DetailsMsgs = { note?: string; done?: string; view?: string; saved?: string; error?: string; travel?: string; xerror?: string; sent?: string; summary_error?: string };

const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const TABS: { key: string; label: string; icon: ReactNode }[] = [
  { key: "summary", label: "Support summary", icon: I(<><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r=".6" /><circle cx="4" cy="12" r=".6" /><circle cx="4" cy="18" r=".6" /></>) },
  { key: "notes", label: "Notes", icon: I(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>) },
  { key: "trip", label: "Add travel", icon: I(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 11-5.7" /><circle cx="12" cy="10" r="2.5" /><path d="M19 3v6M16 6h6" /></>) },
  { key: "receipts", label: "Receipts", icon: I(<path d="M16 7.5c-.6-1.4-2-2.2-4-2.2-2.4 0-4 1.2-4 3s1.6 2.5 4 3c2.6.5 4 1.3 4 3.2s-1.7 3.2-4 3.2c-2.1 0-3.6-.9-4.2-2.4M12 3v2.3M12 18.7V21" />) },
  { key: "intake", label: "Intake", icon: I(<><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" /></>) },
  { key: "agreement", label: "Agreement", icon: I(<><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c.6-3.5 3.2-5.5 6.5-5.5 1.4 0 2.6.3 3.6.9M14 19l2 2 4.5-4.5" /></>) },
  { key: "incident", label: "Incident", icon: I(<><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M7.5 7h4v4h-4zM14 7.5h3M14 10.5h3M7.5 14h9.5M7.5 17.5h9.5" /></>) },
  { key: "risk", label: "Risk", icon: I(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />) },
  { key: "support", label: "Support", icon: I(<><circle cx="13" cy="4" r="1.6" /><path d="m9 21 3-7 3 3v4M7 12l3-5 4 1 2 4M12 14l-1-4" /></>) },
  { key: "consent", label: "Consent", icon: I(<path d="M7 19.5c1.3-2.5 2-5.2 2-7.5a3 3 0 0 1 6 0c0 1.2-.1 2.4-.4 3.5M11.5 21c1-2.6 1.5-5.6 1.5-9M5 16c.7-1.3 1-2.7 1-4a6 6 0 0 1 10.6-3.8M17.5 18c.6-1.8 1-3.8 1-6 0-.7 0-1.3-.2-2M15 21c.3-.6.6-1.3.8-2" />) },
  { key: "emergency", label: "Emergency", icon: I(<><path d="M7 15.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8a3.8 3.8 0 0 1-.5 7.5H7z" /><path d="m10 17-1.5 3M14 17l-1.5 3M12.5 13 11 16h3l-1.5 3" /></>) },
];

const TITLES: Record<string, (n: string) => string> = {
  summary: (n) => `About ${n.split(" ")[0]}`,
  notes: (n) => `${n}'s progress note`,
  receipts: (n) => `${n} receipts`,
  intake: (n) => `${n} intake form`,
  incident: (n) => `${n}'s incident report`,
  note: (n) => `${n}'s progress note`,
};

type NoteRow = { id: string; day: string; carer: string | null; summary: string | null; comms: string | null; best_day: string | null };

/** Submitted progress notes for the participant, newest first. */
async function participantNotes(participant: string) {
  return sql<NoteRow[]>`
    select n.id, to_char(n.date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') as day, c.first_name as carer,
           n.summary, n.comms, n.best_day
      from app.progress_notes n left join app.users c on c.id = n.carer
     where n.participant = ${participant} and (coalesce(n.submit, false) or coalesce(length(trim(n.summary)), 0) > 0)
     order by n.date desc nulls last, n.created_at desc limit 300`;
}
const dm = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

const Sel = ({ name, label, options, required, hint }: { name: string; label: string; options: string[]; required?: boolean; hint?: string }) => (
  <label>{label}
    <select name={name} defaultValue="" required={required}>
      <option value="">{hint ?? "Choose…"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);
const Ticks = ({ name, label, options }: { name: string; label: string; options: string[] }) => (
  <fieldset className="ticks">
    <legend>{label}</legend>
    {options.map((o) => <label key={o}><input type="checkbox" name={name} value={o} /><span>{o}</span></label>)}
  </fieldset>
);

async function NotesList({ s, home }: { s: CarerShift; home: string }) {
  const notes = await participantNotes(s.participant!);
  return (
    <>
      <h3>Progress notes</h3>
      {notes.length === 0 ? (
        <p className="hint">No progress notes yet.</p>
      ) : (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <span>{n.day ? dm(n.day) : "–"}</span>
              <Link href={`${home}&tab=note&note=${n.id}`} className="button secondary">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** The NDIS shift details popup: a grid of buttons, each opening its own view inside the popup. */
export async function ShiftDetails({ s, day, tab, email, msgs }: { s?: CarerShift; day: string; tab?: string; email: string; msgs: DetailsMsgs }) {
  if (!s || s.kind !== "ndis") return null;
  const close = `/carer?date=${day}`;
  const home = `${close}&details=${s.id}`;
  const open = TABS.find((t) => t.key === tab) ?? (tab === "note" ? { key: "note", label: "Progress note", icon: null } : undefined);
  const name = s.participant_name ?? s.place ?? "Shift";

  return (
    <div className="popup-back">
      <Link href={open ? home : close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup shift-details">
        {!open ? (
          <>
            <h2>{name}</h2>
            {msgs.saved && <p className="banner ok">Thanks, your progress note is in.</p>}
            {msgs.done && <p className="banner ok">{msgs.done}</p>}
            {s.address_text && (
              <>
                <h3>Address</h3>
                <p className="sd-address">{s.address_text}</p>
              </>
            )}
            <div className="sd-grid">
              {TABS.map((t) => (
                <Link key={t.key} href={`${home}&tab=${t.key}`} className="sd-btn">{t.icon}<span>{t.key === "summary" ? `About ${name.split(" ")[0]}` : t.label}</span></Link>
              ))}
            </div>
            {s.participant && <NotesList s={s} home={home} />}
          </>
        ) : (
          <>
            <Link href={home} className="back">← Back to shift details</Link>
            <h2>{TITLES[open.key]?.(name) ?? open.label}</h2>
            <Section s={s} day={day} tab={open.key} first={name.split(" ")[0]} email={email} msgs={msgs} />
          </>
        )}
        <Link href={open ? home : close} className="button secondary popup-later">Close</Link>
      </div>
    </div>
  );
}

async function Section({ s, day, tab, first, email, msgs }: { s: CarerShift; day: string; tab: string; first: string; email: string; msgs: DetailsMsgs }) {
  if (s.cancelled) return <p className="banner warn">This shift has been cancelled.</p>;
  const onDay = onShiftDay(s);

  if (tab === "summary") {
    return (
      <>
        <p>If you are new to working with {first} please tap About {first} for a support summary. It will help you know what to do on your shift, how to provide which supports, and also give you insight into their personality.</p>
        <p>We want to see you succeed. We hope this helps.</p>
        <p>It will be sent to your email: {email}.</p>
        <p>If you have any suggestions on how to make it better, please email <a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a>. We love feedback. We love to improve.</p>
        {msgs.sent && <p className="banner ok">{msgs.sent}</p>}
        {msgs.summary_error && <p className="banner error">{msgs.summary_error}</p>}
        {!msgs.sent && (
          <form action={requestSummaryAction}>
            <input type="hidden" name="shift" value={s.id} />
            <input type="hidden" name="date" value={day} />
            <input type="hidden" name="in" value="details" />
            <PendingButton className="big" pending="Putting it together…">About {first}</PendingButton>
            <p className="hint">It takes about a minute to put together.</p>
          </form>
        )}
      </>
    );
  }

  if (tab === "notes") {
    if (s.note_submitted) return <p className="banner ok">Your progress note has been submitted.</p>;
    if (!noteOpen(s)) return <p className="hint">{NOTE_CLOSED} If you missed it, text Klarra on 0483 931 556.</p>;
    return <NoteSteps shiftId={s.id} error={msgs.error} />;
  }

  if (tab === "trip") {
    if (!onDay) return <p className="hint">Trips can be added on the day of the shift.</p>;
    const travel = await shiftTravel(s.id);
    return (
      <>
        {msgs.xerror && <p className="banner error">{msgs.xerror}</p>}
        {msgs.travel && <p className="banner ok">Trip added.</p>}
        <TripPlanner shiftId={s.id} to={s.address_text ?? ""} mapsKey={process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || ""} />
        {travel.length > 0 && (
          <>
            <h3>Trips on this shift</h3>
            <ul className="extras">
              {travel.map((t) => (
                <li key={t.id}>
                  <span>{t.from ?? "?"} → {t.to ?? "?"}</span>
                  <strong>{Number(t.km).toFixed(1)} km · ${Number(t.km).toFixed(2)}</strong>
                  {!t.invoiced && (
                    <form action={removeTravelAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="log" value={t.id} />
                      <button className="link danger">Remove</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    );
  }

  if (tab === "receipts") {
    const receipts = await shiftReceipts(s.id);
    const base = `/carer?date=${day}&details=${s.id}&tab=receipts`;
    const view = msgs.view === "1";
    return (
      <>
        <div className="receipt-tabs">
          <Link href={base} className={!view ? "on" : ""}>Upload</Link>
          <Link href={`${base}&view=1`} className={view ? "on" : ""}>View</Link>
          <span>Total = ${Number(receipts.total ?? 0).toFixed(2)}</span>
        </div>
        {msgs.xerror && <p className="banner error">{msgs.xerror}</p>}
        {!view ? (
          onDay ? <ReceiptDrop shiftId={s.id} /> : <p className="hint">Receipts can be added on the day of the shift.</p>
        ) : receipts.files.length === 0 ? (
          <p className="hint">No receipts on this shift yet.</p>
        ) : (
          <div className="receipt-grid">
            {receipts.files.map((r) => (
              <figure key={r.id}>
                <a href={`/receipts/${r.id}`} target="_blank" rel="noreferrer">
                  {/\.pdf$/i.test(r.file_name) ? <span className="receipt-pdf">PDF</span> : <img src={`/receipts/${r.id}`} alt={r.merchant ?? "Receipt"} />}
                </a>
                <figcaption>
                  <span>{r.merchant ?? r.file_name}</span>
                  <strong>{r.total != null && !r.needs_review ? `$${Number(r.total).toFixed(2)}` : "Office to check"}</strong>
                  <form action={removeReceiptAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="receipt" value={r.id} />
                    <button className="link danger">Delete</button>
                  </form>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </>
    );
  }

  if (tab === "intake") {
    if (!s.participant) return <p className="hint">This shift has no participant.</p>;
    const cur = await intakeFor(s.participant);
    const [values, options, pms] = await Promise.all([readRecord("intakes", cur?.id ?? null), loadOptions(INTAKE), planManagers()]);
    return (
      <form action={carerIntakeAction} className="stack record-in-popup">
        <input type="hidden" name="id" value={s.id} />
        {msgs.error && <p className="banner error">{msgs.error}</p>}
        <RecordFields sections={INTAKE} values={values} options={options} planManagers={pms} />
        <PendingButton className="big" pending="Saving…">Save intake</PendingButton>
      </form>
    );
  }

  if (tab === "incident") {
    return (
      <form action={incidentAction} className="stack record-in-popup incident-form">
        <input type="hidden" name="id" value={s.id} />
        {msgs.error && <p className="banner error">{msgs.error}</p>}
        <fieldset className="form-section">
          <legend>Incident details</legend>
          <Sel name="incident_type" label="Type of incident" options={INCIDENT_TYPES} required />
          <Sel name="incident_harm" label="Harm" options={INCIDENT_HARM} hint="Select if one applies" />
          <div className="two">
            <label>Date of incident<input type="date" name="day" defaultValue={isoDate(new Date())} required /></label>
            <label>Time<input type="time" name="time" required /></label>
          </div>
          <label>Location of incident<input name="incident_location" placeholder="Bedroom / Living room / Shopping centre / Car" maxLength={300} /></label>
          <Sel name="reportable_yes_no" label="Reportable incident?" options={["YES", "NO"]} required hint="Yes / No" />
          <Sel name="reportable_type" label="If reportable, which one" options={REPORTABLE_TYPES} hint="Select if one applies" />
          <Sel name="not_ndis" label="Non NDIS incident?" options={NOT_NDIS} hint="Select if one applies" />
          <label>Describe the incident
            <textarea name="incident_description" rows={7} required minLength={20} maxLength={6000}
              placeholder={"Please include a detailed description of the incident, including:\nWho was involved\nWhat and how it occurred or was alleged to have occurred\nWhy it occurred (if known)"} />
          </label>
          <Ticks name="injury_nature" label="Nature of injury (select all that apply)" options={INJURY_NATURE} />
          <Ticks name="injury_location" label="Location of injury (select all that apply)" options={INJURY_LOCATION} />
          <label>Actions to make the situation safe
            <textarea name="safety_actions" rows={4} maxLength={6000} placeholder="Immediate actions taken to make the situation safe (including any medical treatment received, or assistance provided or offered)" />
          </label>
          <label>Witnesses to incident
            <textarea name="witnesses" rows={3} maxLength={2000} placeholder={"Witness name:\nWitness phone number:\nWitness email:"} />
          </label>
        </fieldset>
        <PendingButton className="big" pending="Sending…">Submit incident report</PendingButton>
      </form>
    );
  }

  if (tab === "note") {
    const n = s.participant && msgs.note ? (await participantNotes(s.participant)).find((x) => x.id === msgs.note) : undefined;
    if (!n) return <p className="hint">We couldn't find that progress note.</p>;
    return (
      <div className="note-view">
        <p className="hint">{n.day ? dm(n.day) : ""}{n.carer ? ` · ${n.carer}` : ""}</p>
        <h3>Summary</h3>
        <p>{n.summary ?? "–"}</p>
        <h3>Communication book</h3>
        <p>{n.comms ?? "–"}</p>
        <h3>Best day</h3>
        <p>{n.best_day ?? "–"}</p>
      </div>
    );
  }

  return <p className="hint">Coming soon.</p>;
}
