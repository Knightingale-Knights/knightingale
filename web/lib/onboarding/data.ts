// Carer sign-up (rebuilt from Bubble's signup page): details, role, NDIS screening, documents, photo and ID, then submit.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { addDays } from "@/lib/roster/rules";
import { normalizePhone } from "@/lib/texts/rules";
import { carerDocs, setDetails, DOC_TYPES, MAX_DOC_BYTES } from "@/lib/compliance/data";
import { PHOTO_MIME, shrinkPhoto } from "@/lib/photo";
import type { DocKey } from "@/lib/compliance/docs";

type Tx = typeof sql;
export class SignupError extends Error {}

export const SIGNUP_ROLES = [["en", "Enrolled nurse (EN)"], ["rn", "Registered nurse (RN)"], ["pca", "Personal care assistant (PCA)"], ["dsw", "Disability support worker (DSW)"], ["student_nurse", "Student nurse"], ["cleaner", "Cleaner"]] as const;
export const SKILLS = [["cert_iii", "Certificate III"], ["certificate_iv", "Certificate IV"], ["en_degree", "Diploma of Nursing"], ["rn_degree", "Bachelor of Nursing"], ["student_nurse", "Student Nurse"]] as const;
export const SIGNUP_DOCS: DocKey[] = ["cpr", "first_aid", "police", "wwcc", "flu"];

/** Makes an applicant record the first time someone signs in through the join page. */
export async function ensureApplicant(email: string, authUserId: string | null) {
  const e = email.trim().toLowerCase();
  const [u] = await sql<{ id: string }[]>`select id from app.users where lower(email) = ${e}`;
  if (u) return { id: u.id, created: false };
  const [n] = await sql<{ id: string }[]>`
    insert into app.users (email, auth_user_id, account_type, active, account_status, notification)
    values (${e}, ${authUserId}, 'carer', false, false, false) returning id`;
  return { id: n.id, created: true };
}

export type Progress = {
  details: boolean; role: boolean; screening: boolean; documents: boolean; photo: boolean;
  missing: string[]; // what still stops them submitting (Bubble needed NDIS screening, a photo and CPR)
};

export type Applicant = {
  id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null; dob: string | null;
  address: string | null; roles: string[] | null; photo: string | null; resume: string | null; ndis_induction: string | null;
};

export async function applicant(id: string): Promise<Applicant | null> {
  const [a] = await sql<Applicant[]>`
    select id, email, first_name, last_name, phone_number as phone, ${melbDay("date_of_birth")} as dob,
           address->>'address' as address, roles, profile_photo as photo, resume, ndis_induction
      from app.users where id = ${id}`;
  return a ?? null;
}

export async function progress(id: string, today: string): Promise<Progress> {
  const a = await applicant(id);
  const docs = await carerDocs(id, today);
  const has = (k: DocKey) => docs.find((d) => d.def.key === k)!.status !== "missing";
  const [q] = await sql<{ n: number }[]>`select count(*)::int as n from app.qualifications where carer = ${id}`;
  const p = {
    details: Boolean(a?.first_name && a?.last_name && a?.phone && a?.dob && a?.address),
    role: Boolean(a?.roles?.length && q.n > 0),
    // Done once the clearance is uploaded (its expiry is read from it, or the office checks it) and it hasn't expired.
    screening: ((s) => Boolean(s && s.files.length && s.status !== "expired"))(docs.find((d) => d.def.key === "ndis_screening")),
    documents: SIGNUP_DOCS.every(has),
    photo: Boolean(a?.photo) && has("id"),
  };
  const missing = [
    !p.details && "your details",
    !p.role && "your role",
    !p.screening && "your NDIS worker screening",
    !has("cpr") && "your CPR certificate",
    !a?.photo && "a profile photo",
  ].filter((x): x is string => Boolean(x));
  return { ...p, missing };
}

