"use client";
import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { feedbackAction, type FeedbackResult } from "./feedback";

/**
 * "Feedback" in the carer menu: a popup where the carer writes feedback, emailed to the office.
 * The popup is placed on the page body, so it stays open when the phone menu closes.
 */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FeedbackResult, FormData>(feedbackAction, null);
  const [round, setRound] = useState(0); // fresh form each time it opens
  return (
    <>
      <button type="button" className="side-btn side-feedback" onClick={() => { setRound((r) => r + 1); setOpen(true); }}>Feedback</button>
      {open && createPortal(
        <div className="popup-back" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="popup">
            <h2 id="feedback-title">Feedback</h2>
            <Form key={round} action={action} pending={pending} state={state} onClose={() => setOpen(false)} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function Form({ action, pending, state, onClose }: { action: (f: FormData) => void; pending: boolean; state: FeedbackResult; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  if (sent && state?.ok) {
    return (
      <>
        <p>{state.message}</p>
        <button className="big" onClick={onClose}>Close</button>
      </>
    );
  }
  return (
    <form action={(f) => { setSent(true); action(f); }} className="stack">
      <p className="hint">Tell us what&apos;s working, what isn&apos;t, or any ideas. It goes straight to the Knightingale team.</p>
      <textarea name="feedback" rows={6} required maxLength={5000} autoFocus />
      {sent && state && !state.ok && <p className="banner error">{state.message}</p>}
      <div className="row">
        <button className="big" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
        <button type="button" className="big secondary" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
