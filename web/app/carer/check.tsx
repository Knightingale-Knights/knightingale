"use client";
import { useEffect, useState } from "react";
import { checkAction, type CheckResult } from "@/app/carer/actions";
import { linkCheckAction } from "@/app/c/[token]/actions";

type Props = { kind: "in" | "out"; shiftId: string; token?: string };

/** Gets a fresh, precise location from the phone, then asks the server to check in or out.
 *  A check-out is only recorded after the carer answers Yes to "Check out now?". */
function useCheck({ kind, shiftId, token }: Props) {
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const go = () => {
    setAsking(false);
    if (!navigator.geolocation) return setResult({ ok: false, message: "This phone can't share its location." });
    setBusy(true);
    setResult(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        const r = token ? await linkCheckAction(token, pos) : await checkAction(kind, shiftId, pos);
        setResult(r);
        setBusy(false);
        if (r.ok) setTimeout(() => window.location.replace(window.location.pathname + window.location.search), 1500);
      },
      () => {
        setResult({ ok: false, message: "Please allow location access for this site, then try again." });
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };
  const tap = () => {
    if (kind === "out") {
      setResult(null);
      setAsking(true);
    } else go();
  };
  const label = busy ? "Finding your location…" : kind === "in" ? "Check in" : "Check out";
  return { tap, go, busy, asking, cancel: () => setAsking(false), result, label };
}

type Check = ReturnType<typeof useCheck>;

/** The main button, or the "Check out now?" question in its place. */
function CheckControls({ c, done }: { c: Check; done?: boolean }) {
  if (c.asking) {
    return (
      <div className="check-confirm">
        <p className="check-confirm-q">Check out now?</p>
        <div className="shift-card-actions">
          <button className="secondary" onClick={c.cancel}>No</button>
          <button onClick={c.go}>Yes</button>
        </div>
      </div>
    );
  }
  return <button onClick={c.tap} disabled={c.busy || done} className="big">{c.label}</button>;
}

export function CheckButton(p: Props) {
  const c = useCheck(p);
  return (
    <div className="check">
      <CheckControls c={c} />
      {c.result && <p className={`banner ${c.result.ok ? "ok" : "error"}`}>{c.result.message}</p>}
    </div>
  );
}

const dismissKey = (p: Props) => `kn-dismiss:${p.shiftId}:${p.kind}`;

/** Pops up over the page when a check in or check out is due. "Not now" hides it for this visit. */
export function CheckPopup(p: Props & { title: string; detail: string; force?: boolean }) {
  const c = useCheck(p);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let hidden = false;
    try { hidden = !p.force && sessionStorage.getItem(dismissKey(p)) === "1"; } catch {}
    setOpen(!hidden);
  }, [p.force, p.shiftId, p.kind]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  const close = () => {
    try { sessionStorage.setItem(dismissKey(p), "1"); } catch {}
    setOpen(false);
  };
  return (
    <div className="popup-back" role="dialog" aria-modal="true" aria-labelledby="check-title">
      <div className="popup">
        <h2 id="check-title">{p.kind === "in" ? "Ready to check in?" : "Ready to check out?"}</h2>
        <p className="popup-shift">{p.title}</p>
        <p className="hint">{p.detail}</p>
        <CheckControls c={c} done={c.result?.ok} />
        {c.result && <p className={`banner ${c.result.ok ? "ok" : "error"}`}>{c.result.message}</p>}
        {!c.result?.ok && !c.asking && <button className="link popup-later" onClick={close}>Not now</button>}
        <p className="hint">You need to be within 500 m of the address, with location turned on.</p>
      </div>
    </div>
  );
}
