import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { personalDetails } from "@/lib/account/personal";
import { aboutOf } from "@/lib/account/about";
import { CarerNav } from "../../CarerNav";
import { personalAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PersonalDetails({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; email?: string; about?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const [d, about] = await Promise.all([personalDetails(me.id), aboutOf(me.id)]);
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account">&larr; Account</Link>
        <h1>Your Details</h1>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.{sp.email ? " Use your new email next time you sign in." : ""}</p>}
        {sp.about && <p className="banner ok">Thanks for telling us about you.</p>}
        <form action={personalAction} className="details-form">
          <label>First name<input name="first" defaultValue={d.first} required maxLength={60} autoComplete="given-name" /></label>
          <label>Middle name <span className="opt">(optional)</span><input name="middle" defaultValue={d.middle} maxLength={60} autoComplete="additional-name" /></label>
          <label>Last name<input name="last" defaultValue={d.last} required maxLength={60} autoComplete="family-name" /></label>
          <label>Mobile number<input name="phone" type="tel" defaultValue={d.phone} required autoComplete="tel" /></label>
          <label>Date of birth<input name="dob" type="date" defaultValue={d.dob} required autoComplete="bday" /></label>
          <label>Address<input name="address" defaultValue={d.address} required maxLength={300} autoComplete="street-address" /></label>
          <label>Email<input name="email" type="email" defaultValue={d.email} required autoComplete="email" /></label>
          <p className="hint">Your email is also how you sign in.</p>
          <fieldset className="radio-row">
            <legend>Do you have a car you can use for shifts?</legend>
            <label><input type="radio" name="can_drive" value="yes" defaultChecked={d.can_drive === true} /> Yes</label>
            <label><input type="radio" name="can_drive" value="no" defaultChecked={d.can_drive === false} /> No</label>
          </fieldset>
          <h2>Emergency contact</h2>
          <label>Name<input name="em_name" defaultValue={d.em_name} maxLength={100} /></label>
          <label>Relationship<input name="em_relationship" defaultValue={d.em_relationship} maxLength={60} placeholder="e.g. Partner, Parent" /></label>
          <label>Phone<input name="em_phone" type="tel" defaultValue={d.em_phone} /></label>
          <button className="big">Save</button>
        </form>
        <Link className="big button about-btn" href="/carer/account/about">{about.why_care ? "Edit About You" : "About You"}</Link>
      </main>
    </div>
  );
}
