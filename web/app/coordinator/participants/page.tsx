import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { myParticipants } from "@/lib/coordinator/data";
import { CoordinatorNav } from "../CoordinatorNav";

export const dynamic = "force-dynamic";

export default async function CoordinatorParticipants() {
  const me = await requireCoordinator();
  const parts = await myParticipants(me.id);
  return (
    <div className="carer coord">
      <CoordinatorNav on="participants" me={me} />
      <main>
        <h1>Participants</h1>
        {parts.length === 0 ? <p className="hint">No participants are linked to you yet.</p> : (
          <ul className="coord-list">
            {parts.map((p) => (
              <li key={p.id}>
                <span>{p.name || "(no name)"}</span>
                <Link className="button" href={`/coordinator/participants/${p.id}`}>Details</Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
