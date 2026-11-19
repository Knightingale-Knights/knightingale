import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { recentCarers } from "@/lib/participants/lists";

export const dynamic = "force-dynamic";

const dmy = (d: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short" }).format(new Date(d));

/** Admin: carers who have worked with the participant in the last 30 days, from the roster. */
export default async function Carers({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await recentCarers(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Carers`} lede="Carers who have worked with them in the last 30 days.">
      <ul className="list-box">
        {list.length === 0 && <li className="empty">No shifts in the last 30 days.</li>}
        {list.map((c) => (
          <li key={c.id}>
            <span>{c.name}<br /><small>{c.shifts} shift{c.shifts === 1 ? "" : "s"} · last {dmy(c.last)}</small></span>
            <Link href={`/compliance/${c.id}`} className="button">Profile</Link>
          </li>
        ))}
      </ul>
    </ParticipantShell>
  );
}
