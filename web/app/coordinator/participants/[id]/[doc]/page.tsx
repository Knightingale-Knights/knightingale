import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { myParticipant, participantDocs, type DocKey } from "@/lib/coordinator/data";
import { DOCS, docId, emergencyDetails } from "@/lib/participants/docs";
import { Blocks, CONSENT_INTRO, consentOutro, EVACUATION_KIT } from "@/lib/participants/docText";
import { loadOptions, readRecord } from "@/lib/forms/fields";
import { RecordView } from "@/components/RecordView";
import { CoordinatorNav } from "../../../CoordinatorNav";

export const dynamic = "force-dynamic";

/** Coordinator: a completed participant document, view only. Unsigned forms aren't shown. */
export default async function CoordinatorDoc({ params }: { params: Promise<{ id: string; doc: string }> }) {
  const me = await requireCoordinator();
  const { id, doc } = await params;
  const d = DOCS[doc];
  const p = d ? await myParticipant(me.id, id) : null;
  if (!d || !p) notFound();
  const has = await participantDocs(id);
  if (!has[d.key as DocKey]) notFound();
  const cur = await docId(d, id);
  const [values, options, details] = await Promise.all([readRecord(d.table, cur), loadOptions(d.sections), d.key === "emergency" ? emergencyDetails(id) : Promise.resolve([])]);
  const first = p.name.split(" ")[0];
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main className="doc-page">
        <Link href={`/coordinator/participants/${id}`} className="back">← {first} Documentation</Link>
        <h1>{first}&apos;s {d.title}</h1>
        {d.key === "consent" && <Blocks blocks={CONSENT_INTRO} />}
        {details.map((g) => (
          <section key={g.title} className="doc-view"><h2>{g.title}</h2>
            <dl>{g.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        ))}
        <RecordView sections={d.sections} values={values} options={options} />
        {d.key === "consent" && <Blocks blocks={consentOutro(p.name)} />}
        {d.key === "emergency" && <Blocks blocks={EVACUATION_KIT} />}
      </main>
    </div>
  );
}
