// Monthly support summaries (Bubble's monthly scheduled workflow): on the 1st, each participant with progress notes
// last month gets their Supports Summary PDF drafted and emailed to their support coordinator. Worked through a few
// at a time, so every run stays well inside the function time limit.
import { sql } from "@/lib/db";
import { sendPlainEmail } from "@/lib/postmark";
import { buildSummary } from "@/lib/carer/summary";

const BATCH = 4;
const PAUL = "paul@knightingale.com.au";

/** Paul gets a copy of the first month's summaries (November 2026, sent 1 Dec), and later only if MONTHLY_SUMMARY_COPY=yes. */
const copyToPaul = (month: string) => month === "2026-11-01" || process.env.MONTHLY_SUMMARY_COPY === "yes";

const monthName = (month: string) =>
  new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`));

/** The month just finished, as "YYYY-MM-01" (Melbourne). */
export function lastMonth(now = new Date()) {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit" }).format(now).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 10);
}

/** Adds every participant with progress notes in that month and a coordinator with an email (once). */
export async function queueMonth(month: string) {
  await sql`
    insert into app.monthly_summaries (participant, month, coordinator)
    select distinct p.id, ${month}::date, p.coordinator_2
      from app.progress_notes n
      join app.users p on p.id = n.participant
      join app.users c on c.id = p.coordinator_2 and nullif(trim(c.email), '') is not null
     where nullif(trim(n.summary), '') is not null
       and coalesce(n.date, n.created_at) >= (${month}::date)::timestamp at time zone 'Australia/Melbourne'
       and coalesce(n.date, n.created_at) < ((${month}::date) + interval '1 month')::timestamp at time zone 'Australia/Melbourne'
    on conflict do nothing`;
}

/** Drafts and sends the next few. Returns how many were sent and how many are still to go. */
export async function sendBatch(month: string) {
  const rows = await sql<{ participant: string; coordinator: string }[]>`
    update app.monthly_summaries m set claimed_at = now(), attempts = m.attempts + 1
     where (m.participant, m.month) in (
       select participant, month from app.monthly_summaries
        where month = ${month}::date and sent_at is null and attempts < 3
          and (claimed_at is null or claimed_at < now() - interval '10 minutes')
        order by participant limit ${BATCH} for update skip locked)
    returning m.participant, m.coordinator`;
  let sent = 0;
  await Promise.all(rows.map(async (r) => {
    try {
      const [c] = await sql<{ email: string; first: string | null }[]>`
        select trim(email) as email, nullif(trim(first_name), '') as first from app.users where id = ${r.coordinator}`;
      if (!c?.email) throw new Error("The coordinator has no email address.");
      const { full, attachment } = await buildSummary(r.participant, 1, month);
      const period = monthName(month);
      await sendPlainEmail({
        to: c.email,
        subject: `${full}'s support summary, ${period}`,
        text: `Hi ${c.first ?? "there"},\n\nAttached is ${full}'s support summary for ${period}, drawn from their carers' progress notes.\n\nIf you have any questions, please reply or email care@knightingale.com.au.\n\nKnightingale`,
        attachments: [attachment],
      });
      if (copyToPaul(month)) {
        await sendPlainEmail({
          to: PAUL,
          subject: `Copy: ${full}'s support summary, ${period}`,
          text: `This is the copy of ${full}'s ${period} support summary that was sent to ${c.email}.`,
          attachments: [attachment],
        }).catch((e) => console.error("monthly summary copy failed", e));
      }
      await sql`update app.monthly_summaries set sent_at = now(), error = null where participant = ${r.participant} and month = ${month}::date`;
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sql`update app.monthly_summaries set error = ${msg.slice(0, 500)}, claimed_at = null where participant = ${r.participant} and month = ${month}::date`;
    }
  }));
  const [left] = await sql<{ n: number }[]>`
    select count(*)::int as n from app.monthly_summaries where month = ${month}::date and sent_at is null and attempts < 3`;
  return { sent, left: left.n };
}
