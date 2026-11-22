import Link from "next/link";
import { ViewAsButton } from "@/components/ViewAsButton";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { applications } from "@/lib/onboarding/data";
import { CARER_ROLES, isRole } from "@/lib/carers/data";
import { auDate, isoDate, roleLabel } from "@/lib/invoicing/rules";
import { approveAction } from "./actions";
import { NameSearch } from "./NameSearch";

export const dynamic = "force-dynamic";

export default async function Applicants({ searchParams }: { searchParams: Promise<{ approved?: string; error?: string; q?: string; role?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role = isRole(sp.role) ? sp.role : null;
  const everyone = await applications();
  const needle = q.toLowerCase();
  const all = everyone.filter((a) =>
    (!role || (a.roles ?? []).includes(role)) &&
    (!needle || [a.name, a.email, a.phone].some((v) => (v ?? "").toLowerCase().includes(needle))));
  const submitted = all.filter((a) => a.submitted);
  const started = all.filter((a) => !a.submitted);
  const href = (r: string | null) => `/applicants?${new URLSearchParams({ ...(q ? { q } : {}), ...(r ? { role: r } : {}) })}`;
  const row = (a: (typeof all)[number], canApprove: boolean) => (
    <tr key={a.id}>
      <td><Link href={`/compliance/${a.id}`}>{a.name || a.email}</Link></td>
      <td>{(a.roles ?? []).map((r) => roleLabel([r])).join(", ")}</td>
      <td>{a.phone ?? ""}</td>
      <td>{auDate(isoDate(a.created_at))}</td>
      <td><ViewAsButton user={a.id} back="/applicants" /></td>
      <td>{canApprove && <form action={approveAction}><input type="hidden" name="id" value={a.id} /><button className="secondary">Approve</button></form>}</td>
    </tr>
  );
  return (
    <div className="shell">
      <TopBar section="/applicants" email={staff.email} />
      <main className="narrow">
        <h1>Applicants</h1>
        {sp.approved && <p className="banner ok">Approved.</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
        <div className="row filters">
          <NameSearch people={everyone.map((a) => ({ id: a.id, name: a.name || a.email }))} q={q} role={role} />
          <nav className="role-filter">
            {CARER_ROLES.map(([k, l]) => <Link key={k} href={href(role === k ? null : k)} className={role === k ? "on" : ""}>{l}</Link>)}
          </nav>
        </div>
        <h2>Waiting for approval ({submitted.length})</h2>
        <table className="grid"><tbody>{submitted.map((a) => row(a, true))}</tbody></table>
        <h2>Started, not finished (last 90 days, {started.length})</h2>
        <table className="grid"><tbody>{started.map((a) => row(a, false))}</tbody></table>
        <p className="hint">New carers sign up at /join.</p>
      </main>
    </div>
  );
}
