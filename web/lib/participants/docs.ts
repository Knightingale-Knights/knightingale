// Participant documents other than the intake: one list of fields drives the admin edit page and the
// read-only view support coordinators see. Each is linked from the participant (users.<link>) as in Bubble.
import { sql } from "@/lib/db";
import { dbValues, fieldsFrom, melbMidnight, readForm, type Section } from "@/lib/forms/fields";
import { saveIntakePart } from "./intake";

/** Knightingale's signature on every participant document (Paul, 25 Nov 2026). */
export const KN_SIGNATURE = "/knightingale-signature.png";

export type DocDef = { key: string; title: string; table: string; link: string; sections: Section[] };

export const CONSENT: DocDef = {
  key: "consent", title: "Privacy Consent Form", table: "consents", link: "consent",
  sections: [
    {
      title: "11. Withdrawal of consent",
      note: "Ticked items are uses of their personal information the participant has withdrawn consent for.",
      fields: [
        { col: "f_1_audits", label: "Participation in NDIS audits and other quality assurance activities associated with maintaining Knightingale's status as a registered NDIS provider.", kind: "check" },
        { col: "f_2_surveys", label: "Participation in quality assurance activities including surveys, research, and complaint resolution.", kind: "check" },
        { col: "f_3_ads", label: "Inclusion in Knightingale promotional activities and events.", kind: "check" },
        { col: "f_4_recruitment", label: "Consent to the use of your personal information for the recruitment of employees, contractors, and volunteers.", kind: "check" },
        { col: "f_5_reporting", label: "Involvement in the evaluation of Knightingale's services and external reporting.", kind: "check" },
        { col: "f_6_training", label: "Use of your data for internal training and operational processes.", kind: "check" },
        { col: "f_7_marketing", label: "Receipt of marketing communications from Knightingale. You may opt out at any time.", kind: "check" },
        { col: "f_8_audiovisual", label: "Collection of information in audio and visual formats.", kind: "check" },
        { col: "f_9_photos", label: "Permission for photos to be published on Knightingale's website or social media profiles.", kind: "check" },
        { col: "f_10_sharing", label: "Information about me may be provided to other service providers.", kind: "check" },
        { col: "f_11_allied", label: "Information may be provided to appropriate authorities such as health professionals, pharmacy, medical specialists etc.", kind: "check" },
      ],
    },
    {
      title: "12. Sharing my information",
      fields: [
        { col: "consent_yes", label: "I consent for you to disclose my / the participant's information to (name and contact details)", kind: "area" },
        { col: "consent_no", label: "Irrespective of any request received, I direct you NOT to provide my / the participant's personal information to (name and contact details)", kind: "area" },
      ],
    },
    {
      title: "Signatures",
      fields: [
        { col: "participant_signature", label: "Participant signature", kind: "signature" },
        { col: "signed_date", label: "Date signed", kind: "date" },
      ],
    },
  ],
};

export const EMERGENCY: DocDef = {
  key: "emergency", title: "Emergency Plan", table: "emergency_plans", link: "emergency_plan",
  sections: [
    {
      title: "Emergency procedures",
      fields: [
        { col: "fire_evacuation", label: "Fire evacuation route & meeting location", kind: "area" },
        { col: "fire_steps", label: "Fire steps & emergency contact", kind: "area" },
        { col: "hospital", label: "Preferred hospital & instructions", kind: "area" },
        { col: "hospital_steps", label: "Hospital steps & emergency contact", kind: "area" },
        { col: "natural_disaster", label: "Natural disaster evacuation plan", kind: "area" },
        { col: "natural_disaster_steps", label: "Natural disaster steps & emergency contact", kind: "area" },
        { col: "infectious", label: "Infectious/hazardous isolation procedure", kind: "area" },
        { col: "infectious_steps", label: "Infectious/hazardous steps & emergency contact", kind: "area" },
        { col: "backup_power", label: "Backup power & emergency lighting", kind: "area" },
        { col: "power_outage", label: "Power outage steps & emergency contact", kind: "area" },
        { col: "supplies", label: "Emergency evacuation kit (location and contents)", kind: "area" },
      ],
    },
    {
      title: "Consent",
      fields: [
        { col: "participant_signature", label: "Participant signature", kind: "signature" },
        { col: "signed_date", label: "Date signed", kind: "date" },
      ],
    },
  ],
};

const TIMING = ["N/A", "Weekly", "Monthly", "Quarterly", "Bi-Annual"];

export const IMPACT = ["High", "Med", "Low"];

/** Laid out as Bubble's Risk Assessment popup. "show" fields come from the profile and intake (riskShowValues).
 *  The page puts Home Risks after section 5 and the Risk Management Plan after section 6. */
