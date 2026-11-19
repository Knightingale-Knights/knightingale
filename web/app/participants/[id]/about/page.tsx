import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { about } from "@/lib/participants/extra";
import { aboutAction } from "../../actions";

export const dynamic = "force-dynamic";

/** Admin: All About the participant (User.description). */
export default async function About({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const text = await about(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`All About ${p.first_name ?? name}`} msg={(await searchParams).msg} wide>
      <form action={aboutAction} className="stack doc-cards">
        <input type="hidden" name="participant" value={id} />
        <fieldset className="form-section"><div className="form-grid">
          <label className="wide">About<textarea name="description" rows={10} defaultValue={text} /></label>
        </div></fieldset>
        <div className="form-save"><button type="submit" className="big">Save</button></div>
      </form>
    </ParticipantShell>
  );
}
