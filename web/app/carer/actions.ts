"use server";
import { requestSummary } from "@/lib/carer/summary";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser, requireCarer } from "@/lib/auth";
import { markRead } from "@/lib/notices/data";
import { checkIn, checkOut, myShift, setAvailability, submitNote } from "@/lib/carer/data";
import { CheckError, type Position } from "@/lib/carer/rules";
import { isoDate } from "@/lib/invoicing/rules";
import { accountNag } from "@/lib/account/nag";

export type CheckResult = { ok: true; message: string } | { ok: false; message: string };

/** Called from the phone with its location. Returns a message instead of throwing, for the page to show. */
export async function checkAction(kind: "in" | "out", shiftId: string, pos: Position): Promise<CheckResult> {
  const me = await requireCarer();
  try {
    if (kind === "in" && !me.viewAs && (await accountNag(me.id, isoDate(new Date()), false)).blocked) {
      return { ok: false, message: "Please finish the items in your Account first. As soon as they're done, you can check in." };
    }
    if (kind === "in") {
      const r = await checkIn(me.id, shiftId, pos);
      revalidatePath("/carer");
      return { ok: true, message: r.autoCheckedOut ? "You're checked in. Your check-out is recorded at the scheduled end." : "You're checked in. Have a great shift!" };
    }
    await checkOut(me.id, shiftId, pos);
    revalidatePath("/carer");
    return { ok: true, message: "You're checked out. Thank you!" };
  } catch (e) {
    if (e instanceof CheckError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/** Back to one view of the shift's Details popup on the day page. */
async function detailsDest(carer: string, id: string, tab: string, q: Record<string, string>) {
  const s = await myShift(carer, id);
  const p = new URLSearchParams({ date: s?.day ?? isoDate(new Date()), details: id, ...(tab ? { tab } : {}), ...q });
  return `/carer?${p}`;
}

export async function noteAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let tab = "", q: Record<string, string> = { saved: "1" };
  try {
    await submitNote(me.id, id, String(f.get("summary") ?? ""), { comms: String(f.get("comms") ?? ""), bestDay: String(f.get("best_day") ?? "") });
  } catch (e) {
    tab = "notes";
    q = { error: String((e as Error).message ?? e) };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, tab, q));
}

export async function availabilityAction(f: FormData) {
  const me = await requireCarer();
  const day = String(f.get("day") ?? "");
  const from = String(f.get("from") ?? "");
  let dest = `/carer/availability?from=${from}`;
  // Carers finish the Culture of Care videos before giving availability (staff viewing as them can still change it).
  if (!me.viewAs && !(await cultureProgress(me.id)).complete) redirect("/carer/availability");
  try {
    await setAvailability(me, day, String(f.get("slot") ?? ""), f.get("on") === "1", isoDate(new Date()));
  } catch (e) {
    dest += `&error=${encodeURIComponent(String((e as Error).message ?? e))}`;
  }
  revalidatePath("/carer/availability");
  redirect(dest);
}

import { cultureProgress } from "@/lib/culture/data";

// ---- travel and receipts ------------------------------------------------------
import { addReceipt, addTravel, removeReceipt, removeTravel, TravelError } from "@/lib/carer/travel";

const errMsg = (e: unknown) => (e instanceof TravelError ? e.message : (console.error(e), "Something went wrong. Please try again."));

export async function travelAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let q: Record<string, string> = { travel: "1" };
  try {
    await addTravel(me.id, id, String(f.get("from") ?? ""), String(f.get("to") ?? ""));
  } catch (e) {
    q = { xerror: errMsg(e) };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, "trip", q));
}

export async function removeTravelAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let q: Record<string, string> = {};
  try {
    await removeTravel(me.id, String(f.get("log") ?? ""));
  } catch (e) {
    q = { xerror: errMsg(e) };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, "trip", q));
}

export type ReceiptResult = { ok: boolean; message: string };

