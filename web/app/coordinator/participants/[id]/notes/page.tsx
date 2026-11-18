import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { myParticipant, participantNotes } from "@/lib/coordinator/data";
import { CoordinatorNav } from "../../../CoordinatorNav";

export const dynamic = "force-dynamic";

const dayLabel = (day: string | null) =>
  day ? new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)) : "";

export default async function CoordinatorNotes({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCoordinator();
  const { id } = await params;
  const p = await myParticipant(me.id, id);
  if (!p) notFound();
  const notes = await participantNotes(id);
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main>
        <Link href={`/coordinator/participants/${id}`} className="back">← {p.name.split(" ")[0]} Documentation</Link>
        <h1>Progress Notes</h1>
        <p className="hint">{p.name}</p>
        {notes.length === 0 ? <p className="hint">No progress notes yet.</p> : (
          <ul className="coord-notes">
            {notes.map((n) => (
              <li key={n.id}>
                <Link href={`/coordinator/participants/${id}/notes/${n.id}`}>
                  <span className="when">{dayLabel(n.day)}{n.carer ? ` · ${n.carer}` : ""}</span>
                  <span className="what">{(n.summary ?? "").slice(0, 160)}{(n.summary ?? "").length > 160 ? "…" : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
