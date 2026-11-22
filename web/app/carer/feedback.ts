"use server";
import { currentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendPlainEmail } from "@/lib/postmark";

export type FeedbackResult = { ok: boolean; message: string } | null;

/** Emails a carer's feedback to the office. */
export async function feedbackAction(_prev: FeedbackResult, form: FormData): Promise<FeedbackResult> {
  const me = await currentUser();
  if (!me) return { ok: false, message: "Please sign in again." };
  const text = String(form.get("feedback") ?? "").trim().slice(0, 5000);
  if (!text) return { ok: false, message: "Please write your feedback first." };
  try {
    const [u] = await sql<{ name: string | null; email: string | null; phone: string | null }[]>`
      select nullif(trim(concat_ws(' ', first_name, last_name)), '') as name, email, phone_number as phone
        from app.users where id = ${me.id}`;
    const name = u?.name ?? me.name ?? "A carer";
    await sendPlainEmail({
      to: "care@knightingale.com.au",
      subject: `Carer feedback from ${name}`,
      text: `${text}\n\nFrom: ${name}\nEmail: ${u?.email ?? me.email ?? ""}\nPhone: ${u?.phone ?? ""}${me.viewAs ? "\n\n(Sent by the office while viewing as this carer.)" : ""}`,
      attachments: [],
    });
    return { ok: true, message: "Thank you, your feedback has been sent." };
  } catch (e) {
    console.error("feedback email failed", e);
    return { ok: false, message: "Sorry, that didn't send. Please try again." };
  }
}
