import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myPayslips } from "@/lib/carer/payslips";
import { CarerNav } from "../CarerNav";

export const dynamic = "force-dynamic";

const money = (n: number | null) => (n ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const short = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}` : "");

export default async function Payslips() {
  const me = await requireCarer();
  const slips = await myPayslips(me.id);
  return (
    <div className="carer with-side">
      <CarerNav on="shifts" name={me.name} />
      <main className="carer-main">
        <div className="pay-top">
          <Link href="/carer" className="button secondary close">Close Payslips</Link>
        </div>
        <h1>Payslips</h1>
        {slips.length === 0 ? <p className="hint">Your payslips will show here after your first payday.</p> : (
          <ul className="slip-list">
            {slips.map((s) => (
              <li key={s.id}>
                <Link href={`/carer/payslips/${s.id}`}>
                  <span>{short(s.paid)}</span>
                  <span className="amt">{money(s.gross_pay)}</span>
                  <span className="go" aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
