import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { bankOf } from "@/lib/account/bank";
import { CarerNav } from "../../CarerNav";
import { bankAction } from "../actions";

export const dynamic = "force-dynamic";

const bsbLabel = (b: string) => (/^\d{6}$/.test(b) ? `${b.slice(0, 3)}-${b.slice(3)}` : b);

export default async function BankDetails({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const b = await bankOf(me.id);
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>Bank Details</h1>
        <p className="hint">Where we pay your wages. Only you and the office can see this.</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        <form action={bankAction} className="details-form" autoComplete="off">
          <label>Account name<input name="acc_name" defaultValue={b.acc_name} required maxLength={100} /></label>
          <label>BSB<input name="bsb" defaultValue={bsbLabel(b.bsb)} required inputMode="numeric" maxLength={7} placeholder="000-000" /></label>
          <label>Account number<input name="acc_no" defaultValue={b.acc_no} required inputMode="numeric" maxLength={12} /></label>
          <button className="big">Done</button>
        </form>
      </main>
    </div>
  );
}
