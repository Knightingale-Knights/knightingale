// The tabs at the top of a carer's Compliance page: the office sees the carer's own Superannuation, Tax File Number,
// Bank Account, Payslips and Stats pages, in the same design the carer sees (read only).
import Link from "next/link";
import { superOf, tfnOf } from "@/lib/account/money";
import { bankOf } from "@/lib/account/bank";
import { myPayslip, myPayslips } from "@/lib/carer/payslips";
import { fileHref } from "@/lib/files";
import { auDate } from "@/lib/invoicing/rules";
import { StatsBody } from "@/app/carer/stats/StatsBody";
import { SlipView } from "@/app/carer/payslips/[id]/SlipView";

export const TABS = [
  ["docs", "Documents"], ["super", "Superannuation"], ["tfn", "Tax File Number"],
  ["bank", "Bank Account"], ["payslips", "Payslips"], ["stats", "Stats"],
] as const;
export type Tab = (typeof TABS)[number][0];

export const tabOf = (t: string | undefined): Tab => (TABS.some(([k]) => k === t) ? (t as Tab) : "docs");

export function TabBar({ carer, on }: { carer: string; on: Tab }) {
  return (
    <nav className="record-tabs" aria-label="Carer details">
      {TABS.map(([k, label]) => (
        <Link key={k} href={k === "docs" ? `/compliance/${carer}` : `/compliance/${carer}?tab=${k}`} className={k === on ? "on" : ""} aria-current={k === on ? "page" : undefined} scroll={false}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <label>{label}<input value={value} readOnly placeholder="Not given" /></label>
);
const yesNo = (v: boolean | null) => (v == null ? "Not answered" : v ? "Yes" : "No");
const bsbLabel = (b: string) => (/^\d{6}$/.test(b) ? `${b.slice(0, 3)}-${b.slice(3)}` : b);
const money = (n: number | null) => (n ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const short = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}` : "");

export async function TabBody({ carer, tab, slip }: { carer: string; tab: Exclude<Tab, "docs">; slip?: string }) {
  if (tab === "super") {
    const v = await superOf(carer);
    return (
      <div className="details-form">
        <h2>Superannuation</h2>
        <Field label="Fund name" value={v.fund_name} />
        <Field label="Fund ABN" value={v.fund_abn} />
        <Field label="USI" value={v.fund_usi} />
        <Field label="Member account number" value={v.member_no} />
      </div>
    );
  }
  if (tab === "tfn") {
    const v = await tfnOf(carer);
    return (
      <div className="details-form">
        <h2>Tax File Number</h2>
        <Field label="Tax file number" value={v.tfn} />
        <Field label="Residency" value={v.residency} />
        <Field label="Claiming the tax-free threshold from Knightingale" value={yesNo(v.threshold)} />
        <Field label="Student debt (HELP, VSL, SFSS, SSL or TSL)" value={yesNo(v.student_debt)} />
        {v.signature ? (
          <div className="contract-sign">
            <p className="label">Signature</p>
            <img className="sig-img" src={fileHref(v.signature)} alt="Signature" />
            {v.signed_at && <p>Signed {auDate(v.signed_at)}</p>}
          </div>
        ) : <p className="banner error">Not signed yet.</p>}
      </div>
    );
  }
  if (tab === "bank") {
    const b = await bankOf(carer);
    return (
      <div className="details-form">
        <h2>Bank Account</h2>
        <Field label="Account name" value={b.acc_name} />
        <Field label="BSB" value={bsbLabel(b.bsb)} />
        <Field label="Account number" value={b.acc_no} />
      </div>
    );
  }
  if (tab === "payslips") {
    const back = `/compliance/${carer}?tab=payslips`;
    if (slip) {
      const p = await myPayslip(carer, slip);
      if (p) return <SlipView p={p} close={back} />;
    }
    const slips = await myPayslips(carer);
    return (
      <>
        <h2>Payslips</h2>
        {slips.length === 0 ? <p className="hint">No payslips yet.</p> : (
          <ul className="slip-list">
            {slips.map((s) => (
              <li key={s.id}>
                <Link href={`${back}&slip=${s.id}`} scroll={false}>
                  <span>{short(s.paid)}</span>
                  <span className="amt">{money(s.gross_pay)}</span>
                  <span className="go" aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }
  return (
    <div className="stats">
      <h2>Stats</h2>
      <StatsBody carer={carer} />
    </div>
  );
}
