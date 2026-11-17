// Works out which carer texts are due, sends each once, and answers Klarra's requests for links.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { melbDay } from "@/lib/roster/queries";
import { buildMessage, dueJobs, normalizePhone, phoneVariants, signLink, type TextKind, type Track } from "./rules";
import { sendSms, type Sender } from "./sms";

const MIN = 60_000;
const HOUR = 60 * MIN;

const startAt = `((s.date at time zone 'Australia/Melbourne') + make_interval(hours => (s.start_time / 100)::int, mins => (s.start_time % 100)::int)) at time zone 'Australia/Melbourne'`;
const endAt = `((s.date at time zone 'Australia/Melbourne') + make_interval(days => case when s.end_time <= s.start_time then 1 else 0 end, hours => (s.end_time / 100)::int, mins => (s.end_time % 100)::int)) at time zone 'Australia/Melbourne'`;

export type TextShift = {
  id: string; day: string; start_at: Date; end_at: Date; track: Track; carer: string; first_name: string | null; phone: string | null;
  participant: string | null; place: string | null; attend_start: Date | null; attend_end: Date | null; has_note: boolean;
};

const select = () => sql`
  s.id, ${melbDay("s.date")} as day, ${sql.unsafe(startAt)} as start_at, ${sql.unsafe(endAt)} as end_at,
  case when s.participant is null then 'residential' else 'ndis' end as track,
  s.carer, c.first_name, c.phone_number as phone, p.first_name as participant,
  coalesce(l.name, s.address->>'address') as place, s.attend_start, s.attend_end,
  (s.progress_note is not null or exists (select 1 from app.progress_notes pn where pn.shift = s.id and (pn.submit or coalesce(length(trim(pn.summary)), 0) > 0))) as has_note`;

const joins = () => sql`
  join app.users c on c.id = s.carer
  left join app.users p on p.id = s.participant
  left join app.locations l on l.id = s.location`;

const open = () => sql`not coalesce(s.cancelled, false) and s.carer is not null and s.date is not null and s.start_time is not null and s.end_time is not null`;

/** Shifts that may have a text due now: started up to two days ago, or starting within the hour. */
async function candidates(now: Date) {
  return sql<TextShift[]>`
    select ${select()} from app.shifts s ${joins()}
     where ${open()} and s.date >= ${new Date(now.getTime() - 3 * 24 * HOUR)} and s.date <= ${new Date(now.getTime() + 24 * HOUR)}`;
}

const link = (id: string, kind: "in" | "out") => `${env.publicBaseUrl}/c/${signLink(env.linkSecret, id, kind)}`;

function skip(kind: TextKind, s: TextShift) {
  if (kind === "checkin") return Boolean(s.attend_start);
  if (s.track !== "ndis") return true; // check out and progress note texts are NDIS only
  if (kind === "checkout") return Boolean(s.attend_end);
  return s.has_note;
}

export type RunSummary = { sent: number; dryRun: number; noPhone: number; failed: number; skipped: number };

/** Run every minute. Each text is claimed in text_log first, so it can never be sent twice. */
export async function runTexts(now = new Date(), send: Sender = sendSms): Promise<RunSummary> {
  const out: RunSummary = { sent: 0, dryRun: 0, noPhone: 0, failed: 0, skipped: 0 };
  for (const s of await candidates(now)) {
    for (const job of dueJobs(s.day, s.start_at.getTime(), s.end_at.getTime(), now.getTime(), env.notes2Enabled)) {
      if (skip(job.kind, s)) { out.skipped++; continue; }
      const kindLink = job.kind === "checkin" ? "in" : job.kind === "checkout" ? "out" : null;
      const body = buildMessage(job.kind, {
        firstName: s.first_name, track: s.track, participant: s.participant, place: s.place,
        start: s.start_at.getTime(), end: s.end_at.getTime(), link: kindLink ? link(s.id, kindLink) : undefined,
      });
      if (!body) { out.skipped++; continue; }
      const phone = normalizePhone(s.phone);
      if (env.onlyPhone && phone !== normalizePhone(env.onlyPhone)) { out.skipped++; continue; } // test switch: nothing logged
      const [claim] = await sql<{ id: number }[]>`
        insert into app.text_log (shift, kind, carer, phone, body, status)
        values (${s.id}, ${job.kind}, ${s.carer}, ${phone}, ${body}, ${phone ? "claimed" : "no_phone"})
        on conflict (shift, kind) do nothing returning id`;
      if (!claim) continue; // already handled
      if (!phone) { out.noPhone++; continue; }
      try {
        const r = await send(phone, body);
        await sql`update app.text_log set status = ${r.dryRun ? "dry_run" : "sent"}, twilio_sid = ${r.sid}, sent_at = now() where id = ${claim.id}`;
        if (r.dryRun) out.dryRun++; else out.sent++;
      } catch (e) {
        await sql`update app.text_log set status = 'failed', error = ${String((e as Error).message ?? e)} where id = ${claim.id}`;
        out.failed++;
      }
    }
  }
  return out;
}

