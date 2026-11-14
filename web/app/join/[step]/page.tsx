import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApplicant } from "@/lib/auth";
import { applicant, progress, SIGNUP_DOCS, SIGNUP_ROLES, SKILLS } from "@/lib/onboarding/data";
import { carerDocs } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { signOutAction } from "@/app/invoicing/actions";
import { AddressInput } from "@/app/carer/extras";
import { DocList } from "@/app/carer/documents/DocList";
import { DocUpload } from "@/app/carer/documents/DocUpload";
import { detailsAction, roleAction, screeningAction, submitAction } from "../actions";
import { ProfileUpload } from "../ProfileUpload";

export const dynamic = "force-dynamic";

const STEPS = [
  ["details", "About you"],
  ["role", "Your role"],
  ["screening", "NDIS screening"],
  ["documents", "Certificates"],
  ["photo", "Photo and ID"],
  ["review", "Submit"],
] as const;
type Step = (typeof STEPS)[number][0];

export default async function JoinStep({ params, searchParams }: { params: Promise<{ step: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireApplicant();
  const { step } = await params;
  if (!STEPS.some(([k]) => k === step)) notFound();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const [a, p, docs] = await Promise.all([applicant(me.id), progress(me.id, today), carerDocs(me.id, today)]);
  if (!a) notFound();
  const done: Record<Step, boolean> = { details: p.details, role: p.role, screening: p.screening, documents: p.documents, photo: p.photo, review: false };
  const i = STEPS.findIndex(([k]) => k === step);
  const next = STEPS[i + 1]?.[0];
  const screening = docs.find((d) => d.def.key === "ndis_screening")!;
  const qual = docs.find((d) => d.def.key === "qualification")!;
  const nurse = a.roles?.some((r) => r === "en" || r === "rn");

  return (
    <div className="carer">
      <header className="carer-top">
        <span className="wordmark small">knightingale</span>
        <span className="hello">Your application</span>
        <nav><form action={signOutAction}><button className="link">Save and sign out</button></form></nav>
      </header>
      <main>
        <ol className="steps">
          {STEPS.map(([k, l], n) => (
            <li key={k} className={`${k === step ? "on" : ""} ${done[k] ? "done" : ""}`}>
              <Link href={`/join/${k}`}>{done[k] ? "✓" : n + 1}<span>{l}</span></Link>
            </li>
          ))}
        </ol>
        <h1>{STEPS[i][1]}</h1>
        {sp.error && <p className="banner error">{sp.error}</p>}

        {step === "details" && (
          <form action={detailsAction} className="stack block">
            <div className="row tight"><label>First name<input name="first" defaultValue={a.first_name ?? ""} required maxLength={60} /></label>
              <label>Last name<input name="last" defaultValue={a.last_name ?? ""} required maxLength={60} /></label></div>
            <label>Mobile<input name="phone" type="tel" defaultValue={a.phone ?? ""} required placeholder="0412 345 678" /></label>
            <label>Date of birth<input name="dob" type="date" defaultValue={a.dob ?? ""} required /></label>
            <AddressInput name="address" label="Home address" listId="home-list" defaultValue={a.address ?? ""} />
            <button type="submit" className="big">Save and continue</button>
          </form>
        )}

        {step === "role" && (
          <>
            <form action={roleAction} className="stack block">
              <fieldset className="chips">
                <legend>What work can you do?</legend>
                {SIGNUP_ROLES.map(([k, l]) => (
                  <label key={k} className="chip"><input type="checkbox" name="roles" value={k} defaultChecked={a.roles?.includes(k)} />{l}</label>
                ))}
              </fieldset>
              <label>Highest qualification
                <select name="skill" defaultValue="">
                  <option value="">Choose…</option>
                  {SKILLS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              <p className="hint">Nurses (EN or RN): add your AHPRA registration.</p>
              <div className="row tight">
                <label>AHPRA number<input name="ahpra" defaultValue={qual.number ?? ""} placeholder="NMW0001234567" /></label>
                <label>AHPRA expiry<input name="ahpra_expiry" type="date" defaultValue={qual.expiry ?? ""} /></label>
              </div>
              <button type="submit" className="big">Save role</button>
              {sp.saved && <p className="banner ok">Saved. Add your documents below, then continue.</p>}
            </form>
            <section className="block">
              <h2>Qualification certificate{nurse ? " or AHPRA registration" : ""}</h2>
              <DocUpload doc="qualification" label={qual.files.length ? "Upload another" : "Upload"} />
              <h2>Resume (optional)</h2>
              <ProfileUpload kind="resume" label="Upload resume" accept="image/*,application/pdf" current={a.resume} />
              <h2>NDIS worker orientation certificate (optional)</h2>
              <ProfileUpload kind="ndis_induction" label="Upload certificate" accept="image/*,application/pdf" current={a.ndis_induction} />
            </section>
          </>
        )}

        {step === "screening" && (
          <form action={screeningAction} className="stack block">
            <p className="hint">You need NDIS worker screening to work with NDIS participants. You can find your ID and expiry in your NDIS worker screening clearance email.</p>
            <label>NDIS Worker Screening ID<input name="number" defaultValue={screening.number ?? ""} required maxLength={60} /></label>
            <label>Expiry date<input name="expiry" type="date" defaultValue={screening.expiry ?? ""} required min={today} /></label>
            <button type="submit" className="big">Save and continue</button>
          </form>
        )}

        {step === "documents" && (
          <>
            <p className="hint">Upload a photo or PDF of each. Your CPR certificate is required; we read the expiry dates for you.</p>
            <DocList docs={docs.filter((d) => SIGNUP_DOCS.includes(d.def.key))} back="/join/documents" />
          </>
        )}

        {step === "photo" && (
          <>
            <section className="block">
              <h2>Profile photo</h2>
              <p className="hint">A clear photo of your face. Participants and facilities see this.</p>
              <ProfileUpload kind="photo" label="Take or upload a photo" accept="image/*" current={a.photo} />
            </section>
            <DocList docs={docs.filter((d) => d.def.key === "id")} back="/join/photo" />
          </>
        )}

        {step === "review" && (
          <section className="block">
            {p.missing.length ? (
              <>
                <p>Almost there. Please add:</p>
                <ul>{p.missing.map((m) => <li key={m}>{m}</li>)}</ul>
              </>
            ) : (
              <p>Everything we need is here. Submit your application and we&apos;ll be in touch.</p>
            )}
            {!p.documents && <p className="hint">Your other certificates can be added later from the Documents tab.</p>}
            <form action={submitAction}><button className="big" disabled={p.missing.length > 0}>Submit my application</button></form>
          </section>
        )}

        {next && step !== "review" && <p className="row tight"><Link href={`/join/${next}`}>Next: {STEPS[i + 1][1]} →</Link></p>}
      </main>
    </div>
  );
}
