"use client";
import { useState } from "react";
import { checkAction, type CheckResult } from "../../actions";

/** Gets a fresh, precise location from the phone, then asks the server to check in or out. */
export function CheckButton({ kind, shiftId }: { kind: "in" | "out"; shiftId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const go = () => {
    if (!navigator.geolocation) {
      setResult({ ok: false, message: "This phone can't share its location." });
      return;
    }
    setBusy(true);
    setResult(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const r = await checkAction(kind, shiftId, { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
        setResult(r);
        setBusy(false);
        if (r.ok) setTimeout(() => window.location.reload(), 1500);
      },
      () => {
        setResult({ ok: false, message: "Please allow location access for this site, then try again." });
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return (
    <div className="check">
      <button onClick={go} disabled={busy} className="big">
        {busy ? "Finding your location…" : kind === "in" ? "Check in" : "Check out"}
      </button>
      {result && <p className={`banner ${result.ok ? "ok" : "error"}`}>{result.message}</p>}
    </div>
  );
}
