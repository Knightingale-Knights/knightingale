"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SAVING = "is-saving";
const DONE = "is-done";

/** Finishes every running fill (to 100%), then clears it. */
function finishAll() {
  document.querySelectorAll<HTMLElement>(`.${SAVING}`).forEach((b) => {
    b.classList.add(DONE);
    window.setTimeout(() => b.classList.remove(SAVING, DONE), 260);
  });
}

/**
 * Whenever a form is submitted, the button that sent it fills from left to right until the save finishes
 * (the page moves on, the button is re-enabled, or 15 s pass). Mounted once for the whole app.
 */
export function SaveProgress() {
  const path = usePathname();
  const query = useSearchParams();

  useEffect(() => {
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const b = (e.submitter as HTMLElement | null) ?? form.querySelector<HTMLElement>("button:not([type=button])");
      if (!b || b.classList.contains("link") || e.defaultPrevented) return;
      b.classList.remove(DONE);
      b.classList.add(SAVING);
      // Buttons that disable themselves while saving: done when they come back.
      let wasDisabled = false;
      const mo = new MutationObserver(() => {
        const dis = (b as HTMLButtonElement).disabled;
        if (dis) wasDisabled = true;
        else if (wasDisabled) { mo.disconnect(); finishAll(); }
      });
      mo.observe(b, { attributes: true, attributeFilter: ["disabled"] });
      window.setTimeout(() => { mo.disconnect(); if (b.classList.contains(SAVING)) finishAll(); }, 15000);
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  // The page moved on (a redirect after saving): finish.
  useEffect(() => { finishAll(); }, [path, query]);

  return null;
}
