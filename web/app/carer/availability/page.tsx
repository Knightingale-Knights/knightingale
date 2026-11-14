import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { myAvailability } from "@/lib/carer/data";
import { SLOTS, addDays } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { availabilityAction } from "../actions";
import { CarerNav } from "../CarerNav";

export const dynamic = "force-dynamic";
const DAYS = 14;

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export default async function Availability({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) && sp.from >= today ? sp.from : today;
  const slots = await myAvailability(me.id, from, DAYS);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const find = (day: string, slot: string) => slots.find((s) => s.day === day && s.slot === slot);

  return (
    <div className="carer">
      <CarerNav on="availability" name={me.name} />
      <main>
        <h1>When can you work?</h1>
        <p className="hint">Tap a time to say you&apos;re available. Tap again to remove it. Booked times can only be changed by the office.</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
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
                      {slot.label}{state === "booked" ? " · booked" : ""}
                    </button>
                  </form>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row tight">
          {from > today && <Link href={`/carer/availability?from=${addDays(from, -DAYS) < today ? today : addDays(from, -DAYS)}`}>← Earlier</Link>}
          <Link href={`/carer/availability?from=${addDays(from, DAYS)}`}>Later →</Link>
        </div>
      </main>
    </div>
  );
}
