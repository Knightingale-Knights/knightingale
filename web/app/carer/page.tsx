import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myShifts, type CarerShift } from "@/lib/carer/data";
import { clockLabel } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "./CarerNav";
import { CheckPopup } from "./check";
import { dueCheck } from "@/lib/carer/rules";

export const dynamic = "force-dynamic";

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

function status(s: CarerShift) {
  if (s.cancelled) return "Cancelled";
  if (s.attend_end) return s.kind === "ndis" && !s.note_submitted ? "Progress note needed" : "Done";
  if (s.attend_start) return "Checked in";
  return null;
}

export default async function MyShifts() {
  const me = await requireCarer();
  const today = isoDate(new Date());
  const shifts = await myShifts(me.id, today);
  const upcoming = shifts.filter((s) => s.day >= today);
  const recent = shifts.filter((s) => s.day < today).reverse();
  const now = Date.now();
  const due = shifts.map((s) => ({ s, kind: dueCheck(s, now) })).find((d) => d.kind);
  const card = (s: CarerShift) => (
    <Link key={s.id} href={`/carer/shift/${s.id}`} className={`cshift ${s.cancelled ? "cancelled" : ""}`}>
      <span className="when">{s.day === today ? "Today" : dayLabel(s.day)} · {clockLabel(s.start_time)}–{clockLabel(s.end_time)}</span>
      <span className="where">{s.place ?? "Shift"}</span>
      {status(s) && <span className={`status ${status(s) === "Progress note needed" ? "todo" : ""}`}>{status(s)}</span>}
    </Link>
  );
  return (
    <div className="carer">
      <CarerNav on="shifts" name={me.name} />
      {due && (
        <CheckPopup kind={due.kind!} shiftId={due.s.id} title={`${due.s.place ?? "Your shift"}, ${clockLabel(due.s.start_time)}–${clockLabel(due.s.end_time)}`} detail={due.s.address_text ?? ""} />
      )}
      <main>
        <h1>My shifts</h1>
        {upcoming.length ? upcoming.map(card) : <p className="empty">No shifts booked in the next four weeks.</p>}
        {recent.length > 0 && (<><h2>Last 7 days</h2>{recent.map(card)}</>)}
      </main>
    </div>
  );
}
