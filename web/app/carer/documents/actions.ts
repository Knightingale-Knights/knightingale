"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { DocError, isRenewal, removeDoc, setDetails, uploadDoc } from "@/lib/compliance/data";
import { docDef, STATUS_LABEL, type AccountDocKey, type DocKey } from "@/lib/compliance/docs";
import { uploadProfileFile, SignupError } from "@/lib/onboarding/data";
import { auDate, isoDate } from "@/lib/invoicing/rules";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail } from "@/lib/postmark";
import { brandedHtml } from "@/lib/email/branded";
import { readDocTitle } from "@/lib/compliance/docTitle";
import type { ExpiryReading } from "@/lib/compliance/expiryReader";

export type DocResult = { ok: boolean; message: string };

/** Why an upload with no expiry needs the office, in a sentence. */
function whyCheck(x: ExpiryReading | null) {
  if (!x) return "It wasn't read automatically.";
  if (x.reason?.startsWith("ai_")) return "The document couldn't be read automatically (a reading error, not a problem with the document).";
  if (x.warning) return x.warning;
  if (x.expiryDate && x.confidence === "low") return `An expiry of ${auDate(x.expiryDate)} was read, but not clearly.`;
  if (x.issueDate) return `No expiry date is printed on it (issued ${auDate(x.issueDate)}).`;
  return "No expiry date was found on it.";
}

/** Emails the office (cc the carer) when a carer uploads a document, with whether it was accepted. Never holds up the upload. */
async function tellOffice(carer: string, fileId: string, label: string, outcome: string, detail: string) {
  if (!env.automationsLive) return;
  try {
    const [u] = await sql<{ name: string | null; email: string | null }[]>`
      select nullif(trim(concat_ws(' ', trim(first_name), trim(last_name))), '') as name, nullif(trim(email), '') as email from app.users where id = ${carer}`;
    const name = u?.name ?? "A carer";
    const doc = `https://knightingale.com.au/files/${fileId}`;
    const page = `https://knightingale.com.au/compliance/${carer}`;
    await sendPlainEmail({
      to: env.complianceAlertTo,
      ...(u?.email ? { cc: u.email } : {}),
      subject: `${name} uploaded ${label}: ${outcome}`,
      text: `${name} uploaded their ${label}.\n\nResult: ${outcome}\n${detail}\n\nDocument: ${doc}\nCompliance page: ${page}`,
      html: brandedHtml({
        kind: "Compliance",
        preview: `${name} uploaded their ${label}: ${outcome}.`,
        rows: [["Carer", name], ["Document", label], ["Result", outcome]],
        section: { heading: "Details", text: detail },
        buttons: [{ label: "View document", href: doc }, { label: "Compliance page", href: page }],
      }),
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
    // Only renewals of expired or expiring documents by active carers email the office.
    const renewal = await isRenewal(carer, key, isoDate(new Date()));
    const r = await uploadDoc(carer, key, { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) }, me.id, isoDate(new Date()));
    revalidatePath(pathFor(me.role, carer));
    revalidatePath("/carer/account", "layout");
    revalidatePath("/join/[step]", "page");
    const label = docDef(key)?.label ?? "Document";
    const bytes = Buffer.from(await file.arrayBuffer());
    // Certificates and qualifications: name which one in the office email.
    const named = async () => {
      if (key !== "certificate" && key !== "qualification") return label;
      const title = await readDocTitle(bytes, file.type);
      return title ?? `${label} (${file.name})`;
    };
    const tell = async (outcome: string, detail: string) => (me.role === "admin" || !renewal ? undefined : tellOffice(carer, r.fileId, await named(), outcome, detail));
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
    if (r.status === "ok") {
      await tell("Accepted", "It looks like the right document.");
      return { ok: true, message: `Thanks, your ${label} is saved.` };
    }
    await tell("Needs checking", `${whyCheck(r.reading)} Please check it and enter the expiry date.`);
    return { ok: true, message: `Thanks, your ${label} is saved. ${r.status === "check" ? STATUS_LABEL.check + "." : ""}`.trim() };
  } catch (e) {
    if (!(e instanceof DocError)) console.error(e);
    else console.warn("upload refused", carer, key, e.message); // what the carer was told, for when they ask
    return { ok: false, message: e instanceof DocError ? e.message : "Upload failed. Please try again." };
  }
}

export async function removeDocAction(f: FormData) {
  const { me, carer } = await who(f.get("carer"));
  if (me.role !== "admin") redirect("/carer");
  const key = String(f.get("doc") ?? "") as DocKey | AccountDocKey;
  let dest = `/compliance/${carer}?removed=${encodeURIComponent(docDef(key)?.label ?? "Document")}#${key}`;
  try {
    await removeDoc(carer, key);
  } catch (e) {
    if (!(e instanceof DocError)) console.error(e);
    dest = `/compliance/${carer}?error=${encodeURIComponent(e instanceof DocError ? e.message : "Something went wrong. Please try again.")}`;
  }
  revalidatePath(`/compliance/${carer}`);
  revalidatePath("/compliance");
  redirect(dest);
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
    // Expiry dates are read from the uploaded document. Only the office can type or correct one.
    if (f.has("expiry") && me.role === "admin") v.expiry = String(f.get("expiry") ?? "");
    await setDetails(carer, key, me.id, v, isoDate(new Date()));
  } catch (e) {
    if (!(e instanceof DocError)) console.error(e);
    dest = `${base}${q}error=${encodeURIComponent(e instanceof DocError ? e.message : "Something went wrong. Please try again.")}#${key}`;
  }
  revalidatePath(base);
  redirect(dest);
}
