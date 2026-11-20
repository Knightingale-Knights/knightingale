"use client";
import { useState } from "react";

/** An office notice: shows until the carer taps "Got it" (which records it, unless the office is viewing as them). */
export function NoticePopup({ id, title, body, action }: { id: string; title: string; body: string; action: (f: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="nag-backdrop notice-back" role="dialog" aria-modal="true" aria-labelledby={`notice-${id}`}>
      <div className="nag">
        <h2 id={`notice-${id}`}>{title}</h2>
        <p className="notice-body">{body}</p>
        <form action={action} onSubmit={() => setOpen(false)} className="nag-actions">
          <input type="hidden" name="notice" value={id} />
          <button className="big">Got it</button>
        </form>
      </div>
    </div>
  );
}
