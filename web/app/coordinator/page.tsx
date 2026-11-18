import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { coordShifts, myParticipants, type CoordShift } from "@/lib/coordinator/data";
import { addDays, clockLabel } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { Portrait } from "@/components/CarerCells";
import { CoordinatorNav } from "./CoordinatorNav";
import { ParticipantPick } from "./ParticipantPick";

export const dynamic = "force-dynamic";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const fmt = (day: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-AU", { ...o, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const validDay = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
const monthStart = (day: string) => `${day.slice(0, 7)}-01`;
const addMonths = (day: string, n: number) => {
  const d = new Date(`${monthStart(day)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0

export default async function CoordinatorCalendar({ searchParams }: { searchParams: Promise<{ view?: string; d?: string; p?: string }> }) {
  const me = await requireCoordinator();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const day = validDay(sp.d) ?? today;
  const view = sp.view === "day" ? "day" : "month";
  const parts = await myParticipants(me.id);
  const p = parts.some((x) => x.id === sp.p) ? sp.p! : null;
  const href = (o: { view?: string; d?: string }) =>
    `/coordinator?${new URLSearchParams({ view: o.view ?? view, d: o.d ?? day, ...(p ? { p } : {}) })}`;

  const first = monthStart(day);
  const last = addDays(addMonths(day, 1), -1);
  const gridFrom = addDays(first, -weekday(first));
  const gridTo = addDays(last, 6 - weekday(last));
  const shifts = view === "day" ? await coordShifts(me.id, day, day, p) : await coordShifts(me.id, gridFrom, gridTo, p);
  const perDay = new Map<string, number>();
  for (const s of shifts) perDay.set(s.day, (perDay.get(s.day) ?? 0) + 1);
  const cells: string[] = [];
  for (let d = gridFrom; d <= gridTo; d = addDays(d, 1)) cells.push(d);

  const card = (s: CoordShift) => (
    <article key={s.id} className="coord-shift">
      <h3>{s.participant}</h3>
      {s.carer_first ? (
        <div className="coord-carer">
          <Portrait photo={s.carer_photo} name={s.carer_first} />
          <span>{s.carer_first}</span>
        </div>
      ) : <div className="coord-carer muted">Carer to be confirmed</div>}
      {s.carer_phone && <a className="coord-phone" href={`tel:${s.carer_phone}`}>{s.carer_phone}</a>}
      <p className="coord-time">{clockLabel(s.start_time)} - {clockLabel(s.end_time)}</p>
    </article>
  );

  return (
    <div className="carer coord">
      <CoordinatorNav on="calendar" me={me} />
      <main>
        <p className="coord-hello">Welcome back {me.name.split(" ")[0]} 😊</p>
        <div className="coord-bar">
          <nav className="coord-tabs">
            <Link href={href({ view: "month" })} className={view === "month" ? "on" : ""}>Month</Link>
            <Link href={href({ view: "day" })} className={view === "day" ? "on" : ""}>Day</Link>
          </nav>
          <ParticipantPick participants={parts} value={p} />
        </div>

        {view === "month" ? (
          <>
            <div className="coord-step">
              <Link href={href({ d: addMonths(day, -1) })} aria-label="Previous month">‹</Link>
              <span>{fmt(first, { month: "long", year: "numeric" })}</span>
              <Link href={href({ d: addMonths(day, 1) })} aria-label="Next month">›</Link>
            </div>
            <div className="coord-month">
              {WEEK.map((w, i) => <span key={i} className="coord-wd">{w}</span>)}
              {cells.map((d) => (
                <Link key={d} href={href({ view: "day", d })}
                  className={`coord-day${d.slice(0, 7) !== first.slice(0, 7) ? " out" : ""}${d === today ? " today" : ""}`}>
                  <span>{Number(d.slice(8))}</span>
                  {perDay.get(d) ? <small>{perDay.get(d)} shift{perDay.get(d) === 1 ? "" : "s"}</small> : <small className="none">›</small>}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="coord-step">
              <Link href={href({ d: addDays(day, -1) })} aria-label="Previous day">‹</Link>
              <span>{fmt(day, { weekday: "short", day: "numeric", month: "short" })}</span>
              <Link href={href({ d: addDays(day, 1) })} aria-label="Next day">›</Link>
            </div>
            <section className="coord-shifts">
              <h2>Shifts</h2>
              {shifts.length ? shifts.map(card) : <p className="hint">No shifts this day.</p>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
