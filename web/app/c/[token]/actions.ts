"use server";
import { env } from "@/lib/env";
import { checkIn, checkOut } from "@/lib/carer/data";
import { CheckError, type Position } from "@/lib/carer/rules";
import { linkExpired, verifyLink } from "@/lib/texts/rules";
import { shiftForLink } from "@/lib/texts/data";
import type { CheckResult } from "@/app/carer/actions";

/** Check in or out from a texted link. The signed link stands in for signing in, for that one shift only. */
export async function linkCheckAction(token: string, pos: Position): Promise<CheckResult> {
  const t = verifyLink(env.linkSecret, token);
  if (!t) return { ok: false, message: "This link isn't valid." };
  const s = await shiftForLink(t.shiftId);
  if (!s) return { ok: false, message: "We couldn't find this shift." };
  if (s.cancelled) return { ok: false, message: "This shift has been cancelled." };
  if (linkExpired(t.kind, s.start_at.getTime(), s.end_at.getTime(), Date.now())) return { ok: false, message: "This link has expired. Text Klarra for a new one." };
  try {
    if (t.kind === "in") {
      const r = await checkIn(s.carer, s.id, pos);
      return { ok: true, message: r.autoCheckedOut ? "You're checked in. Your check-out is recorded at the scheduled end." : "You're checked in. Have a great shift!" };
    }
    await checkOut(s.carer, s.id, pos);
    return { ok: true, message: "You're checked out. Thank you!" };
  } catch (e) {
    if (e instanceof CheckError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