export const RISK: DocDef = {
  key: "risk", title: "Risk Assessment", table: "risk_assessments", link: "risk_assessment",
  sections: [
    {
      title: "Participant",
      fields: [
        { col: "ro_name", label: "Full Name", kind: "show" },
        { col: "ro_dob", label: "D.O.B", kind: "show" },
        { col: "ro_address", label: "Address", kind: "show" },
        { col: "ro_phone", label: "Phone Number", kind: "show" },
      ],
    },
    {
      title: "Personal Details",
      fields: [
        { col: "ro_pref_comm", label: "Preferred Communication", kind: "show" },
        { col: "communication", label: "Communicability", kind: "fixed", options: [
          "1. Without the assistance of another person the participant has limited or no ability to communicate",
          "2. The participant uses equipment to enable or facilitate communication with others, including to enable or facilitate the use of a phone or other device.",
          "3. N/A"] },
        { col: "ro_cultural", label: "Cultural Considerations", kind: "show" },
        { col: "ro_religion", label: "Religion / Spirituality", kind: "show" },
        { col: "ro_interests", label: "Interests", kind: "show" },
        { col: "ro_mental", label: "Mental Health", kind: "show" },
        { col: "ro_physical", label: "Physical Health", kind: "show" },
        { col: "physical_mobility", label: "Physical Mobility", kind: "fixed", options: [
          "1. Relies on other people to be physically mobile or to facilitate their physical mobility.",
          "2. Uses equipment to enable them to be physically mobile or to facilitate their physical mobility.",
          "3. N/A"] },
        { col: "ro_allergies", label: "Allergies", kind: "show" },
      ],
    },
    {
      title: "Emergency Contact Details",
      fields: [
        { col: "ro_c1", label: "Emergency Contact 1", kind: "show" },
        { col: "ro_c1name", label: "Name", kind: "show", wide: false },
        { col: "ro_c1rel", label: "Relationship", kind: "show", wide: false },
        { col: "ro_c1addr", label: "Address", kind: "show" },
        { col: "ro_c1phone", label: "Phone Number", kind: "show", wide: false },
        { col: "ro_c1email", label: "Email", kind: "show", wide: false },
        { col: "ro_c1adv", label: "Advocacy Form", kind: "show" },
        { col: "ro_c2", label: "Emergency Contact 2", kind: "show" },
        { col: "ro_c2name", label: "Name", kind: "show", wide: false },
        { col: "ro_c2rel", label: "Relationship", kind: "show", wide: false },
        { col: "ro_c2addr", label: "Address", kind: "show" },
        { col: "ro_c2phone", label: "Phone Number", kind: "show", wide: false },
        { col: "ro_c2email", label: "Email", kind: "show", wide: false },
        { col: "ro_c2adv", label: "Advocacy Form", kind: "show" },
      ],
    },
    {
      title: "Consent",
      fields: [
        { col: "persons_involved", label: "Participant Involvement", kind: "area" },
        { col: "ro_privacy", label: "Privacy Policy", kind: "show" },
      ],
    },
    {
      title: "Living Alone",
      fields: [
        { col: "ro_sole", label: "Sole Support Worker", kind: "show" },
        { col: "personal_contact", label: "Outside Contact", kind: "fixed", options: [
          "1. No regular face-to-face contact with other NDIS providers.",
          "2. Limited or irregular face-to-face contact with relatives, friends or other people.",
          "3. N/A"] },
        { col: "reliance", label: "Reliance on our service", kind: "area" },
        { col: "health_safety_impact", label: "Disruption Impact", kind: "area" },
      ],
    },
    {
      title: "Risk Factors",
      fields: [
        { col: "physical_health", label: "Medical Conditions", kind: "multi", set: "physical_health", compact: true },
        { col: "personal_care", label: "Personal Care", kind: "multi", set: "personal_care", compact: true },
        { col: "nutrition", label: "Eating / Drinking", kind: "multi", set: "nutrition", compact: true },
        { col: "accidental_movement", label: "Accidental Movement", kind: "multi", set: "accidental_movement", compact: true },
        { col: "manual_handling", label: "Manual Handling", kind: "multi", set: "manual_handling", compact: true },
        { col: "environmental_risks", label: "Environmental", kind: "multi", set: "environmental", compact: true },
        { col: "mental_health", label: "Mental Health", kind: "multi", set: "mental_health", compact: true },
        { col: "financial_risks", label: "Financial", kind: "multi", set: "financial_risks", compact: true },
        { col: "social_risks", label: "Social Risks", kind: "multi", set: "social_risks", compact: true },
        { col: "substance_use", label: "Substance Use", kind: "multi", set: "substance_use", compact: true },
        { col: "other_risks", label: "Other Risks", kind: "area" },
      ],
    },
    {
      title: "Monitoring & Supervision Plan",
      fields: [
        { col: "sole_worker", label: "Is Personal Support (Assistance with Daily Personal Activities) being provided by a sole Worker?", kind: "yesno" },
        { col: "supervision_timing", label: "If YES, set out the frequency at which Knightingale will undertake in-person supervision of the Worker. Weekly? Monthly? Quarterly? Bi-Annually?", kind: "fixed", options: TIMING },
        { col: "provider_timing", label: "If YES, set out the frequency for engaging with providers who may be involved in providing Other Support Services to the Client in their home or in supporting the Client to access community based-activities.", kind: "fixed", options: TIMING },
      ],
    },
    {
      title: "Signatures",
      fields: [
        { col: "ro_consent", label: "Consent", kind: "show" },
        { col: "participant_signature", label: "Participant Signature", kind: "signature" },
        { col: "ro_name", label: "Participant", kind: "show" },
        { col: "signature_date", label: "Date Signed", kind: "date" },
        { col: "ro_rep_sig", label: "Representative Signature (if applicable)", kind: "show", img: true },
        { col: "ro_kn_sig", label: "Knightingale Signature", kind: "show", img: true },
        { col: "ro_kn_date", label: "Date Signed", kind: "show" },
      ],
    },
  ],
};

