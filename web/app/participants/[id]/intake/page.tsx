import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecordFields } from "@/components/RecordForm";
import { participant } from "@/lib/participants/data";
import { INTAKE, intakeFor } from "@/lib/participants/intake";
import { loadOptions, planManagers, readRecord } from "@/lib/forms/fields";
import { saveIntakeAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Intake({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const cur = await intakeFor(id);
  const [values, options, pms] = await Promise.all([readRecord("intakes", cur?.id ?? null), loadOptions(INTAKE), planManagers()]);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <div className="shell">
      <TopBar section="/participants" email={staff.email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className="form-page">
        <Link href={`/participants/${id}`} className="sheet-close" aria-label="Close" title="Back to the participant">×</Link>
        <h1>{name} intake</h1>
        <p className="lede">{cur?.id ? "Editing the saved intake." : "No intake yet. Saving creates one."}</p>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
        <form action={saveIntakeAction} className="stack">
          <input type="hidden" name="participant" value={id} />
          <RecordFields sections={INTAKE} values={values} options={options} planManagers={pms} />
          <div className="form-save"><button type="submit" className="big">Save intake</button></div>
        </form>
      </main>
    </div>
  );
}
