import Link from "next/link";
import type { Payslip } from "@/lib/carer/payslips";
import { PrintButton } from "./PrintButton";

const money = (n: number | null) => (n ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const dm = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "");

/** One payslip, laid out as Bubble's Payslip popup (the carer's page, and the office's Payslips tab). */
export function SlipView({ p, close }: { p: Payslip; close: string }) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  const row = (label: string, value: string) => (
    <div className="slip-row"><span>{label}</span><span>{value}</span></div>
  );
  return (
    <div className="slip-page">
      <article className="slip">
        <header className="slip-head">
          <span>Payslip</span>
          <Link href={close} className="slip-x" aria-label="Close">×</Link>
        </header>
        <div className="slip-body">
          <p className="slip-co">Knightingale</p>
          <p className="slip-abn">ABN: 50 405 424 095</p>
          <p className="slip-name">{name}{p.role ? ` (${p.role.toUpperCase()})` : ""}</p>
          {p.address && <p className="slip-addr">{p.address}</p>}
          <hr />
          <p className="slip-period">{dm(p.start)} - {dm(p.end)}</p>

          <p className="slip-label">Net pay</p>
          <p className="slip-net">{money(p.net_pay)}</p>

          <p className="slip-label">Earnings</p>
          <div className="slip-rows">
            {row("Hours worked", (p.hours_worked ?? 0).toFixed(2))}
            {row("Gross pay", money(p.gross_pay))}
            {row("Reimbursements", money(p.travel))}
          </div>

          <p className="slip-label">Tax &amp; super</p>
          <div className="slip-rows">
            {row("Tax", money(p.tax))}
            {row(`Super${p.fund ? ` - ${p.fund.toUpperCase()}` : ""}`, money(p.super))}
          </div>

          <p className="slip-label">Year to date</p>
          <div className="slip-rows">
            {row("Gross", money(p.ytd_gross))}
            {row("Tax", money(p.ytd_tax))}
            {row("Net", money(p.ytd_net))}
          </div>

          <PrintButton />
        </div>
      </article>
    </div>
  );
}
