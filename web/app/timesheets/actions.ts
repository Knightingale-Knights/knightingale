"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteShift } from "@/lib/roster/mutate";
import { prepareDelete } from "@/lib/klarra/push";
import { deleteShiftInBubble, mirrorAvailability } from "@/lib/bubble/write";

/** The ✕ on a timesheet card: deletes the shift here and in Bubble, then returns to the same period. */
export async function deleteTimesheetShiftAction(f: FormData) {
  await requireStaff();
  const id = String(f.get("id") ?? "");
  const p = new URLSearchParams();
  for (const k of ["from", "to", "q"]) if (f.get(k)) p.set(k, String(f.get(k)));
  try {
    const since = new Date();
    const [row] = await sql<{ bubble_id: string | null }[]>`select bubble_id from app.shifts where id = ${id}`;
    const told = await prepareDelete(id);
    await deleteShift(id);
    await told();
    p.set("msg", "Shift deleted.");
    try {
      await deleteShiftInBubble(row?.bubble_id ?? null);
      await mirrorAvailability(since);
    } catch (e) {
      console.error("bubble write failed", e);
      p.set("warn", `Deleted here, but Bubble was not updated: ${(e as Error).message}`);
    }
  } catch (e) {
    p.set("error", (e as Error).message);
  }
  revalidatePath("/timesheets");
  redirect(`/timesheets?${p}`);
}
