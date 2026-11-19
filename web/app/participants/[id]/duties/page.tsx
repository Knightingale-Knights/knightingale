import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { participant } from "@/lib/participants/data";
import { duties } from "@/lib/participants/lists";
import { dutyAction } from "../../actions";

export const dynamic = "force-dynamic";

/** Admin: the participant's Points of Care (Bubble's Shift Duties popup). */
export default async function Duties({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const list = await duties(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className="form-page list-doc">
        <h1>{p.first_name ?? name}&apos;s Points of Care</h1>
        <p className="lede">Please use this as a guide for the shift. Mark off or add any tasks you complete.</p>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        <ul className="list-box">
          {list.length === 0 && <li className="empty">No points of care yet.</li>}
          {list.map((d) => (
            <li key={d.id}>
              <form action={dutyAction}>
                <input type="hidden" name="participant" value={id} /><input type="hidden" name="duty" value={d.id} />
                <button name="op" value="toggle" className={d.done ? "tick on" : "tick"} aria-label={d.done ? "Mark not done" : "Mark done"}>{d.done ? "✓" : ""}</button>
              </form>
              <span className={d.done ? "done" : ""}>{d.duty}</span>
              <form action={dutyAction}>
                <input type="hidden" name="participant" value={id} /><input type="hidden" name="duty" value={d.id} />
                <button name="op" value="remove" className="remove" aria-label="Remove">×</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={dutyAction} className="list-add">
          <input type="hidden" name="participant" value={id} />
          <input name="text" placeholder="Making breakfast" required />
          <button name="op" value="add">ADD</button>
        </form>
      </main>
    </div>
  );
}
