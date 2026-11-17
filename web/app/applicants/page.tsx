import Link from "next/link";
import { ViewAsButton } from "@/components/ViewAsButton";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { applications } from "@/lib/onboarding/data";
import { auDate, isoDate, roleLabel } from "@/lib/invoicing/rules";
import { approveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Applicants({ searchParams }: { searchParams: Promise<{ approved?: string; error?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const all = await applications();
  const submitted = all.filter((a) => a.submitted);
  const started = all.filter((a) => !a.submitted);
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
        <h2>Waiting for approval ({submitted.length})</h2>
        <table className="grid"><tbody>{submitted.map((a) => row(a, true))}</tbody></table>
        <h2>Started, not finished (last 90 days, {started.length})</h2>
        <table className="grid"><tbody>{started.map((a) => row(a, false))}</tbody></table>
        <p className="hint">New carers sign up at /join.</p>
      </main>
    </div>
  );
}
