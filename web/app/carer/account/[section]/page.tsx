import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { sql } from "@/lib/db";
import { accountDocs } from "@/lib/compliance/data";
import { fileHref, STATUS_LABEL } from "@/lib/compliance/docs";
import { sectionOf, showsFor } from "@/lib/account/sections";
import { auDate, isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "../../CarerNav";
import { DocList } from "../../documents/DocList";
import { noInsuranceAction } from "../actions";
import { NoInsurance } from "../NoInsurance";
import { PdfPreview } from "@/components/PdfPreview";

export const dynamic = "force-dynamic";

/** Is this stored file a PDF? Bubble links show it in the name; app uploads keep the type. */
async function isPdf(url: string) {
  if (/\.pdf($|\?)/i.test(url)) return true;
  const m = /^\/files\/([0-9a-f-]{36})$/i.exec(url);
  if (!m) return false;
  const [r] = await sql<{ mime: string }[]>`select mime from app.compliance_files where id = ${m[1]}`;
  return r?.mime === "application/pdf";
}

export default async function AccountSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ error?: string; saved?: string; tab?: string }> }) {
  const me = await requireCarer();
  const [{ section }, sp] = await Promise.all([params, searchParams]);
  const s = sectionOf(section);
  if (!s) notFound();
  if (s.kind === "link") redirect(s.href);
  if (!showsFor(s, me.roles)) notFound();
  const keys = s.kind === "docs" ? s.docs : [];
  const docs = keys.length ? await accountDocs(me.id, keys, isoDate(new Date())) : [];
  const doc = docs.find((d) => d.def.key === sp.tab) ?? docs[0];
  const file = doc?.files.at(-1) ?? null;
  const pdf = file ? await isPdf(file) : false;
  const noInsurance = s.key === "insurance" && (await sql<{ v: boolean }[]>`select no_insurance as v from app.users where id = ${me.id}`)[0]?.v;
  const back = `/carer/account/${s.key}${docs.length > 1 ? `?tab=${doc.def.key}` : ""}`;
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>{s.label}</h1>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        {s.kind !== "docs" || !doc ? <p className="hint">Coming soon.</p> : (
          <>
            {docs.length > 1 && (
              <nav className="doc-tabs">
                {docs.map((d) => <Link key={d.def.key} href={`/carer/account/${s.key}?tab=${d.def.key}`} className={d === doc ? "on" : ""}>{d.def.label}</Link>)}
              </nav>
            )}
            {file && (
              <div className="doc-preview">
                {pdf
                  ? <PdfPreview src={fileHref(file)} alt={doc.def.label} />
                  : <a href={fileHref(file)} target="_blank" rel="noreferrer"><img src={fileHref(file)} alt={doc.def.label} /></a>}
                <p className="doc-exp">{doc.expiry ? `Expires ${auDate(doc.expiry)}` : STATUS_LABEL[doc.status]}</p>
              </div>
            )}
            {s.key === "insurance" && (noInsurance ? (
              <form action={noInsuranceAction} className="no-ins">
                <p className="hint">You&apos;ve told us you don&apos;t have car insurance, so you won&apos;t be offered shifts where a participant needs to be driven in your car.</p>
                <input type="hidden" name="none" value="0" />
                <button className="secondary">I have car insurance now</button>
              </form>
            ) : !file && <div className="no-ins"><NoInsurance /></div>)}
            {!(s.key === "insurance" && noInsurance) && <DocList docs={[doc]} back={back} />}
          </>
        )}
      </main>
    </div>
  );
}
