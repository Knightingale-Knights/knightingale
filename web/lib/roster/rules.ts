// Pure roster rules: times, hours, pricing, availability slots and clashes.
// Shift times are stored as Bubble did: numbers like 930 (09:30) and 1430 (14:30).

export type ShiftKind = "residential" | "ndis";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** "9:30", "09:30", "930" or 930 -> 930. Returns null if it isn't a valid time. */
export function parseClock(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const s = String(v).trim().replace(/\s/g, "");
  const m = s.match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 100 + min;
}

export const toMinutes = (c: number) => Math.floor(c / 100) * 60 + (c % 100);

export function clockLabel(c: number | null) {
  if (c == null) return "";
  return `${String(Math.floor(c / 100)).padStart(2, "0")}:${String(c % 100).padStart(2, "0")}`;
}

/** Hours between two clock times; an end at or before the start runs past midnight. */
export function hoursBetween(start: number, end: number) {
  let mins = toMinutes(end) - toMinutes(start);
  if (mins <= 0) mins += 24 * 60;
  return round2(mins / 60);
}

export type PriceItem = { rate: number | null; hourly_revenue: number | null; carer_pay: number | null };

/** Same arithmetic as Bubble: fee, revenue and wage are hours times the price item's figures. */
export function price(hours: number, item: PriceItem) {
  const rate = Number(item.rate ?? 0);
  return {
    rate,
    fee: round2(hours * rate),
    revenue: round2(hours * Number(item.hourly_revenue ?? 0)),
    wage: round2(hours * Number(item.carer_pay ?? 0)),
  };
}

// Availability slots carers tick in the app (Bubble's "shift_time" option set).
export const SLOTS = [
  { value: "0600___1400", label: "Morning", start: 600, end: 1400 },
  { value: "night__2200___0715_", label: "Afternoon", start: 1200, end: 2000 },
  { value: "night__11pm___7am_", label: "Night", start: 2000, end: 600 },
] as const;

/** [start, end) in minutes from the start of the shift's day; overnight windows run past 1440. */
function span(start: number, end: number): [number, number] {
  const a = toMinutes(start);
  let b = toMinutes(end);
  if (b <= a) b += 24 * 60;
  return [a, b];
}

const overlap = (x: [number, number], y: [number, number]) => x[0] < y[1] && y[0] < x[1];

/** Which availability slots a shift falls in: every slot whose window overlaps the shift. */
export function slotsFor(start: number, end: number) {
  const s = span(start, end);
  return SLOTS.filter((slot) => {
    const w = span(slot.start, slot.end);
    // A night slot also covers the early hours of the day it starts on.
    const early: [number, number] = [w[0] - 24 * 60, w[1] - 24 * 60];
    return overlap(s, w) || overlap(s, early);
  }).map((slot) => slot.value);
}

export type Booking = { id: string; day: string; start_time: number; end_time: number };

const dayIndex = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);

/** True when two bookings for the same carer overlap, including overnight shifts into the next day. */
export function clashes(a: Booking, b: Booking) {
  const off = (dayIndex(b.day) - dayIndex(a.day)) * 24 * 60;
  const x = span(a.start_time, a.end_time);
  const y = span(b.start_time, b.end_time).map((v) => v + off) as [number, number];
  return overlap(x, y);
}

/** Days for "repeat weekly until": the start day, then every 7 days up to and including the end. */
export function weeklyDates(first: string, until: string | null, max = 26) {
  const out = [first];
  if (!until) return out;
  const end = Date.parse(`${until}T00:00:00Z`);
  let t = Date.parse(`${first}T00:00:00Z`);
  while (out.length < max) {
    t += 7 * 86_400_000;
    if (t > end) break;
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Monday of the week containing day (yyyy-mm-dd). */
export function weekStart(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type Period = "am" | "pm" | "ns";
/** Roster grouping by start time: AM 7:00 to before 12:00, PM 12:00 to before 22:00, NS 22:00 to before 7:00. */
export function periodOf(start: number | null): Period {
  if (start == null) return "am";
  if (start >= 700 && start < 1200) return "am";
  if (start >= 1200 && start < 2200) return "pm";
  return "ns";
}

/** First day of the month n months from day's month. */
export function addMonths(day: string, n: number) {
  const [y, m] = day.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/** Monday-first weeks covering day's month: [first day shown, day after the last shown]. */
export function monthGrid(day: string): [string, string] {
  const first = `${day.slice(0, 7)}-01`;
  const last = addDays(addMonths(first, 1), -1);
  return [weekStart(first), addDays(weekStart(last), 7)];
}
