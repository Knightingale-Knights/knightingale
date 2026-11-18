import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { myParticipant, participantDocs, type DocKey } from "@/lib/coordinator/data";
import { CoordinatorNav } from "../../CoordinatorNav";

export const dynamic = "force-dynamic";

// The participant's documents, as on Bubble's coordinator page. A button shows only when the participant
// has that document; the Information Booklet is ours, so it always shows. Those with a path are built.
const DOCS: { label: string; key?: DocKey; path?: string }[] = [
  { label: "Information Booklet" },
  { label: "Progress Notes", key: "notes", path: "notes" },
  { label: "Carers", key: "carers" },
  { label: "Intake Form", key: "intake" },
  { label: "Risk Assessment", key: "risk" },
  { label: "Service Agreement", key: "agreement" },
  { label: "Points of Care", key: "points" },
  { label: "Support Plan", key: "support" },
  { label: "Medication Plan", key: "medication" },
  { label: "Emergency Plan", key: "emergency" },
  { label: "Privacy Consent Form", key: "consent" },
];

export default async function CoordinatorParticipant({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCoordinator();
  const { id } = await params;
  const p = await myParticipant(me.id, id);
  if (!p) notFound();
  const has = await participantDocs(id);
  const docs = DOCS.filter((d) => !d.key || has[d.key]);
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main>
        <Link href="/coordinator/participants" className="back">← Participants</Link>
        <h1>{p.name.split(" ")[0]} Documentation</h1>
        <div className="policy-btns">
          {docs.map((d) => d.path
            ? <Link key={d.label} className="policy-btn featured" href={`/coordinator/participants/${id}/${d.path}`}>{d.label}</Link>
            : <span key={d.label} className="policy-btn soon" aria-disabled="true">{d.label}<small>Coming soon</small></span>)}
        </div>
      </main>
    </div>
  );
}
