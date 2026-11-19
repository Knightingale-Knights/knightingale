"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { setMiss } from "@/lib/carers/misses";

/** Saves the "missed" dropdown next to a carer on the Availability page. */
export async function missAction(f: FormData) {
  const staff = await requireStaff();
  const carer = String(f.get("carer") ?? "");
  const day = String(f.get("day") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(carer) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  await setMiss(carer, day, String(f.get("reason") ?? ""), staff.id);
  revalidatePath("/availability");
  revalidatePath("/active-carers");
}
