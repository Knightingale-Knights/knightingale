// The Risk Assessment form body, laid out as Bubble's popup.
import { RecordFields } from "@/components/RecordForm";
import { PendingButton } from "@/components/PendingButton";
import { HOME_SAFE, HOME_YES, IMPACT, SAFE_CHOICES, YES_CHOICES, type RiskPlan } from "@/lib/participants/docs";
import { melbDate, type Options, type Section } from "@/lib/forms/fields";

/** The Risk Assessment in Bubble's order: details, Risk Factors, Home Risks, Monitoring, Risk Management Plan, Signatures. */
export function RiskLayout({ sections, values, options, home, plans }: {
  sections: Section[]; values: Record<string, unknown>; options: Options;
  home: Record<string, string | null> | null; plans: RiskPlan[];
}) {
  return (
    <>
      <RecordFields sections={sections.slice(0, 6)} values={values} options={options} />
      <HomeRisks home={home} />
      <RecordFields sections={sections.slice(6, 7)} values={values} options={options} />
      <RiskPlanFields plans={plans} />
      <RecordFields sections={sections.slice(7)} values={values} options={options} />
    </>
  );
}

function HomeTable({ rows, choices, home }: { rows: [string, string][]; choices: [string, string][]; home: Record<string, string | null> | null }) {
  return (
    <table className="home-risks">
      <thead><tr><th>Risks</th>{choices.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>
        {rows.map(([c, label]) => {
          const v = home?.[c] ?? "";
          const known = choices.some(([x]) => x === v);
          return (
            <tr key={c}>
              <td>{label}{v && !known && <input type="hidden" name={`home_${c}`} value={v} />}</td>
              {choices.map(([x, l]) => (
                <td key={x}><input type="radio" name={`home_${c}`} value={x} defaultChecked={v === x} aria-label={`${label}: ${l}`} /></td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Home Risks: the home safety checklist, as in Bubble. */
function HomeRisks({ home }: { home: Record<string, string | null> | null }) {
  return (
    <fieldset className="form-section">
      <legend>Home Risks</legend>
      <input type="hidden" name="home_present" value="1" />
      <HomeTable rows={HOME_SAFE} choices={SAFE_CHOICES} home={home} />
      <HomeTable rows={HOME_YES} choices={YES_CHOICES} home={home} />
      <div className="form-grid">
        <label className="wide">Home safety notes<textarea name="home_home_safety_notes" rows={2} defaultValue={home?.home_safety_notes ?? ""} /></label>
      </div>
    </fieldset>
  );
}

function Impact({ name, value, label }: { name: string; value: string | null | undefined; label: string }) {
  const v = value ?? "";
  return (
    <label className="half centre">{label}
      <select name={name} defaultValue={v}>
        <option value="">High/Med/Low</option>
        {v && !IMPACT.includes(v) && <option value={v}>{v}</option>}
        {IMPACT.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/** Six months from today, as a date input shows it (Bubble's default review date). */
function sixMonths() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(d);
}

function PlanRow({ k, p }: { k: string; p?: RiskPlan }) {
  return (
    <div className="form-grid plan-row" id={`plan-${k}`}>
      <label className="wide">Risk Type<input name={`plan_${k}_risk`} defaultValue={p?.risk ?? ""} placeholder="Type here..." /></label>
      <Impact name={`plan_${k}_participant_impact`} value={p?.participant_impact} label="Participant Impact" />
      <Impact name={`plan_${k}_others`} value={p?.others} label="Others Impact" />
      <label className="half centre">Person Responsible<input name={`plan_${k}_person_responsible`} defaultValue={p ? p.person_responsible ?? "" : "Paul"} /></label>
      <label className="half centre">Review Date<input type="date" name={`plan_${k}_review_date`} defaultValue={p ? melbDate(p.review_date) : sixMonths()} /></label>
      <div className="wide plan-generate">
        <PendingButton name="generate" value={k} pending="Writing the treatment…">{p?.treatment ? "REWRITE" : "GENERATE"}</PendingButton>
      </div>
      <label className="wide">Risk Treatment<textarea name={`plan_${k}_treatment`} rows={p?.treatment ? 10 : 4} defaultValue={p?.treatment ?? ""} placeholder="Type here..." /></label>
      {p && <label className="wide check"><input type="checkbox" name={`plan_${k}_delete`} />Delete this risk</label>}
    </div>
  );
}

/** The Risk Management Plan: the saved risks, then a blank one to add a risk. */
function RiskPlanFields({ plans }: { plans: RiskPlan[] }) {
  return (
    <fieldset className="form-section">
      <legend>Risk Management Plan</legend>
      {plans.map((p) => <PlanRow key={p.id} k={p.id} p={p} />)}
      {plans.length > 0 && <p className="hint plan-add">Add a risk</p>}
      <PlanRow k="new" />
    </fieldset>
  );
}
