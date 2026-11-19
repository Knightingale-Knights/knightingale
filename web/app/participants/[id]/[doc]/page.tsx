import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecordFields } from "@/components/RecordForm";
import { participant } from "@/lib/participants/data";
import { DOCS, docId, emergencyDetails, riskPlans, type RiskPlan } from "@/lib/participants/docs";
import { Blocks, CONSENT_INTRO, consentOutro, EVACUATION_KIT } from "@/lib/participants/docText";
import { loadOptions, melbDate, readRecord } from "@/lib/forms/fields";
import { saveDocAction } from "../../actions";

export const dynamic = "force-dynamic";

/** Admin: a participant document (Privacy Consent Form, Emergency Plan, Risk Assessment), editable. */
export default async function ParticipantDoc({ params, searchParams }: { params: Promise<{ id: string; doc: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id, doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const cur = await docId(d, id);
  const [values, options, details, plans] = await Promise.all([
    readRecord(d.table, cur), loadOptions(d.sections),
    d.key === "emergency" ? emergencyDetails(id) : Promise.resolve([]),
    d.key === "risk" ? riskPlans(id) : Promise.resolve([] as RiskPlan[]),
  ]);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className="form-page">
        <h1>{p.first_name ?? name}&apos;s {d.title}</h1>
        <p className="lede">{cur ? "Editing the saved form." : "Not filled in yet. Saving creates it."}</p>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
        {d.key === "consent" && <Blocks blocks={CONSENT_INTRO} />}
        {details.map((g) => (
          <section key={g.title} className="doc-view"><h2>{g.title}</h2>
            <dl>{g.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        ))}
        {d.key === "emergency" && <p className="hint">These details come from the intake. <Link href={`/participants/${id}/intake`}>Edit them in the intake</Link>.</p>}
        <form action={saveDocAction} className="stack">
          <input type="hidden" name="participant" value={id} />
          <input type="hidden" name="doc" value={d.key} />
          <RecordFields sections={d.sections} values={values} options={options} />
          {d.key === "risk" && <RiskPlanFields plans={plans} />}
          {d.key === "consent" && <Blocks blocks={consentOutro(name)} />}
          {d.key === "emergency" && <Blocks blocks={EVACUATION_KIT} />}
          <div className="form-save"><button type="submit" className="big">Save {d.title}</button></div>
        </form>
      </main>
    </div>
  );
}

function PlanRow({ k, p }: { k: string; p?: RiskPlan }) {
  return (
    <div className="form-grid plan-row">
      <label>Risk Type<input name={`plan_${k}_risk`} defaultValue={p?.risk ?? ""} /></label>
      <label>Person Responsible<input name={`plan_${k}_person_responsible`} defaultValue={p?.person_responsible ?? ""} /></label>
      <label className="wide">Risk Treatment<textarea name={`plan_${k}_treatment`} rows={2} defaultValue={p?.treatment ?? ""} /></label>
      <label className="wide">Participant Impact<textarea name={`plan_${k}_participant_impact`} rows={2} defaultValue={p?.participant_impact ?? ""} /></label>
      <label className="wide">Others Impact<textarea name={`plan_${k}_others`} rows={2} defaultValue={p?.others ?? ""} /></label>
      <label>Review Date<input type="date" name={`plan_${k}_review_date`} defaultValue={melbDate(p?.review_date)} /></label>
      {p && <label className="check"><input type="checkbox" name={`plan_${k}_delete`} />Delete this risk</label>}
    </div>
  );
}

/** The Risk Management Plan: one block per risk, plus a blank one to add a risk. */
function RiskPlanFields({ plans }: { plans: RiskPlan[] }) {
  return (
    <fieldset className="form-section">
      <legend>Risk Management Plan</legend>
      {plans.map((p) => <PlanRow key={p.id} k={p.id} p={p} />)}
      <p className="hint">Add a risk</p>
      <PlanRow k="new" />
    </fieldset>
  );
}
