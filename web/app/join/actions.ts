"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireApplicant } from "@/lib/auth";
import { saveDetails, saveRole, saveScreening, sendWelcome, SignupError, submitApplication, uploadProfileFile, type ProfileFile } from "@/lib/onboarding/data";
import { isoDate } from "@/lib/invoicing/rules";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
const fail = (step: string, e: unknown) => {
  if (!(e instanceof SignupError)) console.error(e);
  return `/join/${step}?error=${encodeURIComponent(e instanceof SignupError ? e.message : "Something went wrong. Please try again.")}`;
};

export async function detailsAction(f: FormData) {
  const me = await requireApplicant();
  let dest = "/join/role";
  try {
    const r = await saveDetails(me.id, { first: s(f, "first"), last: s(f, "last"), phone: s(f, "phone"), dob: s(f, "dob"), address: s(f, "address") }, isoDate(new Date()));
    if (r.firstTime) await sendWelcome(me.email, s(f, "first").trim()); // Bubble sent the welcome email after this step
  } catch (e) { dest = fail("details", e); }
  revalidatePath("/join/[step]", "page");
  redirect(dest);
}

export async function roleAction(f: FormData) {
  const me = await requireApplicant();
  let dest = "/join/role?saved=1";
  try {
    await saveRole(me.id, { roles: f.getAll("roles").map(String), skill: s(f, "skill"), ahpraNumber: s(f, "ahpra"), ahpraExpiry: s(f, "ahpra_expiry") }, isoDate(new Date()));
  } catch (e) { dest = fail("role", e); }
  revalidatePath("/join/[step]", "page");
  redirect(dest);
}

export async function screeningAction(f: FormData) {
  const me = await requireApplicant();
  let dest = "/join/documents";
  try {
    await saveScreening(me.id, s(f, "number"), s(f, "expiry"), isoDate(new Date()));
  } catch (e) { dest = fail("screening", e); }
  revalidatePath("/join/[step]", "page");
  redirect(dest);
}

export async function submitAction() {
  const me = await requireApplicant();
  let dest = "/carer?welcome=1";
  try {
    await submitApplication(me.id, isoDate(new Date()));
  } catch (e) { dest = fail("review", e); }
  revalidatePath("/", "layout");
  redirect(dest);
}

export type UploadResult = { ok: boolean; message: string };

export async function profileUploadAction(f: FormData): Promise<UploadResult> {
  const me = await requireApplicant();
  const kind = s(f, "kind") as ProfileFile;
  const file = f.get("file");
  if (!["photo", "resume", "ndis_induction"].includes(kind) || !(file instanceof File)) return { ok: false, message: "Choose a file to upload." };
  try {
    await uploadProfileFile(me.id, kind, { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
    revalidatePath("/join/[step]", "page");
    return { ok: true, message: "Uploaded. Thank you!" };
  } catch (e) {
    if (!(e instanceof SignupError)) console.error(e);
    return { ok: false, message: e instanceof SignupError ? e.message : "Upload failed. Please try again." };
  }
}