/** The profile and intake details the Risk Assessment shows (edited in the intake), keyed ro_*. */
export async function riskShowValues(participant: string): Promise<Record<string, string | null>> {
  const [r] = await sql<Record<string, string | null>[]>`
    with i as (select * from app.intakes where id = (select intake_form from app.users where id = ${participant})),
    opt as (select set_key, value, display from app.option_values)
    select trim(concat_ws(' ', u.first_name, u.last_name)) as ro_name, u.first_name,
           to_char(u.date_of_birth at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as ro_dob,
           u.address->>'address' as ro_address, u.phone_number as ro_phone,
           nullif(concat_ws(' - ', (select display from opt where set_key = 'communication_type' and value = i.communication_type), nullif(i.language, '')), '') as ro_pref_comm,
           i.cultural_values as ro_cultural, i.religion as ro_religion, i.hobbies as ro_interests,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'mental_health' and o.value = any(i.mental_health)) as ro_mental,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'physical_health' and o.value = any(i.physical_health)) as ro_physical,
           i.allergies as ro_allergies,
           (select display from opt where set_key = 'contact' and value = i.contact1) as ro_c1, i.contact1name as ro_c1name, i.contact1relation as ro_c1rel,
           i.contact1address->>'address' as ro_c1addr, i.contact1phone as ro_c1phone, i.contact1email as ro_c1email, i.contact1advocacyform as ro_c1adv,
           (select display from opt where set_key = 'contact' and value = i.contact2) as ro_c2, i.contact2name as ro_c2name, i.contact2relation as ro_c2rel,
           i.contact2address->>'address' as ro_c2addr, i.contact2phone as ro_c2phone, i.contact2email as ro_c2email, i.contact2advocacyform as ro_c2adv,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'participation_consent' and o.value = any(i.consent)) as ro_consent,
           (select nullif(sa.representative_signature, '') from app.service_agreements sa where sa.id = u.service_agreement) as ro_rep_sig,
           ${KN_SIGNATURE}::text as ro_kn_sig,
           to_char(i.signature_date at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as ro_kn_date
      from app.users u left join i on true where u.id = ${participant}`;
  if (!r) return {};
  const first = r.first_name || r.ro_name || "The participant";
  return { ...r, ro_privacy: "Privacy policy was explained to participant", ro_sole: `${first} has been assigned multiple support workers.` };
}


const YN = ["Yes", "No"];

/** Laid out as Bubble's Support Plan popup, which edits the profile and intake as well as the plan itself.
 *  The page puts the Emergency Plan button after the emergency contacts (section 2). */
