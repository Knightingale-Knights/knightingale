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

// ---- Points of Care (Shift Duties) and Carers --------------------------------------------
import { addCarers, addDuty, removeCarer, removeDuty, toggleDuty } from "@/lib/participants/lists";

export async function dutyAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  const op = String(f.get("op") ?? "");
  const duty = String(f.get("duty") ?? "");
  let msg = "";
  if (op === "add") {
    const text = String(f.get("text") ?? "").trim();
    if (text) { await addDuty(id, text, staff.id); msg = "Added."; }
  } else if (op === "toggle" && duty) await toggleDuty(id, duty);
  else if (op === "remove" && duty) { await removeDuty(id, duty); msg = "Removed."; }
  revalidatePath(`/participants/${id}/duties`);
  redirect(`/participants/${id}/duties${msg ? `?msg=${encodeURIComponent(msg)}` : ""}`);
}

export async function carersAction(f: FormData) {
  await requireStaff();
  const id = String(f.get("participant") ?? "");
  const op = String(f.get("op") ?? "");
  let msg = "";
  if (op === "add") {
    const ids = f.getAll("carers").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
    await addCarers(id, ids);
    msg = ids.length ? `Added ${ids.length}.` : "";
  } else if (op === "remove") {
    await removeCarer(id, String(f.get("carer") ?? ""));
    msg = "Removed.";
  }
  revalidatePath(`/participants/${id}/carers`);
  redirect(`/participants/${id}/carers${msg ? `?msg=${encodeURIComponent(msg)}` : ""}`);
}

// ---- About, Feedback, Funding, Summary ----------------------------------------------------
import { addFeedback, removeQuarter, saveAbout, saveQuarter } from "@/lib/participants/extra";
import { emailSummaryTo } from "@/lib/carer/summary";

const back = (id: string, page: string, msg: string, error = false) =>
  redirect(`/participants/${id}/${page}?${error ? "error" : "msg"}=${encodeURIComponent(msg)}`);

export async function aboutAction(f: FormData) {
  await requireStaff();
  const id = String(f.get("participant") ?? "");
  await saveAbout(id, String(f.get("description") ?? ""));
  revalidatePath(`/participants/${id}`);
  back(id, "about", "Saved.");
}

export async function feedbackAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  await addFeedback(id, f, staff.id);
  revalidatePath(`/participants/${id}/feedback`);
  back(id, "feedback", "Feedback saved.");
}

export async function quarterAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  if (f.get("op") === "remove") await removeQuarter(id, String(f.get("quarter") ?? ""));
  else await saveQuarter(id, f, staff.id);
  revalidatePath(`/participants/${id}/funding`);
  back(id, "funding", f.get("op") === "remove" ? "Removed." : "Saved.");
}

export async function summaryAction(f: FormData) {
  const staff = await requireStaff();
  const id = String(f.get("participant") ?? "");
  let msg = "";
  try {
    msg = await emailSummaryTo(id, staff.email);
  } catch (e) {
    back(id, "summary", (e as Error).message, true);
  }
  back(id, "summary", msg);
}
