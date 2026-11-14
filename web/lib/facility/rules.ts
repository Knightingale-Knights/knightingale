// Facility booking rules and texts (wording from the Bubble residential group, kept to one SMS segment).
import { parseClock } from "@/lib/roster/rules";

/** The carer types a facility can book. */
export const BOOKABLE_ROLES = [
  ["en", "EN"],
  ["rn", "RN"],
  ["pca", "PCA"],
  ["cleaner", "Cleaner"],
  ["dsw", "DSW"],
  ["student_nurse", "Student nurse"],
] as const;
export type BookableRole = (typeof BOOKABLE_ROLES)[number][0];
export const roleName = (r: string) => BOOKABLE_ROLES.find(([k]) => k === r)?.[1] ?? r.toUpperCase();

export const MAX_NOTES = 1000;
export class BookingError extends Error {}

export type BookingInput = { day: string; start: string; end: string; role: string; notes: string };

export function validateBooking(i: BookingInput, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.day)) throw new BookingError("Choose a date.");
  if (i.day < today) throw new BookingError("Choose today or a later date.");
  const start = parseClock(i.start);
  const end = parseClock(i.end);
  if (start == null || end == null) throw new BookingError("Enter start and end times.");
  if (start === end) throw new BookingError("The end time must be different from the start time.");
  if (!BOOKABLE_ROLES.some(([k]) => k === i.role)) throw new BookingError("Choose the type of carer you need.");
  const notes = i.notes.trim();
  if (notes.length > MAX_NOTES) throw new BookingError(`Notes can be up to ${MAX_NOTES} characters.`);
  return { start, end, role: i.role as BookableRole, notes };
}

const hhmm = (n: number) => String(n).padStart(4, "0");
const ordinal = (d: number) => d + (d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th");

/** "Mon, Nov 16th", as Bubble formatted it. */
export function bookingDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  const wd = new Intl.DateTimeFormat("en-AU", { weekday: "short", timeZone: "UTC" }).format(d);
  const mon = new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(d);
  return `${wd}, ${mon} ${ordinal(d.getUTCDate())}`;
}

const fit = (options: string[]) => options.find((m) => m.length <= 160) ?? options[options.length - 1].slice(0, 160);

/** Plain ASCII, so each text stays in the cheaper SMS encoding. */
export function bookingTexts(b: { day: string; start: number; end: number; role: string; facility: string; bookedBy: string }) {
  const when = `${hhmm(b.start)} - ${hhmm(b.end)} shift on ${bookingDay(b.day)}`;
  const role = roleName(b.role);
  // "an EN", "an RN" (said letter by letter), "a PCA", "a Cleaner", "a Student nurse"
  const an = (/^[A-Z]+$/.test(role) ? /^[AEFHILMNORSX]/.test(role) : /^[aeiou]/i.test(role)) ? "an" : "a";
  return {
    ack: fit([
      `We've received your request to fill a ${when}. Available ${role}s have been notified. Sit tight, we're on it!`,
      `We've received your request for a ${role} for a ${when}. We're on it!`,
    ]),
    alert: fit([
      `${b.facility} needs ${an} ${role} for a ${when}. Booked by ${b.bookedBy}.`,
      `${b.facility} needs ${an} ${role} for a ${when}.`,
    ]),
  };
}