export const SUPPORT: DocDef = {
  key: "support", title: "Support Plan", table: "support_plans", link: "support_plan",
  sections: [
    {
      title: "Participant", src: "user",
      fields: [
        { col: "ro_name", label: "Full Name", kind: "show" },
        { col: "sex", label: "Gender", kind: "choice", set: "sex" },
        { col: "date_of_birth", label: "D.O.B", kind: "date" },
        { col: "address", label: "Address", kind: "address" },
        { col: "phone_number", label: "Phone Number", kind: "text" },
        { col: "ro_email", label: "Email Address", kind: "show" },
        { col: "communication_method", label: "How do you prefer we contact you?", kind: "choice", set: "communication_method", src: "intake" },
        { col: "ndis_number", label: "What is your NDIS number?", kind: "text" },
        { col: "ndis_funding", label: "What is your NDIS Funding type?", kind: "choice", set: "ndis_funding", src: "intake" },
        { col: "plan_manager", label: "Who is your plan manager?", kind: "planManager", src: "intake" },
        { col: "ro_pm_email", label: "What is your plan manager's email?", kind: "show" },
        { col: "ro_pm_phone", label: "What is your plan manager's contact number?", kind: "show" },
        { col: "plan_start", label: "What date does your NDIS plan start?", kind: "date" },
        { col: "plan_end", label: "What date does your NDIS plan end?", kind: "date" },
      ],
    },
    {
      title: "Personal Details", src: "intake",
      fields: [
        { col: "aboriginal", label: "Do you identify as Aboriginal / Torres Strait Islander", kind: "fixed", options: YN },
        { col: "cultural_values", label: "Culture, Diversity, Values, Beliefs?", kind: "area" },
        { col: "living_situation", label: "Living Situation", kind: "choice", set: "living_situation" },
        { col: "bsp", label: "BSP", kind: "fixed", options: YN },
        { col: "primary_diagnosis", label: "Primary formal NDIS diagnosis", kind: "area" },
        { col: "secondary_diagnosis", label: "Secondary formal NDIS diagnosis", kind: "area" },
        { col: "legal_issues", label: "Any Legal Issues", kind: "area" },
        { col: "other_info", label: "Other Relevant Info", kind: "area" },
        { col: "gp", label: "Medical Team Contacts", kind: "area", src: "doc" },
      ],
    },
    {
      title: "Emergency Contact Details", src: "intake",
      fields: [1, 2].flatMap((n) => [
        { col: `contact${n}`, label: n === 1 ? "Emergency Contact #1" : "Emergency Contact #2 (optional)", kind: "choice", set: "contact" },
        { col: `contact${n}name`, label: "Name", kind: "text" },
        { col: `contact${n}relation`, label: "Relationship", kind: "text" },
        { col: `contact${n}address`, label: "Address", kind: "address" },
        { col: `contact${n}phone`, label: "Phone Number", kind: "text" },
        { col: `contact${n}email`, label: "Email", kind: "text" },
        { col: `contact${n}advocacyform`, label: "Advocacy Form", kind: "fixed", options: YN },
      ] as Section["fields"]),
    },
    {
      title: "Communication", src: "intake",
      fields: [
        { col: "communication_type", label: "Preferred Communication Type", kind: "choice", set: "communication_type" },
        { col: "language", label: "Spoken Languages", kind: "area" },
        { col: "interpreter", label: "Interpreter Requirements", kind: "fixed", options: YN },
      ],
    },
    {
      title: "Physical Health", src: "intake",
      fields: [
        { col: "physical_health", label: "Physical Diagnosis", kind: "multi", set: "physical_health", compact: true },
        { col: "medications", label: "Medications", kind: "area" },
        { col: "medication_assistance", label: "Medication Assistance", kind: "area" },
        { col: "emerging_health", label: "Express Emerging Health Concerns", kind: "area", src: "doc" },
        { col: "urgent_health", label: "Escalate Urgent Health Situations", kind: "area", src: "doc" },
      ],
    },
    {
      title: "Mental Health", src: "intake",
      fields: [
        { col: "mental_health", label: "Mental Health Diagnosis", kind: "multi", set: "mental_health", compact: true },
        { col: "mental_medications", label: "Medications", kind: "area" },
        { col: "hospital_admission_history", label: "Hospital Admissions", kind: "fixed", options: YN },
        { col: "hospital_admission_assistance", label: "Staying Out Of Hospital", kind: "area" },
      ],
    },
    {
      title: "Diet", src: "intake",
      fields: [
        { col: "diet_requirements", label: "Dietary Requirements", kind: "area" },
        { col: "vegetarian", label: "Vegetarian", kind: "fixed", options: YN },
        { col: "vegan", label: "Vegan", kind: "fixed", options: YN },
        { col: "dairy", label: "Dairy Free", kind: "fixed", options: YN },
        { col: "gluten", label: "Gluten Free", kind: "fixed", options: YN },
        { col: "allergies", label: "Allergies", kind: "area" },
        { col: "dont_eat", label: "Least Favourite Food", kind: "area" },
        { col: "favourite_food", label: "Favourite Food", kind: "area" },
      ],
    },
    {
      title: "Practical Support Needs", src: "intake",
      fields: [
        { col: "support_needs", label: "Daily Support", kind: "area" },
        { col: "mobility", label: "Mobility Aids", kind: "multi", set: "mobility", compact: true },
        { col: "manual_handling", label: "Manual Handling Assistance?", kind: "multi", set: "manual_handling", compact: true },
        { col: "personal_care", label: "Personal Care Assistance", kind: "multi", set: "personal_care", compact: true },
        { col: "services", label: "Support Needed", kind: "multi", set: "service_required", compact: true },
        { col: "assist_by", label: "We Can Best Assist You", kind: "area" },
      ],
    },
    {
      title: "Your Preferences", src: "intake",
      fields: [
        { col: "carer_age", label: "Carer Age", kind: "text" },
        { col: "carer_gender", label: "Carer Gender", kind: "choice", set: "sex" },
        { col: "carer_culture", label: "Cultural, Religious, Ethnic Preferences", kind: "area" },
        { col: "carer_language", label: "Spoken Language Preferences", kind: "area" },
        { col: "carer_personality", label: "Personality Preferences", kind: "area" },
        { col: "carer_skills", label: "Unique Carer Skills/Knowledge", kind: "area" },
        { col: "carer_training", label: "Specific Training Needed", kind: "area" },
        { col: "unique_you", label: "Anything Else We Should Know", kind: "area" },
      ],
    },
    {
      title: "Goals/Expectations/Desired Outcomes", src: "intake",
      fields: [
        { col: "outcomes", label: "Goals/Expectations/Desired Outcomes", kind: "area" },
        { col: "twelve_month_goals", label: "12 Month Goals", kind: "area" },
      ],
    },
    {
      title: "Admin", src: "intake",
      fields: [{ col: "consent", label: "Consent", kind: "multi", set: "participation_consent", compact: true }],
    },
    {
      title: "Signatures",
      fields: [
        { col: "participant_signature", label: "Participant Signature", kind: "signature" },
        { col: "ro_name", label: "Participant", kind: "show" },
        { col: "signed_date", label: "Date", kind: "date" },
        { col: "representative_signature", label: "Representative Signature (if applicable)", kind: "signature", src: "intake" },
        { col: "ro_kn_sig", label: "Knightingale Signature", kind: "show", img: true },
        { col: "signature_date", label: "Date", kind: "date", src: "intake" },
      ],
    },
  ],
};

