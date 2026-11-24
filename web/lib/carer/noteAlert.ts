// Escalation check for every progress note (what Bubble's "progress note ai is called" workflow did).
// The note goes to the same progress-notes endpoint, so the same alert rules apply. The result is saved
// on the note; an "alert" emails Paul's copy (care@) with the note attached as a PDF.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail, sendTemplateWith, templateInfo } from "@/lib/postmark";
import { notePdf } from "@/lib/pdf";

const ENDPOINT = process.env.PROGRESS_NOTE_AI_URL ?? "https://progress-notes.vercel.app/api/analyze-progress-note";
const ALERT_TO = process.env.NOTE_ALERT_EMAIL ?? "care@knightingale.com.au";
/** Bubble's "Progress Notes" Postmark template. */
const NOTE_TEMPLATE = Number(process.env.POSTMARK_NOTE_TEMPLATE_ID ?? 41115884);

export type AiResult = { status: "alert" | "routine" | "no_contact"; summary_bullets: string[]; reasoning?: string };

type NoteRow = {
  id: string; summary: string | null; comms: string | null; best_day: string | null; date: Date | null;
  participant: string | null; carer: string | null;
};

/** What the AI reads: the summary, plus the communication book when there is something in it. */
export function noteText(n: { summary: string | null; comms: string | null }) {
  const comms = (n.comms ?? "").trim();
  const quiet = !comms || /^nothing to report\.?$/i.test(comms);
  return [(n.summary ?? "").trim(), quiet ? "" : `Communication book: ${comms}`].filter(Boolean).join("\n\n");
}

/**
 * Fills the template's own variables by name: participant, carer, date, the shift summary (with
 * WHY THE ALERT WAS SENT and CARER'S WORDS, as Bubble sent it), subject, preheader and the alert reasons.
 */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The Shift Summary block. As HTML (for a {{{summary}}} slot) each reason and paragraph gets its own line. */
export function summaryBlock(summary: string, reasons: string[], html: boolean) {
  if (!html) return [`WHY THE ALERT WAS SENT: ${reasons.join(" ")}`, `CARER'S WORDS: ${summary}`].join("\n\n");
  const lines = (t: string) => esc(t.trim()).replace(/\r?\n/g, "<br>");
  return [
    "WHY THE ALERT WAS SENT:<br>" + reasons.map((r) => `- ${esc(r)}`).join("<br>"),
    "CARER'S WORDS:<br>" + lines(summary),
  ].join("<br><br>");
}

export function templateModel(vars: string[], n: { participant: string; carer: string; date: string; summary: string }, reasons: string[], mail: { subject: string; text: string }, raw: string[] = []) {
  const bodyFor = (v: string) => summaryBlock(n.summary, reasons, raw.includes(v));
  const pick = (v: string): unknown => {
    const k = v.toLowerCase();
    if (/subject|title|heading/.test(k)) return mail.subject;
    if (/preheader|preview|intro/.test(k)) return `Progress note for ${n.participant}, shift on ${n.date} with ${n.carer}.`;
    if (/reason|why|alert|bullet/.test(k)) return reasons.join(" ");
    if (/participant|client|resident/.test(k)) return n.participant;
    if (/carer|worker|staff|author|from|sender/.test(k)) return n.carer;
    if (/date|day/.test(k)) return n.date;
    if (/summary|note|body|content|words|message|text|details/.test(k)) return bodyFor(v);
    if (/company_name/.test(k)) return "Knightingale";
    if (/url|link/.test(k)) return "https://knightingale.com.au";
    return undefined;
  };
  const model: Record<string, unknown> = {};
  for (const v of vars) {
    const val = pick(v.split(".").pop() ?? v);
    if (val !== undefined) model[v.split(".")[0]] = val;
  }
  return model;
}

/** "🚨🚨 IMPORTANT: LUCIA ROMEO PROGRESS NOTE 🚨🚨" plus the plain-text body, as Bubble sent it. */
export function alertEmail(n: { participant: string; carer: string; date: string; summary: string }, reasons: string[]) {
  return {
    subject: `🚨🚨 IMPORTANT: ${n.participant.toUpperCase()} PROGRESS NOTE 🚨🚨`,
    text: [
      `Progress note for ${n.participant}, shift on ${n.date} with ${n.carer}.`,
      "",
      "WHY THE ALERT WAS SENT:",
      ...reasons.map((r) => `- ${r}`),
      "",
      "CARER'S WORDS:",
      n.summary,
      "",
      "Thank you for reading.",
    ].join("\n"),
  };
}

