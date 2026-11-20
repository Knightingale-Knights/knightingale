// Whether each Account section is complete, for the tick beside it.
import { sql } from "@/lib/db";
import { accountDocs } from "@/lib/compliance/data";
import { sectionsFor } from "./sections";

export type Done = boolean | null; // null: no tick (nothing to complete)

export async function accountOverview(carer: string, today: string) {
  const [u] = await sql<{
      name: string; photo: string | null; roles: string[] | null; personal: boolean; signed: boolean; avail: boolean;
      bank: boolean; super: boolean; tfn: boolean; insurance: boolean; no_insurance: boolean;
    }[]>`
      select trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.profile_photo as photo, u.roles,
             (nullif(trim(u.first_name), '') is not null and nullif(trim(u.last_name), '') is not null and u.phone_number is not null
               and u.date_of_birth is not null and u.address is not null and u.email is not null) as personal,
             u.contract_signature is not null as signed,
             exists (select 1 from app.availability a where a.carer = u.id and coalesce(a.available, false)) as avail,
             exists (select 1 from app.bank_details b where b.carer = u.id and b.acc_no is not null and b.bsb_no is not null) as bank,
             exists (select 1 from app.superannuation s where s.carer = u.id and s.fund_name is not null and s.member_no is not null) as super,
             exists (select 1 from app.tfn_declarations t where t.carer = u.id and t.tax_file_number is not null and nullif(t.signature, '') is not null) as tfn,
             exists (select 1 from app.identity_documents i where i.carer = u.id and i.insurance is not null) as insurance,
             u.no_insurance
        from app.users u where u.id = ${carer}`;
  const sections = sectionsFor(u.roles);
  const keys = [...new Set(sections.flatMap((s) => (s.kind === "docs" ? s.docs : [])))];
  const docs = await accountDocs(carer, keys, today);
  const byKey = new Map(docs.map((d) => [d.def.key as string, d]));
  // Done once it's supplied and not expired (an expiry still to be checked by the office counts as supplied).
  const docsDone = (ks: string[]) => ks.every((k) => ["ok", "soon", "check"].includes(byKey.get(k)?.status ?? "missing"));
  const done: Record<string, Done> = {};
  for (const s of sections) {
    done[s.key] =
      s.kind === "docs" ? docsDone(s.tick ?? s.docs)
      : s.key === "personal" ? u.personal
      : s.key === "availability" ? u.avail
      : s.key === "contract" ? u.signed
      : s.key === "bank" ? u.bank
      : s.key === "super" ? u.super
      : s.key === "tfn" ? u.tfn
      : null;
  }
  return { name: u.name, photo: u.photo, roles: u.roles, done, docs, sections };
}
