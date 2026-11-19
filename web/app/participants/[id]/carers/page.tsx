import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { participant } from "@/lib/participants/data";
import { otherCarers, participantCarers } from "@/lib/participants/lists";
import { carersAction } from "../../actions";

export const dynamic = "force-dynamic";

/** Admin: the participant's carers (Bubble's Carers popup). */
export default async function Carers({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const [list, others] = await Promise.all([participantCarers(id), otherCarers(id)]);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className="form-page list-doc">
        <h1>{p.first_name ?? name}&apos;s Carers</h1>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        <ul className="list-box">
          {list.length === 0 && <li className="empty">No carers yet.</li>}
          {list.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <Link href={`/compliance/${c.id}`} className="button">Profile</Link>
              <form action={carersAction}>
                <input type="hidden" name="participant" value={id} /><input type="hidden" name="carer" value={c.id} />
                <button name="op" value="remove" className="remove" aria-label={`Remove ${c.name}`}>×</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={carersAction} className="list-add stack">
          <input type="hidden" name="participant" value={id} />
          <details className="tags">
            <summary><span className="tags-empty">Choose some carers…</span></summary>
            <div className="tags-list">
              {others.map((c) => <label key={c.id} className="check"><input type="checkbox" name="carers" value={c.id} />{c.name}</label>)}
            </div>
          </details>
          <button name="op" value="add">ADD</button>
        </form>
      </main>
    </div>
  );
}
