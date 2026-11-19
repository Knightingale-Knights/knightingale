"use client";
import { useRef } from "react";
import { missAction } from "./actions";

/** The "missed" dropdown: saves as soon as a reason is picked (or cleared). */
export function MissSelect({ carer, day, value, reasons }: { carer: string; day: string; value: string; reasons: { value: string; display: string }[] }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={missAction} className="miss-form">
      <input type="hidden" name="carer" value={carer} />
      <input type="hidden" name="day" value={day} />
      <select name="reason" defaultValue={value} onChange={() => form.current?.requestSubmit()} className={value === "accepted" ? "ok" : value ? "on" : ""} aria-label="Missed">
        <option value="">–</option>
        {reasons.map((r) => <option key={r.value} value={r.value}>{r.display}</option>)}
      </select>
    </form>
  );
}
