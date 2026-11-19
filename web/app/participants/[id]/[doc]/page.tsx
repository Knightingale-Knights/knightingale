import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecordFields } from "@/components/RecordForm";
import { RiskLayout } from "@/components/RiskForm";
import { SupportsForm } from "@/components/SupportsForm";
import { participant } from "@/lib/participants/data";
import {
  DOCS, agreementSupports, docId, emergencyDetails, homeSafety, priceItems, profileAndIntake, riskPlans, riskShowValues,
  supportShowValues, type PriceItem, type RiskPlan, type Support,
} from "@/lib/participants/docs";
import { Blocks, CONSENT_INTRO, consentOutro, EVACUATION_KIT, INFO_BOOK, SERVICE_AGREEMENT } from "@/lib/participants/docText";
import { loadOptions, planManagers, readRecord } from "@/lib/forms/fields";
import { saveDocAction } from "../../actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Generate writes a risk treatment with Claude

/** Admin: a participant document (Privacy Consent Form, Emergency Plan, Risk Assessment, Support Plan, Info Book, Service Agreement), editable. */
export default async function ParticipantDoc({ params, searchParams }: { params: Promise<{ id: string; doc: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id, doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const cur = await docId(d, id);
  const risk = d.key === "risk";
  const support = d.key === "support";
  const info = d.key === "info";
  const service = d.key === "service";
  const cards = risk || support || info || service;
  const [record, options, details, plans, home, shown, linked, pms, items, supports] = await Promise.all([
    readRecord(d.table, cur), loadOptions(d.sections),
    d.key === "emergency" ? emergencyDetails(id) : Promise.resolve([]),
    risk ? riskPlans(id) : Promise.resolve([] as RiskPlan[]),
    risk ? homeSafety(id) : Promise.resolve(null),
    risk || info || service ? riskShowValues(id) : support ? supportShowValues(id) : Promise.resolve({} as Record<string, string | null>),
    profileAndIntake(d, id),
    support ? planManagers() : Promise.resolve([]),
    service ? priceItems() : Promise.resolve([] as PriceItem[]),
    service ? agreementSupports(cur) : Promise.resolve([] as Support[]),
  ]);
  const values = { ...linked, ...record, ...shown };
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className="form-page">
        <Link href={`/participants/${id}`} className="sheet-close" aria-label="Close" title="Back to the participant">×</Link>
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
        {risk && <p className="hint">Profile, contact and consent details come from the intake. <Link href={`/participants/${id}/intake`}>Edit them in the intake</Link>.</p>}
        {support && <p className="hint">Most of the Support Plan is the participant&apos;s profile and intake, so changes here update those too.</p>}
        {(info || service) && <p className="hint">Consent and the Knightingale signature come from the intake. <Link href={`/participants/${id}/intake`}>Edit them in the intake</Link>.</p>}
        <form action={saveDocAction} className={cards ? "stack doc-cards" : "stack"}>
          <input type="hidden" name="participant" value={id} />
          <input type="hidden" name="doc" value={d.key} />
          {risk ? <RiskLayout sections={d.sections} values={values} options={options} home={home} plans={plans} />
            : support ? (
              <>
                <RecordFields sections={d.sections.slice(0, 3)} values={values} options={options} planManagers={pms} />
                <div className="doc-link-row"><Link href={`/participants/${id}/emergency`} className="button">EMERGENCY PLAN</Link></div>
                <RecordFields sections={d.sections.slice(3)} values={values} options={options} planManagers={pms} />
              </>
            ) : info ? (
              <>
                <Blocks blocks={INFO_BOOK} />
                <RecordFields sections={d.sections} values={values} options={options} />
              </>
            ) : service ? (
              <>
                <Blocks blocks={[["Parties To The Agreement", `This Service Agreement is made between:\n\n${[name, shown.ro_address].filter(Boolean).join(", ")}\n\nAND\n\nKnightingale (ABN 50 405 424 095) of 22 Kavanagh St, Southbank VIC 3006.\n\nThis Service Agreement will commence from today and continue until either you or Knightingale terminates it in accordance with the termination conditions set out below.`]]} />
                <Blocks blocks={SERVICE_AGREEMENT} />
                <SupportsForm items={items} supports={supports} />
                <RecordFields sections={d.sections} values={values} options={options} />
              </>
            ) : <RecordFields sections={d.sections} values={values} options={options} />}
          {d.key === "consent" && <Blocks blocks={consentOutro(name)} />}
          {d.key === "emergency" && <Blocks blocks={EVACUATION_KIT} />}
          <div className="form-save"><button type="submit" className="big">Save {d.title}</button></div>
        </form>
      </main>
    </div>
  );
}
