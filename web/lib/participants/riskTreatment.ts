// Writes a Risk Treatment for one risk with Claude (Risk Assessment > GENERATE).
// Same prompt and rules as risk-emergency-generator/api/generate-risk-treatment.js,
// reading the participant and their 20 newest progress notes from our database.
import { sql } from "@/lib/db";
import { emergencyDetails } from "./docs";

const HIDE_GROUPS = new Set(["Primary emergency contact", "Secondary emergency contact"]);
const HIDE_ROWS = new Set(["Address", "Phone", "Email", "Contact preference", "NDIS number", "Plan manager", "Plan manager email", "Plan manager phone"]);

async function profile(participant: string) {
  const groups = (await emergencyDetails(participant))
    .filter((g) => !HIDE_GROUPS.has(g.title))
    .map((g) => ({ ...g, rows: g.rows.filter(([k]) => !HIDE_ROWS.has(k)) }))
    .filter((g) => g.rows.length);
  return groups.map((g) => `${g.title}\n${g.rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`).join("\n\n");
}

async function notes(participant: string) {
  const rows = await sql<{ at: Date; summary: string | null }[]>`
    select coalesce(date, created_at) as at, summary from app.progress_notes
     where participant = ${participant} and nullif(trim(summary), '') is not null
     order by coalesce(date, created_at) desc limit 20`;
  return rows.map((n, i) => `Note ${i + 1} (${new Date(n.at).toISOString()}):\n${n.summary}`).join("\n\n");
}

/** The treatment text for the risk. Throws if no API key is set or the call fails. */
export async function generateRiskTreatment(participant: string, risk: string, staffNotes?: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY isn't set.");
  const [p, n] = await Promise.all([profile(participant), notes(participant)]);
  const prompt = `You are writing an NDIS Risk Treatment for a participant supported by Knightingale, an aged care and NDIS staffing agency.

<participant_profile>
${p || "No profile details."}
</participant_profile>

<recent_progress_notes>
${n || "No progress notes available."}
</recent_progress_notes>

<identified_risk>
${risk}
</identified_risk>

${staffNotes ? `<staff_context>\n${staffNotes}\n</staff_context>\n` : ""}
Write a Risk Treatment for the identified risk only, following these rules exactly:

VOICE AND AUDIENCE:
- Write in second person, addressing the carer directly ("you") on how to best support the participant with this risk.
- Refer to support staff as "carers", never "workers".

STRUCTURE:
- Do NOT include any header lines such as "Risk area:" or "Relevant to:". Start directly with point 1.
- 5 numbered points. Each point has a short plain-text sub-heading on its own line, followed by one paragraph.
- End with these three lines:
Review Date:
Completed by:
Date:
- Then 1 to 2 lines of practical next-step advice.

FORMATTING:
- Plain text only. No markdown, no asterisks, no bold, no bullet symbols, no horizontal rules.
- Never use em-dashes or en-dashes. Use commas or full stops instead.
- Maximum 500 words total.

CONTENT RULES:
- Ground your guidance in the participant's actual conditions, routines and recent events, but NEVER mention that this information came from progress notes or any records. State facts directly (e.g. "Noe tolerates small sips of thin water" not "progress notes record that..."). Never use phrases like "progress notes indicate", "documented", "recorded" or "as observed in notes".
- NEVER mention support coordinators, legal guardians, emergency contacts, or any named contact people or their phone numbers. Do not instruct the carer to contact them.
- Professional style, aligned with the NDIS Code of Conduct, balancing duty of care with the participant's autonomy and dignity.

Output the document text only, no preamble.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n").trim();
  if (!text) throw new Error("Claude didn't return a treatment.");
  return text.replace(/\s*[–—]\s*/g, ", ");
}
