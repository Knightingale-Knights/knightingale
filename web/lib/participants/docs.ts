// Participant documents other than the intake: one list of fields drives the admin edit page and the
// read-only view support coordinators see. Each is linked from the participant (users.<link>) as in Bubble.
import { sql } from "@/lib/db";
import { dbValues, readForm, type Section } from "@/lib/forms/fields";

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

export const DOCS: Record<string, DocDef> = { consent: CONSENT, emergency: EMERGENCY };

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
  const db = dbValues(d.sections, readForm(d.sections, f));
  const id = await docId(d, participant);
  if (id) {
    await sql`update ${sql(`app.${d.table}`)} set ${sql({ ...db, updated_at: new Date() })} where id = ${id}`;
    return id;
  }
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into ${sql(`app.${d.table}`)} ${sql({ ...db, participant, created_by: by })} returning id`;
    await tx`update app.users set ${sql({ [d.link]: row.id })} where id = ${participant}`;
    return row.id;
  });
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
