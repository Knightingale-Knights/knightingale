"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { deleteNotice, resetReads, saveNotice, setActive } from "@/lib/notices/data";

export async function saveNoticeAction(f: FormData) {
  const staff = await requireStaff();
  let dest = "/notices?msg=" + encodeURIComponent("Saved.");
  try {
    await saveNotice(f, staff.id);
  } catch (e) {
    const id = String(f.get("id") ?? "");
    dest = `/notices?edit=${id || "new"}&error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath("/notices");
  redirect(dest);
}

export async function noticeOpAction(f: FormData) {
  await requireStaff();
  const id = String(f.get("id") ?? "");
  const op = String(f.get("op") ?? "");
  let msg = "";
  if (op === "on" || op === "off") { await setActive(id, op === "on"); msg = op === "on" ? "Turned on." : "Turned off."; }
  else if (op === "reset") { await resetReads(id); msg = "Everyone will see it again."; }
  else if (op === "delete") { await deleteNotice(id); msg = "Deleted."; }
  revalidatePath("/notices");
  redirect(`/notices?msg=${encodeURIComponent(msg)}`);
}
