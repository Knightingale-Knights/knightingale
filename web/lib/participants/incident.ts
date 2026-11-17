// Incident reports: carers create them from a shift's Details popup. Saved here and in Bubble, and emailed to the office.
import { sql } from "@/lib/db";
import { bubbleCreate, bubbleOn, bubbleUuid } from "@/lib/bubble/write";
import { sendPlainEmail } from "@/lib/postmark";

export const INCIDENT_TYPES = [
  "Acts, omissions, events occurring in relation to providing supports",
  "Acts by person with a disability",
  "Have or could have caused harm",
  "Have caused serious harm or risk of harm to another person",
];
export const INCIDENT_HARM = [
  "Incident that resulted in harm or risk of harm to a Participant",
  "Incident caused by Participant resulting in serious harm or risk of serious harm to another person",
];
export const REPORTABLE_TYPES = [
  "Abuse or neglect of a Participant",
  "Death of a Participant",
  "Serious injury to a Participant",
  "Sexual misconduct committed against or in presence of a Participant",
  "Unlawful physical contact or assault of a Participant",
  "Unlawful sexual contact with or sexual assault of a Participant",
  "Use of an unauthorised restrictive practice in relation to a Participant",
];
export const NOT_NDIS = ["Work Health & Safety Incident", "Infection", "Hazardous Exposure", "Child Safety", "Other", "N/A"];
export const INJURY_NATURE = [
  "Amputation", "Burn", "Concussion", "Contusion/crush", "Dermatitis", "Dislocation", "Foreign body", "Fracture",
  "Internal Injury", "Laceration/open wound", "Sprain/strain", "Superficial injury",
];
export const INJURY_LOCATION = [
  "Arms", "Back", "Elbows", "Eye", "Face", "Fingers", "Foot", "Hand", "Head", "Hip", "Internal organs", "Knees", "Leg",
  "Shoulder", "Toes", "Trunk (other than back)",
];

export class IncidentError extends Error {}

const pick = (v: FormDataEntryValue | null, list: string[]) => {
  const s = String(v ?? "").trim();
  return list.includes(s) ? s : null;
};
const many = (f: FormData, key: string, list: string[]) => {
  const xs = f.getAll(key).map(String).filter((x) => list.includes(x));
  return xs.length ? xs.join(", ") : null;
};
const text = (v: FormDataEntryValue | null, max = 6000) => String(v ?? "").trim().slice(0, max) || null;

/** Melbourne date + time (yyyy-mm-dd, hh:mm) as a real time. */
function melbTime(day: string, hm: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(hm)) return null;
  const guess = new Date(`${day}T${hm}:00Z`);
  const off = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", timeZoneName: "longOffset" })
    .formatToParts(guess).find((p) => p.type === "timeZoneName")?.value ?? "GMT+10:00";
  const m = off.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const mins = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 600;
  return new Date(guess.getTime() - mins * 60_000);
}

/** Saves a new incident report for the carer's NDIS shift. */
export async function createIncident(carer: { id: string; name: string }, shiftId: string, f: FormData) {
  const [s] = await sql<{ participant: string; p_bubble: string | null; c_bubble: string | null; first: string | null; last: string | null }[]>`
    select s.participant, p.bubble_id as p_bubble, c.bubble_id as c_bubble, p.first_name as first, p.last_name as last
      from app.shifts s join app.users p on p.id = s.participant join app.users c on c.id = s.carer
     where s.id = ${shiftId} and s.carer = ${carer.id}`;
  if (!s) throw new IncidentError("We couldn't find this shift.");

  const v = {
    incident_type: pick(f.get("incident_type"), INCIDENT_TYPES),
    incident_harm: pick(f.get("incident_harm"), INCIDENT_HARM),
    incident_date: melbTime(String(f.get("day") ?? ""), String(f.get("time") ?? "")),
    incident_location: text(f.get("incident_location"), 300),
    reportable_yes_no: pick(f.get("reportable_yes_no"), ["YES", "NO"]),
    reportable_type: pick(f.get("reportable_type"), REPORTABLE_TYPES),
    not_ndis: pick(f.get("not_ndis"), NOT_NDIS),
    incident_description: text(f.get("incident_description")),
    injury_nature: many(f, "injury_nature", INJURY_NATURE),
    injury_location: many(f, "injury_location", INJURY_LOCATION),
    safety_actions: text(f.get("safety_actions")),
    witnesses: text(f.get("witnesses"), 2000),
  };
  if (!v.incident_type) throw new IncidentError("Choose the type of incident.");
  if (!v.incident_date) throw new IncidentError("Enter the date and time of the incident.");
  if (!v.reportable_yes_no) throw new IncidentError("Say whether it's a reportable incident.");
  if (!v.incident_description || v.incident_description.length < 20) throw new IncidentError("Please describe the incident.");

  // Bubble first so both sides share one id. If Bubble fails, keep the report here and say so in the log.
  let bid: string | null = null;
  if (bubbleOn() && s.p_bubble) {
    const body: Record<string, unknown> = {
      participant: s.p_bubble, ...(s.c_bubble ? { carer: s.c_bubble } : {}),
      "incident type": v.incident_type, "incident harm": v.incident_harm, "incident date": v.incident_date.toISOString(),
      "incident location": v.incident_location, "reportable (yes/no)": v.reportable_yes_no, "not ndis": v.not_ndis,
      "incident description": v.incident_description, "injury nature": v.injury_nature, "injury location": v.injury_location,
      "safety actions": v.safety_actions, witnesses: v.witnesses,
    };
    try {
      bid = await bubbleCreate("incident", body);
    } catch (e) {
      console.error("incident: Bubble create failed", e);
    }
  }
  const [row] = await sql<{ id: string }[]>`
    insert into app.incidents ${sql({ ...v, participant: s.participant, carer: carer.id, created_by: carer.id, ...(bid ? { id: bubbleUuid(bid), bubble_id: bid } : {}) })}
    returning id`;

  const who = [s.first, s.last].filter(Boolean).join(" ") || "a participant";
  const when = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(v.incident_date);
  try {
    await sendPlainEmail({
      to: process.env.INCIDENT_NOTIFY_TO ?? "paul@knightingale.com.au",
      subject: `${v.reportable_yes_no === "YES" ? "REPORTABLE " : ""}Incident report: ${who}, from ${carer.name}`,
      text: [
        `${carer.name} has submitted an incident report for ${who}.`, "",
        `When: ${when}`, `Where: ${v.incident_location ?? "-"}`, `Type: ${v.incident_type}`, `Harm: ${v.incident_harm ?? "-"}`,
        `Reportable: ${v.reportable_yes_no}${v.reportable_type ? ` (${v.reportable_type})` : ""}`, `Non NDIS: ${v.not_ndis ?? "-"}`,
        `Injury: ${v.injury_nature ?? "-"}${v.injury_location ? ` (${v.injury_location})` : ""}`, "",
        "What happened:", v.incident_description, "", "Actions to make it safe:", v.safety_actions ?? "-", "", "Witnesses:", v.witnesses ?? "-",
        ...(bid ? [] : ["", "Note: this report was not saved to Bubble."]),
      ].join("\n"),
      attachments: [],
    });
  } catch (e) {
    console.error("incident: email failed", e);
  }
  return row.id;
}
