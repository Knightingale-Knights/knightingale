import Link from "next/link";
import { ViewAsButton } from "@/components/ViewAsButton";
import { Portrait, roleList } from "@/components/CarerCells";
import { TabBar, TabBody, tabOf } from "./CarerTabs";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { sql } from "@/lib/db";
import { accountDocs, carerDocs } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { DocList } from "@/app/carer/documents/DocList";
import { approveCarerAction, setCarerActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarerCompliance({ params, searchParams }: { params: Promise<{ carer: string }>; searchParams: Promise<{ error?: string; saved?: string; status?: string; removed?: string; tab?: string; slip?: string }> }) {
  const staff = await requireStaff();
  const { carer } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(carer)) notFound();
  const [u] = await sql<{ name: string; phone: string | null; email: string | null; address: string | null; active: boolean; approved: boolean; photo: string | null; roles: string[] | null; no_insurance: boolean; upcoming: number; dob: string | null }[]>`
    select trim(concat_ws(' ', first_name, last_name)) as name, phone_number as phone, email, nullif(trim(u.address->>'address'), '') as address, coalesce(active, false) as active, coalesce(account_status, false) as approved, profile_photo as photo, roles, coalesce(no_insurance, false) as no_insurance,
           to_char(date_of_birth at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as dob,
           (select count(*)::int from app.shifts s
             where s.carer = u.id and not coalesce(s.cancelled, false) and s.date >= date_trunc('day', now() at time zone 'Australia/Melbourne') at time zone 'Australia/Melbourne') as upcoming
      from app.users u where id = ${carer} and account_type = 'carer'`;
  if (!u) notFound();
  const on = u.approved && u.active;
  const tab = tabOf(sp.tab);
  const [docs, other] = await Promise.all([
    carerDocs(carer, isoDate(new Date())),
    accountDocs(carer, ["insurance", "licence", "passport", "certificate", "ahpra", "covid", "resume"], isoDate(new Date())),
  ]);
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/compliance" /></TopBar>
      <main className="narrow">
        <Link href="/compliance" className="back">← Compliance</Link>
        <div className="title-row compliance-head"><Portrait photo={u.photo} name={u.name} generic /><div className="compliance-name"><h1>{u.name}</h1>{(roleList(u.roles) || u.dob) && <p className="compliance-role">{roleList(u.roles)}{u.dob && <span className="compliance-dob">DOB {u.dob}</span>}</p>}</div><ViewAsButton user={carer} back={`/compliance/${carer}`} /></div>
        <div className="compliance-contact">
          {(u.phone || u.email) && <p className="lede">{[u.phone, u.email].filter(Boolean).join(" · ")}</p>}
          {u.address && <p className="lede">{u.address}</p>}
        </div>
        <TabBar carer={carer} on={tab} />
        {tab !== "docs" ? <TabBody carer={carer} tab={tab} slip={sp.slip} /> : (<>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        {sp.removed && <p className="banner ok">{sp.removed} removed. {u.name} will be asked to upload it again.</p>}
        {sp.status === "off" && <p className="banner ok">{u.name} is deactivated.</p>}
        {sp.status === "on" && <p className="banner ok">{u.name} is active again.</p>}
        {sp.status === "approved" && <p className="banner ok">{u.name} is approved and active.</p>}
        <div className="row status-toggle">
          <p className="hint">{!u.approved ? "Applicant: not approved yet." : u.active ? "Active carer" : "Inactive: can still sign in, but the availability they mark doesn't show to you."}</p>
          <form action={approveCarerAction}>
            <input type="hidden" name="id" value={carer} />
            <button className={on ? "" : "secondary"} disabled={on} aria-pressed={on}>{on ? "Approved" : "Approve"}</button>
          </form>
          <form action={setCarerActiveAction}>
            <input type="hidden" name="id" value={carer} />
            <input type="hidden" name="active" value="0" />
            <button className={on ? "secondary" : ""} disabled={!on} aria-pressed={!on}>{on ? "Deactivate" : "Deactivated"}</button>
          </form>
        </div>
        {on && u.upcoming > 0 && <p className="hint">{u.name} has {u.upcoming} upcoming shift{u.upcoming === 1 ? "" : "s"}. Reassign them in the roster before deactivating.</p>}
        <DocList docs={docs} carer={carer} admin />
        <h2>Other documents</h2>
        {u.no_insurance && <p className="hint">{u.name} said they don&apos;t have car insurance.</p>}
        <DocList docs={other} carer={carer} admin />
        </>)}
      </main>
    </div>
  );
}
