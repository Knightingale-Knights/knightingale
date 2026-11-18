"use server";
import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { setNoteEmails } from "@/lib/coordinator/data";

/** The coordinator's own switch for progress note emails (an admin viewing as them can change it too). */
export async function noteEmailsAction(f: FormData) {
  const me = await requireCoordinator();
  await setNoteEmails(me.id, f.get("on") === "1");
  revalidatePath("/coordinator", "layout");
}