/** Details the Support Plan shows but doesn't edit, keyed ro_*. */
export async function supportShowValues(participant: string): Promise<Record<string, string | null>> {
  const [r] = await sql<Record<string, string | null>[]>`
    select trim(concat_ws(' ', u.first_name, u.last_name)) as ro_name, u.email as ro_email, pm.email as ro_pm_email, pm.phone as ro_pm_phone
      from app.users u left join app.intakes i on i.id = u.intake_form left join app.plan_managers pm on pm.id = i.plan_manager
     where u.id = ${participant}`;
  return r ?? {};
}

/** The profile and intake values a document's "user" and "intake" fields show. */
export async function profileAndIntake(d: DocDef, participant: string) {
  const pick = (row: Record<string, unknown> | undefined, secs: Section[]) =>
    Object.fromEntries(secs.flatMap((x) => x.fields).filter((f) => row && f.col in row).map((f) => [f.col, row![f.col]]));
  const [u] = await sql<Record<string, unknown>[]>`select * from app.users where id = ${participant}`;
  const [i] = u?.intake_form ? await sql<Record<string, unknown>[]>`select * from app.intakes where id = ${u.intake_form as string}` : [];
  return { ...pick(u, fieldsFrom(d.sections, "user")), ...pick(i, fieldsFrom(d.sections, "intake")) };
}


export const INFO: DocDef = {
  key: "info", title: "Information Booklet", table: "info_book_signoffs", link: "info_book",
  sections: [
    {
      title: "Signatures",
      fields: [
        { col: "participant_signature", label: "Participant Signature", kind: "signature" },
        { col: "ro_name", label: "Participant", kind: "show" },
        { col: "signed_date", label: "Date", kind: "date" },
        { col: "representative_signature", label: "Representative Signature (if applicable)", kind: "signature" },
        { col: "representative", label: "Representative Name", kind: "text" },
        { col: "ro_kn_sig", label: "Knightingale Signature", kind: "show", img: true },
        { col: "ro_kn_date", label: "Date", kind: "show" },
      ],
    },
  ],
};

export const SERVICE: DocDef = {
  key: "service", title: "Service Agreement", table: "service_agreements", link: "service_agreement",
  sections: [
    {
      title: "Signatures",
      fields: [
        { col: "ro_consent", label: "Consent", kind: "show" },
        { col: "participant_signature", label: "Participant Signature", kind: "signature" },
        { col: "ro_name", label: "Participant", kind: "show" },
        { col: "signed_date", label: "Date Signed", kind: "date" },
        { col: "representative_signature", label: "Representative Signature (if applicable)", kind: "signature" },
        { col: "representative", label: "Representative Name", kind: "text" },
        { col: "ro_kn_sig", label: "Knightingale Signature", kind: "show", img: true },
        { col: "ro_kn_date", label: "Date Signed", kind: "show" },
      ],
    },
  ],
};

export type PriceItem = { id: string; item_no: string | null; item_name: string | null; item_price: number | null };
export type Support = { id: string; no: number | null; ndis_pricing: string | null; hours: number | null; total: number | null };

/** NDIS price items for the Schedule of Supports. */
export function priceItems() {
  return sql<PriceItem[]>`select id, item_no, item_name, item_price::float as item_price from app.ndis_price_items order by item_name`;
}

/** The Service Agreement's supports (Bubble's Support Arrangements), in order. */
export function agreementSupports(agreement: string | null) {
  if (!agreement) return Promise.resolve([] as Support[]);
  return sql<Support[]>`
    select id, no::float as no, ndis_pricing, hours::float as hours, total::float as total
      from app.support_arrangements where service_agreement = ${agreement} order by no nulls last, created_at`;
}

/** Saves the Schedule of Supports posted with the agreement (sup_<id>_item/_hours/_delete, sup_new_*). */
async function saveSupports(participant: string, agreement: string, f: FormData, by: string) {
  const rows = await agreementSupports(agreement);
  const prices = new Map((await priceItems()).map((p) => [p.id, p.item_price ?? 0]));
  const read = (k: string) => {
    const item = String(f.get(`sup_${k}_item`) ?? "") || null;
    const h = Number(String(f.get(`sup_${k}_hours`) ?? "").replace(/[^\d.]/g, ""));
    const hours = Number.isFinite(h) && h > 0 ? h : null;
    return { ndis_pricing: item, hours, total: item && hours ? Math.round(hours * (prices.get(item) ?? 0) * 100) / 100 : null };
  };
  await sql.begin(async (tx) => {
    let n = 0;
    for (const r of rows) {
      if (!f.has(`sup_${r.id}_item`)) { n++; continue; }
      if (f.get(`sup_${r.id}_delete`) === "on") {
        await tx`delete from app.support_arrangements where id = ${r.id}`;
        continue;
      }
      n++;
      await tx`update app.support_arrangements set ${tx({ ...read(r.id), no: n, updated_at: new Date() })} where id = ${r.id}`;
    }
    const v = read("new");
    if (v.ndis_pricing) {
      n++;
      await tx`insert into app.support_arrangements ${tx({ ...v, no: n, participant, service_agreement: agreement, created_by: by })}`;
    }
    // Keep Bubble's Support 1 to 5 fields in step.
    const ids = (await tx<{ id: string }[]>`select id from app.support_arrangements where service_agreement = ${agreement} order by no nulls last, created_at limit 5`).map((x) => x.id);
    await tx`update app.service_agreements set ${tx({ support_1: ids[0] ?? null, support_2: ids[1] ?? null, support_3: ids[2] ?? null, support_4: ids[3] ?? null, support_5: ids[4] ?? null })} where id = ${agreement}`;
  });
}

