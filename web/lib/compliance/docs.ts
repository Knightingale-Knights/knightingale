// The compliance documents kept for each carer, and where Bubble stores each one.
export type DocKey = "cpr" | "first_aid" | "police" | "wwcc" | "ndis_screening" | "flu" | "id" | "qualification";
/** Documents shown one by one on the carer Account page (not columns in the office compliance table). */
export type AccountDocKey = "passport" | "licence" | "resume" | "certificate" | "ahpra" | "covid" | "insurance";

export type DocDef<K extends string = DocKey | AccountDocKey> = {
  key: K;
  label: string;
  table: string;
  fileCols: string[]; // a record "has a file" when any of these is set ("[]" marks a list column)
  uploadCol: string | null; // where a new upload goes (null: no file, details only)
  uploadIsArray: boolean;
  fileOptional?: boolean; // details alone count as on file (the picture is extra)
  expiryCol: string | null;
  mustMatch?: string; // an upload the reader says is the wrong document is refused, with this as what to upload instead
  expiryOptional?: boolean; // most of these have no expiry (qualifications: only AHPRA expires), so no expiry is fine
  numberCol: string | null;
  numberLabel: string | null;
  ai: { label: string; fallbackMonths: number | null; fromIssueOnly?: boolean } | null; // read the expiry from the upload (fromIssueOnly: always issue date + fallbackMonths)
  roster: "all" | "ndis" | null; // warn on the roster when this has expired
  hint: string;
};

export const DOCS: DocDef<DocKey>[] = [
  { key: "cpr", label: "CPR", table: "cpr_certificates", fileCols: ["cpr_certificate"], uploadCol: "cpr_certificate", uploadIsArray: false,
    expiryCol: "expiry", numberCol: null, numberLabel: null, ai: { label: "CPR / cardiopulmonary resuscitation)", fallbackMonths: 12 }, roster: "all",
    hint: "Statement of Attainment for HLTAID009 from a registered training organisation." },
  { key: "first_aid", label: "First aid", table: "first_aid_certificates", fileCols: ["first_aid_certificate"], uploadCol: "first_aid_certificate", uploadIsArray: false,
    expiryCol: "expiry", numberCol: null, numberLabel: null, ai: { label: "First Aid (HLTAID011 Provide First Aid)", fallbackMonths: 36 }, roster: "all",
    hint: "Statement of Attainment for HLTAID011 from a registered training organisation." },
  { key: "police", label: "Police check", table: "police_checks", fileCols: ["image"], uploadCol: "image", uploadIsArray: false,
    expiryCol: null, numberCol: "reference_number", numberLabel: "Reference number", ai: { label: "National Police Check certificate", fallbackMonths: null }, roster: "all",
    hint: "Your National Police Check certificate." },
  { key: "wwcc", label: "Working with Children Check", table: "wwcc_checks", fileCols: ["image"], uploadCol: "image", uploadIsArray: false,
    expiryCol: "expiry", numberCol: "card_number", numberLabel: "Card number", ai: { label: "Working with Children Check card", fallbackMonths: 60 }, roster: "all",
    hint: "A photo of your WWCC card." },
  { key: "ndis_screening", label: "NDIS worker screening", table: "ndis_screening_checks", fileCols: ["image"], uploadCol: "image", uploadIsArray: false,
    expiryCol: "expiry_date", numberCol: "id_number", numberLabel: "Screening ID",
    ai: { label: "NDIS Worker Screening Clearance (the clearance notice, email or letter). The expiry is written in the text, e.g. 'expires on DD/MM/YYYY'", fallbackMonths: 60 }, roster: "ndis",
    hint: "Upload your NDIS Worker Screening clearance (the email or letter). We read your ID and expiry date from it." },
  { key: "flu", label: "Flu vaccination", table: "vaccinations", fileCols: ["flu", "influenza[]"], uploadCol: "influenza", uploadIsArray: true,
    expiryCol: "expiry", numberCol: null, numberLabel: null, ai: { label: "Influenza (flu) vaccination record. Report the date the flu vaccine was given (administered) as issue_date. Ignore any vaccine product or batch expiry date", fallbackMonths: 12, fromIssueOnly: true }, roster: null,
    hint: "Your flu vaccination record or immunisation history statement." },
  { key: "id", label: "Photo ID", table: "identity_documents", fileCols: ["passport", "license", "citizenship"], uploadCol: "license", uploadIsArray: false,
    expiryCol: null, numberCol: null, numberLabel: null, ai: null, roster: null,
    hint: "Your driver licence or passport." },
  { key: "qualification", label: "Qualification", table: "qualifications", fileCols: ["transcript[]", "ahpra[]"], uploadCol: "transcript", uploadIsArray: true,
    expiryCol: "expiry", expiryOptional: true, numberCol: "registration_number", numberLabel: "AHPRA registration number",
    ai: { label: "Qualification certificate or academic transcript for a Certificate III or Certificate IV (e.g. in Individual Support, Ageing Support or Disability), or for nurses a Diploma, Bachelor or Master of Nursing (e.g. Master of Nursing Practice or Science), or an AHPRA registration. The words Certificate III, Certificate IV, Diploma of Nursing, Bachelor of Nursing, Master of Nursing or AHPRA must appear on it. Anything else (a short course, first aid or CPR, manual handling, an enrolment letter, a resume, ID) is the wrong document. Only an AHPRA registration has an expiry date", fallbackMonths: null }, mustMatch: "your Certificate III or IV (nurses: your Diploma, Bachelor or Master of Nursing)", roster: null,
    hint: "Your certificate or transcript. Nurses: add your AHPRA number." },
];

