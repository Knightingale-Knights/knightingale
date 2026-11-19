import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { participantNotes } from "@/lib/coordinator/data";

export const dynamic = "force-dynamic";
const fmt = (d: string | null) => (d ? new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`)) : "");

/** Admin: the participant's progress notes, newest first. */
export default async function Notes({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await participantNotes(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Progress Notes`}>
      <ul className="list-box">
        {list.length === 0 && <li className="empty">No progress notes yet.</li>}
        {list.map((n) => (
          <li key={n.id}>
            <span><b>{fmt(n.day)}</b>{n.carer ? ` · ${n.carer}` : ""}<br /><small>{(n.summary ?? "").slice(0, 140)}</small></span>
            <Link href={`/participants/${id}/notes/${n.id}`} className="button">Open</Link>
          </li>
        ))}
      </ul>
    </ParticipantShell>
  );
}
