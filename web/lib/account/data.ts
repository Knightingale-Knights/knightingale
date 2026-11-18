// Whether each Account section is complete, for the tick beside it.
import { sql } from "@/lib/db";
import { carerDocs, type DocState } from "@/lib/compliance/data";
import { SECTIONS } from "./sections";

export type Done = boolean | null; // null: no tick (nothing to complete)

export async function accountOverview(carer: string, today: string) {
  const [docs, [u]] = await Promise.all([
    carerDocs(carer, today),
    sql<{
      name: string; photo: string | null; roles: string[] | null; personal: boolean; signed: boolean; avail: boolean;
      bank: boolean; super: boolean; tfn: boolean; insurance: boolean;
    }[]>`
      select trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.profile_photo as photo, u.roles,
             (nullif(trim(u.first_name), '') is not null and nullif(trim(u.last_name), '') is not null and u.phone_number is not null
               and u.date_of_birth is not null and u.address is not null and u.email is not null) as personal,
             u.contract_signature is not null as signed,
             exists (select 1 from app.availability a where a.carer = u.id and coalesce(a.available, false)) as avail,
             exists (select 1 from app.bank_details b where b.carer = u.id and b.acc_no is not null and b.bsb_no is not null) as bank,
             exists (select 1 from app.superannuation s where s.carer = u.id and s.fund_name is not null and s.member_no is not null) as super,
             exists (select 1 from app.tfn_declarations t where t.carer = u.id and t.tax_file_number is not null) as tfn,
             exists (select 1 from app.identity_documents i where i.carer = u.id and i.insurance is not null) as insurance
        from app.users u where u.id = ${carer}`,
  ]);
  const byKey = new Map(docs.map((d) => [d.def.key, d]));
  const docsDone = (keys: string[]) => keys.every((k) => byKey.get(k as DocState["def"]["key"])?.status === "ok");
  const done: Record<string, Done> = {};
  for (const s of SECTIONS) {
    done[s.key] =
      s.kind === "docs" ? docsDone(s.tick)
      : s.key === "personal" ? u.personal
      : s.key === "availability" ? u.avail
      : s.key === "contract" ? u.signed
      : s.key === "bank" ? u.bank
      : s.key === "super" ? u.super
      : s.key === "tfn" ? u.tfn
      : s.key === "insurance" ? u.insurance
      : null;
  }
  return { name: u.name, photo: u.photo, roles: u.roles, done, docs };
}
