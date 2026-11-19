import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Portrait } from "@/components/CarerCells";
import { participant } from "@/lib/participants/data";
import { ViewAsButton } from "@/components/ViewAsButton";
import { ParticipantCalendar } from "@/components/ParticipantCalendar";

export const dynamic = "force-dynamic";

// The participant's sections, as in Bubble. Those with a link are built.
const BUILT: Record<string, string> = { "Intake Form": "intake", Consent: "consent", Emergency: "emergency", "Risk Assessment": "risk", "Support Plan": "support", "Info Book": "info", "Service Agreement": "service", "Shift Duties": "duties", Carers: "carers",
  About: "about", Documents: "documents", Feedback: "feedback", Funding: "funding", "Group Chat": "/chats/", "Incident Reports": "incidents",
  "Progress Notes": "notes", Summary: "summary", Survey: "survey" };
const SECTIONS = [
  "About", "Carers", "Consent", "Documents", "Emergency", "Feedback", "Funding", "Group Chat", "Incident Reports",
  "Info Book", "Intake Form", "Progress Notes", "Risk Assessment", "Service Agreement", "Shift Duties", "Summary",
  "Support Plan", "Survey",
];

export default async function Participant({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; d?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
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
            {p.coordinator_id && <ViewAsButton user={p.coordinator_id} back={`/participants/${id}`} label="View as coordinator" />}
          </div>
        </div>
        <nav className="section-grid">
          {SECTIONS.map((s) => BUILT[s]
            ? <Link key={s} href={BUILT[s].startsWith("/") ? `${BUILT[s]}${id}` : `/participants/${id}/${BUILT[s]}`} className="side-btn">{s}</Link>
            : <span key={s} className="side-btn off" title="Not built yet">{s}</span>)}
        </nav>
        <ParticipantCalendar participant={id} view={sp.view === "day" ? "day" : "month"} day={sp.d} base={`/participants/${id}`} />
      </main>
    </div>
  );
}
