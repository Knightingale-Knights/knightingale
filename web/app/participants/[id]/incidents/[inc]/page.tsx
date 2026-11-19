import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { incident } from "@/lib/participants/extra";

export const dynamic = "force-dynamic";

const FIELDS: [string, string][] = [
  ["carer_name", "Reported by"], ["incident_date", "Date of incident"], ["incident_location", "Location"], ["incident_type", "Incident type"],
  ["incident_harm", "Harm"], ["reportable_yes_no", "Reportable incident?"], ["reportable_type", "Reportable type"], ["not_ndis", "Other incident type"],
  ["injury_nature", "Nature of injury"], ["injury_location", "Location of injury"], ["incident_description", "What happened"], ["witnesses", "Witnesses"],
  ["safety_actions", "Immediate safety actions"], ["incident_management", "How it was managed"], ["participant_feedback", "Participant feedback"],
  ["team_informed", "Team informed"], ["team_informed_date", "Date team informed"], ["ndis_reported", "Reported to the NDIS Commission"],
  ["ndis_reported_date", "Date reported"], ["agencies_reported", "Other agencies reported to"], ["investigation_outcome", "Investigation outcome"],
  ["preventable_incident", "Preventable?"], ["future_prevention", "Future prevention"], ["incident_resolution", "Resolution"],
];
const show = (v: unknown) => (v instanceof Date ? new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", dateStyle: "medium", timeStyle: "short" }).format(v) : String(v));

/** Admin: one incident report, read only. */
export default async function IncidentView({ params }: { params: Promise<{ id: string; inc: string }> }) {
  const staff = await requireStaff();
  const { id, inc } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const r = await incident(id, inc);
  if (!r) notFound();
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Incident Report`} wide>
      <p><Link href={`/participants/${id}/incidents`}>← All incident reports</Link></p>
      <section className="doc-view"><h2>Report Details</h2>
        <dl>{FIELDS.filter(([k]) => r[k] != null && r[k] !== "").map(([k, l]) => <div key={k}><dt>{l}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{show(r[k])}</dd></div>)}</dl>
      </section>
    </ParticipantShell>
  );
}
