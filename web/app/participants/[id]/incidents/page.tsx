import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { incidentsFor } from "@/lib/participants/extra";

export const dynamic = "force-dynamic";
const dmy = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : "");

/** Admin: the participant's incident reports. */
export default async function Incidents({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await incidentsFor(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Incident Reports`}>
      <ul className="list-box">
        {list.length === 0 && <li className="empty">No incident reports.</li>}
        {list.map((r) => (
          <li key={r.id}>
            <span><b>{dmy(r.day)}</b>{r.carer ? ` · ${r.carer}` : ""}<br /><small>{(r.description ?? r.type ?? "").slice(0, 120)}</small></span>
            <Link href={`/participants/${id}/incidents/${r.id}`} className="button">Open</Link>
          </li>
        ))}
      </ul>
    </ParticipantShell>
  );
}
