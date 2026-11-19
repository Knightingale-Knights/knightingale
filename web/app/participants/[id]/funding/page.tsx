import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { participant } from "@/lib/participants/data";
import { quarters, type Quarter } from "@/lib/participants/extra";
import { melbDate } from "@/lib/forms/fields";
import { quarterAction } from "../../actions";

export const dynamic = "force-dynamic";

const money = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const dmy = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : "?");
const DAY = 86_400_000;

function QuarterCard({ id, q }: { id: string; q: Quarter }) {
  const amount = q.amount ?? 0, spent = q.spent ?? 0, left = amount - spent;
  const days = q.end_value ? Math.max(0, Math.ceil((new Date(q.end_value).getTime() - Date.now()) / DAY)) : null;
  const weeks = days != null ? days / 7 : null;
  const perWeek = weeks && weeks > 0 ? left / weeks : null;
  const weekly = (q.rate ?? 0) * (q.hours_per_week ?? 0);
  const lastsWeeks = weekly > 0 ? left / weekly : null;
  const ends = lastsWeeks != null ? new Date(Date.now() + lastsWeeks * 7 * DAY) : null;
  return (
    <form action={quarterAction} className="form-section funding-card">
      <input type="hidden" name="participant" value={id} /><input type="hidden" name="quarter" value={q.id} />
      <h2>{dmy(q.start)} - {dmy(q.end_value)}</h2>
      <div className="funding-stats">
        <div><span>Total</span><b>{money(amount)}</b></div>
        <div><span>Spent</span><b>{money(spent)}</b></div>
        <div><span>Remaining</span><b>{money(left)}</b></div>
      </div>
      <p className="hint">{weeks != null ? `Wks Left: ${weeks.toFixed(1)}` : ""}{perWeek != null ? ` · Spend/Wk: ${money(perWeek)}` : ""}</p>
      <div className="form-grid">
        <label className="half">Start<input type="date" name="start" defaultValue={melbDate(q.start)} /></label>
        <label className="half">End<input type="date" name="end" defaultValue={melbDate(q.end_value)} /></label>
        <label className="half">Total ($)<input name="amount" inputMode="decimal" defaultValue={q.amount ?? ""} /></label>
        <label className="half">Spent ($)<input name="spent" inputMode="decimal" defaultValue={q.spent ?? ""} /></label>
        <p className="wide hint">Calculate Budget:</p>
        <label className="half">Hrs/Wk:<input name="hours_per_week" inputMode="decimal" defaultValue={q.hours_per_week ?? ""} /></label>
        <label className="half">Rate ($/hr)<input name="rate" inputMode="decimal" defaultValue={q.rate ?? ""} /></label>
        {ends && <p className="wide">Funding will end {dmy(ends)}, {days != null && lastsWeeks != null ? `${Math.round(lastsWeeks * 7 - days)} days ${lastsWeeks * 7 >= days ? "after" : "before"} the period ends` : ""}.</p>}
      </div>
      <div className="plan-actions"><button type="submit">Save</button><button type="submit" name="op" value="remove" className="secondary">Delete</button></div>
    </form>
  );
}

/** Admin: the participant's NDIS funding periods (Bubble's Funding popup). */
export default async function Funding({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const p = await participant(id);
  if (!p) notFound();
  const list = await quarters(id);
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Funding`} msg={(await searchParams).msg} wide>
      <div className="doc-cards">
        {list.map((q) => <QuarterCard key={q.id} id={id} q={q} />)}
        <form action={quarterAction} className="form-section">
          <input type="hidden" name="participant" value={id} />
          <h2>Add a funding period</h2>
          <div className="form-grid">
            <label className="half">Start<input type="date" name="start" required /></label>
            <label className="half">End<input type="date" name="end" required /></label>
            <label className="half">Total ($)<input name="amount" inputMode="decimal" required /></label>
            <label className="half">Spent ($)<input name="spent" inputMode="decimal" /></label>
          </div>
          <div className="plan-actions"><button type="submit">Add</button></div>
        </form>
      </div>
    </ParticipantShell>
  );
}
