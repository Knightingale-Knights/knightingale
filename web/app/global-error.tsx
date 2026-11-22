"use client";
import { useEffect } from "react";

/**
 * Replaces Next's bare "Application error" screen. The usual cause is the app being updated while
 * the page was open (its buttons point at the old version), so it reloads once to the latest version.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    try {
      const key = `kn-reloaded:${location.pathname}`;
      if (sessionStorage.getItem(key)) return; // tried once already: show the message
      sessionStorage.setItem(key, "1");
      setTimeout(() => sessionStorage.removeItem(key), 30000);
    } catch { /* storage blocked */ }
    location.reload();
  }, [error]);
  return (
    <html lang="en-AU">
      <body style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", background: "#F6F4F0", color: "#1B1A18", padding: "60px 24px" }}>
        <h1 style={{ fontWeight: 300 }}>Updating…</h1>
        <p>Loading the latest version of the app. If this stays, tap Reload.</p>
        <button onClick={() => location.reload()} style={{ padding: "10px 18px" }}>Reload</button>
      </body>
    </html>
  );
}
