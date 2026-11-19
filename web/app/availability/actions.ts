"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { setMiss } from "@/lib/carers/misses";
import { adminSetSlot } from "@/lib/carers/data";

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

/** Turns a carer's AM / PM / NS slot on or off for the day. */
export async function slotAction(f: FormData) {
  const staff = await requireStaff();
  const carer = String(f.get("carer") ?? "");
  const day = String(f.get("day") ?? "");
  const period = String(f.get("period") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(carer) || !["AM", "PM", "NS"].includes(period)) return;
  await adminSetSlot(carer, day, period as "AM" | "PM" | "NS", f.get("on") === "1", staff.id);
  revalidatePath("/availability");
}
