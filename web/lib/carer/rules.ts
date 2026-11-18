// Pure rules for the carer side: distance, check-in windows and what a carer may do.
// Same limits as the CarerTexts check-in page.

export const RADIUS_M = 500; // must be within this distance of the shift address
export const MAX_ACCURACY_M = 500; // phone location must be at least this precise
export const CHECK_IN_EARLY_MS = 30 * 60_000; // can check in from 30 min before the start until the end
export const CHECK_OUT_LATE_MS = 24 * 3600_000; // can check out up to 24h after the end

const EARTH_RADIUS_M = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const validCoords = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export type Position = { lat: number; lng: number; accuracy: number };
export type ShiftForCheck = {
  start_at: Date | null; end_at: Date | null; cancelled: boolean;
  attend_start: Date | null; attend_end: Date | null; address: { lat?: number; lng?: number } | null;
};

export class CheckError extends Error {}

/** Throws a CheckError with a message for the carer if they can't check in or out right now. */
export function assertCanCheck(kind: "in" | "out", s: ShiftForCheck, pos: Position, now = Date.now()) {
  if (s.cancelled) throw new CheckError("This shift has been cancelled.");
  if (!s.start_at || !s.end_at) throw new CheckError("This shift has no start or end time. Please contact the office.");
  if (kind === "in") {
    if (s.attend_start) throw new CheckError("You're already checked in.");
    if (now < s.start_at.getTime() - CHECK_IN_EARLY_MS) throw new CheckError("It's too early to check in for this shift.");
    if (now > s.end_at.getTime()) throw new CheckError("It's too late to check in. Please contact the office.");
  } else {
    if (!s.attend_start) throw new CheckError("Check in first.");
    if (s.attend_end) throw new CheckError("You're already checked out.");
    if (now > s.end_at.getTime() + CHECK_OUT_LATE_MS) throw new CheckError("It's too late to check out. Please contact the office.");
  }
  if (!validCoords(pos.lat, pos.lng)) throw new CheckError("We couldn't read your location. Please try again.");
  if (!Number.isFinite(pos.accuracy) || pos.accuracy > MAX_ACCURACY_M) {
    throw new CheckError("Your phone couldn't get a precise location. Move outside or turn on precise location, then try again.");
  }
  const lat = s.address?.lat;
  const lng = s.address?.lng;
  if (!validCoords(lat, lng)) throw new CheckError("This shift has no mapped address yet. Please contact the office.");
  const d = Math.round(haversineM(pos.lat, pos.lng, lat, lng as number));
  if (d > RADIUS_M) throw new CheckError(`You're about ${d} m from the shift address. You need to be within ${RADIUS_M} m.`);
  return d;
}

export const EMPTY_NOTE_FIELD = "Not on this shift";

export const NOTE_FIELDS = [
  "activities_of_daily_living", "allied_health", "best_day", "comms", "fluid_intake", "food_intake",
  "general_mood", "housework", "maintenance", "medical_appointments", "outings",
] as const;

/** One item per line, each starting with "• "; blank becomes "Not on this shift". */
export function formatNoteField(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return EMPTY_NOTE_FIELD;
  const text = value.trim();
  if (text.toLowerCase() === EMPTY_NOTE_FIELD.toLowerCase()) return EMPTY_NOTE_FIELD;
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:[•\-*·]\s*)+/, "").trim()).filter(Boolean);
  return lines.length ? lines.map((l) => "• " + l).join("\n") : EMPTY_NOTE_FIELD;
}

/** Pulls the JSON object out of a model reply, tolerating code fences or extra text. */
export function parseModelJson(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch { /* try the outer braces */ }
  const a = clean.indexOf("{");
  const b = clean.lastIndexOf("}");
  if (a !== -1 && b > a) {
    try { return JSON.parse(clean.slice(a, b + 1)); } catch { /* give up */ }
  }
  return null;
}

export const POPUP_IN_BEFORE_MS = 30 * 60_000; // the check-in popup shows from 30 min before the start...
export const POPUP_OUT_BEFORE_MS = 15 * 60_000; // ...and the check-out popup from 15 min before the end

/** Which check the app should prompt for right now: "in", "out" or null. Aged care check-outs are automatic. */
export function dueCheck(s: ShiftForCheck & { kind: "ndis" | "residential" }, now = Date.now()): "in" | "out" | null {
  if (s.cancelled || !s.start_at || !s.end_at) return null;
  const start = s.start_at.getTime();
  const end = s.end_at.getTime();
  if (!s.attend_start) return now >= start - POPUP_IN_BEFORE_MS && now <= end ? "in" : null;
  if (!s.attend_end && s.kind === "ndis") return now >= end - POPUP_OUT_BEFORE_MS && now <= end + CHECK_OUT_LATE_MS ? "out" : null;
  return null;
}

/** Which check button the shift card shows: check in from 30 min before the start until the end; check out (NDIS only) once checked in. */
export function checkButton(s: ShiftForCheck & { kind: "ndis" | "residential" }, now = Date.now()): "in" | "out" | null {
  if (s.cancelled || !s.start_at || !s.end_at) return null;
  if (!s.attend_start) return now >= s.start_at.getTime() - CHECK_IN_EARLY_MS && now <= s.end_at.getTime() ? "in" : null;
  if (s.kind === "ndis" && !s.attend_end && now <= s.end_at.getTime() + CHECK_OUT_LATE_MS) return "out";
  return null;
}

/** True on the shift's date (Melbourne), or while an overnight shift is still running. */
export function onShiftDay(s: { day: string; start_at: Date | null; end_at: Date | null }, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return today === s.day || (s.start_at != null && s.end_at != null && now >= s.start_at && now <= s.end_at);
}

const melbDayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Progress notes can only be written on the day of the shift (for an overnight shift, also the day it ends). */
export function noteOpen(s: { day: string; end_at: Date | null }, now = new Date()) {
  const today = melbDayOf(now);
  return today === s.day || (s.end_at != null && today === melbDayOf(s.end_at));
}
export const NOTE_CLOSED = "Progress notes can only be written on the day of the shift.";
