// The Supports Summary: Claude drafts it from the participant's recent progress notes and we
// email it as a PDF. Moved here from the support-summary service (same prompt and layout),
// so it reads progress notes from our database instead of Bubble.
import { sql } from "@/lib/db";
import { sendPlainEmail } from "@/lib/postmark";
import { supportSummaryPdf } from "@/lib/pdf";

const SYSTEM_PROMPT = `You are drafting an NDIS participant support summary for Knightingale, a care staffing agency.
You will be given a participant's name, support type and setting, and a set of dated progress notes covering a reporting period.
Determine the length of that period only from the actual dates of the notes provided — never assume or state a fixed duration (e.g. do not say "three months" unless the notes actually span that long).
Write a professional, warm support summary in the same structure as Knightingale's existing template.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:

{
  "overview": "1-2 sentence overview paragraph",
  "sessions": [ { "date": "DD/MM", "summary": "1-2 sentence session summary" } ],
  "summaryOfWork": [ { "heading": "Theme heading", "body": "1-3 sentence paragraph" } ],
  "keyObservations": [ "short observation" ],
  "recommendations": [ "short recommendation" ]
}

Guidelines:
- Use only information present in the notes. Do not invent events, names, or clinical claims.
- The "sessions" array must contain exactly one entry per note provided, in the same order as given. Never merge two notes into one entry, and never skip a note.
- Group summaryOfWork into 3-5 sensible themes drawn from the actual notes (e.g. community access, social engagement, wellbeing, relationships), not a fixed list.
- keyObservations and recommendations should be grounded in patterns actually visible across the notes.
- Keep language plain and person-centred.`;

type Note = { date: Date; summary: string };
const auDate = (d: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne" }).format(d);

async function draft(participantName: string, supportType: string, setting: string, notes: Note[]) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY isn't set.");
  const user = `Participant: ${participantName}
Support type: ${supportType || "Not specified"}
Setting: ${setting || "Not specified"}
Number of notes: ${notes.length}

Progress notes:
${notes.map((n) => `${auDate(n.date)}: ${n.summary}`).join("\n")}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: 32000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = (data.content ?? []).find((b: { type: string }) => b.type === "text")?.text ?? "";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("The summary came back in the wrong shape. Please try again.");
  }
}

/** Drafts the participant's summary from the last months of progress notes, or from one calendar month
 *  (month = "YYYY-MM-01", Melbourne time). Returns the PDF and the period it covers. */
export async function buildSummary(participant: string, monthsBack = 1, month?: string) {
  const [p] = await sql<{ first: string | null; full: string | null; setting: string | null; support: string | null }[]>`
    select coalesce(nullif(trim(u.first_name), ''), 'Participant') as first, trim(concat_ws(' ', u.first_name, u.last_name)) as full,
           u.current_location->>'address' as setting,
           (select string_agg(o.display, ', ') from app.intakes i join app.option_values o on o.set_key = 'service_required' and o.value = any(i.services)
             where i.id = u.intake_form) as support
      from app.users u where u.id = ${participant}`;
  if (!p) throw new Error("That participant no longer exists.");
  const notes = await sql<Note[]>`
    select coalesce(date, created_at) as date, summary from app.progress_notes
     where participant = ${participant} and nullif(trim(summary), '') is not null
       and ${month
         ? sql`coalesce(date, created_at) >= (${month}::date)::timestamp at time zone 'Australia/Melbourne'
               and coalesce(date, created_at) < ((${month}::date) + interval '1 month')::timestamp at time zone 'Australia/Melbourne'`
         : sql`coalesce(date, created_at) > now() - make_interval(months => ${monthsBack})`}
     order by coalesce(date, created_at)`;
  const first = (p.first ?? "Participant").split(/\s+/)[0];
  if (!notes.length) throw new Error(`There are no recent progress notes for ${first} yet, so there's nothing to summarise.`);
  const content = await draft(p.first ?? "Participant", p.support ?? "", p.setting ?? "", notes);
  const reportPeriod = `${auDate(notes[0].date)} - ${auDate(notes[notes.length - 1].date)}`;
  const base64 = await supportSummaryPdf({ participantName: p.first ?? "Participant", reportPeriod, content });
  return {
    first, full: p.full || first, reportPeriod,
    attachment: { Name: `${(p.first ?? "Participant").replace(/\s+/g, "_")}_Supports_Summary.pdf`, Content: base64, ContentType: "application/pdf" },
  };
}

/** Carer: "Request Jan's summary" from a shift, emailed to the carer with a copy to Paul. */
export async function requestSummary(carer: { id: string; email: string; name: string }, shiftId: string) {
  const [s] = await sql<{ participant: string | null }[]>`select participant from app.shifts where id = ${shiftId} and carer = ${carer.id}`;
  if (!s?.participant) throw new Error("We couldn't find this shift.");
  if (!carer.email) throw new Error("We don't have an email address for you.");
  const { first, full, reportPeriod, attachment } = await buildSummary(s.participant);
  const [me] = await sql<{ full: string | null }[]>`select nullif(trim(concat_ws(' ', first_name, last_name)), '') as full from app.users where id = ${carer.id}`;
  const carerName = me?.full || carer.name || carer.email;
  await sendPlainEmail({
    to: carer.email,
    subject: `${first}'s support summary`,
    text: `Hi ${carer.name.split(" ")[0] || "there"},\n\nAttached is ${first}'s support summary (${reportPeriod}). We hope it helps on your shift.\n\nIf you have any suggestions on how to make it better, please email care@knightingale.com.au.\n\nKnightingale`,
    attachments: [attachment],
  });
  // Let Paul know who asked (a copy of the summary is attached).
  const copyTo = process.env.SUMMARY_COPY_TO ?? "paul@knightingale.com.au";
  await sendPlainEmail({
    to: copyTo,
    subject: `${carerName} requested a support summary about ${full}`,
    text: `${carerName} requested a support summary about ${full}.\n\nIt covers ${reportPeriod} and was sent to ${carer.email}. A copy is attached.`,
    attachments: [attachment],
  }).catch((e) => console.error("summary copy failed", e));
  return first;
}

/** Admin: emails the participant's support summary to the person asking (Bubble's Summary button). */
export async function emailSummaryTo(participant: string, to: string) {
  const { first, reportPeriod, attachment } = await buildSummary(participant);
  await sendPlainEmail({ to, subject: `${first}'s support summary`, text: `Attached is ${first}'s support summary (${reportPeriod}).`, attachments: [attachment] });
  return `${first}'s summary is on its way to ${to}.`;
}
