"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFacility } from "@/lib/auth";
import { bookShift } from "@/lib/facility/data";
import { BookingError } from "@/lib/facility/rules";
import { isoDate } from "@/lib/invoicing/rules";

export async function bookAction(f: FormData) {
  const me = await requireFacility();
  const get = (k: string) => String(f.get(k) ?? "");
  let dest = "/facility?booked=1";
  try {
    await bookShift(me, { day: get("day"), start: get("start"), end: get("end"), role: get("role"), notes: get("notes") }, isoDate(new Date()));
  } catch (e) {
    if (!(e instanceof BookingError)) console.error(e);
    dest = `/facility?error=${encodeURIComponent(e instanceof BookingError ? e.message : "Something went wrong. Please try again.")}`;
  }
  revalidatePath("/facility");
  redirect(dest);
}
