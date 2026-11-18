import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { myParticipant } from "@/lib/coordinator/data";
import { CoordinatorNav } from "../../CoordinatorNav";

export const dynamic = "force-dynamic";

// The participant's documents, as on Bubble's coordinator page. Those with a path are built.
const DOCS: { label: string; path?: string }[] = [
  { label: "Information Booklet" },
  { label: "Progress Notes", path: "notes" },
  { label: "Carers" },
  { label: "Intake Form" },
  { label: "Risk Assessment" },
  { label: "Service Agreement" },
  { label: "Points of Care" },
  { label: "Support Plan" },
  { label: "Medication Plan" },
  { label: "Emergency Plan" },
  { label: "Privacy Consent Form" },
];

export default async function CoordinatorParticipant({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCoordinator();
  const { id } = await params;
  const p = await myParticipant(me.id, id);
  if (!p) notFound();
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main>
        <Link href="/coordinator/participants" className="back">← Participants</Link>
        <h1>{p.name.split(" ")[0]} Documentation</h1>
        <div className="policy-btns">
          {DOCS.map((d) => d.path
            ? <Link key={d.label} className="policy-btn featured" href={`/coordinator/participants/${id}/${d.path}`}>{d.label}</Link>
            : <span key={d.label} className="policy-btn soon" aria-disabled="true">{d.label}<small>Coming soon</small></span>)}
        </div>
      </main>
    </div>
  );
}
