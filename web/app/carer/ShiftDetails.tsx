import Link from "next/link";
import type { ReactNode } from "react";
import type { CarerShift } from "@/lib/carer/data";
import { onShiftDay } from "@/lib/carer/rules";
import { shiftReceipts, shiftTravel } from "@/lib/carer/travel";
import { removeReceiptAction, removeTravelAction, requestSummaryAction, travelAction } from "./actions";
import { ReceiptDrop } from "./extras";
import { TripPlanner } from "./TripPlanner";
import { PendingButton } from "@/components/PendingButton";
import { NoteSteps } from "./NoteSteps";

export type DetailsMsgs = { view?: string; saved?: string; error?: string; travel?: string; xerror?: string; sent?: string; summary_error?: string };

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

/** The NDIS shift details popup: a grid of buttons, each opening its own view inside the popup. */
export async function ShiftDetails({ s, day, tab, email, msgs }: { s?: CarerShift; day: string; tab?: string; email: string; msgs: DetailsMsgs }) {
  if (!s || s.kind !== "ndis") return null;
  const close = `/carer?date=${day}`;
  const home = `${close}&details=${s.id}`;
  const open = TABS.find((t) => t.key === tab);
  const name = s.participant_name ?? s.place ?? "Shift";

  return (
    <div className="popup-back">
      <Link href={close} className="modal-shade" aria-label="Close" />
      <div className="popup details-popup shift-details">
        {!open ? (
          <>
            <h2>{name}</h2>
            {msgs.saved && <p className="banner ok">Thanks, your progress note is in.</p>}
            {s.address_text && (
              <>
                <h3>Address</h3>
                <p className="sd-address">{s.address_text}</p>
              </>
            )}
            <div className="sd-grid">
              {TABS.map((t) => (
                <Link key={t.key} href={`${home}&tab=${t.key}`} className="sd-btn">{t.icon}<span>{t.label}</span></Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <Link href={home} className="back">← Back to shift details</Link>
            <h2>{open.key === "notes" ? `${name}'s progress note` : open.key === "receipts" ? `${name} receipts` : open.label}</h2>
            <Section s={s} day={day} tab={open.key} first={name.split(" ")[0]} email={email} msgs={msgs} />
          </>
        )}
        <Link href={close} className="button secondary popup-later">Close</Link>
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
        <p>If you are new to working with {first} please request a summary. It will help you know what to do on your shift, how to provide which supports, and also give you insight into their personality.</p>
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
            <PendingButton className="big" pending="Putting the summary together…">Request {first}&apos;s summary</PendingButton>
            <p className="hint">It takes about a minute to put together.</p>
          </form>
        )}
      </>
    );
  }

  if (tab === "notes") {
    if (s.note_submitted) return <p className="banner ok">Your progress note has been submitted.</p>;
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

  return <p className="hint">Coming soon.</p>;
}
