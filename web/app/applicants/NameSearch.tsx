"use client";
import { useRouter } from "next/navigation";

/** Search box with a dropdown of every applicant's name. Picking a name opens their profile; Search filters the list. */
export function NameSearch({ people, q, role }: { people: { id: string; name: string }[]; q: string; role: string | null }) {
  const router = useRouter();
  return (
    <form className="search">
      {role && <input type="hidden" name="role" value={role} />}
      <input
        name="q"
        defaultValue={q}
        list="applicant-names"
        placeholder="Search applicant name"
        autoComplete="off"
        onChange={(e) => {
          const hit = people.find((p) => p.name.toLowerCase() === e.target.value.trim().toLowerCase());
          if (hit) router.push(`/compliance/${hit.id}`);
        }}
      />
      <datalist id="applicant-names">
        {people.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>
      <button className="secondary">Search</button>
    </form>
  );
}