// ---- links for Klarra ------------------------------------------------------

const NOT_FOUND = "Sorry, I can't see a shift you're on right now. Please call Paul.";
const NOT_FOUND_IN = "Sorry, I can't see a shift you're about to start. Please call Paul.";
export const ALREADY_IN = "You're already checked in. Text me when you're done and I'll send your check out link.";

async function shiftsForPhone(raw: string, now: Date) {
  const variants = phoneVariants(raw);
  if (!variants.length) return [];
  return sql<TextShift[]>`
    select ${select()} from app.shifts s ${joins()}
     where ${open()} and regexp_replace(coalesce(c.phone_number, ''), '[\\s().-]', '', 'g') in ${sql(variants)}
       and s.date >= ${new Date(now.getTime() - 2 * 24 * HOUR)} and s.date <= ${new Date(now.getTime() + 24 * HOUR)}`;
}

/** The shift the carer is on now and has not checked out of. Checked-in shifts first. */
function openShift(list: TextShift[], now: number) {
  return list
    .filter((s) => !s.attend_end && now >= s.start_at.getTime() - 60 * MIN && now <= s.end_at.getTime() + 3 * HOUR)
    .sort((a, b) => Number(Boolean(b.attend_start)) - Number(Boolean(a.attend_start)) || b.start_at.getTime() - a.start_at.getTime())[0];
}

/** The shift the carer is about to start, or has started, and has not checked in to. Closest start wins. */
function upcomingShift(list: TextShift[], now: number) {
  return list
    .filter((s) => !s.attend_start && now >= s.start_at.getTime() - 60 * MIN && now <= s.end_at.getTime())
    .sort((a, b) => Math.abs(a.start_at.getTime() - now) - Math.abs(b.start_at.getTime() - now))[0];
}

export type Reply = { found: boolean; shiftId?: string; message: string };
const hi = (s: TextShift) => (firstWord(s.first_name) ? `Hi ${firstWord(s.first_name)}` : "Hi");
const firstWord = (n: string | null) => String(n ?? "").trim().split(/\s+/)[0] ?? "";

/** Klarra calls this for a carer's text. intent: checkin, checkout or auto (decided by the shift). */
export async function linkReply(phone: string, intent: "checkin" | "checkout" | "auto", now = new Date()): Promise<Reply> {
  const list = await shiftsForPhone(phone, now);
  const t = now.getTime();
  const outReply = (s: TextShift): Reply => ({ found: true, shiftId: s.id, message: `${hi(s)}, here is your check out link: ${link(s.id, "out")}` });
  const inReply = (s: TextShift): Reply => ({ found: true, shiftId: s.id, message: `${hi(s)}, here is your check in link: ${link(s.id, "in")}` });
  const o = openShift(list, t);
  const u = upcomingShift(list, t);
  if (intent === "checkout") return o ? outReply(o) : { found: false, message: NOT_FOUND };
  if (intent === "checkin") {
    if (u) return inReply(u);
    if (o?.attend_start) return { found: true, shiftId: o.id, message: ALREADY_IN };
    return { found: false, message: NOT_FOUND_IN };
  }
  if (o?.attend_start) return outReply(o);
  if (u) return inReply(u);
  if (o) return outReply(o);
  return { found: false, message: NOT_FOUND };
}

/** The shift behind a check-in or check-out link. */
export async function shiftForLink(id: string) {
  const [s] = await sql<(TextShift & { cancelled: boolean; address_text: string | null; start_time: number; end_time: number })[]>`
    select ${select()}, coalesce(s.cancelled, false) as cancelled, s.address->>'address' as address_text, s.start_time, s.end_time
      from app.shifts s ${joins()} where s.id = ${id}`;
  return s ?? null;
}
