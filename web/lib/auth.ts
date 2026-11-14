import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";

export type Staff = { id: string; email: string; name: string };
export type Role = "admin" | "carer" | "facility" | "applicant";
export type AppUser = Staff & { role: Role; roles: string[] | null; phone: string | null; approved: boolean };

const extraAdmins = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * The signed-in person, matched to their app user by email.
 * Admin = account type "admin" or listed in ADMIN_EMAILS. Carer = active account type "carer".
 * Facility = account type "location" (shown as Client in Bubble), unless made inactive.
 * Applicant = a carer who hasn't finished signing up (not active, never approved).
 * Anyone else (participants, locations, inactive carers) gets no access yet.
 */
export async function currentUser(): Promise<AppUser | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const [u] = await sql<(Omit<AppUser, "role" | "approved"> & { account_type: string | null; active: boolean | null; account_status: boolean | null })[]>`
    select id, email, trim(concat_ws(' ', first_name, last_name)) as name, account_type, active, account_status, roles, phone_number as phone
      from app.users where lower(email) = ${email}`;
  if (!u) return null;
  const role = u.account_type === "admin" || extraAdmins().includes(email)
    ? "admin"
    : u.account_type === "carer" && u.active ? "carer"
    : u.account_type === "location" && u.active !== false ? "facility"
    : u.account_type === "carer" && !u.active && !u.account_status ? "applicant" : null;
  if (!role) return null;
  return { id: u.id, email: u.email, name: u.name, roles: u.roles, phone: u.phone, role, approved: Boolean(u.account_status) };
}

export async function currentStaff(): Promise<Staff | null> {
  const u = await currentUser();
  return u?.role === "admin" ? u : null;
}

export async function requireStaff(): Promise<Staff> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "admin") redirect(homePath(u.role));
  return u;
}

export async function requireCarer(): Promise<AppUser> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "carer") redirect(homePath(u.role));
  return u;
}

export async function requireFacility(): Promise<AppUser> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "facility") redirect(homePath(u.role));
  return u;
}

export async function requireApplicant(): Promise<AppUser> {
  const u = await currentUser();
  if (!u) redirect("/join");
  if (u.role !== "applicant") redirect(homePath(u.role));
  return u;
}

export const homePath = (role: Role) =>
  role === "carer" ? "/carer" : role === "facility" ? "/facility" : role === "applicant" ? "/join/details" : "/roster";

/** Where someone lands after signing in. */
export async function homeFor(): Promise<string> {
  const u = await currentUser();
  return u ? homePath(u.role) : "/login?error=" + encodeURIComponent("This email doesn't have access yet.");
}
