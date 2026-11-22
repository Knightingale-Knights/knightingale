// Progress notes carers email to care@knightingale.com.au. A Gmail rule forwards them to Postmark,
// which posts them to /api/inbound/progress-note. We match the sender to a carer, let Claude pick
// the shift and pull out the note, then save it like a note written in the app.
import { sql } from "@/lib/db";
import { sendPlainEmail } from "@/lib/postmark";
import { addDays } from "@/lib/roster/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { myShiftsBetween, submitNote, type CarerShift } from "./data";

const OFFICE = "care@knightingale.com.au";
const PAUL = "paul@knightingale.com.au";
const LOOK_BACK_DAYS = 45;

export type InboundAttachment = { name: string; contentType: string; content: string }; // content is base64
export type InboundEmail = { from: string; fromName: string; subject: string; text: string; date: string; attachments: InboundAttachment[] };
export type InboundResult = { status: "created" | "ignored" | "unmatched" | "forwarded"; detail: string };

type Pick = { is_progress_note: boolean; shift_id: string | null; summary: string; comms: string; reason: string };

const clock = (hhmm: number | null) => {
  if (hhmm == null) return "?";
  const h = Math.floor(hhmm / 100), m = hhmm % 100;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const shiftLine = (s: CarerShift) =>
  `${s.id} | ${dayLabel(s.day)} | ${clock(s.start_time)}-${clock(s.end_time)} | ${s.participant_name ?? "?"} | note already submitted: ${s.note_submitted ? "yes" : "no"}`;

/** Plain text from an HTML body, for emails sent without a text part. */
export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}

async function pickShift(mail: InboundEmail, carerName: string, shifts: CarerShift[]): Promise<Pick | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const files = mail.attachments.flatMap((a) =>
    a.contentType === "application/pdf" ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.content } }]
    : /^image\/(png|jpeg|gif|webp)$/.test(a.contentType) ? [{ type: "image", source: { type: "base64", media_type: a.contentType, data: a.content } }]
    : []);
  const prompt = `A carer, ${carerName}, emailed this to Knightingale (an NDIS support agency).
Sent: ${mail.date}
Subject: ${mail.subject}

Email body:
${mail.text.slice(0, 30000) || "(empty, see attachments)"}

The carer's NDIS shifts around that time (id | date | time | participant | note already submitted):
${shifts.map(shiftLine).join("\n") || "(none)"}

Decide if this is a progress note for one of those shifts. If it is, pick the shift by participant and date (and time if needed).
Only pick a shift you are sure of. If the date or participant doesn't clearly match exactly one shift, return shift_id null and say why.
summary: the progress note itself, word for word as the carer wrote it (from the body or attachments), without greetings, sign-offs, signatures or forwarding headers.
comms: any communication with family, coordinators or other services mentioned, or "Nothing to report."`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 8000,
      tools: [{
        name: "record_note",
        description: "Records which shift the emailed progress note is for.",
        input_schema: {
          type: "object",
          properties: {
            is_progress_note: { type: "boolean" },
            shift_id: { type: ["string", "null"] },
            summary: { type: "string" },
            comms: { type: "string" },
            reason: { type: "string", description: "One short sentence: why this shift, or why none." },
          },
          required: ["is_progress_note", "shift_id", "summary", "comms", "reason"],
        },
      }],
      tool_choice: { type: "tool", name: "record_note" },
      messages: [{ role: "user", content: [...files, { type: "text", text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { content?: { type: string; input?: Pick }[] };
  return j.content?.find((b) => b.type === "tool_use")?.input ?? null;
}

const tell = (subject: string, text: string, to = OFFICE) => sendPlainEmail({ to, subject, text, attachments: [] });

/** Handles one inbound email. Never throws for a bad email: it tells the office instead. */
export async function handleEmailedNote(mail: InboundEmail): Promise<InboundResult> {
  const from = mail.from.trim().toLowerCase();

  // Gmail checks a new forwarding address by emailing it a confirmation link: pass that on to Paul.
  if (from === "forwarding-noreply@google.com" || /forwarding confirmation/i.test(mail.subject)) {
    await tell(mail.subject || "Gmail forwarding confirmation", mail.text, PAUL);
    return { status: "forwarded", detail: "Gmail forwarding confirmation sent to Paul" };
  }

  const [carer] = await sql<{ id: string; name: string }[]>`
    select id, coalesce(nullif(trim(concat_ws(' ', first_name, last_name)), ''), email) as name
      from app.users where lower(trim(email)) = ${from} and account_type = 'carer' limit 1`;
  if (!carer) return { status: "ignored", detail: `not from a carer (${from})` }; // still in the care@ inbox as usual

  const today = isoDate(new Date());
  const shifts = (await myShiftsBetween(carer.id, addDays(today, -LOOK_BACK_DAYS), addDays(today, 2)))
    .filter((s) => s.kind === "ndis" && !s.cancelled);
  const pick = await pickShift(mail, carer.name, shifts);
  const where = `\n\nEmail: "${mail.subject}" from ${carer.name} (${from}), sent ${mail.date}.`;
  if (!pick) {
    await tell(`Emailed progress note not added: ${carer.name}`, `The progress note couldn't be read automatically. Please add it by hand.${where}`);
    return { status: "unmatched", detail: "no reading" };
  }
  if (!pick.is_progress_note) return { status: "ignored", detail: `not a progress note: ${pick.reason}` };

  const shift = shifts.find((s) => s.id === pick.shift_id);
  const problem = !shift ? `It couldn't be matched to one of their shifts: ${pick.reason}`
    : shift.note_submitted ? `${shift.participant_name ?? "The participant"}'s shift on ${dayLabel(shift.day)} already has a progress note.`
    : pick.summary.trim().length < 20 ? "The note was too short to save." : null;
  if (problem || !shift) {
    await tell(`Emailed progress note not added: ${carer.name}`, `${problem}\n\nPlease add it by hand.${where}`);
    return { status: "unmatched", detail: problem ?? "no shift" };
  }

  try {
    await submitNote(carer.id, shift.id, pick.summary.trim().slice(0, 8000), { comms: pick.comms, anyDate: true });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    await tell(`Emailed progress note not added: ${carer.name}`, `${msg}\n\nPlease add it by hand.${where}`);
    return { status: "unmatched", detail: msg };
  }
  await tell(
    `Progress note added: ${carer.name} for ${shift.participant_name ?? "participant"}, ${dayLabel(shift.day)}`,
    `${carer.name}'s emailed progress note was saved and linked to the ${clock(shift.start_time)}-${clock(shift.end_time)} shift with ${shift.participant_name ?? "the participant"} on ${dayLabel(shift.day)}.${shift.participant ? `\n\nhttps://knightingale.com.au/participants/${shift.participant}` : ""}${where}`,
  );
  return { status: "created", detail: shift.id };
}
