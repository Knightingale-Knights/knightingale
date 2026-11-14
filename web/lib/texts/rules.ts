// Carer text rules, copied from CarerTexts so the timings and wording stay the same.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TZ = "Australia/Melbourne";
const MIN = 60_000;
const HOUR = 60 * MIN;

export type TextKind = "checkin" | "checkout" | "notes_1" | "notes_2" | "notes_3";
export type Track = "ndis" | "residential";
export type Job = { kind: TextKind; at: number; until: number };

/** Australian numbers to E.164. Null if it does not look like a number. */
export function normalizePhone(raw: string | null | undefined) {
  if (!raw) return null;
  const s = String(raw).replace(/[\s()\-.]/g, "");
  if (/^\+\d{8,15}$/.test(s)) return s;
  if (/^0\d{9}$/.test(s)) return "+61" + s.slice(1);
  if (/^61\d{9}$/.test(s)) return "+" + s;
  if (/^4\d{8}$/.test(s)) return "+61" + s;
  return null;
}

/** The ways a number may be typed in a profile, for matching an incoming text to a carer. */
export function phoneVariants(raw: string) {
  const e164 = normalizePhone(raw);
  if (!e164) return [];
  const out = new Set([e164]);
  if (e164.startsWith("+61")) {
    const local = e164.slice(3);
    out.add("0" + local).add("61" + local).add(local);
  }
  return [...out];
}

export const firstWord = (name: string | null | undefined) => String(name ?? "").trim().split(/\s+/)[0] ?? "";

const offsetMs = (utc: number) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
      .formatToParts(new Date(utc)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(utc / MIN) * MIN;
};

/** A Melbourne wall-clock time on a day ("YYYY-MM-DD", plus extra days) as a UTC instant. */
export function melbAt(day: string, hour: number, minute: number, plusDays = 0) {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d + plusDays, hour, minute);
  const first = guess - offsetMs(guess);
  return guess - offsetMs(first);
}

const hhmm = (ms: number) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).format(new Date(ms)).replace(":", "");

/** The texts for one shift. `at` is when it is due, `until` the last moment it is still worth sending. */
export function jobsFor(day: string, start: number, end: number, notes2 = false): Job[] {
  const jobs: Job[] = [
    { kind: "checkin", at: start - 15 * MIN, until: start },
    { kind: "checkout", at: end, until: end + 3 * HOUR },
  ];
  const notes: [TextKind, number][] = [
    ["notes_1", melbAt(day, 22, 0)],
    ["notes_2", melbAt(day, 10, 0, 1)],
    ["notes_3", melbAt(day, 20, 0, 1)],
  ];
  for (const [kind, at] of notes) {
    if (kind === "notes_2" && !notes2) continue; // paused, as in CarerTexts (NOTES_2_ENABLED)
    if (at >= end + 30 * MIN) jobs.push({ kind, at, until: at + 2 * HOUR });
  }
  return jobs;
}

export const dueJobs = (day: string, start: number, end: number, now: number, notes2 = false) =>
  jobsFor(day, start, end, notes2).filter((j) => now >= j.at && now < j.until);

export type MessageCtx = { firstName: string | null; track: Track; participant: string | null; place: string | null; start: number; end: number; link?: string };

/** Plain ASCII on purpose (no emoji or curly quotes) so each text stays in the cheaper SMS encoding.
 *  Uses the CarerTexts wording, falling back to shorter wording when a long name would push it past one segment. */
export function buildMessage(kind: TextKind, c: MessageCtx): string | null {
  const name = firstWord(c.firstName);
  const hi = name ? `Hi ${name}` : "Hi";
  let options: string[];
  if (c.track === "ndis") {
    const who = firstWord(c.participant) || "your participant";
    if (kind === "checkin") options = [`${hi}, have a great time with ${who}! Check in when you arrive: ${c.link}`, `${hi}, check in when you arrive: ${c.link}`];
    else if (kind === "checkout") options = [`${hi}, hope the shift with ${who} went well. Please check out here: ${c.link}`, `${hi}, please check out here: ${c.link}`];
    else {
      const when = kind === "notes_1" ? "today" : "yesterday";
      options = [
        `${hi}, a gentle reminder you haven't submitted a progress note for your ${hhmm(c.start)} - ${hhmm(c.end)} shift with ${who} ${when}.`,
        `${hi}, a reminder to submit your progress note for ${who} ${when}.`,
      ];
    }
  } else {
    const place = c.place || "your shift address";
    if (kind === "checkin") options = [`${hi}, have a great time at ${place}! Check in when you arrive: ${c.link}`, `${hi}, check in when you arrive at ${place}: ${c.link}`, `${hi}, check in when you arrive: ${c.link}`];
    else if (kind === "checkout") options = [`${hi}, hope your shift at ${place} went well. Please check out here: ${c.link}`, `${hi}, please check out of ${place} here: ${c.link}`, `${hi}, please check out here: ${c.link}`];
    else return null; // aged care carers do not get progress note reminders
  }
  return options.find(isOneSegment) ?? options[options.length - 1];
}

/** GSM-7 texts fit 160 characters in one segment (Twilio bills per segment). */
export const isOneSegment = (body: string) => body.length <= 160 && /^[\x20-\x7e\n]*$/.test(body);

// ---- links ------------------------------------------------------------------
// Token: i|o + the shift uuid as 22 base64url characters + "." + 8 character signature (32 in all).

const mac = (secret: string, head: string) => createHmac("sha256", secret).update(head).digest().subarray(0, 6).toString("base64url");

export function signLink(secret: string, shiftId: string, kind: "in" | "out") {
  if (!secret) throw new Error("LINK_SECRET is not set");
  const hex = shiftId.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error("bad shift id");
  const head = (kind === "in" ? "i" : "o") + Buffer.from(hex, "hex").toString("base64url");
  return `${head}.${mac(secret, head)}`;
}

export function verifyLink(secret: string, token: string): { shiftId: string; kind: "in" | "out" } | null {
  if (!secret || typeof token !== "string") return null;
  const m = /^([io])([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{8})$/.exec(token);
  if (!m) return null;
  const a = Buffer.from(m[3]);
  const b = Buffer.from(mac(secret, m[1] + m[2]));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const h = Buffer.from(m[2], "base64url").toString("hex");
  if (h.length !== 32) return null;
  return { shiftId: `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`, kind: m[1] === "i" ? "in" : "out" };
}

/** A check-in link works until 6 hours after the start, a check-out link until 24 hours after the end. */
export const linkExpired = (kind: "in" | "out", start: number, end: number, now: number) =>
  now > (kind === "in" ? start + 6 * HOUR : end + 24 * HOUR);
