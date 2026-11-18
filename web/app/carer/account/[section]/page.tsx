import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { carerDocs } from "@/lib/compliance/data";
import { sectionOf } from "@/lib/account/sections";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "../../CarerNav";
import { DocList } from "../../documents/DocList";

export const dynamic = "force-dynamic";

export default async function AccountSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireCarer();
  const [{ section }, sp] = await Promise.all([params, searchParams]);
  const s = sectionOf(section);
  if (!s) notFound();
  if (s.kind === "link") redirect(s.href);
  const docs = s.kind === "docs" ? (await carerDocs(me.id, isoDate(new Date()))).filter((d) => s.docs.includes(d.def.key)) : [];
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>{s.label}</h1>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        {s.kind === "docs" ? <DocList docs={docs} back={`/carer/account/${s.key}`} /> : <p className="hint">Coming soon.</p>}
      </main>
    </div>
  );
}
