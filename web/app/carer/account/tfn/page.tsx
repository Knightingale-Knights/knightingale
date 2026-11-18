import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { RESIDENCY, tfnOf } from "@/lib/account/money";
import { fileHref } from "@/lib/files";
import { auDate } from "@/lib/invoicing/rules";
import { CarerNav } from "../../CarerNav";
import { SignaturePad } from "../../contract/SignaturePad";
import { tfnAction } from "../actions";

export const dynamic = "force-dynamic";

const YesNo = ({ name, value }: { name: string; value: boolean | null }) => (
  <>
    <label><input type="radio" name={name} value="yes" defaultChecked={value === true} required /> Yes</label>
    <label><input type="radio" name={name} value="no" defaultChecked={value === false} /> No</label>
  </>
);

export default async function TaxFileNumber({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const v = await tfnOf(me.id);
  const residency = (RESIDENCY as readonly string[]).includes(v.residency) ? v.residency : v.residency ? (v.residency.includes("Foreign") ? RESIDENCY[1] : RESIDENCY[0]) : "";
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>Tax File Number</h1>
        <p className="hint">Your tax file number declaration. Only you and the office can see this.</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        <form action={tfnAction} className="details-form" autoComplete="off">
          <label>Tax file number<input name="tfn" defaultValue={v.tfn} required inputMode="numeric" maxLength={11} /></label>
          <label>Residency
            <select name="residency" defaultValue={residency} required>
              <option value="" disabled>Choose one</option>
              {RESIDENCY.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <fieldset className="radio-row">
            <legend>Do you want to claim the tax-free threshold from Knightingale?</legend>
            <YesNo name="threshold" value={v.threshold} />
          </fieldset>
          <p className="hint">Usually yes if Knightingale is your only or main job. Claim it from one employer only. Foreign residents and working holiday makers can't claim it.</p>
          <fieldset className="radio-row">
            <legend>Do you have a student debt (HELP, VSL, SFSS, SSL or TSL)?</legend>
            <YesNo name="student_debt" value={v.student_debt} />
          </fieldset>
          {v.signature ? (
            <div className="contract-sign">
              <p className="label">Your signature</p>
              <img className="sig-img" src={fileHref(v.signature)} alt="Your signature" />
              {v.signed_at && <p>Signed {auDate(v.signed_at)}</p>}
              <p className="hint">To change any details, sign again below.</p>
            </div>
          ) : (
            <p className="banner error">Not signed yet. Please sign below to declare these details are true and correct.</p>
          )}
          <SignaturePad disabled={Boolean(me.viewAs)} label="Done" />
        </form>
      </main>
    </div>
  );
}
