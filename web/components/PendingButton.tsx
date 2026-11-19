"use client";
import { useFormStatus } from "react-dom";

/** A submit button that says it's working while the form is being sent.
 *  With name and value, only the button that was tapped shows the working text. */
export function PendingButton({ children, pending, className, name, value }: {
  children: React.ReactNode; pending: string; className?: string; name?: string; value?: string;
}) {
  const { pending: busy, data } = useFormStatus();
  const mine = busy && (!name || data?.get(name) === value);
  return <button className={className} disabled={busy} name={name} value={value}>{mine ? pending : children}</button>;
}
