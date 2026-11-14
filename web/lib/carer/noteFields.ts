// Sorts a carer's progress note summary into the note's fields with Claude.
// Same prompt and rules as perfect-progress-note/api/fill-note-fields.js.
import { EMPTY_NOTE_FIELD, NOTE_FIELDS, formatNoteField, parseModelJson } from "./rules";

const SYSTEM_PROMPT = `You read a carer's shift summary for an NDIS or aged care participant and sort its content into fixed fields.

Return ONLY a JSON object with exactly these keys, each a string:
${NOTE_FIELDS.join(", ")}

Field definitions:
- activities_of_daily_living: personal care such as showering, dressing, toileting, grooming, mobility, transfers, medication prompts
- allied_health: physio, OT, speech pathology, podiatry, dietitian or similar visits, plus any exercises or programs from them
- best_day: the highlight of the shift, what went well or what the participant enjoyed most
- comms: communication with family, coordinators, other staff, phone calls, messages, handover
- fluid_intake: drinks and hydration
- food_intake: meals, snacks, appetite, food preparation
- general_mood: the participant's mood and emotional state, with the evidence given
- housework: cleaning, laundry, dishes, tidying, bed making, rubbish
- maintenance: repairs, faults, hazards or equipment issues at the home
- medical_appointments: GP, specialist, hospital, pathology or other medical appointments, including transport and outcome
- outings: community access, shopping, walks, social activities, drives

Rules:
- Use only information in the summary. Never invent or assume details.
- Keep the carer's facts, names and times. Rewrite lightly for clarity, concise.
- If something fits more than one field, put it in the best fit and do not repeat it.
- Put each separate item on its own line, starting with "• " (bullet then a space). Use short phrases, not commas to join items. A single item still gets a bullet. Separate lines with a newline character.
- Example for housework: "• washed dishes\\n• vacuumed the floor\\n• made the bed"
- If the summary has nothing for a field, write exactly: ${EMPTY_NOTE_FIELD} (no bullet)
- Plain text only. No markdown, the only symbol allowed is the • bullet.
- No text outside the JSON object.`;

export type NoteFields = Record<(typeof NOTE_FIELDS)[number], string>;

/** Returns the filled fields, or null when no API key is set. Throws if the call fails. */
export async function fillNoteFields(summary: string): Promise<NoteFields | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: summary }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const parsed = parseModelJson(text);
  if (!parsed) throw new Error("Claude didn't return the fields.");
  return Object.fromEntries(NOTE_FIELDS.map((f) => [f, formatNoteField(parsed[f])])) as NoteFields;
}
