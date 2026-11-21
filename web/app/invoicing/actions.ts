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
    dest = back({ tab: "wintringham", sent: String(r.rows) });
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
    // Voiding frees its shifts and travel so they can be invoiced again.
    await sql.begin(async (tx) => {
      const [inv] = await tx`update app.invoices set state = 'void' where id = ${id} and created_in_app returning id`;
      if (!inv) return;
      await tx`delete from app.invoice_shifts where invoice_id = ${id}`;
      await tx`delete from app.invoice_travel where invoice_id = ${id}`;
    });
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
