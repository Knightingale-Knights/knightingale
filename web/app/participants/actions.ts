"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { saveIntake } from "@/lib/participants/intake";

export async function saveIntakeAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  let dest = `/participants/${id}/intake?msg=${encodeURIComponent("Intake saved.")}`;
  try {
    await saveIntake(id, f, staff.id);
  } catch (e) {
    console.error("intake save failed", e);
    dest = `/participants/${id}/intake?error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath(`/participants/${id}`);
  redirect(dest);
}

// ---- other participant documents (Privacy Consent Form, Emergency Plan) ---------------
import { DOCS, saveDoc } from "@/lib/participants/docs";

export async function saveDocAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  const d = DOCS[String(f.get("doc") ?? "")];
  if (!d) redirect(`/participants/${id}`);
  let dest = `/participants/${id}/${d.key}?msg=${encodeURIComponent(`${d.title} saved.`)}`;
  try {
    await saveDoc(d, id, f, staff.id);
  } catch (e) {
    console.error("doc save failed", e);
    dest = `/participants/${id}/${d.key}?error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath(`/participants/${id}`);
  redirect(dest);
}
