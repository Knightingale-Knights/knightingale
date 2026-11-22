"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

/** Deactivates or reactivates a carer. Inactive carers can't sign in and drop off the active lists. */
export async function setCarerActiveAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id") ?? "");
  const on = form.get("active") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/compliance");
  await sql`update app.users set active = ${on}, updated_at = now() where id = ${id} and account_type = 'carer'`;
  revalidatePath(`/compliance/${id}`);
  redirect(`/compliance/${id}?status=${on ? "on" : "off"}`);
}
