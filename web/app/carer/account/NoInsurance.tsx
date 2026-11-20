"use client";
import { useState } from "react";
import { noInsuranceAction } from "./actions";

/** "I don't have insurance", with a warning the carer must accept (or go back and upload instead). */
export function NoInsurance() {
  const [open, setOpen] = useState(false);
  const upload = () => {
    setOpen(false);
    const el = document.getElementById("insurance");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.querySelector<HTMLInputElement>("input[type=file]")?.focus();
  };
  return (
    <>
      <button type="button" className="secondary" onClick={() => setOpen(true)}>I don&apos;t have insurance</button>
      {open && (
        <div className="nag-backdrop" role="dialog" aria-modal="true" aria-labelledby="noins-title">
          <div className="nag">
            <p className="label">Insurance</p>
            <h2 id="noins-title">Before you continue</h2>
            <p>Without insurance, you won&apos;t be able to accept shifts where a participant needs to be driven around in your car.</p>
            <p className="hint">You can add your insurance any time from your Account, and those shifts open up again.</p>
            <form action={noInsuranceAction} className="nag-actions">
              <input type="hidden" name="none" value="1" />
              <button type="button" className="big" onClick={upload}>Add my insurance</button>
              <button className="secondary">I understand, continue without</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
