"use client";
import { useState } from "react";

const n = (v: string) => Number(v.replace(/[$,\s]/g, "")) || 0;
const f2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2);

/** The money boxes in the Pay popup. Super and net pay follow gross, tax and reimbursements as they're changed. */
export function PayFields({ d, notes }: {
  d: { gross: number; tax: number; reimbursements: number; hours: number };
  notes: { gross: string; tax: string; reimbursements: string };
}) {
  const [gross, setGross] = useState(f2(d.gross));
  const [tax, setTax] = useState(f2(d.tax));
  const [reimb, setReimb] = useState(f2(d.reimbursements));
  const sup = f2(n(gross) * 0.12);
  const net = f2(n(gross) - n(tax) + n(reimb));
  const box = (name: string, label: string, value: string, set: ((v: string) => void) | null, note?: string) => (
    <label>{label}
      <input name={name} value={value} inputMode="decimal" required readOnly={!set} onChange={set ? (e) => set(e.target.value) : undefined} />
      {note && <small className="hint">{note}</small>}
    </label>
  );
  return (
    <>
      {box("gross", "Gross pay", gross, setGross, notes.gross)}
      {box("tax", "Tax", tax, setTax, notes.tax)}
      {box("super", "Super", sup, null, "12% of gross pay")}
      {box("reimbursements", "Reimbursements", reimb, setReimb, notes.reimbursements)}
      {box("net", "Net pay", net, null, "Gross - tax + reimbursements")}
      <label>Hours<input name="hours" defaultValue={f2(d.hours)} inputMode="decimal" required /></label>
    </>
  );
}
