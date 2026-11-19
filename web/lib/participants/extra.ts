// The other participant sections from Bubble's admin participant card: About, Documents, Feedback, Funding,
// Incident Reports, Progress Notes and Survey.
import { sql } from "@/lib/db";
import { melbMidnight } from "@/lib/forms/fields";

const ID = /^[0-9a-f-]{36}$/i;

// ---- About (User.description) ----
export async function about(participant: string) {
  const [r] = await sql<{ description: string | null }[]>`select description from app.users where id = ${participant}`;
  return r?.description ?? "";
}
export async function saveAbout(participant: string, text: string) {
  await sql`update app.users set description = ${text.trim() || null}, updated_at = now() where id = ${participant}`;
}

// ---- Documents (Participant Documents) ----
export type Doc = { id: string; name: string | null; doc: string | null; audit: boolean | null; created_at: Date };
export function documents(participant: string) {
  return sql<Doc[]>`select id, name, doc, audit, created_at from app.participant_documents where participant = ${participant} order by created_at desc`;
}

// ---- Feedback (Feedback Form) ----
export type Feedback = {
  id: string; created_at: Date; name: string | null; behalf: string | null; date_signed: Date | null; phone: string | null; email: string | null;
  comms: string | null; help_details: string | null; feedback: string | null; outcome: string | null; signature: string | null;
};
export function feedbackFor(participant: string) {
  return sql<Feedback[]>`
    select id, created_at, name, behalf, date_signed, phone, email, comms, help_details, feedback, outcome, signature
      from app.feedback where participant = ${participant} order by created_at desc`;
}
export async function addFeedback(participant: string, f: FormData, by: string) {
  const g = (k: string) => String(f.get(k) ?? "").trim() || null;
  const day = g("date_signed");
  const sig = g("signature");
  await sql`insert into app.feedback ${sql({
    participant, created_by: by, name: g("name"), behalf: g("behalf"), phone: g("phone"), email: g("email"), comms: g("comms"),
    help_details: g("help_details"), feedback: g("feedback"), outcome: g("outcome"),
    date_signed: day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? melbMidnight(day) : null,
    signature: sig && sig.startsWith("data:image/png;base64,") ? sig : null,
  })}`;
}

// ---- Funding (NDIS Quarters) ----
export type Quarter = { id: string; start: Date | null; end_value: Date | null; amount: number | null; spent: number | null; rate: number | null; hours_per_week: number | null };
export function quarters(participant: string) {
  return sql<Quarter[]>`
    select id, start, end_value, amount::float as amount, spent::float as spent, rate::float as rate, hours_per_week::float as hours_per_week
      from app.ndis_quarters where participant = ${participant} order by start desc nulls last`;
}
export async function saveQuarter(participant: string, f: FormData, by: string) {
  const g = (k: string) => String(f.get(k) ?? "").trim();
  const day = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(g(k)) ? melbMidnight(g(k)) : null);
  const num = (k: string) => { const n = Number(g(k).replace(/[^\d.]/g, "")); return g(k) && Number.isFinite(n) ? n : null; };
  const v = { start: day("start"), end_value: day("end"), amount: num("amount"), spent: num("spent"), rate: num("rate"), hours_per_week: num("hours_per_week") };
  const id = g("quarter");
  if (ID.test(id)) await sql`update app.ndis_quarters set ${sql({ ...v, updated_at: new Date() })} where id = ${id} and participant = ${participant}`;
  else await sql`insert into app.ndis_quarters ${sql({ ...v, participant, created_by: by })}`;
}
export async function removeQuarter(participant: string, id: string) {
  if (ID.test(id)) await sql`delete from app.ndis_quarters where id = ${id} and participant = ${participant}`;
}

// ---- Incident Reports ----
export type IncidentRow = { id: string; day: Date | null; carer: string | null; type: string | null; description: string | null };
export function incidentsFor(participant: string) {
  return sql<IncidentRow[]>`
    select i.id, coalesce(i.incident_date, i.created_at) as day, trim(concat_ws(' ', c.first_name, c.last_name)) as carer,
           i.incident_type as type, i.incident_description as description
      from app.incidents i left join app.users c on c.id = i.carer
     where i.participant = ${participant} order by coalesce(i.incident_date, i.created_at) desc`;
}
export async function incident(participant: string, id: string) {
  if (!ID.test(id)) return null;
  const [r] = await sql<Record<string, unknown>[]>`
    select i.*, trim(concat_ws(' ', c.first_name, c.last_name)) as carer_name
      from app.incidents i left join app.users c on c.id = i.carer where i.id = ${id} and i.participant = ${participant}`;
  return r ?? null;
}

// ---- Survey (Participant Surveys) ----
export function surveys(participant: string) {
  return sql<Record<string, unknown>[]>`select * from app.participant_surveys where participant = ${participant} order by created_at desc`;
}