export const DOCS: Record<string, DocDef> = { consent: CONSENT, emergency: EMERGENCY, risk: RISK, support: SUPPORT, info: INFO, service: SERVICE };

export type RiskPlan = { id: string; risk: string | null; treatment: string | null; participant_impact: string | null; others: string | null; person_responsible: string | null; review_date: Date | null };

/** The participant's Risk Management Plan rows. */
export function riskPlans(participant: string) {
  return sql<RiskPlan[]>`
    select id, risk, treatment, participant_impact, others, person_responsible, review_date
      from app.risk_management_plans where participant = ${participant} order by created_at`;
}

const PLAN_COLS = ["risk", "treatment", "participant_impact", "others", "person_responsible"] as const;

/** Saves the Risk Management Plan rows posted with the Risk Assessment (plan_<id>_<col>, plan_new_<col>, plan_<id>_delete). */
export async function saveRiskPlans(participant: string, assessment: string, f: FormData, by: string): Promise<string | null> {
  const rows = await riskPlans(participant);
  const read = (k: string) => {
    const v: Record<string, unknown> = {};
    for (const c of PLAN_COLS) v[c] = String(f.get(`plan_${k}_${c}`) ?? "").trim() || null;
    const d = String(f.get(`plan_${k}_review_date`) ?? "");
    v.review_date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? melbMidnight(d) : null;
    return v;
  };
  return sql.begin(async (tx) => {
    for (const r of rows) {
      if (!f.has(`plan_${r.id}_risk`)) continue;
      if (f.get(`plan_${r.id}_delete`) === "on") {
        await tx`delete from app.risk_assessments_risk_management_plan where risk_management_plans_id = ${r.id}`;
        await tx`delete from app.risk_management_plans where id = ${r.id}`;
      } else {
        await tx`update app.risk_management_plans set ${tx({ ...read(r.id), updated_at: new Date() })} where id = ${r.id}`;
      }
    }
    const n = read("new");
    if (n.risk || n.treatment) {
      const [row] = await tx<{ id: string }[]>`
        insert into app.risk_management_plans ${tx({ ...n, participant, created_by: by })} returning id`;
      await tx`insert into app.risk_assessments_risk_management_plan (risk_assessments_id, risk_management_plans_id) values (${assessment}, ${row.id})`;
      return row.id;
    }
    return null;
  });
}

// ---- Home Risks (app.home_safety, linked as users.home_safety) ----
export const HOME_SAFE: [string, string][] = [
  ["bathroom_access", "Bathroom Access"], ["bathroom_drainage", "Bathroom Drainage"], ["bathroom_ventilation", "Bathroom Ventilation"],
  ["bed_height", "Bed Height"], ["bed_space", "Bed Space Sufficient"], ["cleaning_products", "Cleaning Products"],
  ["cleaning_products_storage", "Cleaning Products Storage"], ["clothesline", "Clothesline"], ["door_access", "Door Access"],
  ["electrical_equipment", "Electrical Equipment"], ["electrical_leads", "Electrical Leads"], ["floor_surfaces", "Floor Surfaces"],
  ["food_prep_equipment", "Food Prep Equipment"], ["fridge_freezer", "Fridge / Freezer"], ["furniture_placement", "Furniture Placement"],
  ["gates", "Gates"], ["laundry_drainage", "Laundry Drainage"], ["laundry_ventilation", "Laundry Ventilation"], ["lighting", "Lighting"],
  ["parking", "Parking"], ["pathway_garden", "Pathway Garden"], ["portable_heaters", "Portable Heaters"],
  ["power_points", "Power Points"], ["room_to_move", "Room To Move Safely"], ["stairs", "Stairs"], ["stove", "Stove"],
  ["switches_plugs", "Switches / Plugs"], ["tables_chairs", "Tables / Chairs"], ["vacuum", "Vacuum"], ["verandah", "Verandah"],
  ["walking_aid_access", "Walking Aids Access"], ["washer_dryer", "Washer / Dryer"],
];
export const HOME_YES: [string, string][] = [
  ["dangerous_visitors", "Dangerous Visitors"], ["doors_locked", "Doors Locked"], ["exposed_gas_cylinders", "Exposed Gas Cylinders"],
  ["faulty_smoke_detectors", "Faulty Smoke Detectors"], ["hoarding", "Hoarding"], ["infectious_disease", "Infectious Disease"],
  ["manual_handling", "Manual Handling"], ["pests", "Pests"], ["pets", "Pets"], ["power_points_near_water", "Power Points Near Water"], ["restraint_used", "Restraint Used"],
  ["smoker_in_home", "Smoker In Home"], ["weapons", "Weapons"],
];
export const SAFE_CHOICES: [string, string][] = [["safe", "Safe"], ["unsafe", "Unsafe"], ["n_a", "N/A"]];
export const YES_CHOICES: [string, string][] = [["yes", "Yes"], ["no", "No"], ["n_a", "N/A"]];

