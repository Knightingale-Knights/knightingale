import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { fileHref } from "@/lib/files";
import { contractState } from "@/lib/contract/data";
import { CONTRACT, EMPLOYER, PAY_COLUMNS, PAY_NOTES, PAY_ROWS, positionOf } from "@/lib/contract/text";
import { auDate } from "@/lib/invoicing/rules";
import { ViewAsBar } from "@/components/ViewAsBar";
import { signContractAction } from "./actions";
import { SignaturePad } from "./SignaturePad";

export const dynamic = "force-dynamic";

/** The casual employment contract. Unsigned carers are sent here first and can't use the app until they sign. */
export default async function Contract({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireCarer();
  if (!me.approved && !me.viewAs) redirect("/carer"); // still being reviewed: the waiting popup, not the contract
  const sp = await searchParams;
  const state = await contractState(me.id);
  const signed = Boolean(state.signature);
  const position = positionOf(me.roles);
  return (
    <div className="contract-page">
      <ViewAsBar />
      <main className="contract">
        <p className="wordmark small">Knightingale</p>
        <h1>Casual Employment Contract</h1>
        {!signed && <p className="lede">{state.outdated ? "Our pay rates have changed. Please read and sign your updated employment contract." : "Before you start, please read and sign your employment contract."}</p>}
        <div className="contract-parties">
          <p className="label">An employment agreement between</p>
          <p>{EMPLOYER}</p>
          <p className="label">and</p>
          <p>{me.name || me.email}</p>
        </div>
        {CONTRACT.map((b, i) => (
          <section key={i}>
            {b.h && <h2>{b.h}</h2>}
            {b.p?.map((t, j) => <p key={j}>{t.replace("{position}", position)}</p>)}
            {b.list && <ol className="contract-list">{b.list.map((t, j) => <li key={j}><span>({String.fromCharCode(97 + j)})</span>{t}</li>)}</ol>}
            {b.bullets && <ul className="contract-bullets">{b.bullets.map((t, j) => <li key={j}>{t}</li>)}</ul>}
            {b.after?.map((t, j) => <p key={`a${j}`}>{t}</p>)}
            {b.table && (
              <table className="pay-table">
                <thead><tr><th></th>{PAY_COLUMNS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{PAY_ROWS.map(([k, ...v]) => <tr key={k}><th>{k}</th>{v.map((n, j) => <td key={j}>{n == null ? "n/a" : `$${n}`}</td>)}</tr>)}</tbody>
              </table>
            )}
            {b.table && PAY_NOTES.map((t, j) => <p key={`n${j}`} className="hint">{t}</p>)}
          </section>
        ))}
        <section className="contract-sign">
          <h2>Signatures</h2>
          {sp.error && <p className="banner error">{sp.error}</p>}
          {signed ? (
            <>
              <p className="label">Your signature</p>
              <img className="sig-img" src={fileHref(state.signature!)} alt="Your signature" />
              <p>Signed {auDate(state.date)}</p>
              <p className="label">Knightingale</p>
              <p>Paul-Simon Djite, Founder</p>
              <Link className="big button" href="/carer/policies">Done</Link>
            </>
          ) : (
            <form action={signContractAction}>
              <p className="label">Your autograph please</p>
              <SignaturePad disabled={Boolean(me.viewAs)} />
              {me.viewAs && <p className="hint">You're viewing as this carer, so you can't sign for them.</p>}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
