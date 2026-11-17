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
    body: JSON.stringify({ participant_id: s.participant_b, format: "pdf", months_back: 3 }),
    cache: "no-store",
  });
  const out = (await res.json().catch(() => ({}))) as { error?: string; filename?: string; file_base64?: string; mime_type?: string; report_period?: string };
  if (res.status === 422) throw new Error(`There are no recent progress notes for ${s.first ?? "this participant"} yet, so there's nothing to summarise.`);
  if (!res.ok || !out.file_base64) throw new Error("The summary couldn't be made just now. Please try again later.");

  const first = s.first ?? "Your participant";
  await sendPlainEmail({
    to: carer.email,
    subject: `${first}'s support summary`,
    text: `Hi ${carer.name.split(" ")[0] || "there"},\n\nAttached is ${first}'s support summary${out.report_period ? ` (${out.report_period})` : ""}. We hope it helps on your shift.\n\nIf you have any suggestions on how to make it better, please email care@knightingale.com.au.\n\nKnightingale`,
    attachments: [{ Name: out.filename ?? `${first}_Supports_Summary.pdf`, Content: out.file_base64, ContentType: out.mime_type ?? "application/pdf" }],
  });
  return first;
}
