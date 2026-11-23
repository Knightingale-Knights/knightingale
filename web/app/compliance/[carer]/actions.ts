"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { approve } from "@/lib/onboarding/data";

/** Deactivates or reactivates a carer. Inactive carers can still sign in, but drop off the active lists and their availability is hidden; deactivating also deletes their availability from today on. */
export async function setCarerActiveAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id") ?? "");
  const on = form.get("active") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/compliance");
  await sql.begin(async (tx) => {
    await tx`update app.users set active = ${on}, updated_at = now() where id = ${id} and account_type = 'carer'`;
    // Deactivating clears their availability from today on (slots already booked into a shift stay).
    if (!on) await tx`
      delete from app.availability
       where carer = ${id} and coalesce(accepted, '') <> 'YES'
         and date >= date_trunc('day', now() at time zone 'Australia/Melbourne') at time zone 'Australia/Melbourne'`;
  });
  revalidatePath(`/compliance/${id}`);
  redirect(`/compliance/${id}?status=${on ? "on" : "off"}`);
}

/** Approves an applicant (same as Approve on the Applicants page): they become an active carer. */
export async function approveCarerAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/compliance");
  try {
    await approve(id);
  } catch (e) {
    redirect(`/compliance/${id}?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/compliance/${id}`);
  revalidatePath("/applicants");
  redirect(`/compliance/${id}?status=approved`);
}
