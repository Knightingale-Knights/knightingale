"use server";
import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { setNoteEmails } from "@/lib/coordinator/data";

/** The coordinator's own switch for progress note emails. Viewing as them never changes it. */
export async function noteEmailsAction(f: FormData) {
  const me = await requireCoordinator();
  if (me.viewAs) return;
  await setNoteEmails(me.id, f.get("on") === "1");
  revalidatePath("/coordinator", "layout");
}
