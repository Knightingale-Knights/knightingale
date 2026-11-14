"use client";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { bookAction } from "./actions";
import { BOOKABLE_ROLES, MAX_NOTES, bookingDay, roleName } from "@/lib/facility/rules";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return <button type="submit" className="big" disabled={pending}>{pending ? "Booking…" : "Confirm booking"}</button>;
}

/** Book a carer: fill in the form, check it in a popup, then confirm. */
export function BookForm({ today, facility }: { today: string; facility: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [review, setReview] = useState<Record<string, string> | null>(null);
  const open = () => {
    const f = form.current!;
    if (!f.reportValidity()) return;
    setReview(Object.fromEntries(new FormData(f)) as Record<string, string>);
  };
  return (
    <form ref={form} action={bookAction} className="stack book">
      <label>Date<input type="date" name="day" min={today} defaultValue={today} required /></label>
      <div className="row tight">
        <label>Start<input type="time" name="start" required /></label>
        <label>End<input type="time" name="end" required /></label>
      </div>
      <label>Carer type
        <select name="role" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {BOOKABLE_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label>Notes (optional)<textarea name="notes" rows={3} maxLength={MAX_NOTES} placeholder="Anything we should know, such as who to report to" /></label>
      <button type="button" className="big" onClick={open}>Review booking</button>

      {review && (
        <div className="popup-back" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="popup">
            <h2 id="review-title">Check your booking</h2>
            <p className="popup-shift">{roleName(review.role)} at {facility}</p>
            <p>{bookingDay(review.day)}, {review.start} to {review.end}</p>
            {review.notes?.trim() && <p className="hint">{review.notes}</p>}
            <ConfirmButton />
            <button type="button" className="link popup-later" onClick={() => setReview(null)}>Change something</button>
          </div>
        </div>
      )}
    </form>
  );
}
