import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { superOf } from "@/lib/account/money";
import { CarerNav } from "../../CarerNav";
import { superAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Superannuation({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const v = await superOf(me.id);
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>Superannuation</h1>
        <p className="hint">The fund we pay your super into. You'll find these on your fund's website or app.</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        <form action={superAction} className="details-form" autoComplete="off">
          <label>Fund name<input name="fund_name" defaultValue={v.fund_name} required maxLength={120} /></label>
          <label>Fund ABN<input name="fund_abn" defaultValue={v.fund_abn} inputMode="numeric" maxLength={14} /></label>
          <label>USI<input name="fund_usi" defaultValue={v.fund_usi} maxLength={20} /></label>
          <label>Member account number<input name="member_no" defaultValue={v.member_no} required maxLength={30} /></label>
          <button className="big">Update</button>
        </form>
      </main>
    </div>
  );
}