/** The participant's home safety row, from their link field or the newest one for them. */
export async function homeSafety(participant: string): Promise<Record<string, string | null> | null> {
  const [r] = await sql<Record<string, string | null>[]>`
    select h.* from app.home_safety h, app.users u
     where u.id = ${participant} and (h.id = u.home_safety or h.participant = u.id)
     order by (h.id = u.home_safety) desc, h.updated_at desc limit 1`;
  return r ?? null;
}

/** Saves the Home Risks posted with the Risk Assessment (home_<col>), creating and linking the row if needed. */
export async function saveHomeSafety(participant: string, f: FormData, by: string) {
  if (!f.has("home_present")) return;
  const v: Record<string, string | null> = {};
  for (const [c] of [...HOME_SAFE, ...HOME_YES]) v[c] = String(f.getAll(`home_${c}`).at(-1) ?? "") || null;
  v.home_safety_notes = String(f.get("home_home_safety_notes") ?? "").trim() || null;
  const cur = await homeSafety(participant);
  if (cur) {
    await sql`update app.home_safety set ${sql({ ...v, updated_at: new Date() })} where id = ${cur.id}`;
    return;
  }
  if (!Object.values(v).some(Boolean)) return;
  await sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`insert into app.home_safety ${tx({ ...v, participant, created_by: by })} returning id`;
    await tx`update app.users set home_safety = ${row.id} where id = ${participant}`;
  });
}

/** The participant's document row (its id), from their link field or the newest one for them. */
export async function docId(d: DocDef, participant: string): Promise<string | null> {
  const [r] = await sql<{ id: string | null }[]>`
    select coalesce(
      (select x.id from ${sql(`app.${d.table}`)} x where x.id = u.${sql(d.link)}),
      (select x.id from ${sql(`app.${d.table}`)} x where x.participant = u.id order by x.updated_at desc limit 1)
    ) as id
      from app.users u where u.id = ${participant}`;
  return r?.id ?? null;
}

/** Saves the document, creating and linking it to the participant if they have none. */
export async function saveDoc(d: DocDef, participant: string, f: FormData, by: string) {
  const own = fieldsFrom(d.sections, "doc");
  const db = dbValues(own, readForm(own, f));
  const intakePart = fieldsFrom(d.sections, "intake");
  const userPart = fieldsFrom(d.sections, "user");
  if (intakePart.length) await saveIntakePart(participant, intakePart, f, by);
  if (userPart.length) {
    const u = dbValues(userPart, readForm(userPart, f));
    if (Object.keys(u).length) await sql`update app.users set ${sql({ ...u, updated_at: new Date() })} where id = ${participant}`;
  }
  let id = await docId(d, participant);
  if (id) {
    await sql`update ${sql(`app.${d.table}`)} set ${sql({ ...db, updated_at: new Date() })} where id = ${id}`;
  } else {
    id = await sql.begin(async (tx) => {
      const [row] = await tx<{ id: string }[]>`
        insert into ${sql(`app.${d.table}`)} ${sql({ ...db, participant, created_by: by })} returning id`;
      await tx`update app.users set ${sql({ [d.link]: row.id })} where id = ${participant}`;
      return row.id;
    });
  }
  let newPlan: string | null = null;
  if (d.key === "risk") {
    newPlan = await saveRiskPlans(participant, id, f, by);
    await saveHomeSafety(participant, f, by);
  }
  if (d.key === "service") await saveSupports(participant, id, f, by);
  return { id, newPlan };
}

