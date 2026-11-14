"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createInvoice } from "@/lib/invoicing/create";
import { sendWintringhamCsv } from "@/lib/invoicing/wintringham";
import type { InvoiceKind } from "@/lib/invoicing/rules";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (params: Record<string, string>) => `/invoicing?${new URLSearchParams(params)}`;

export async function createInvoiceAction(form: FormData) {
  const staff = await requireStaff();
  const kind = str(form, "kind") as InvoiceKind;
  const target = str(form, "target");
  const through = str(form, "through");
  let dest: string;
  try {
    const r = await createInvoice({
      kind, target, through,
      invoiceNumber: str(form, "invoice_number"),
      invoiceDate: str(form, "invoice_date"),
      paymentTerms: str(form, "payment_terms"),
      sendTo: str(form, "send_to"),
      travelItemNo: str(form, "travel_item_no"),
      travelItemDescription: str(form, "travel_item_description"),
      sendRoster: form.get("send_roster") === "on",
      expectedShiftIds: form.getAll("shift_id").map(String),
      createdBy: staff.id,
    });
    dest = back({ tab: kind, done: r.invoiceId, ...(r.warnings.length ? { warn: r.warnings.join(" ") } : {}) });
  } catch (e) {
    dest = back({ tab: kind, target, through, error: String((e as Error).message ?? e) });
  }
  revalidatePath("/invoicing");
  redirect(dest);
}

export async function sendWintringhamAction(form: FormData) {
  await requireStaff();
  let dest: string;
  try {
    const r = await sendWintringhamCsv(str(form, "send_to"));
    dest = back({ tab: "wintringham", sent: String(r.rows), ...(r.bubbleErrors ? { warn: `Bubble wasn't fully updated (${r.bubbleErrors} errors).` } : {}) });
  } catch (e) {
    dest = back({ tab: "wintringham", error: String((e as Error).message ?? e) });
  }
  revalidatePath("/invoicing");
  redirect(dest);
}

export async function setInvoiceStateAction(form: FormData) {
  await requireStaff();
  const id = str(form, "id");
  const state = str(form, "state");
  if (!["issued", "paid", "void"].includes(state)) redirect(back({ tab: "sent", error: "Unknown status." }));
  if (state === "void") {
    // Voiding frees its shifts so they can be invoiced again, here and in Bubble.
    const freed = await sql.begin(async (tx) => {
      const [inv] = await tx`update app.invoices set state = 'void' where id = ${id} and created_in_app returning id`;
      if (!inv) return { shifts: [] as string[], travel: [] as string[] };
      const s = await tx<{ b: string }[]>`
        delete from app.invoice_shifts x using app.shifts s
         where x.invoice_id = ${id} and s.id = x.shift_id returning s.bubble_id as b`;
      const t = await tx<{ b: string }[]>`
        delete from app.invoice_travel x using app.shift_logs l
         where x.invoice_id = ${id} and l.id = x.shift_log_id returning l.bubble_id as b`;
      return { shifts: s.map((r) => r.b).filter(Boolean), travel: t.map((r) => r.b).filter(Boolean) };
    });
    const { bubbleWritebackEnabled, patchBubble, patchMany } = await import("@/lib/bubble");
    if (bubbleWritebackEnabled()) {
      const errs = await patchMany([
        ...freed.shifts.map((b) => () => patchBubble("shift", b, { invoiced: false })),
        ...freed.travel.map((b) => () => patchBubble("shiftlogs", b, { invoiced: false })),
      ]);
      if (errs.length) redirect(back({ tab: "sent", warn: `Voided, but Bubble wasn't fully updated (${errs.length} errors).` }));
    }
  } else {
    await sql`update app.invoices set state = ${state}, paid_at = case when ${state} = 'paid' then now() end where id = ${id}`;
  }
  revalidatePath("/invoicing");
  redirect(back({ tab: "sent" }));
}

export async function signOutAction() {
  const { supabaseServer } = await import("@/lib/supabase/server");
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
