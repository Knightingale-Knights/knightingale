import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { SignaturePad } from "@/components/SignaturePad";
import { participant } from "@/lib/participants/data";
import { feedbackFor } from "@/lib/participants/extra";
import { fileHref } from "@/lib/files";
import { Blocks } from "@/lib/participants/docText";
import { feedbackAction } from "../../actions";

export const dynamic = "force-dynamic";

const INTRO = "We welcome all feedback, including complaints and compliments. If you have a complaint or concern about your current NDIS supports or services provided by Knightingale, it is important to talk about it. Please fill out this complaint form below, and we will respond to you within one business day. We endeavour to keep information in your complaint confidential, unless required by law. If you wish to make a complaint anonymously, you can do so:\n1. by calling us on +61 426 512 584 and stating that you wish to make an anonymous complaint (so we don't ask you to identify yourself); or\n2. by filling out this Feedback and Complaints Form in your possession, but not including your personal details in the table below as these may identify you, and post it to #133, 22 Kavanagh St, Southbank VIC 3006.";
const NDIS = "To make a complaint to the NDIS Quality and Safeguards Commission:\n• Phone: 1800 035 544 or TTY 133 677 (Interpreters can be arranged)\n• National Relay Service and ask for 1800 035 544\n• Visit https://www.ndiscommission.gov.au/about/complaints and fill out a complaint contact form\n\nThe NDIS Commission can take complaints from anyone about:\n• NDIS services or supports that were not provided in a safe and respectful way\n• NDIS services and supports that were not delivered to an appropriate standard";
const BEHALF = ["Particpant", "Family Member", "Friend", "Advocate", "Carer", "Staff Member", "Other"];
const dmy = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d)) : "");

/** Admin: the participant's Feedback Forms, and a new one to fill in (Bubble's Feedback popup). */
export default async function Feedback({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await feedbackFor(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title="Feedback Form" msg={(await searchParams).msg} wide>
      {list.map((x) => (
        <section key={x.id} className="doc-view"><h2>Feedback {dmy(x.created_at)}</h2>
          <dl>
            {([["Full Name", x.name], ["On Behalf Of", x.behalf], ["Date", dmy(x.date_signed)], ["Phone Number", x.phone], ["Email Address", x.email],
              ["Communication / Interpreter / National Relay Help?", x.comms], ["Assistance Required", x.help_details],
              ["Feedback Details", x.feedback], ["Desired Outcome", x.outcome]] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            {x.signature && <div><dt>Signature</dt><dd><img className="doc-sig" src={fileHref(x.signature)} alt="Signature" /></dd></div>}
          </dl>
        </section>
      ))}
      <form action={feedbackAction} className="stack doc-cards">
        <input type="hidden" name="participant" value={id} />
        <Blocks blocks={[["Feedback Form", INTRO]]} />
        <fieldset className="form-section"><legend>Your Details</legend><div className="form-grid">
          <label className="wide">Full Name<input name="name" /></label>
          <label className="half">On Behalf Of:<select name="behalf" defaultValue=""><option value="">Choose…</option>{BEHALF.map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="half">Date<input type="date" name="date_signed" /></label>
          <label className="half">Phone Number<input name="phone" /></label>
          <label className="half">Email Address<input name="email" type="email" /></label>
          <label className="half">Communication / Interpreter / National Relay Help?<select name="comms" defaultValue=""><option value="">YES/NO</option><option>YES</option><option>NO</option></select></label>
          <label className="wide">Please List Any Assistance Required?<textarea name="help_details" rows={2} /></label>
        </div></fieldset>
        <fieldset className="form-section"><legend>Supports And Services</legend><div className="form-grid">
          <label className="wide">Feedback Details<textarea name="feedback" rows={4} /></label>
          <label className="wide">Desired Outcome<textarea name="outcome" rows={3} /></label>
        </div></fieldset>
        <Blocks blocks={[["", NDIS]]} />
        <fieldset className="form-section"><legend>Signature</legend><div className="form-grid">
          <p className="wide hint">I agree that the information provided in this Feedback and Complaints Form is true and correct:</p>
          <div className="wide sig-field"><span className="label">Signature</span><SignaturePad name="signature" current={null} /></div>
        </div></fieldset>
        <div className="form-save"><button type="submit" className="big">Save Feedback</button></div>
      </form>
    </ParticipantShell>
  );
}
