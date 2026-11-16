// The participant intake, as on Bubble's intake_admin page (Intake type, linked by User.intake form).
import { sql } from "@/lib/db";
import { bubbleBody, dbValues, readForm, type Section } from "@/lib/forms/fields";
import { bubbleCreate, bubbleOn, bubblePatch, bubbleUuid } from "@/lib/bubble/write";

export const INTAKE: Section[] = [
  {
    title: "About you",
    fields: [
      { col: "gender", label: "Gender", kind: "fixed", options: ["Male", "Female", "Other"] },
      { col: "aboriginal", label: "Aboriginal or Torres Strait Islander", kind: "yesno" },
      { col: "cultural_values", label: "Culture, diversity, values and beliefs", kind: "area" },
      { col: "religion", label: "Religion or spirituality", kind: "area" },
      { col: "language", label: "Languages spoken", kind: "area" },
      { col: "interpreter", label: "Interpreter needed", kind: "yesno" },
      { col: "communication_method", label: "How do you prefer we contact you?", kind: "choice", set: "communication_method" },
      { col: "communication_type", label: "Preferred communication", kind: "choice", set: "communication_type" },
      { col: "living_situation", label: "Living situation", kind: "choice", set: "living_situation" },
      { col: "bsp", label: "Behaviour support plan", kind: "yesno" },
      { col: "legal_issues", label: "Any legal issues", kind: "area" },
      { col: "hobbies", label: "Hobbies", kind: "area" },
      { col: "unique_you", label: "What makes you unique", kind: "area" },
      { col: "other_info", label: "Anything else we should know", kind: "area" },
    ],
  },
  {
    title: "NDIS",
    fields: [
      { col: "ndis_funding", label: "NDIS funding", kind: "choice", set: "ndis_funding" },
      { col: "plan_manager", label: "Plan manager", kind: "planManager" },
    ],
  },
  {
    title: "Health",
    fields: [
      { col: "diagnosis", label: "Diagnosis", kind: "area" },
      { col: "primary_diagnosis", label: "Primary formal NDIS diagnosis", kind: "area" },
      { col: "secondary_diagnosis", label: "Secondary formal NDIS diagnosis", kind: "area" },
      { col: "physical_health", label: "Physical health conditions", kind: "multi", set: "physical_health" },
      { col: "physical_medications", label: "Physical health medications", kind: "area" },
      { col: "mental_health", label: "Mental health conditions", kind: "multi", set: "mental_health" },
      { col: "mental_medications", label: "Mental health medications", kind: "area" },
      { col: "medications", label: "Medication list", kind: "area" },
      { col: "medication_assistance", label: "Medication assistance", kind: "area" },
      { col: "hospital_admission_history", label: "Hospital admissions", kind: "area" },
      { col: "hospital_admission_assistance", label: "Staying out of hospital", kind: "area" },
      { col: "allergies", label: "Allergies", kind: "area" },
    ],
  },
  {
    title: "Diet",
    fields: [
      { col: "diet_requirements", label: "Dietary requirements", kind: "area" },
      { col: "vegetarian", label: "Vegetarian", kind: "yesno" },
      { col: "vegan", label: "Vegan", kind: "yesno" },
      { col: "dairy", label: "Dairy free", kind: "yesno" },
      { col: "gluten", label: "Gluten free", kind: "yesno" },
      { col: "dont_eat", label: "Food you don't like", kind: "area" },
      { col: "favourite_food", label: "Favourite food", kind: "area" },
    ],
  },
  {
    title: "Support needs",
    fields: [
      { col: "support_needs", label: "Daily tasks", kind: "area" },
      { col: "mobility", label: "Mobility aids", kind: "multi", set: "mobility" },
      { col: "manual_handling", label: "Manual handling assistance", kind: "multi", set: "manual_handling" },
      { col: "personal_care", label: "Personal care assistance", kind: "multi", set: "personal_care" },
      { col: "services", label: "Support needed", kind: "multi", set: "service_required" },
      { col: "assist_by", label: "How we can best assist you", kind: "area" },
    ],
  },
  {
    title: "Carer preferences",
    note: "Optional.",
    fields: [
      { col: "carer_age", label: "Age", kind: "text" },
      { col: "carer_gender", label: "Gender", kind: "choice", set: "sex" },
      { col: "carer_culture", label: "Culture, religion, ethnicity", kind: "area" },
      { col: "carer_language", label: "Languages spoken", kind: "area" },
      { col: "carer_personality", label: "Personality", kind: "area" },
      { col: "carer_skills", label: "Unique skills or knowledge", kind: "area" },
      { col: "carer_training", label: "Specific training", kind: "area" },
    ],
  },
  {
    title: "Goals",
    fields: [
      { col: "goals", label: "Goals and expectations", kind: "area" },
      { col: "twelve_month_goals", label: "12 month goals", kind: "area" },
      { col: "outcomes", label: "Desired outcomes", kind: "area" },
    ],
  },
  ...([1, 2] as const).map((n) => ({
    title: `Emergency contact ${n}`,
    fields: [
      { col: `contact${n}`, label: "Contact type", kind: "choice", set: "contact" },
      { col: `contact${n}name`, label: "Name", kind: "text" },
      { col: `contact${n}relation`, label: "Relationship", kind: "text" },
      { col: `contact${n}address`, label: "Address", kind: "address" },
      { col: `contact${n}phone`, label: "Phone", kind: "text" },
      { col: `contact${n}email`, label: "Email", kind: "text" },
      { col: `contact${n}advocacyform`, label: "Advocacy form", kind: "yesno" },
    ] as Section["fields"],
  })),
  {
    title: "Consent and signatures",
    fields: [
      { col: "consent", label: "Consent", kind: "multi", set: "participation_consent" },
      { col: "signature_date", label: "Date signed", kind: "date" },
      { col: "participant_signature", label: "Participant signature", kind: "signature" },
      { col: "representative_signature", label: "Representative signature (if applicable)", kind: "signature" },
      { col: "knightingale_signature", label: "Knightingale signature", kind: "signature" },
    ],
  },
];

