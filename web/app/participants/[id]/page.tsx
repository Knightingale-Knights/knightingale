import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Portrait } from "@/components/CarerCells";
import { participant } from "@/lib/participants/data";

export const dynamic = "force-dynamic";

// The participant's sections, as in Bubble. None are built yet.
const SECTIONS = [
  "About", "Carers", "Consent", "Documents", "Emergency", "Feedback", "Funding", "Group Chat", "Incident Reports",
  "Info Book", "Intake Form", "Progress Notes", "Risk Assessment", "Service Agreement", "Shift Duties", "Summary",
  "Support Plan", "Survey",
];

export default async function Participant({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href="/participants">← All participants</Link>
      </TopBar>
      <main>
        <div className="profile-head">
          <Portrait photo={p.photo} name={name} />
          <div>
            <h1>{name}</h1>
            <p className="lede">{[p.email, p.phone, p.coordinator ? `Coordinator: ${p.coordinator}` : null].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <nav className="section-grid">
          {SECTIONS.map((s) => <span key={s} className="side-btn off" title="Not built yet">{s}</span>)}
        </nav>
      </main>
    </div>
  );
}
