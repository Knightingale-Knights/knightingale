// The weekly roster email to a participant's support coordinator (rebuilt from the Roster repo).
import { createRequire } from "node:module";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { addDays } from "./rules";
import { fromDay, melbDay } from "./queries";

const require = createRequire(import.meta.url);
const doc = require("../pdf/rosterDoc.cjs") as {
  buildPdf: (p: unknown, s: unknown[], range: string, stats: unknown) => Promise<Buffer>;
  buildEmailHtml: (p: unknown, s: unknown[], range: string, stats: unknown) => string;
  fmtTimeRange: (a: number | null, b: number | null) => string;
};

import { MONTHS, WEEKDAYS, parts, nextMonday, weekRangeText } from "./week";
export { nextMonday, weekRangeText };

export type WeeklyRoster = {
  participant: { name: string; ndisNumber: string | null; email: string | null; coordinatorEmail: string | null };
  weekStart: string;
  shifts: { day: string; weekday: string; dayMonth: string; timeRange: string; carer: string | null; hours: number | null }[];
  stats: { totalHoursText: string; shiftCount: number; carerCount: number };
};

export async function weeklyRoster(participantId: string, weekStart: string): Promise<WeeklyRoster | null> {
  const [p] = await sql<{ name: string; ndis_number: string | null; email: string | null; coordinator_email: string | null }[]>`
    select trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.ndis_number, u.email, c.email as coordinator_email
      from app.users u left join app.users c on c.id = u.coordinator
     where u.id = ${participantId} and u.account_type = 'participant'`;
  if (!p) return null;
  const rows = await sql<{ day: string; start_time: number | null; end_time: number | null; hours: number | null; carer: string | null }[]>`
    select ${melbDay("s.date")} as day, s.start_time, s.end_time, s.hours,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer
      from app.shifts s left join app.users c on c.id = s.carer
     where s.participant = ${participantId} and not coalesce(s.cancelled, false)
       and s.date >= ${fromDay(weekStart)} and s.date < ${fromDay(addDays(weekStart, 7))}
     order by s.date, s.start_time nulls last`;
  const shifts = rows.map((r) => {
    const x = parts(r.day);
    return { day: r.day, weekday: WEEKDAYS[x.dow], dayMonth: `${x.d} ${MONTHS[x.m - 1]}`, timeRange: doc.fmtTimeRange(r.start_time, r.end_time), carer: r.carer, hours: r.hours };
  });
  const total = shifts.reduce((a, s) => a + (Number(s.hours) || 0), 0);
  const stats = {
    totalHoursText: Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/\.?0+$/, ""),
    shiftCount: shifts.length,
    carerCount: new Set(shifts.map((s) => s.carer).filter(Boolean)).size,
  };
  return { participant: { name: p.name, ndisNumber: p.ndis_number, email: p.email, coordinatorEmail: p.coordinator_email }, weekStart, shifts, stats };
}

export class RosterEmailError extends Error {}

/** Emails the roster to the coordinator (or the participant if they have no coordinator), with the PDF attached. */
export async function sendWeeklyRoster(participantId: string, weekStart = nextMonday(), to?: string) {
  const r = await weeklyRoster(participantId, weekStart);
  if (!r) throw new RosterEmailError("That participant no longer exists.");
  const recipient = (to || r.participant.coordinatorEmail || r.participant.email || "").trim();
  if (!recipient) throw new RosterEmailError(`${r.participant.name} has no coordinator or email to send the roster to.`);
  const range = weekRangeText(weekStart);
  const shifts = r.shifts.map((s) => ({ ...s, carer: s.carer ?? "TBC", hours: s.hours ?? "" }));
  const who = { name: r.participant.name, ndisNumber: r.participant.ndisNumber };
  const [pdf, html] = await Promise.all([doc.buildPdf(who, shifts, range, r.stats), Promise.resolve(doc.buildEmailHtml(who, shifts, range, r.stats))]);
  const a = parts(weekStart);
  const b = parts(addDays(weekStart, 6));
  const subject = `Weekly roster — ${r.participant.name} — ${a.d} ${MONTHS[a.m - 1]} to ${b.d} ${MONTHS[b.m - 1]}`;
  if (!env.postmarkToken) throw new RosterEmailError("POSTMARK_TOKEN is not set");
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": env.postmarkToken },
    body: JSON.stringify({
      From: env.fromEmail, To: recipient, Subject: subject, HtmlBody: html, MessageStream: "outbound",
      Attachments: [{ Name: `Knightingale_Roster_${r.participant.name.replace(/\s+/g, "-")}_${weekStart}.pdf`, Content: pdf.toString("base64"), ContentType: "application/pdf" }],
    }),
  });
  if (!res.ok) throw new RosterEmailError(`Postmark ${res.status}: ${((await res.json().catch(() => ({}))) as { Message?: string }).Message ?? "send failed"}`);
  return { to: recipient, subject, shifts: r.shifts.length };
}
