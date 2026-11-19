import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { documents } from "@/lib/participants/extra";
import { fileHref } from "@/lib/files";

export const dynamic = "force-dynamic";

/** Admin: the participant's documents (Bubble's Documents popup). */
export default async function Documents({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await documents(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Documents`} lede={list.length ? "Please select a document" : undefined}>
      <ul className="list-box">
        {list.length === 0 && <li className="empty">No documents yet.</li>}
        {list.map((d) => (
          <li key={d.id}>
            <span>{d.name ?? "(no name)"}</span>
            {d.doc ? <a href={fileHref(d.doc)} className="button" target="_blank" rel="noopener">Open</a> : <span className="hint">No file</span>}
          </li>
        ))}
      </ul>
    </ParticipantShell>
  );
}
