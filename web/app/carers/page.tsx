import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { Portrait, hoursLabel, roleList } from "@/components/CarerCells";
import { CARER_ROLES, activeCarers, isRole } from "@/lib/carers/data";
import { isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

export default async function ActiveCarers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role = isRole(sp.role) ? sp.role : null;
  const rows = await activeCarers(isoDate(new Date()), q, role);
  const href = (r: string | null) => `/carers?${new URLSearchParams({ ...(q ? { q } : {}), ...(r ? { role: r } : {}) })}`;
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/carers" /></TopBar>
      <main>
        <h1>Active carers</h1>
        <p className="lede">{rows.length} carer{rows.length === 1 ? "" : "s"}{role ? ` · ${role.toUpperCase()}` : ""}</p>
        <div className="row filters">
          <form className="search">
            {role && <input type="hidden" name="role" value={role} />}
            <input name="q" defaultValue={q} placeholder="Search name, email or phone" />
            <button className="secondary">Search</button>
          </form>
          <nav className="role-filter">
            {CARER_ROLES.map(([k, l]) => <Link key={k} href={href(role === k ? null : k)} className={role === k ? "on" : ""}>{l}</Link>)}
          </nav>
        </div>
        {rows.length === 0 ? (
          <p className="empty">No carers match.</p>
        ) : (
          <div className="table-wrap">
            <table className="grid people">
              <thead><tr><th></th><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th className="num">Last 7 days</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "(no name)";
                  return (
                    <tr key={r.id}>
                      <td className="pic"><Portrait photo={r.photo} name={name} /></td>
                      <td><Link href={`/compliance/${r.id}`}>{name}</Link></td>
                      <td>{roleList(r.roles)}</td>
                      <td>{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : ""}</td>
                      <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : ""}</td>
                      <td className="num">{hoursLabel(r.hours7)}</td>
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
