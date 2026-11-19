import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecordFields } from "@/components/RecordForm";
import { participant } from "@/lib/participants/data";
import { DOCS, docId, emergencyDetails } from "@/lib/participants/docs";
import { Blocks, CONSENT_INTRO, consentOutro, EVACUATION_KIT } from "@/lib/participants/docText";
import { loadOptions, readRecord } from "@/lib/forms/fields";
import { saveDocAction } from "../../actions";

export const dynamic = "force-dynamic";

/** Admin: a participant document (Privacy Consent Form, Emergency Plan), editable. */
export default async function ParticipantDoc({ params, searchParams }: { params: Promise<{ id: string; doc: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id, doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const cur = await docId(d, id);
  const [values, options, details] = await Promise.all([readRecord(d.table, cur), loadOptions(d.sections), d.key === "emergency" ? emergencyDetails(id) : Promise.resolve([])]);
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
          {d.key === "consent" && <Blocks blocks={consentOutro(name)} />}
          {d.key === "emergency" && <Blocks blocks={EVACUATION_KIT} />}
          <div className="form-save"><button type="submit" className="big">Save {d.title}</button></div>
        </form>
      </main>
    </div>
  );
}