const dmy = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Australia/Melbourne" }).format(d) : "");

async function callAi(text: string, clientName: string): Promise<AiResult> {
  const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteText: text, clientName }) });
  const out = (await res.json().catch(() => ({}))) as Partial<AiResult> & { error?: string };
  if (!res.ok || !out.status) throw new Error(`progress note AI ${res.status}: ${out.error ?? "no status"}`);
  return { status: out.status, summary_bullets: Array.isArray(out.summary_bullets) ? out.summary_bullets : [], reasoning: out.reasoning };
}

/** Checks one note, saves the result, and emails an alert if needed. Skips notes already checked. */
export async function analyseNote(id: string): Promise<AiResult["status"] | null> {
  const [n] = await sql<NoteRow[]>`
    select n.id, n.summary, n.comms, n.best_day, n.date,
           nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '') as participant,
           nullif(trim(c.first_name), '') as carer
      from app.progress_notes n
      left join app.users p on p.id = n.participant
      left join app.users c on c.id = n.carer
     where n.id = ${id} and not coalesce(n.ai_analysed, false)`;
  if (!n || !(n.summary ?? "").trim()) return null;
  const participant = (n.participant ?? "Participant").replace(/\s+/g, " ");
  const r = await callAi(noteText(n), participant);
  const bullets = r.summary_bullets.map((b) => String(b).trim()).filter(Boolean);
  // Claim the note before emailing, so two runs never send the same alert twice.
  const claimed = await sql`
    update app.progress_notes set ai_analysed = true, ai_status = ${r.status}, ai_summary = ${bullets.length ? bullets.join(", ") : null}
     where id = ${id} and not coalesce(ai_analysed, false) returning id`;
  if (!claimed.length || r.status !== "alert") return r.status;

  const info = { participant, carer: n.carer ?? "the carer", date: dmy(n.date), summary: (n.summary ?? "").trim() };
  const mail = alertEmail(info, bullets);
  try {
    const pdf = await notePdf({ ...info, comms: n.comms, bestDay: n.best_day, reasons: bullets });
    const attachments = [{ Name: `Progress Note - ${participant} - ${info.date.replace(/\//g, "-")}.pdf`, Content: pdf, ContentType: "application/pdf" }];
    try {
      const t = await templateInfo(NOTE_TEMPLATE);
      const model = templateModel(t.names, info, bullets, mail, t.raw);
      console.log("progress note alert template", NOTE_TEMPLATE, { vars: t.names, raw: t.raw, filled: Object.keys(model) });
      await sendTemplateWith({ templateId: NOTE_TEMPLATE, to: ALERT_TO, model, attachments });
    } catch (e) {
      // The template couldn't be used: send the same alert as plain text so it is never lost.
      console.error("progress note template failed, sending plain", e);
      await sendPlainEmail({ to: ALERT_TO, from: env.fromEmail, subject: mail.subject, text: mail.text, attachments });
    }
  } catch (e) {
    // Not sent: unmark it so the catch-up cron tries again.
    await sql`update app.progress_notes set ai_analysed = false where id = ${id}`;
    throw e;
  }
  return r.status;
}

/** Best effort after a note is submitted: a failure is logged and the catch-up cron retries. */
export async function analyseNoteSafely(id: string) {
  try {
    await analyseNote(id);
  } catch (e) {
    console.error("progress note AI failed", id, e);
  }
}

/** Submitted notes from the switch-over on that haven't been checked yet, oldest first. */
export async function uncheckedNotes(limit = 10) {
  const rows = await sql<{ id: string }[]>`
    select id from app.progress_notes
     where not coalesce(ai_analysed, false) and coalesce(submit, false)
       and created_at >= '2026-11-21T13:00:00Z' and length(trim(coalesce(summary, ''))) > 0
     order by created_at limit ${limit}`;
  return rows.map((r) => r.id);
}
