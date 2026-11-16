import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Portrait } from "@/components/CarerCells";
import { participants } from "@/lib/participants/data";

export const dynamic = "force-dynamic";

export default async function Participants({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const active = sp.show !== "inactive";
  const rows = await participants(q, active);
  const href = (show: string) => `/participants?${new URLSearchParams({ show, ...(q ? { q } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={href("active")} className={active ? "on" : ""}>Active</Link>
        <Link href={href("inactive")} className={!active ? "on" : ""}>Inactive</Link>
      </TopBar>
      <main>
        <h1>Participants</h1>
        <p className="lede">{rows.length} {active ? "active" : "inactive"} participant{rows.length === 1 ? "" : "s"}</p>
        <div className="row filters">
          <form className="search">
            {!active && <input type="hidden" name="show" value="inactive" />}
            <input name="q" defaultValue={q} placeholder="Search name, email or phone" />
            <button className="secondary">Search</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <p className="empty">No participants match.</p>
        ) : (
          <div className="table-wrap">
            <table className="grid people">
              <thead><tr><th></th><th>Name</th><th>Coordinator</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "(no name)";
                  return (
                    <tr key={r.id}>
                      <td className="pic"><Portrait photo={r.photo} name={name} /></td>
                      <td><Link href={`/participants/${r.id}`}>{name}</Link></td>
                      <td>{r.coordinator ?? ""}</td>
                      <td>{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : ""}</td>
                      <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
