"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { DocError, setDetails, uploadDoc } from "@/lib/compliance/data";
import { docDef, STATUS_LABEL, type AccountDocKey, type DocKey } from "@/lib/compliance/docs";
import { uploadProfileFile, SignupError } from "@/lib/onboarding/data";
import { auDate, isoDate } from "@/lib/invoicing/rules";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail } from "@/lib/postmark";

export type DocResult = { ok: boolean; message: string };

/** Emails the office when a carer uploads a document, with whether it was accepted. Never holds up the upload. */
async function tellOffice(carer: string, label: string, outcome: string, detail: string) {
  if (!env.automationsLive) return;
  try {
    const [u] = await sql<{ name: string | null }[]>`select nullif(trim(concat_ws(' ', first_name, last_name)), '') as name from app.users where id = ${carer}`;
    const name = u?.name ?? "A carer";
    await sendPlainEmail({
      to: env.complianceAlertTo,
      subject: `${name} uploaded ${label}: ${outcome}`,
      text: `${name} uploaded their ${label}.\n\nResult: ${outcome}\n${detail}\n\nCheck it: https://knightingale.com.au/compliance/${carer}`,
      attachments: [],
    });
  } catch (e) {
    console.error("upload email failed", e);
  }
}

/** Carers upload their own documents; staff can upload for any carer. */
async function who(carerField: FormDataEntryValue | null) {
  const me = await currentUser();
  if (!me || me.role === "facility") redirect("/login");
  const carer = me.role === "admin" && carerField ? String(carerField) : me.id;
  if (me.role !== "admin" && carer !== me.id) redirect("/carer");
  return { me, carer };
}

const pathFor = (role: string, carer: string, back?: string) =>
  role === "admin" ? `/compliance/${carer}` : back && /^\/(join\/[a-z]+|carer\/account\/[a-z]+(\?tab=[a-z_]+)?)$/.test(back) ? back : "/carer/account";

export async function uploadDocAction(f: FormData): Promise<DocResult> {
  const { me, carer } = await who(f.get("carer"));
  const key = String(f.get("doc") ?? "") as DocKey | AccountDocKey;
  const file = f.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose a file to upload." };
  if (key === "resume") {
    try {
      await uploadProfileFile(carer, "resume", { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
      revalidatePath("/carer/account", "layout");
      return { ok: true, message: "Thanks, your resume is saved." };
    } catch (e) {
      return { ok: false, message: e instanceof SignupError ? e.message : "Upload failed. Please try again." };
    }
  }
  try {
    const r = await uploadDoc(carer, key, { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) }, me.id, isoDate(new Date()));
    revalidatePath(pathFor(me.role, carer));
    revalidatePath("/carer/account", "layout");
    revalidatePath("/join/[step]", "page");
    const label = docDef(key)?.label ?? "Document";
    const tell = (outcome: string, detail: string) => (me.role === "admin" ? Promise.resolve() : tellOffice(carer, label, outcome, detail));
    if (r.reading?.reason === "document_type_mismatch") {
      await tell("Rejected", `Not a ${label} document${r.reading.mismatchReason ? `: ${r.reading.mismatchReason}` : "."}`);
      return { ok: false, message: `Saved, but this doesn't look like a ${label} document${r.reading.mismatchReason ? `: ${r.reading.mismatchReason}` : "."} The office will check it.` };
    }
    if (!docDef(key)?.expiryCol) {
      await tell("Accepted", r.reading ? "It looks like the right document." : "Please check it.");
      return { ok: true, message: `Thanks, your ${label} is saved.` };
    }
    if (r.status === "expired") {
      await tell("Rejected", `It expired on ${auDate(r.expiry)}.`);
      return { ok: false, message: `Saved, but this ${label} expired on ${auDate(r.expiry)}. Please upload a current one.` };
    }
    if (r.expiry) {
      await tell("Accepted", `Expires ${auDate(r.expiry)}${r.reading?.expirySource === "calculated_from_issue_date" ? " (worked out from the issue date)" : ""}.`);
      return { ok: true, message: `Thanks, your ${label} is saved. It expires on ${auDate(r.expiry)}.` };
    }
    await tell("Needs checking", r.reading ? "The expiry date couldn't be read, so please check it and enter it." : "Please check it.");
    return { ok: true, message: `Thanks, your ${label} is saved. ${r.status === "check" ? STATUS_LABEL.check + "." : ""}`.trim() };
  } catch (e) {
    if (!(e instanceof DocError)) console.error(e);
    return { ok: false, message: e instanceof DocError ? e.message : "Upload failed. Please try again." };
  }
}

export async function detailsAction(f: FormData) {
  const { me, carer } = await who(f.get("carer"));
  const key = String(f.get("doc") ?? "") as DocKey | AccountDocKey;
  const base = pathFor(me.role, carer, String(f.get("back") ?? ""));
  const q = base.includes("?") ? "&" : "?";
  let dest = `${base}${q}saved=${key}#${key}`;
  try {
    const v: { number?: string; expiry?: string } = {};
    if (f.has("number")) v.number = String(f.get("number") ?? "");
    // Carers can type the expiry only for documents with no file to read it from; staff can always correct it.
    const d = docDef(key);
    if (f.has("expiry") && (me.role === "admin" || (d && (!d.uploadCol || !d.ai)))) v.expiry = String(f.get("expiry") ?? "");
    await setDetails(carer, key, me.id, v, isoDate(new Date()));
  } catch (e) {
    if (!(e instanceof DocError)) console.error(e);
    dest = `${base}${q}error=${encodeURIComponent(e instanceof DocError ? e.message : "Something went wrong. Please try again.")}#${key}`;
  }
  revalidatePath(base);
  redirect(dest);
}
