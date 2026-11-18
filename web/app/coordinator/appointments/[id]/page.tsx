import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { coordAppointment } from "@/lib/coordinator/data";
import { CoordinatorNav } from "../../CoordinatorNav";

export const dynamic = "force-dynamic";

/** An appointment for one of the coordinator's participants (view only). */
export default async function CoordinatorAppointment({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCoordinator();
  const { id } = await params;
  const a = await coordAppointment(me.id, id);
  if (!a) notFound();
  const day = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${a.day}T00:00:00Z`));
  const part = (h: string, v: string | null) => v && <section className="coord-note"><h2>{h}</h2><p>{v}</p></section>;
  return (
    <div className="carer coord">
      <CoordinatorNav on="calendar" me={me} />
      <main>
        <Link href={`/coordinator?view=day&d=${a.day}`} className="back">← {day}</Link>
        <h1>Appointment</h1>
        <p className="hint">{a.participant} · {day}{a.time ? ` · ${a.time}` : ""}{a.done ? " · Done" : ""}</p>
        {part("Details", a.details)}
        {part("Where", a.address)}
        {part("Carer", a.carer)}
        {part("Notes", a.notes)}
      </main>
    </div>
  );
}
