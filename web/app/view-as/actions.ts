"use server";
import { redirect } from "next/navigation";
import { homePath, signedInUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { startViewAs, stopViewAs, viewAsSession } from "@/lib/viewAs";

/** Admin only: see and use the app as this user (carer, facility, applicant or coordinator). */
export async function startViewAsAction(f: FormData) {
  const me = await signedInUser();
  if (me?.role !== "admin") redirect("/login");
  const target = String(f.get("user") ?? "");
  const [t] = await sql<{ id: string; account_type: string | null; active: boolean | null; account_status: boolean | null }[]>`
    select id, account_type, active, account_status from app.users where id = ${target}`;
  const role = !t ? null
    : t.account_type === "carer" && t.active ? "carer"
    : t.account_type === "location" && t.active !== false ? "facility"
    : t.account_type === "carer" && !t.active && !t.account_status ? "applicant"
    : t.account_type === "resident" && t.active !== false ? "coordinator" : null;
  if (!role) redirect(`${String(f.get("back") || "/active-carers")}?error=${encodeURIComponent("This person has no app view to open.")}`);
  await startViewAs(me, target);
  redirect(homePath(role));
}

/** Leaves the user's view and returns to the admin pages. */
export async function stopViewAsAction() {
  const me = await signedInUser();
  if (me?.role !== "admin") redirect("/login");
  const v = await viewAsSession(me.email);
  await stopViewAs(v?.session ?? null);
  if (!v) redirect("/roster");
  const [t] = await sql<{ account_type: string | null }[]>`select account_type from app.users where id = ${v.target}`;
  redirect(t?.account_type === "resident" ? "/coordinators" : t?.account_type === "location" ? "/sites" : `/compliance/${v.target}`);
}
