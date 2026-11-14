import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";

export type Staff = { id: string; email: string; name: string };

const extraAdmins = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** The signed-in staff member, or null. Admin = Bubble account type "admin", or listed in ADMIN_EMAILS. */
export async function currentStaff(): Promise<Staff | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const [u] = await sql<Staff[]>`
    select id, email, trim(concat_ws(' ', first_name, last_name)) as name
      from app.users where lower(email) = ${email}
       and (account_type = 'admin' or ${extraAdmins().includes(email)})`;
  return u ?? null;
}

export async function requireStaff(): Promise<Staff> {
  const s = await currentStaff();
  if (!s) redirect("/login");
  return s;
}