export type DetailsInput = { first: string; last: string; phone: string; dob: string; address: string };

export async function saveDetails(id: string, i: DetailsInput, today: string) {
  const first = i.first.trim().slice(0, 60);
  const last = i.last.trim().slice(0, 60);
  if (!first || !last) throw new SignupError("Enter your first and last name.");
  const phone = normalizePhone(i.phone);
  if (!phone) throw new SignupError("Enter an Australian mobile number, like 0412 345 678.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.dob) || i.dob > addDays(today, -16 * 365) || i.dob < "1930-01-01") throw new SignupError("Enter your date of birth.");
  const address = i.address.trim().slice(0, 300);
  if (address.length < 8) throw new SignupError("Enter your home address.");
  // As in Bubble: one account per mobile number.
  const local = "0" + phone.slice(3);
  const [dup] = await sql<{ n: number }[]>`
    select count(*)::int as n from app.users
     where id <> ${id} and regexp_replace(coalesce(phone_number, ''), '[\\s().-]', '', 'g') in (${phone}, ${local})`;
  if (dup.n) throw new SignupError("That mobile number is already registered. Please sign in with the email you used before, or call us.");
  const [before] = await sql<{ first_name: string | null }[]>`select first_name from app.users where id = ${id}`;
  const [d, m] = [i.dob.slice(8, 10), i.dob.slice(5, 7)];
  await sql`
    update app.users set first_name = ${first}, last_name = ${last}, phone_number = ${local}, date_of_birth = ${fromDay(i.dob)},
           bday_text = ${`${d}/${m}`}, address = ${sql.json({ address })}
     where id = ${id}`;
  return { firstTime: !before?.first_name };
}

export type RoleInput = { roles: string[]; skill: string; ahpraNumber: string };

/** Role and qualification, as Bubble's QualificationsNextButton: student nurses can also work as PCA and DSW. */
export async function saveRole(id: string, i: RoleInput, today: string) {
  const allowed = SIGNUP_ROLES.map(([k]) => k as string);
  let roles = [...new Set(i.roles.filter((r) => allowed.includes(r)))];
  if (!roles.length) throw new SignupError("Choose at least one role.");
  if (roles.includes("student_nurse")) roles = [...new Set([...roles, "pca", "dsw"])];
  const nurse = roles.includes("en") || roles.includes("rn");
  const ahpra = i.ahpraNumber.trim().toUpperCase().slice(0, 30);
  if (nurse && !/^NMW\d{10}$/.test(ahpra)) throw new SignupError("Enter your AHPRA registration number, like NMW0001234567.");
  const skill = SKILLS.find(([k]) => k === i.skill)?.[0] ?? null;
  // PCA and DSW qualifications don't expire; Bubble set them 10 years out.
  // A nurse's AHPRA expiry is read from their uploaded registration, never typed in: keep whatever is on file.
  await sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    await tx`update app.users set roles = ${roles}::text[] where id = ${id}`;
    const [q] = await tx<{ id: string; transcript: string[] | null; ahpra: string[] | null; expiry: Date | null }[]>`
      select id, transcript, ahpra, expiry from app.qualifications where carer = ${id} order by created_at desc limit 1`;
    await tx`
      insert into app.qualifications (carer, role, qualifications, registration_number, expiry, transcript, ahpra, created_by)
      values (${id}, ${roles}::text[], ${skill ? [skill] : []}::text[], ${nurse ? ahpra : null}, ${nurse ? (q?.expiry ?? null) : roles.some((r) => r === "pca" || r === "dsw") ? fromDay(addDays(today, 3652)) : null},
              ${q?.transcript ?? null}, ${q?.ahpra ?? null}, ${id})`;
  });
  return roles;
}

export type ProfileFile = "photo" | "resume" | "ndis_induction";
const PROFILE_COL: Record<ProfileFile, string> = { photo: "profile_photo", resume: "resume", ndis_induction: "ndis_induction" };

