"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { approve } from "@/lib/onboarding/data";

export async function approveAction(f: FormData) {
  await requireStaff();
  const id = String(f.get("id") ?? "");
  let dest = "/applicants?approved=1";
  try { await approve(id); } catch (e) { dest = `/applicants?error=${encodeURIComponent(String((e as Error).message ?? e))}`; }
  revalidatePath("/applicants");
  redirect(dest);
}
