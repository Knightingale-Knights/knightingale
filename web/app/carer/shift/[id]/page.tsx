import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { myShift } from "@/lib/carer/data";
import { clockLabel } from "@/lib/roster/rules";
import { noteAction } from "../../actions";
import { CarerNav } from "../../CarerNav";
import { CheckButton, CheckPopup } from "../../check";
import { dueCheck } from "@/lib/carer/rules";

export const dynamic = "force-dynamic";

const time = (d: Date) => new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" }).format(d);
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export default async function Shift({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; check?: string }> }) {
  const me = await requireCarer();
  const { id } = await params;
  const sp = await searchParams;
  const s = await myShift(me.id, id);
  if (!s) notFound();
  const due = dueCheck(s);
  const fromText = sp.check === "in" || sp.check === "out";
  const maps = s.address_text ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address_text)}` : null;

  return (
    <div className="carer">
      <CarerNav on="shifts" name={me.name} />
      <main>
        {due && (
          <CheckPopup kind={due} shiftId={s.id} force={fromText} title={`${s.place ?? "Your shift"}, ${clockLabel(s.start_time)}–${clockLabel(s.end_time)}`} detail={s.address_text ?? ""} />
        )}
        <Link href="/carer" className="back">← My shifts</Link>
        <h1>{s.place ?? "Shift"}</h1>
        <p className="when">{dayLabel(s.day)} · {clockLabel(s.start_time)}–{clockLabel(s.end_time)}</p>
        {s.address_text && <p>{maps ? <a href={maps} target="_blank" rel="noreferrer">{s.address_text}</a> : s.address_text}</p>}
        {s.notes && <p className="notes">{s.notes}</p>}

        {s.cancelled ? (
          <p className="banner warn">This shift has been cancelled.</p>
        ) : (
          <section className="block">
            {s.attend_start && <p>Checked in at {time(s.attend_start)}{s.attend_end ? `, checked out at ${time(s.attend_end)}` : ""}.</p>}
            {!s.attend_start && <CheckButton kind="in" shiftId={s.id} />}
            {s.attend_start && !s.attend_end && <CheckButton kind="out" shiftId={s.id} />}
            <p className="hint">You need to be within 500 m of the address, with location turned on.</p>
          </section>
        )}

        {s.kind === "ndis" && !s.cancelled && (
          <section className="block">
            <h2>Progress note</h2>
            {sp.error && <p className="banner error">{sp.error}</p>}
            {s.note_submitted ? (
              <p className="banner ok">{sp.saved ? "Thanks, your progress note is in." : "Your progress note has been submitted."}</p>
            ) : (
              <form action={noteAction} className="stack">
                <input type="hidden" name="id" value={s.id} />
                <label>
                  How did the shift go? Include personal care, meals and drinks, mood, outings, housework, and anything the team should know.
                  <textarea name="summary" rows={8} required minLength={20} maxLength={8000} />
                </label>
                <button type="submit" className="big">Submit progress note</button>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
