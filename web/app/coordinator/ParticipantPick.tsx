"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** "Select a participant" filter for the calendar. */
export function ParticipantPick({ participants, value }: { participants: { id: string; name: string }[]; value: string | null }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <select className="coord-pick" value={value ?? ""} aria-label="Select a participant"
      onChange={(e) => {
        const q = new URLSearchParams(sp.toString());
        if (e.target.value) q.set("p", e.target.value); else q.delete("p");
        router.push(`${path}?${q}`);
      }}>
      <option value="">All participants</option>
      {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}
