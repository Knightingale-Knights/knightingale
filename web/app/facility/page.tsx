import { requireFacility } from "@/lib/auth";
import { MenuBurger } from "@/components/MenuBurger";
import { ViewAsBar } from "@/components/ViewAsBar";
import { facilityFor, facilityShifts, type Booking } from "@/lib/facility/data";
import { roleName } from "@/lib/facility/rules";
import { clockLabel } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { signOutAction } from "@/app/invoicing/actions";
import { BookForm } from "./BookForm";

export const dynamic = "force-dynamic";

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

function status(b: Booking) {
  if (b.cancelled) return { text: "Cancelled", cls: "muted" };
  if (b.carer_first) return { text: `Filled by ${b.carer_first}`, cls: "ok" };
  return { text: "Requested", cls: "todo" };
}

export default async function FacilityHome({ searchParams }: { searchParams: Promise<{ booked?: string; error?: string }> }) {
  const me = await requireFacility();
  const sp = await searchParams;
  const today = isoDate(new Date());
  const facility = await facilityFor(me.id);
  const shifts = facility ? await facilityShifts(facility.id, today) : [];
  const upcoming = shifts.filter((s) => s.day >= today);
  const past = shifts.filter((s) => s.day < today).reverse();
  const row = (b: Booking) => {
    const st = status(b);
    return (
      <div key={b.id} className={`cshift ${b.cancelled ? "cancelled" : ""}`}>
        <span className="when">{b.day === today ? "Today" : dayLabel(b.day)} · {clockLabel(b.start_time)} – {clockLabel(b.end_time)}</span>
        <span className="where">{b.roles?.[0] ? roleName(b.roles[0]) : "Shift"}</span>
        <span className={`status ${st.cls}`}>{st.text}</span>
      </div>
    );
  };
  return (
    <div className="carer">
      <ViewAsBar />
      <header className="carer-top">
        <span className="wordmark small">knightingale</span>
        <MenuBurger />
        <span className="hello">{facility?.name ?? me.name}</span>
        <nav><form action={signOutAction}><button className="link">Sign out</button></form></nav>
      </header>
      <main>
        {!facility ? (
          <p className="banner warn">Your account isn&apos;t linked to a facility yet. Please call Knightingale.</p>
        ) : (
          <>
            <h1>Book a carer</h1>
            {sp.booked && <p className="banner ok">Thanks, we&apos;ve received your request. Available carers have been notified.</p>}
            {sp.error && <p className="banner error">{sp.error}</p>}
            <section className="block"><BookForm today={today} facility={facility.name} /></section>
            <h2>Upcoming shifts</h2>
            {upcoming.length ? upcoming.map(row) : <p className="empty">No upcoming shifts.</p>}
            {past.length > 0 && (<><h2>Last 2 weeks</h2>{past.map(row)}</>)}
          </>
        )}
      </main>
    </div>
  );
}
