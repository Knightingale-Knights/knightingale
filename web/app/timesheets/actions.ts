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

// ---- Pay -------------------------------------------------------------------------
import { createPayslip, PayError } from "@/lib/payroll/pay";

/** The Pay popup's Submit: saves the payslip (and the carer's running totals), then returns to the same period. */
export async function payAction(f: FormData) {
  const staff = await requireStaff();
  const p = new URLSearchParams();
  for (const k of ["from", "to", "q"]) if (f.get(k)) p.set(k, String(f.get(k)));
  const num = (k: string) => Number(String(f.get(k) ?? "").replace(/[$,\s]/g, ""));
  const day = (k: string) => String(f.get(k) ?? "");
  try {
    await createPayslip(String(f.get("carer") ?? ""), staff.id, {
      gross: num("gross"), tax: num("tax"), hours: num("hours"), reimbursements: num("reimbursements"),
      super: Math.round(num("super") * 100) / 100, net: Math.round(num("net") * 100) / 100, start: day("start"), end: day("end"), paid: day("paid"),
    });
    p.set("paid", String(f.get("name") ?? "the carer"));
  } catch (e) {
    if (!(e instanceof PayError)) console.error("pay failed", e);
    p.set("error", e instanceof PayError ? e.message : "The payslip could not be saved. Please try again.");
    p.set("pay", String(f.get("carer") ?? ""));
  }
  revalidatePath("/timesheets");
  redirect(`/timesheets?${p}`);
}
