"use client";
import { useEffect } from "react";

/** Safari ignores the "no zoom" viewport setting, so block its pinch gesture here as well. */
export function NoZoom() {
  useEffect(() => {
    // Maps still pinch-zoom.
    const inMap = (e: Event) => e.target instanceof Element && Boolean(e.target.closest(".gm-style, [data-allow-zoom]"));
    const stop = (e: Event) => { if (!inMap(e)) e.preventDefault(); };
    const pinch = (e: TouchEvent) => { if (e.touches.length > 1 && !inMap(e)) e.preventDefault(); };
    document.addEventListener("gesturestart", stop, { passive: false });
    document.addEventListener("gesturechange", stop, { passive: false });
    document.addEventListener("touchmove", pinch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("touchmove", pinch);
    };
  }, []);
  return null;
}
