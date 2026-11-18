import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Portrait } from "@/components/CarerCells";
import { ViewAsButton } from "@/components/ViewAsButton";
import { coordinators } from "@/lib/coordinator/data";

export const dynamic = "force-dynamic";

/** NDIS support coordinators, with View as to open their pages as them. */
export default async function Coordinators({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const rows = await coordinators(q);
  return (
    <div className="shell">
      <TopBar section="/coordinators" email={staff.email} />
      <main>
        <h1>Support Coordinators</h1>
        <p className="lede">{rows.length} support coordinator{rows.length === 1 ? "" : "s"}</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        <div className="row filters">
          <form className="search">
            <input name="q" defaultValue={q} placeholder="Search name, email or phone" />
            <button className="secondary">Search</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <p className="empty">No support coordinators match.</p>
        ) : (
          <div className="table-wrap">
            <table className="grid people">
              <thead><tr><th></th><th>Name</th><th>Participants</th><th>Phone</th><th>Email</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="pic"><Portrait photo={r.photo} name={r.name || "?"} /></td>
                    <td>{r.name || "(no name)"}</td>
                    <td>{r.participants}</td>
                    <td>{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : ""}</td>
                    <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : ""}</td>
                    <td><ViewAsButton user={r.id} back="/coordinators" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
