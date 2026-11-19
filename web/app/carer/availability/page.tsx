import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myAvailability } from "@/lib/carer/data";
import { SLOTS, addDays } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { availabilityAction, awayAction, removeAwayAction } from "../actions";
import { dayLabel as awayLabel, myAway, REASONS } from "@/lib/carer/away";
import { CarerNav } from "../CarerNav";
import { cultureProgress } from "@/lib/culture/data";

export const dynamic = "force-dynamic";
const DAYS = 14;

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export default async function Availability({ searchParams }: { searchParams: Promise<{ from?: string; error?: string; away?: string; n?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) && sp.from >= today ? sp.from : today;
  const [slots, away, culture] = await Promise.all([myAvailability(me.id, from, DAYS), myAway(me.id, today), cultureProgress(me.id)]);
  const locked = !culture.complete && !me.viewAs;
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const find = (day: string, slot: string) => slots.find((s) => s.day === day && s.slot === slot);

  return (
    <div className="carer">
      <CarerNav on="availability" name={me.name} />
      <main>
        <h1>When can you work?</h1>
        {locked ? (
          <section className="culture-gate">
            <h2>Watch Culture of Care first</h2>
            <p>Before you share your availability, please watch our Culture of Care videos. They show how we care at Knightingale.</p>
            <p className="hint">{culture.done} of {culture.total} watched</p>
            <Link href="/carer/culture" className="button big">Watch the videos</Link>
          </section>
        ) : (
          <p className="hint">Tap a time to say you&apos;re available. Tap again to remove it.</p>
        )}
        {!culture.complete && me.viewAs && <p className="banner warn">This carer hasn&apos;t finished Culture of Care ({culture.done} of {culture.total}), so they can&apos;t change their availability yet.</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.away === "saved" && <p className="banner ok">Thanks for letting us know.</p>}
        {sp.away === "rostered" && <p className="banner ok">Thanks for letting us know. You&apos;re rostered on {sp.n === "1" ? "a shift" : "some shifts"} in that time, so we&apos;ll sort out cover and be in touch.</p>}
        {!locked && (
          <>
        <div className="avail">
          {days.map((day) => (
            <div key={day} className="avail-row">
              <span className="d">{dayLabel(day)}</span>
              {SLOTS.map((slot) => {
                const s = find(day, slot.value);
                const state = s?.booked ? "booked" : s?.available ? "on" : "off";
                return (
                  <form key={slot.value} action={availabilityAction}>
                    <input type="hidden" name="day" value={day} />
                    <input type="hidden" name="from" value={from} />
                    <input type="hidden" name="slot" value={slot.value} />
                    <input type="hidden" name="on" value={state === "off" ? "1" : "0"} />
                    <button className={`slot ${state}`} disabled={state === "booked"} aria-pressed={state !== "off"}>
                      {slot.short}{state === "booked" ? " · booked" : ""}
                    </button>
                  </form>
                );
              })}
            </div>
          ))}
        </div>
          </>
        )}
        <section className="away">
          <h2>Going away or unwell?</h2>
          <p className="hint">Let us know the days you can&apos;t work. If you&apos;re rostered on, we&apos;ll find cover.</p>
          {away.length > 0 && (
            <ul className="away-list">
              {away.map((a) => (
                <li key={a.id}>
                  <span><strong>{REASONS[a.reason]}</strong> {a.from_day === a.to_day ? awayLabel(a.from_day) : `${awayLabel(a.from_day)} to ${awayLabel(a.to_day)}`}{a.note ? ` · ${a.note}` : ""}</span>
                  <form action={removeAwayAction}><input type="hidden" name="id" value={a.id} /><button className="link danger">Remove</button></form>
                </li>
              ))}
            </ul>
          )}
          <form action={awayAction} className="away-form">
            <div className="away-reasons">
              <label className="away-reason"><input type="radio" name="reason" value="holiday" defaultChecked /> Holiday</label>
              <label className="away-reason"><input type="radio" name="reason" value="sick" /> Sick</label>
            </div>
            <div className="away-days">
              <label>First day<input type="date" name="from_day" min={today} defaultValue={today} required /></label>
              <label>Last day<input type="date" name="to_day" min={today} defaultValue={today} required /></label>
            </div>
            <label>Note (optional)<input name="note" maxLength={500} placeholder="Anything we should know" /></label>
            <button>I&apos;m away these days</button>
          </form>
        </section>
        {!locked && (
        <div className="row tight">
          {from > today && <Link href={`/carer/availability?from=${addDays(from, -DAYS) < today ? today : addDays(from, -DAYS)}`}>← Earlier</Link>}
          <Link href={`/carer/availability?from=${addDays(from, DAYS)}`}>Later →</Link>
        </div>
        )}
      </main>
    </div>
  );
}
