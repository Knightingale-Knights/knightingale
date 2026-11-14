"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCarer } from "@/lib/auth";
import { checkIn, checkOut, setAvailability, submitNote } from "@/lib/carer/data";
import { CheckError, type Position } from "@/lib/carer/rules";
import { isoDate } from "@/lib/invoicing/rules";

export type CheckResult = { ok: true; message: string } | { ok: false; message: string };

/** Called from the phone with its location. Returns a message instead of throwing, for the page to show. */
export async function checkAction(kind: "in" | "out", shiftId: string, pos: Position): Promise<CheckResult> {
  const me = await requireCarer();
  try {
    if (kind === "in") {
      const r = await checkIn(me.id, shiftId, pos);
      revalidatePath(`/carer/shift/${shiftId}`);
      return { ok: true, message: r.autoCheckedOut ? "You're checked in. Your check-out is recorded at the scheduled end." : "You're checked in. Have a great shift!" };
    }
    await checkOut(me.id, shiftId, pos);
    revalidatePath(`/carer/shift/${shiftId}`);
    return { ok: true, message: "You're checked out. Thank you!" };
  } catch (e) {
    if (e instanceof CheckError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function noteAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let dest = `/carer/shift/${id}?saved=1`;
  try {
    await submitNote(me.id, id, String(f.get("summary") ?? ""));
  } catch (e) {
    dest = `/carer/shift/${id}?error=${encodeURIComponent(String((e as Error).message ?? e))}`;
  }
  revalidatePath(`/carer/shift/${id}`);
  redirect(dest);
}

export async function availabilityAction(f: FormData) {
  const me = await requireCarer();
  const day = String(f.get("day") ?? "");
  const from = String(f.get("from") ?? "");
  let dest = `/carer/availability?from=${from}`;
  try {
    await setAvailability(me, day, String(f.get("slot") ?? ""), f.get("on") === "1", isoDate(new Date()));
  } catch (e) {
    dest += `&error=${encodeURIComponent(String((e as Error).message ?? e))}`;
  }
  revalidatePath("/carer/availability");
  redirect(dest);
}

// ---- travel and receipts ------------------------------------------------------
import { addReceipt, addTravel, removeTravel, TravelError } from "@/lib/carer/travel";

const shiftDest = (id: string, q: string) => `/carer/shift/${id}?${q}#extras`;
const errMsg = (e: unknown) => (e instanceof TravelError ? e.message : (console.error(e), "Something went wrong. Please try again."));

export async function travelAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let dest = shiftDest(id, "travel=1");
  try {
    await addTravel(me.id, id, String(f.get("from") ?? ""), String(f.get("to") ?? ""));
  } catch (e) {
    dest = shiftDest(id, `xerror=${encodeURIComponent(errMsg(e))}`);
  }
  revalidatePath(`/carer/shift/${id}`);
  redirect(dest);
}

export async function removeTravelAction(f: FormData) {
  const me = await requireCarer();
  const id = String(f.get("id") ?? "");
  let dest = shiftDest(id, "removed=1");
  try {
    await removeTravel(me.id, String(f.get("log") ?? ""));
  } catch (e) {
    dest = shiftDest(id, `xerror=${encodeURIComponent(errMsg(e))}`);
  }
  revalidatePath(`/carer/shift/${id}`);
  redirect(dest);
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
    revalidatePath(`/carer/shift/${id}`);
    const t = r.reading;
    if (t && !t.needsReview && t.total != null) return { ok: true, message: `Receipt added: $${t.total.toFixed(2)}${t.merchant ? ` at ${t.merchant}` : ""}.` };
    if (t?.reason === "not_a_receipt") return { ok: true, message: "Uploaded, but it doesn't look like a receipt. The office will check it." };
    return { ok: true, message: "Receipt uploaded. The office will check the total." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}