/** The participant details on the Emergency Plan, grouped as in Bubble (from their profile and intake). */
export async function emergencyDetails(participant: string): Promise<{ title: string; rows: [string, string][] }[]> {
  const [r] = await sql<Record<string, string | null>[]>`
    with i as (select * from app.intakes where id = (select intake_form from app.users where id = ${participant})),
    opt as (select set_key, value, display from app.option_values)
    select trim(concat_ws(' ', u.first_name, u.last_name)) as name, i.gender,
           to_char(u.date_of_birth at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as dob,
           u.address->>'address' as address, u.phone_number as phone, u.email,
           (select display from opt where set_key = 'communication_method' and value = i.communication_method) as contact_pref,
           u.ndis_number, (select display from opt where set_key = 'ndis_funding' and value = i.ndis_funding) as funding,
           pm.name as pm, pm.email as pm_email, pm.phone as pm_phone,
           to_char(u.plan_start at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as plan_start,
           to_char(u.plan_end at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as plan_end,
           (select display from opt where set_key = 'communication_type' and value = i.communication_type) as comm_type,
           i.language, i.interpreter,
           (select display from opt where set_key = 'contact' and value = i.contact1) as c1, i.contact1name as c1name, i.contact1relation as c1rel,
           i.contact1address->>'address' as c1addr, i.contact1phone as c1phone, i.contact1email as c1email, i.contact1advocacyform as c1adv,
           (select display from opt where set_key = 'contact' and value = i.contact2) as c2, i.contact2name as c2name, i.contact2relation as c2rel,
           i.contact2address->>'address' as c2addr, i.contact2phone as c2phone, i.contact2email as c2email, i.contact2advocacyform as c2adv,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'physical_health' and o.value = any(i.physical_health)) as physical,
           i.allergies, i.physical_medications,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'mental_health' and o.value = any(i.mental_health)) as mental,
           i.mental_medications,
           (select string_agg(o.display, ', ') from opt o where o.set_key = 'mobility' and o.value = any(i.mobility)) as mobility,
           i.diet_requirements as diet,
           (select display from opt where set_key = 'living_situation' and value = i.living_situation) as living
      from app.users u left join i on true left join app.plan_managers pm on pm.id = i.plan_manager
     where u.id = ${participant}`;
  if (!r) return [];
  const g = (title: string, rows: [string, string | null][]) => ({ title, rows: rows.filter((x): x is [string, string] => Boolean(x[1] && String(x[1]).trim())) });
  return [
    g("Personal details", [["Full name", r.name], ["Gender", r.gender], ["Date of birth", r.dob], ["Address", r.address], ["Phone", r.phone], ["Email", r.email],
      ["Contact preference", r.contact_pref], ["NDIS number", r.ndis_number], ["NDIS funding", r.funding], ["Plan manager", r.pm],
      ["Plan manager email", r.pm_email], ["Plan manager phone", r.pm_phone], ["NDIS plan start", r.plan_start], ["NDIS plan end", r.plan_end]]),
    g("Communication", [["Preferred communication", r.comm_type], ["Spoken languages", r.language], ["Interpreter needed", r.interpreter]]),
    g("Primary emergency contact", [["Contact", r.c1], ["Name", r.c1name], ["Relationship", r.c1rel], ["Address", r.c1addr], ["Phone", r.c1phone], ["Email", r.c1email], ["Advocacy form", r.c1adv]]),
    g("Secondary emergency contact", [["Contact", r.c2], ["Name", r.c2name], ["Relationship", r.c2rel], ["Address", r.c2addr], ["Phone", r.c2phone], ["Email", r.c2email], ["Advocacy form", r.c2adv]]),
    g("Physical health", [["Physical conditions", r.physical], ["Allergies", r.allergies], ["Medications", r.physical_medications]]),
    g("Mental health", [["Mental health conditions", r.mental], ["Medications", r.mental_medications]]),
    g("Requirements", [["Mobility aids", r.mobility], ["Diet", r.diet], ["Living situation", r.living]]),
  ].filter((x) => x.rows.length);
}

// ---- the Service Agreement on the carer's side -----------------------------------

export type AgreementView = {
  id: string | null;
  name: string; address: string | null;
  participantSignature: string | null; representativeSignature: string | null; representative: string | null;
  signedDate: string | null; knSignature: string | null;
  supports: { item: string; hours: number | null; total: number | null }[];
};

/** Everything a carer needs to show a participant their Service Agreement and have it signed. */
export async function agreementForCarer(participant: string): Promise<AgreementView> {
  const id = await docId(SERVICE, participant);
  const [[u], shown, rows] = await Promise.all([
    sql<{ name: string }[]>`select trim(concat_ws(' ', first_name, last_name)) as name from app.users where id = ${participant}`,
    riskShowValues(participant),
    id ? sql<{ item: string | null; hours: number | null; total: number | null }[]>`
      select coalesce(p.item_name, '') as item, a.hours::float as hours, a.total::float as total
        from app.support_arrangements a left join app.ndis_price_items p on p.id = a.ndis_pricing
       where a.service_agreement = ${id} order by a.no nulls last, a.created_at` : Promise.resolve([]),
  ]);
  const [sa] = id
    ? await sql<{ participant_signature: string | null; representative_signature: string | null; representative: string | null; signed: string | null }[]>`
        select nullif(participant_signature, '') as participant_signature, nullif(representative_signature, '') as representative_signature,
               nullif(representative, '') as representative,
               to_char(signed_date at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as signed
          from app.service_agreements where id = ${id}`
    : [];
  return {
    id, name: u?.name ?? "", address: shown.ro_address ?? null,
    participantSignature: sa?.participant_signature ?? null, representativeSignature: sa?.representative_signature ?? null,
    representative: sa?.representative ?? null, signedDate: sa?.signed ?? null, knSignature: shown.ro_kn_sig ?? null,
    supports: rows.map((r) => ({ item: r.item ?? "", hours: r.hours, total: r.total })),
  };
}

/** Saves the participant's (or their representative's) signature, dated today, creating the agreement if needed. */
export async function signAgreement(participant: string, s: { participantSignature: string | null; representativeSignature: string | null; representative: string | null }, by: string) {
  const png = (v: string | null) => (v && v.startsWith("data:image/png;base64,") ? v : null);
  const p = png(s.participantSignature), r = png(s.representativeSignature);
  if (!p && !r) throw new Error("Please have the participant (or their representative) sign first.");
  if (r && !s.representative?.trim()) throw new Error("Please enter the representative's name.");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
  const values = {
    participant_signature: p, representative_signature: r, representative: r ? s.representative!.trim() : null,
    signed_date: melbMidnight(today), updated_at: new Date(),
  };
  const id = await docId(SERVICE, participant);
  if (id) { await sql`update app.service_agreements set ${sql(values)} where id = ${id}`; return id; }
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`insert into app.service_agreements ${tx({ ...values, participant, created_by: by })} returning id`;
    await tx`update app.users set service_agreement = ${row.id} where id = ${participant}`;
    return row.id;
  });
}
