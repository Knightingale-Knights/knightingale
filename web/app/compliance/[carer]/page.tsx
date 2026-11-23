import Link from "next/link";
import { ViewAsButton } from "@/components/ViewAsButton";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { sql } from "@/lib/db";
import { accountDocs, carerDocs } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { DocList } from "@/app/carer/documents/DocList";
import { setCarerActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarerCompliance({ params, searchParams }: { params: Promise<{ carer: string }>; searchParams: Promise<{ error?: string; saved?: string; status?: string; removed?: string }> }) {
  const staff = await requireStaff();
  const { carer } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(carer)) notFound();
  const [u] = await sql<{ name: string; phone: string | null; email: string | null; active: boolean; no_insurance: boolean; upcoming: number }[]>`
    select trim(concat_ws(' ', first_name, last_name)) as name, phone_number as phone, email, coalesce(active, false) as active, coalesce(no_insurance, false) as no_insurance,
           (select count(*)::int from app.shifts s
             where s.carer = u.id and not coalesce(s.cancelled, false) and s.date >= date_trunc('day', now() at time zone 'Australia/Melbourne') at time zone 'Australia/Melbourne') as upcoming
      from app.users u where id = ${carer} and account_type = 'carer'`;
  if (!u) notFound();
  const [docs, other] = await Promise.all([
    carerDocs(carer, isoDate(new Date())),
    accountDocs(carer, ["insurance", "licence", "passport", "certificate", "ahpra", "covid", "resume"], isoDate(new Date())),
  ]);
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/compliance" /></TopBar>
      <main className="narrow">
        <Link href="/compliance" className="back">← Compliance</Link>
        <div className="title-row"><h1>{u.name}</h1><ViewAsButton user={carer} back={`/compliance/${carer}`} /></div>
        <p className="lede">{[u.phone, u.email].filter(Boolean).join(" · ")}</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        {sp.removed && <p className="banner ok">{sp.removed} removed. {u.name} will be asked to upload it again.</p>}
        {sp.status === "off" && <p className="banner ok">{u.name} is deactivated.</p>}
        {sp.status === "on" && <p className="banner ok">{u.name} is active again.</p>}
        <div className="row">
          <p className="hint">{u.active ? "Active carer" : "Inactive: can still sign in, but the availability they mark doesn't show to you."}</p>
          <details className="confirm">
            <summary>{u.active ? "Deactivate" : "Reactivate"}</summary>
            <form action={setCarerActiveAction}>
              <input type="hidden" name="id" value={carer} />
              <input type="hidden" name="active" value={u.active ? "0" : "1"} />
              {u.active && u.upcoming > 0 && (
                <p className="banner warn">{u.name} still has {u.upcoming} upcoming shift{u.upcoming === 1 ? "" : "s"}. Reassign them in the roster.</p>
              )}
              <button className={u.active ? "link danger" : "link"}>{u.active ? `Confirm deactivate ${u.name}` : `Confirm reactivate ${u.name}`}</button>
            </form>
          </details>
        </div>
        <DocList docs={docs} carer={carer} admin />
        <h2>Other documents</h2>
        {u.no_insurance && <p className="hint">{u.name} said they don&apos;t have car insurance.</p>}
        <DocList docs={other} carer={carer} admin />
      </main>
    </div>
  );
}
