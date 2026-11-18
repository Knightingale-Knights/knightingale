"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Nag } from "@/lib/account/nag";

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
const short = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

const reason = (i: Nag["items"][number]) =>
  i.why === "missing" ? "Not uploaded yet" : i.why === "expired" ? `Expired ${short(i.expiry!)}` : `Expires ${short(i.expiry!)}`;

/**
 * The account reminder. Before the due date it closes ("Remind me later"); after it, it won't close for the carer
 * (closable is still true on their Account and Availability pages, and always for the office viewing as them).
 */
export function AccountNag({ nag, closable, storeKey }: { nag: Nag; closable: boolean; storeKey: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let closed = false;
    try { closed = closable && sessionStorage.getItem(storeKey) === "1"; } catch {}
    setOpen(!closed);
  }, [closable, storeKey]);
  if (!open || !nag.items.length) return null;

  const close = () => {
    try { sessionStorage.setItem(storeKey, "1"); } catch {}
    setOpen(false);
  };
  const first = nag.items.reduce((a, b) => (a.due <= b.due ? a : b));
  const one = nag.items.length === 1;

  return (
    <div className="nag-backdrop" role="dialog" aria-modal="true" aria-labelledby="nag-title">
      <div className="nag">
        <p className="label">{nag.blocked ? "Your account" : "A gentle reminder"}</p>
        <h2 id="nag-title">{nag.blocked ? "Just one more step" : `Hi ${nag.firstName}, a quick one`}</h2>
        {nag.blocked ? (
          <p>Hi {nag.firstName}, before you can see your shifts again we just need {one ? "this" : "these"} from you. It only takes a minute, and as soon as {one ? "it's" : "they're"} done, everything opens straight back up.</p>
        ) : (
          <p>Thank you for everything you do. We noticed {one ? "something" : "a few things"} in your account need{one ? "s" : ""} a little attention. There's no rush today: you have until <strong>{day(first.due)}</strong>.</p>
        )}
        <ul className="nag-list">
          {nag.items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} onClick={close}>
                <span className="nag-item">{i.label}</span>
                <span className={`nag-why${i.overdue ? " over" : ""}`}>{reason(i)}{i.overdue ? "" : ` · by ${short(i.due)}`}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!nag.blocked && (
          <p className="hint">After that date this message won&apos;t close until it&apos;s done, simply so we can keep you, and the people you care for, safe and covered.</p>
        )}
        <p className="hint">If anything&apos;s tricky, text Klarra on 0483 931 556 and we&apos;ll help.</p>
        <div className="nag-actions">
          <Link className="big button" href={first.href} onClick={close}>Take me there</Link>
          {closable && <button type="button" className="secondary" onClick={close}>{nag.blocked ? "Close" : "Remind me later"}</button>}
        </div>
      </div>
    </div>
  );
}
