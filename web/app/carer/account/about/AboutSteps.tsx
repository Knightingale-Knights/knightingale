"use client";
import { useState } from "react";
import type { About } from "@/lib/account/about";
import { ABOUT_STEPS } from "@/lib/account/about";
import { aboutAction } from "../actions";

/** Intro, then one question card at a time, then save. All answers stay in one form. */
export function AboutSteps({ initial, error }: { initial: About; error?: string }) {
  const [step, setStep] = useState(0); // 0 = intro
  const [v, setV] = useState(initial);
  const last = ABOUT_STEPS.length;
  const blocked = step === 1 && !v.why_care.trim();
  return (
    <form action={aboutAction} className="about-steps">
      {error && <p className="banner error">{error}</p>}
      {step === 0 && (
        <div className="about-intro">
          <p>I am lucky enough to speak to you all and hear about your unique personalities and traits. There&apos;s a carer who likes to do hip hop dance, another carer plays netball, yet another likes to attend shooting comps. Yes, with a real gun. And yes, this carer is a very good shot. I&apos;ve seen the videos.</p>
          <p>I think this diversity in interests and personalities is beautiful, should be celebrated and shared with the world. Well, if not with the world, at least with the Aged Care residences, NDIS participants and Community clients we are lucky enough to care for.</p>
          <p>Take your time, be a little vulnerable and make yourself shine. This will only be shared with clients you work with.</p>
          <p>Enjoy the process.</p>
        </div>
      )}
      {ABOUT_STEPS.map((s, i) => (
        <fieldset key={s.title} hidden={step !== i + 1}>
          <p className="about-count">{i + 1} of {last}</p>
          <h2>{s.title}</h2>
          {s.fields.map((f) => (
            <label key={f.key}>
              {f.label && <span>{f.label}</span>}
              <textarea name={f.key} rows={f.rows} value={v[f.key]} maxLength={3000}
                onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            </label>
          ))}
        </fieldset>
      ))}
      <div className="about-nav">
        {step > 0 && <button type="button" className="secondary" onClick={() => setStep(step - 1)}>Back</button>}
        {step < last
          ? <button type="button" className="big" disabled={blocked} onClick={() => setStep(step + 1)}>Next</button>
          : <button className="big">Save</button>}
      </div>
    </form>
  );
}
