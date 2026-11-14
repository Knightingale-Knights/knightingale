"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-reads the chat every 15 seconds while the page is open and visible, and keeps it scrolled to the newest message. */
export function ChatRefresh() {
  const router = useRouter();
  useEffect(() => {
    document.getElementById("end")?.scrollIntoView();
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 15000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