export async function intakeFor(participant: string) {
  const [row] = await sql<{ id: string | null; bubble_id: string | null; user_b: string | null }[]>`
    select coalesce(u.intake_form, (select i.id from app.intakes i where i.participant = u.id order by i.updated_at desc limit 1)) as id,
           (select i.bubble_id from app.intakes i where i.id = coalesce(u.intake_form,
              (select i2.id from app.intakes i2 where i2.participant = u.id order by i2.updated_at desc limit 1))) as bubble_id,
           u.bubble_id as user_b
      from app.users u where u.id = ${participant} and u.account_type = 'participant'`;
  return row ?? null;
}

/** Saves the intake here and in Bubble, creating and linking it first if the participant has none. */
export async function saveIntake(participant: string, f: FormData, by: string | null) {
  const cur = await intakeFor(participant);
  if (!cur) throw new Error("That participant no longer exists.");
  const values = readForm(INTAKE, f);
  const body = await bubbleBody(INTAKE, values);
  const db = dbValues(INTAKE, values);

  if (cur.id) {
    if (bubbleOn() && cur.bubble_id) await bubblePatch("intake", cur.bubble_id, body);
    await sql`update app.intakes set ${sql(db)} where id = ${cur.id}`;
    return cur.id;
  }
  // New intake: create it in Bubble first so both sides share one id.
  let bid: string | null = null;
  if (bubbleOn() && cur.user_b) {
    bid = await bubbleCreate("intake", { ...body, participant: cur.user_b });
    await bubblePatch("user", cur.user_b, { "intake form": bid });
  }
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into app.intakes ${sql({ ...db, participant, created_by: by, ...(bid ? { id: bubbleUuid(bid), bubble_id: bid } : {}) })}
      returning id`;
    await tx`update app.users set intake_form = ${row.id} where id = ${participant}`;
    return row.id;
  });
}