/** Profile photo, resume and NDIS induction certificate are kept on the user, as in Bubble. */
export async function uploadProfileFile(id: string, kind: ProfileFile, file: { name: string; type: string; bytes: Buffer }) {
  const types = kind === "photo" ? ["image/jpeg", "image/png", "image/webp"] : DOC_TYPES;
  if (!types.includes(file.type)) throw new SignupError(kind === "photo" ? "Upload a photo (JPG or PNG)." : "Upload a photo or a PDF.");
  if (!file.bytes.length || file.bytes.length > MAX_DOC_BYTES) throw new SignupError("That file is too big or empty.");
  if (kind === "photo") {
    try {
      file = { name: (file.name || "photo").replace(/\.\w+$/, "") + ".webp", type: PHOTO_MIME, bytes: await shrinkPhoto(file.bytes) };
    } catch {
      throw new SignupError("That photo couldn't be read. Try a JPG or PNG.");
    }
  }
  const name = (file.name || kind).replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  const [f] = await sql<{ id: string }[]>`
    insert into app.compliance_files (carer, doc, file_name, mime, bytes, uploaded_by)
    values (${id}, ${kind}, ${name}, ${file.type}, ${file.bytes}, ${id}) returning id`;
  await sql`update app.users set ${sql(PROFILE_COL[kind])} = ${`/files/${f.id}`} where id = ${id}`;
  return `/files/${f.id}`;
}

async function postmarkTemplate(templateId: number, to: string, carer: string, cc?: string) {
  if (!env.postmarkToken) return;
  const res = await fetch("https://api.postmarkapp.com/email/withTemplate", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": env.postmarkToken },
    body: JSON.stringify({
      TemplateId: templateId, From: env.fromEmail, To: to, ...(cc ? { Cc: cc } : {}), MessageStream: "outbound",
      TemplateModel: { carer, action_url: "https://knightingale.com.au/carers", support_url: "https://knightingale.com.au", company_name: "Knightingale", company_address: "Melbourne, Victoria" },
    }),
  });
  if (!res.ok) console.error("postmark template failed", templateId, res.status);
}

// The Postmark templates Bubble used.
export const WELCOME_TEMPLATE = 40922058;
export const NEW_SIGNUP_TEMPLATE = 40977848;

export async function sendWelcome(email: string, first: string) {
  await postmarkTemplate(WELCOME_TEMPLATE, email, first);
}

/** Submits the application: the carer becomes active and waits for approval, as Bubble's CompleteSignUpButton did. */
export async function submitApplication(id: string, today: string) {
  const p = await progress(id, today);
  if (p.missing.length) throw new SignupError(`Please add ${p.missing.join(", ")} first.`);
  const [u] = await sql<{ email: string; first_name: string }[]>`
    update app.users set active = true, account_status = false, notification = true where id = ${id} returning email, first_name`;
  await postmarkTemplate(NEW_SIGNUP_TEMPLATE, u.email, u.first_name, env.ccEmail);
}

// ---- office ---------------------------------------------------------------------

export type ApplicantRow = { id: string; name: string; email: string; phone: string | null; roles: string[] | null; created_at: Date; submitted: boolean };

/** Applications, A to Z: submitted and waiting for approval, or still in progress (last 90 days). */
export async function applications() {
  return sql<ApplicantRow[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name, email, phone_number as phone, roles, created_at,
           coalesce(active, false) as submitted
      from app.users
     where account_type = 'carer' and not coalesce(account_status, false)
       and (active or created_at > now() - interval '90 days')
     order by lower(trim(concat_ws(' ', first_name, last_name))), created_at desc
     limit 2000`;
}

export async function approve(id: string) {
  const [u] = await sql<{ id: string }[]>`
    update app.users set account_status = true, active = true where id = ${id} and account_type = 'carer' returning id`;
  if (!u) throw new SignupError("That applicant no longer exists.");
}
