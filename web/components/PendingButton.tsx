"use client";
import { useFormStatus } from "react-dom";

/** A submit button that says it's working while the form is being sent. */
export function PendingButton({ children, pending, className }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return <button className={className} disabled={busy}>{busy ? pending : children}</button>;
}
