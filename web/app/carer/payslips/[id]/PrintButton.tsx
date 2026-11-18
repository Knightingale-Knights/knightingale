"use client";

/** Opens the browser's print dialog, where the payslip can be saved as a PDF. */
export function PrintButton() {
  return <button type="button" className="secondary slip-pdf" onClick={() => window.print()}>⤓ Download PDF</button>;
}
