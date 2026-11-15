// Files that Bubble stored. Once copied into Supabase Storage (app.file_copies) they are served from there;
// until then (or if a copy is missing) the browser is sent to Bubble's original link.
import { sql } from "@/lib/db";

const BUBBLE = /^https?:\/\/([^/]+\.cdn\.bubble\.io|s3\.amazonaws\.com\/appforest_uf)\//i;
export const isBubbleFile = (u: string) => BUBBLE.test(u.startsWith("//") ? `https:${u}` : u);
const abs = (u: string) => (u.startsWith("//") ? `https:${u}` : u);

/** Link for a stored document (private: carers see their own, staff see all). */
export const fileHref = (u: string) => (isBubbleFile(u) ? `/files/bubble?u=${encodeURIComponent(abs(u))}` : u);
/** Link for a public website image. */
export const siteImg = (u: string) => (isBubbleFile(u) ? `/site-img?u=${encodeURIComponent(abs(u))}` : u);

export async function copied(url: string) {
  const [r] = await sql<{ path: string; mime: string | null; site: boolean }[]>`
    select path, mime, site from app.file_copies where url = ${url} and status = 'copied'`;
  return r ?? null;
}

/** Downloads a copied file from Supabase Storage (needs SUPABASE_SERVICE_ROLE_KEY on the server). */
export async function fromStorage(path: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !base) return null;
  const res = await fetch(`${base}/storage/v1/object/authenticated/files/${path.split("/").map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    cache: "no-store",
  });
  return res.ok ? res : null;
}

/** Is this Bubble file one of the carer's own documents (or their own profile files)? */
export async function ownsFile(userId: string, url: string) {
  const [r] = await sql<{ ok: boolean }[]>`
    select exists (
      select 1 from app.users where id = ${userId} and ${url} in (profile_photo, resume, ndis_induction, contract_signature)
      union all select 1 from app.cpr_certificates where carer = ${userId} and cpr_certificate = ${url}
      union all select 1 from app.first_aid_certificates where carer = ${userId} and first_aid_certificate = ${url}
      union all select 1 from app.police_checks where carer = ${userId} and image = ${url}
      union all select 1 from app.wwcc_checks where carer = ${userId} and image = ${url}
      union all select 1 from app.vaccinations where carer = ${userId} and (flu = ${url} or ${url} = any(influenza) or ${url} = any(covid19))
      union all select 1 from app.qualifications where carer = ${userId} and (${url} = any(transcript) or ${url} = any(ahpra))
      union all select 1 from app.identity_documents where carer = ${userId} and ${url} in (license, passport, citizenship, insurance)
      union all select 1 from app.shifts where carer = ${userId} and ${url} = any(receipts)
    ) as ok`;
  return r.ok;
}