/** The Account page splits I.D and qualifications into their parts. Same tables, so the office view still sees them. */
export const ACCOUNT_DOCS: DocDef<AccountDocKey>[] = [
  { key: "passport", label: "Right to Work", table: "identity_documents", fileCols: ["passport"], uploadCol: "passport", uploadIsArray: false,
    expiryCol: null, numberCol: null, numberLabel: null, ai: null, roster: null,
    hint: "A photo of your passport, visa or birth certificate, showing you can work in Australia." },
  { key: "licence", label: "Licence", table: "identity_documents", fileCols: ["license"], uploadCol: "license", uploadIsArray: false,
    expiryCol: null, numberCol: null, numberLabel: null, ai: null, roster: null, hint: "The front of your driver licence." },
  // The resume is kept on the user, as in Bubble (uploaded through the profile-file path, not a compliance table).
  { key: "resume", label: "Resume", table: "users", fileCols: ["resume"], uploadCol: "resume", uploadIsArray: false,
    expiryCol: null, numberCol: null, numberLabel: null, ai: null, roster: null, hint: "Your current resume (PDF or a photo)." },
  { key: "certificate", label: "Certificate", table: "qualifications", fileCols: ["transcript[]"], uploadCol: "transcript", uploadIsArray: true,
    expiryCol: null, numberCol: null, numberLabel: null, ai: { label: "Qualification certificate or academic transcript for a Certificate III or Certificate IV (e.g. in Individual Support, Ageing Support or Disability), or for nurses a Diploma, Bachelor or Master of Nursing (e.g. Master of Nursing Practice or Science), or an AHPRA registration. The words Certificate III, Certificate IV, Diploma of Nursing, Bachelor of Nursing, Master of Nursing or AHPRA must appear on it. Anything else (a short course, first aid or CPR, manual handling, an enrolment letter, a resume, ID) is the wrong document. Only an AHPRA registration has an expiry date", fallbackMonths: null },
    mustMatch: "your Certificate III or IV (nurses: your Diploma, Bachelor or Master of Nursing)", roster: null, hint: "Your qualification certificate or transcript (e.g. Cert III, Cert IV, Diploma, Bachelor of Nursing)." },
  { key: "insurance", label: "Car Insurance", table: "identity_documents", fileCols: ["insurance"], uploadCol: "insurance", uploadIsArray: false,
    expiryCol: "insurance_expiry", numberCol: null, numberLabel: null,
    ai: { label: "Car insurance certificate of currency or policy schedule. It must be car (motor vehicle) insurance: the words \"car insurance\" (or motor or vehicle insurance for a car) must appear on it. Any other kind of insurance (health or medical, travel, home or contents, life, income protection, pet, public liability, professional indemnity) is the wrong document. The expiry is the end of the period of cover", fallbackMonths: null }, roster: null,
    hint: "A photo of your car insurance certificate of currency, and the date it expires." },
  { key: "covid", label: "COVID-19", table: "vaccinations", fileCols: ["covid19[]"], uploadCol: "covid19", uploadIsArray: true,
    expiryCol: null, numberCol: null, numberLabel: null, ai: null, roster: null,
    hint: "Your COVID-19 digital certificate. One certificate lists every dose, including boosters." },
  { key: "ahpra", label: "AHPRA", table: "qualifications", fileCols: ["ahpra[]"], uploadCol: "ahpra", uploadIsArray: true,
    expiryCol: "expiry", numberCol: "registration_number", numberLabel: "AHPRA registration number",
    ai: { label: "AHPRA registration (certificate of registration or a screenshot of the public register). The expiry is the registration expiry date", fallbackMonths: null }, roster: null,
    hint: "Your AHPRA registration (a screenshot of the public register is fine) and your registration number." },
];

export const docDef = (k: string) => DOCS.find((d) => d.key === k) ?? ACCOUNT_DOCS.find((d) => d.key === k) ?? null;

export const SOON_DAYS = 30;
export type Status = "ok" | "soon" | "expired" | "missing" | "check";

/** missing: nothing on file. check: on file but no expiry date yet (for a document that has one). */
export function statusOf(d: DocDef, r: { has_file: boolean; has_record: boolean; expiry: string | null; number: string | null } | undefined, today: string): Status {
  const typed = Boolean(r?.has_record && (r.number || r.expiry));
  const onFile = d.uploadCol && !d.fileOptional ? Boolean(r?.has_file) : Boolean(r?.has_file) || typed;
  if (!onFile) return "missing";
  if (!d.expiryCol) return "ok";
  if (!r?.expiry) return d.expiryOptional ? "ok" : "check";
  if (r.expiry < today) return "expired";
  const soon = new Date(`${today}T00:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + SOON_DAYS);
  return r.expiry <= soon.toISOString().slice(0, 10) ? "soon" : "ok";
}

export const STATUS_LABEL: Record<Status, string> = { ok: "Up to date", soon: "Expiring soon", expired: "Expired", missing: "Missing", check: "Office to check" };

/** Links to stored documents: Bubble's go through the app (copied into Supabase Storage at switch-over). */
export { fileHref } from "@/lib/files";
