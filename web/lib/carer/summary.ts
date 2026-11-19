// "Request Jan's summary": the support-summary service drafts a PDF from the participant's
// progress notes, and we email it to the carer who asked (Bubble's Support Summary workflow).
import { sql } from "@/lib/db";
import { sendPlainEmail } from "@/lib/postmark";

const URL_ = () => process.env.SUPPORT_SUMMARY_URL ?? "https://support-summary.vercel.app/api/generate-summary";

export async function requestSummary(carer: { id: string; email: string; name: string }, shiftId: string) {
  const [s] = await sql<{ participant_b: string | null; first: string | null }[]>`
    select p.bubble_id as participant_b, split_part(trim(p.first_name), ' ', 1) as first
      from app.shifts s join app.users p on p.id = s.participant
     where s.id = ${shiftId} and s.carer = ${carer.id}`;
  if (!s) throw new Error("We couldn't find this shift.");
  if (!s.participant_b) throw new Error("This participant isn't set up for summaries yet.");
  if (!carer.email) throw new Error("We don't have an email address for you.");

  const res = await fetch(URL_(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: s.participant_b, format: "pdf", months_back: 1 }),
    cache: "no-store",
  });
  const out = (await res.json().catch(() => ({}))) as { error?: string; filename?: string; file_base64?: string; mime_type?: string; report_period?: string };
  if (res.status === 422) throw new Error(`There are no recent progress notes for ${s.first ?? "this participant"} yet, so there's nothing to summarise.`);
  if (!res.ok || !out.file_base64) throw new Error("The summary couldn't be made just now. Please try again later.");

  const first = s.first ?? "Your participant";
  const attachment = { Name: out.filename ?? `${first}_Supports_Summary.pdf`, Content: out.file_base64, ContentType: out.mime_type ?? "application/pdf" };
  await sendPlainEmail({
    to: carer.email,
    subject: `${first}'s support summary`,
    text: `Hi ${carer.name.split(" ")[0] || "there"},\n\nAttached is ${first}'s support summary${out.report_period ? ` (${out.report_period})` : ""}. We hope it helps on your shift.\n\nIf you have any suggestions on how to make it better, please email care@knightingale.com.au.\n\nKnightingale`,
    attachments: [attachment],
  });
  // A copy to Paul, so he knows who is asking and what the summaries say.
  const copyTo = process.env.SUMMARY_COPY_TO ?? "paul@knightingale.com.au";
  await sendPlainEmail({
    to: copyTo,
    subject: `${first}'s support summary, requested by ${carer.name || carer.email}`,
    text: `${carer.name || "A carer"} (${carer.email}) requested ${first}'s support summary${out.report_period ? ` covering ${out.report_period}` : ""}. A copy is attached.`,
    attachments: [attachment],
  }).catch((e) => console.error("summary copy failed", e));
  return first;
}

/** Admin: emails the participant's support summary to the person asking (Bubble's Summary button). */
export async function emailSummaryTo(participant: string, to: string) {
  const [p] = await sql<{ b: string | null; first: string | null }[]>`
    select bubble_id as b, split_part(trim(first_name), ' ', 1) as first from app.users where id = ${participant}`;
  if (!p) throw new Error("That participant no longer exists.");
  if (!p.b) throw new Error("This participant isn't set up for summaries yet.");
  const res = await fetch(URL_(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: p.b, format: "pdf", months_back: 1 }),
    cache: "no-store",
  });
  const out = (await res.json().catch(() => ({}))) as { filename?: string; file_base64?: string; mime_type?: string; report_period?: string };
  const first = p.first ?? "The participant";
  if (res.status === 422) throw new Error(`There are no recent progress notes for ${first} yet, so there's nothing to summarise.`);
  if (!res.ok || !out.file_base64) throw new Error("The summary couldn't be made just now. Please try again later.");
  await sendPlainEmail({
    to,
    subject: `${first}'s support summary`,
    text: `Attached is ${first}'s support summary${out.report_period ? ` (${out.report_period})` : ""}.`,
    attachments: [{ Name: out.filename ?? `${first}_Supports_Summary.pdf`, Content: out.file_base64, ContentType: out.mime_type ?? "application/pdf" }],
  });
  return `${first}'s summary is on its way to ${to}.`;
}
