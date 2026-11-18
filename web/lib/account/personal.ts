// Personal Details on the carer Account page. Carers edit their own; changing the email also changes their sign-in.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/texts/rules";
import { addDays } from "@/lib/roster/rules";
import { fromDay } from "@/lib/roster/queries";

export class DetailsError extends Error {}

export type Personal = {
  first: string; middle: string; last: string; phone: string; dob: string; address: string; email: string;
  can_drive: boolean | null; about: string; em_name: string; em_relationship: string; em_phone: string;
};

export async function personalDetails(id: string): Promise<Personal> {
  const [r] = await sql<Personal[]>`
    select coalesce(first_name, '') as first, coalesce(middle_name, '') as middle, coalesce(last_name, '') as last,
           coalesce(phone_number, '') as phone,
           coalesce(to_char(date_of_birth at time zone 'Australia/Melbourne', 'YYYY-MM-DD'), '') as dob,
           coalesce(address->>'address', '') as address, coalesce(email, '') as email, can_drive,
           coalesce(description, '') as about, coalesce(emergency_name, '') as em_name,
           coalesce(emergency_relationship, '') as em_relationship, coalesce(emergency_phone, '') as em_phone
      from app.users where id = ${id}`;
  return r;
}

const clean = (v: string, n: number) => v.trim().replace(/\s+/g, " ").slice(0, n);

/** Finds the address on Google, so the map and travel distances keep working. Best effort. */
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!env.googleMapsKey) return null;
  try {
    const u = `https://maps.googleapis.com/maps/api/geocode/json?region=au&address=${encodeURIComponent(address)}&key=${env.googleMapsKey}`;
    const j = await (await fetch(u, { signal: AbortSignal.timeout(8000) })).json();
    const loc = j?.results?.[0]?.geometry?.location;
    return typeof loc?.lat === "number" && typeof loc?.lng === "number" ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

/** Moves the person's sign-in to a new email. Returns false if Supabase refused. */
async function moveSignIn(oldEmail: string, newEmail: string) {
  let a: { id: string } | undefined;
  try {
    [a] = await sql<{ id: string }[]>`select id from auth.users where lower(email) = ${oldEmail.toLowerCase()} limit 1`;
  } catch (e) {
    console.error("auth lookup failed", e);
    return false;
  }
  if (!a) return true; // never signed in here yet: they'll sign in with the new email
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !base) return false;
  const res = await fetch(`${base}/auth/v1/admin/users/${a.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail, email_confirm: true }),
  });
  return res.ok;
}

export async function savePersonal(id: string, i: Personal, today: string) {
  const first = clean(i.first, 60), middle = clean(i.middle, 60), last = clean(i.last, 60);
  if (!first || !last) throw new DetailsError("Enter your first and last name.");
  const phone = normalizePhone(i.phone);
  if (!phone || !phone.startsWith("+61")) throw new DetailsError("Enter an Australian mobile number, like 0412 345 678.");
  const local = "0" + phone.slice(3);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.dob) || i.dob > addDays(today, -16 * 365) || i.dob < "1930-01-01") throw new DetailsError("Enter your date of birth.");
  const address = clean(i.address, 300);
  if (address.length < 8) throw new DetailsError("Enter your home address.");
  const email = i.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) throw new DetailsError("Enter a valid email address.");
  const emPhoneRaw = i.em_phone.trim();
  const emPhone = emPhoneRaw ? normalizePhone(emPhoneRaw) : null;
  if (emPhoneRaw && !emPhone) throw new DetailsError("Enter a valid phone number for your emergency contact.");
  const emLocal = emPhone?.startsWith("+61") ? "0" + emPhone.slice(3) : emPhone;

  const [dup] = await sql<{ phone: number; email: number }[]>`
    select count(*) filter (where regexp_replace(coalesce(phone_number, ''), '[\\s().-]', '', 'g') in (${phone}, ${local}))::int as phone,
           count(*) filter (where lower(email) = ${email})::int as email
      from app.users where id <> ${id}`;
  if (dup.phone) throw new DetailsError("That mobile number is already used by another account. Please call us.");
  if (dup.email) throw new DetailsError("That email is already used by another account. Please call us.");

  const [cur] = await sql<{ email: string | null; address: { address?: string; lat?: number; lng?: number } | null }[]>`
    select email, address from app.users where id = ${id}`;
  if (cur.email && cur.email.toLowerCase() !== email && !(await moveSignIn(cur.email, email))) {
    throw new DetailsError("We couldn't change your sign-in email. Please try again, or call us.");
  }
  let addr = cur.address ?? {};
  if ((addr.address ?? "") !== address) {
    const pos = await geocode(address);
    addr = { address, ...(pos ?? {}) };
  }
  const [d, m] = [i.dob.slice(8, 10), i.dob.slice(5, 7)];
  await sql`
    update app.users set first_name = ${first}, middle_name = ${middle || null}, last_name = ${last}, phone_number = ${local},
           date_of_birth = ${fromDay(i.dob)}, bday_text = ${`${d}/${m}`}, address = ${sql.json(addr)}, email = ${email},
           can_drive = ${i.can_drive},
           emergency_name = ${clean(i.em_name, 100) || null}, emergency_relationship = ${clean(i.em_relationship, 60) || null},
           emergency_phone = ${emLocal}
     where id = ${id}`;
  return { emailChanged: (cur.email ?? "").toLowerCase() !== email };
}
