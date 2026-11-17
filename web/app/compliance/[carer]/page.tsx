import Link from "next/link";
import { ViewAsButton } from "@/components/ViewAsButton";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { sql } from "@/lib/db";
import { carerDocs } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { DocList } from "@/app/carer/documents/DocList";

export const dynamic = "force-dynamic";

export default async function CarerCompliance({ params, searchParams }: { params: Promise<{ carer: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const staff = await requireStaff();
  const { carer } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(carer)) notFound();
  const [u] = await sql<{ name: string; phone: string | null; email: string | null }[]>`
    select trim(concat_ws(' ', first_name, last_name)) as name, phone_number as phone, email from app.users where id = ${carer} and account_type = 'carer'`;
  if (!u) notFound();
  const docs = await carerDocs(carer, isoDate(new Date()));
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/compliance" /></TopBar>
      <main className="narrow">
        <Link href="/compliance" className="back">← Compliance</Link>
        <div className="title-row"><h1>{u.name}</h1><ViewAsButton user={carer} back={`/compliance/${carer}`} /></div>
        <p className="lede">{[u.phone, u.email].filter(Boolean).join(" · ")}</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        <DocList docs={docs} carer={carer} admin />
      </main>
    </div>
  );
}
