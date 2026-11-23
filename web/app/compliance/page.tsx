import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { Portrait, roleList } from "@/components/CarerCells";
import { complianceTable } from "@/lib/compliance/data";
import { DOCS, STATUS_LABEL, type Status } from "@/lib/compliance/docs";
import { auDate, isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

const SHOW = [["problems", "Needs attention"], ["expired", "Expired"], ["soon", "Expiring soon"], ["all", "Everyone"]] as const;

export default async function Compliance({ searchParams }: { searchParams: Promise<{ show?: string; q?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const show = (SHOW.find(([k]) => k === sp.show)?.[0] ?? "problems") as (typeof SHOW)[number][0];
  const q = (sp.q ?? "").trim().toLowerCase();
  const today = isoDate(new Date());
  const all = await complianceTable(today);
  const counts = (s: Status) => all.filter((r) => Object.values(r.statuses).includes(s)).length;
  const rows = all.filter((r) => {
    const st = Object.values(r.statuses);
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (show === "expired") return st.includes("expired");
    if (show === "soon") return st.includes("soon");
    if (show === "problems") return st.some((s) => s !== "ok");
    return true;
  });
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/compliance" /></TopBar>
      <main>
        <h1>Carer compliance</h1>
        <p className="lede">{all.length} active carers · {counts("expired")} with something expired · {counts("soon")} expiring in 30 days · {counts("missing")} missing a document</p>
        <div className="row filters">
          <form className="search"><input type="hidden" name="show" value={show} /><input name="q" defaultValue={sp.q ?? ""} placeholder="Search carers" /><button className="secondary">Search</button></form>
          <nav className="role-filter">
            {SHOW.map(([k, l]) => <Link key={k} href={`/compliance?${new URLSearchParams({ show: k, ...(sp.q ? { q: sp.q } : {}) })}`} className={k === show ? "on" : ""}>{l}</Link>)}
          </nav>
        </div>
        <div className="table-wrap">
          <table className="grid compliance">
            <thead><tr><th>Carer</th><th>Roles</th>{DOCS.map((d) => <th key={d.key}>{d.label}</th>)}<th title="DSWs only">Insurance</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/compliance/${r.id}`} className="person">
                      <Portrait photo={r.photo} name={r.name} generic />
                      <span>{r.name || "(no name)"}</span>
                    </Link>
                  </td>
                  <td>{roleList(r.roles)}</td>
                  {DOCS.map((d) => (
                    <td key={d.key} className={`cell ${r.statuses[d.key]}`} title={STATUS_LABEL[r.statuses[d.key]]}>
                      {r.statuses[d.key] === "missing" ? "Missing" : r.expiries[d.key] ? auDate(r.expiries[d.key]) : r.statuses[d.key] === "check" ? "Check" : "✓"}
                    </td>
                  ))}
                  {r.insurance ? (
                    <td className={`cell ${r.insurance.status === "none" ? "ok" : r.insurance.status}`} title={r.insurance.status === "none" ? "Said they have no insurance" : STATUS_LABEL[r.insurance.status]}>
                      {r.insurance.status === "none" ? "None" : r.insurance.status === "missing" ? "Missing" : r.insurance.expiry ? auDate(r.insurance.expiry) : r.insurance.status === "check" ? "Check" : "✓"}
                    </td>
                  ) : <td className="cell na">–</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="empty">Nothing to show.</p>}
      </main>
    </div>
  );
}