/** Called by the upload button with the (already shrunk) file. */
export async function receiptAction(f: FormData): Promise<ReceiptResult> {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  const file = f.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose a receipt to upload." };
  try {
    const r = await addReceipt(me.id, id, { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
    revalidatePath("/carer");
    const t = r.reading;
    if (t && !t.needsReview && t.total != null) return { ok: true, message: `Receipt added: $${t.total.toFixed(2)}${t.merchant ? ` at ${t.merchant}` : ""}.` };
    if (t?.reason === "not_a_receipt") return { ok: true, message: "Uploaded, but it doesn't look like a receipt. The office will check it." };
    return { ok: true, message: "Receipt uploaded. The office will check the total." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

export async function removeReceiptAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let q: Record<string, string> = { view: "1" };
  try {
    await removeReceipt(me.id, String(f.get("receipt") ?? ""));
  } catch (e) {
    q = { view: "1", xerror: errMsg(e) };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, "receipts", q));
}

/** Emails the participant's support summary to the carer. */
export async function requestSummaryAction(f: FormData) {
  const me = await requireCarer();
  const shift = String(f.get("shift") ?? "");
  const day = String(f.get("date") ?? "");
  const back = new URLSearchParams(f.get("in") === "details" ? { date: day, details: shift, tab: "summary" } : { date: day, summary: shift });
  try {
    const first = await requestSummary(me, shift);
    back.set("sent", `${first}'s summary is on its way to ${me.email}.`);
  } catch (e) {
    back.set("summary_error", (e as Error).message);
  }
  redirect(`/carer?${back}`);
}

// ---- participant forms from the Details popup -----------------------------------
import { saveIntake } from "@/lib/participants/intake";
import { createIncident, IncidentError } from "@/lib/participants/incident";

/** The participant on one of this carer's NDIS shifts, or null. */
async function shiftParticipant(carer: string, shiftId: string) {
  const s = await myShift(carer, shiftId);
  return s && s.kind === "ndis" && s.participant ? s.participant : null;
}

export async function carerIntakeAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let tab = "", q: Record<string, string> = { done: "Intake saved." };
  try {
    const p = await shiftParticipant(me.id, id);
    if (!p) throw new Error("We couldn't find this shift.");
    await saveIntake(p, f, me.id);
  } catch (e) {
    console.error("carer intake save failed", e);
    tab = "intake";
    q = { error: (e as Error).message };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, tab, q));
}

export async function incidentAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let tab = "", q: Record<string, string> = { done: "Incident report sent. Thank you." };
  try {
    await createIncident(me, id, f);
  } catch (e) {
    if (!(e instanceof IncidentError)) console.error("incident save failed", e);
    tab = "incident";
    q = { error: e instanceof IncidentError ? e.message : "Something went wrong. Please try again." };
  }
  revalidatePath("/carer");
  redirect(await detailsDest(me.id, id, tab, q));
}

// ---- away (holiday or sick) --------------------------------------------------
import { addAway, AwayError, removeAway } from "@/lib/carer/away";

export async function awayAction(f: FormData) {
  const me = await requireCarer();
  let dest = "/carer/availability?away=saved";
  if (me.viewAs) redirect("/carer/availability?error=" + encodeURIComponent("Only the carer can mark themselves away."));
  try {
    const clash = await addAway(me, {
      from: String(f.get("from_day") ?? ""), to: String(f.get("to_day") ?? ""),
      reason: String(f.get("reason") ?? ""), note: String(f.get("note") ?? ""),
    }, isoDate(new Date()));
    if (clash) dest = `/carer/availability?away=rostered&n=${clash}`;
  } catch (e) {
    dest = "/carer/availability?error=" + encodeURIComponent(e instanceof AwayError ? e.message : (console.error(e), "Something went wrong. Please try again."));
  }
  revalidatePath("/carer/availability");
  redirect(dest);
}

export async function removeAwayAction(f: FormData) {
  const me = await requireCarer();
  if (!me.viewAs) await removeAway(me.id, String(f.get("id") ?? ""));
  revalidatePath("/carer/availability");
  redirect("/carer/availability");
}

/** "Got it" on an office notice. Not recorded while the office is viewing as the carer. */
export async function noticeReadAction(f: FormData) {
  const me = await currentUser();
  if (!me || me.role !== "carer" || me.viewAs) return;
  await markRead(String(f.get("notice") ?? ""), me.id);
}
