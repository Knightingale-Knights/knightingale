"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { saveIntake } from "@/lib/participants/intake";

export async function saveIntakeAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  let dest = `/participants/${id}/intake?msg=${encodeURIComponent("Intake saved.")}`;
  try {
    await saveIntake(id, f, staff.id);
  } catch (e) {
    console.error("intake save failed", e);
    dest = `/participants/${id}/intake?error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath(`/participants/${id}`);
  redirect(dest);
}

// ---- other participant documents (Privacy Consent Form, Emergency Plan) ---------------
import { DOCS, saveDoc } from "@/lib/participants/docs";
import { generateRiskTreatment } from "@/lib/participants/riskTreatment";
import { sql } from "@/lib/db";

export async function saveDocAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  const d = DOCS[String(f.get("doc") ?? "")];
  if (!d) redirect(`/participants/${id}`);
  const gen = String(f.get("generate") ?? "");
  let dest = `/participants/${id}/${d.key}?msg=${encodeURIComponent(`${d.title} saved.`)}`;
  try {
    const { newPlan } = await saveDoc(d, id, f, staff.id);
    if (d.key === "risk" && gen) {
      const plan = gen === "new" ? newPlan : gen;
      const [row] = plan ? await sql<{ id: string; risk: string | null }[]>`
        select id, risk from app.risk_management_plans where id = ${plan} and participant = ${id}` : [];
      if (!row?.risk?.trim()) throw new Error("Type the risk first, then tap Generate.");
      const treatment = await generateRiskTreatment(id, row.risk);
      await sql`update app.risk_management_plans set treatment = ${treatment}, updated_at = now() where id = ${row.id}`;
      dest = `/participants/${id}/${d.key}?msg=${encodeURIComponent("Risk treatment written.")}#plan-${row.id}`;
    }
  } catch (e) {
    console.error("doc save failed", e);
    dest = `/participants/${id}/${d.key}?error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath(`/participants/${id}`);
  redirect(dest);
}
