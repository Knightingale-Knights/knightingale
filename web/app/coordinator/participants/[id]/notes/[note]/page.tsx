import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { myParticipant, participantNote } from "@/lib/coordinator/data";
import { EMPTY_NOTE_FIELD, NOTE_FIELDS } from "@/lib/carer/rules";
import { CoordinatorNav } from "../../../../CoordinatorNav";

export const dynamic = "force-dynamic";

const LABELS: Record<(typeof NOTE_FIELDS)[number], string> = {
  general_mood: "General Mood", best_day: "Best Part of the Day", activities_of_daily_living: "Activities of Daily Living",
  food_intake: "Food Intake", fluid_intake: "Fluid Intake", outings: "Outings", housework: "Housework",
  medical_appointments: "Medical Appointments", allied_health: "Allied Health", comms: "Communication", maintenance: "Maintenance",
};
const ORDER: (typeof NOTE_FIELDS)[number][] = [
  "general_mood", "best_day", "activities_of_daily_living", "food_intake", "fluid_intake", "outings",
  "housework", "medical_appointments", "allied_health", "comms", "maintenance",
];

export default async function CoordinatorNote({ params }: { params: Promise<{ id: string; note: string }> }) {
  const me = await requireCoordinator();
  const { id, note } = await params;
  const p = await myParticipant(me.id, id);
  if (!p) notFound();
  const n = await participantNote(id, note);
  if (!n) notFound();
  const day = n.day ? new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${n.day}T00:00:00Z`)) : "";
  const fields = ORDER.filter((f) => n[f] && n[f]!.trim() && n[f]!.trim().toLowerCase() !== EMPTY_NOTE_FIELD.toLowerCase());
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main>
        <Link href={`/coordinator/participants/${id}/notes`} className="back">← Progress Notes</Link>
        <h1>{p.name.split(" ")[0]}&apos;s Progress Note</h1>
        <p className="hint">{day}{n.carer ? ` · ${n.carer}` : ""}</p>
        {n.summary && <section className="coord-note"><h2>Summary</h2><p>{n.summary}</p></section>}
        {fields.map((f) => (
          <section key={f} className="coord-note"><h2>{LABELS[f]}</h2><p>{n[f]}</p></section>
        ))}
      </main>
    </div>
  );
}
