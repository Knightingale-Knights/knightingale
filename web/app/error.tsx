"use client";
import { useEffect } from "react";

// Signs that the app was updated while this page was open: the fix is simply to load the new version.
const STALE = /Server Action|ChunkLoadError|Loading chunk|dynamically imported module|deployment/i;

/** Shown instead of "Application error". After an update it reloads the page once by itself. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = STALE.test(error?.message ?? "");
  useEffect(() => {
    if (!stale) return;
    try {
      const key = `kn-reloaded:${location.pathname}`;
      if (sessionStorage.getItem(key)) return; // already tried once: show the message instead
      sessionStorage.setItem(key, "1");
      setTimeout(() => sessionStorage.removeItem(key), 30000);
    } catch { /* storage blocked */ }
    location.reload();
  }, [stale]);
  return (
    <main className="narrow" style={{ padding: "60px 24px" }}>
      <h1>{stale ? "Updating…" : "Something went wrong"}</h1>
      <p className="lede">{stale ? "The app was just updated. Loading the latest version." : "Please try again. If it keeps happening, let the office know."}</p>
      <div className="row">
        <button onClick={() => location.reload()}>Reload</button>
        {!stale && <button className="secondary" onClick={() => reset()}>Try again</button>}
      </div>
    </main>
  );
}
