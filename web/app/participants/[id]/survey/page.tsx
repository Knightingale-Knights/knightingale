import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { surveys } from "@/lib/participants/extra";

export const dynamic = "force-dynamic";

const Q: [string, string][] = [
  ["identity", "Do you identify yourself as (select all that apply):"], ["location", "Location:"], ["age", "Age group:"], ["gender", "Gender:"],
  ["ndis_services", "Which Knightingale NDIS Services do you receive (select all that apply):"],
  ["ndis_hours_weekly", "How many hours of NDIS core services do you receive each week:"], ["completing_survey", "Are you completing the survey:"],
  ["ndis_plan_understanding", "How well is your NDIS plan explained to you:"], ["support_based", "The support you receive is based on what you want to do:"],
  ["individual_treatment", "Are you treated as an individual:"], ["privacy_respect", "Do you believe your privacy is respected:"],
  ["satisfaction", "How satisfied are you with Knightingale NDIS services:"], ["respect_of_rights", "How satisfied are you with how Knightingale respects your rights:"],
  ["complaints", "Are there any complaints you would like to make about your NDIS supports:"], ["three_goods", "What are three things that Knightingale does really well:"],
  ["three_bads", "What are three things that Knightingale does not so well:"], ["three_changes", "What are three things you would change about Knightingale:"],
  ["additional_questions", "Are there any questions I didn't ask that I should next time:"],
  ["opinion_rating", "If Knightingale could no longer provide you supports, how upset would you be (1 not upset - 10 very upset):"],
  ["comments", "Comments:"], ["your_contact", "Your contact:"],
];
const dmy = (d: unknown) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric" }).format(new Date(d as string));

/** Admin: the participant's NDIS surveys, read only. */
export default async function Survey({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await surveys(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title="NDIS Survey" lede={list.length ? undefined : "No surveys yet."} wide>
      {list.map((s) => (
        <section key={String(s.id)} className="doc-view"><h2>Survey ({dmy(s.created_at)})</h2>
          <dl>{Q.filter(([k]) => s[k] != null && s[k] !== "" && !(Array.isArray(s[k]) && !(s[k] as unknown[]).length)).map(([k, l]) => (
            <div key={k}><dt>{l}</dt><dd>{Array.isArray(s[k]) ? (s[k] as string[]).join(", ") : String(s[k])}</dd></div>
          ))}</dl>
        </section>
      ))}
    </ParticipantShell>
  );
}
