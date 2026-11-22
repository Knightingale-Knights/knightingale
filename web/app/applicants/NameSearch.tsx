"use client";
import { useRouter } from "next/navigation";

/**
 * Search box with a dropdown of every applicant's name and email. Picking one opens their profile;
 * Search filters the list by name, email or phone.
 */
export function NameSearch({ people, q, role }: { people: { id: string; name: string; email: string }[]; q: string; role: string | null }) {
  const router = useRouter();
  return (
    <form className="search">
      {role && <input type="hidden" name="role" value={role} />}
      <input
        name="q"
        defaultValue={q}
        list="applicant-names"
        placeholder="Search applicant name or email"
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value.trim().toLowerCase();
          const hit = people.find((p) => p.name.toLowerCase() === v || p.email.toLowerCase() === v);
          if (hit) router.push(`/compliance/${hit.id}`);
        }}
      />
      <datalist id="applicant-names">
        {people.map((p) => <option key={`n-${p.id}`} value={p.name}>{p.email}</option>)}
        {people.filter((p) => p.email).map((p) => <option key={`e-${p.id}`} value={p.email}>{p.name}</option>)}
      </datalist>
      <button className="secondary">Search</button>
    </form>
  );
}
