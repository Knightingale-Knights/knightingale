// Superannuation and Tax File Number declaration on the carer Account page. Only the carer and the office see these.
import { sql } from "@/lib/db";

export class MoneyError extends Error {}

export type Super = { fund_name: string; fund_abn: string; fund_usi: string; member_no: string };
export type Tfn = { tfn: string; residency: string; threshold: boolean | null; student_debt: boolean | null; signature: string | null };

export const RESIDENCY = ["An Australian resident for tax purposes", "A Foreign resident for tax purposes", "A Working Holiday Maker"] as const;

const latest = (table: "superannuation" | "tfn_declarations", carer: string, tx: typeof sql = sql) =>
  tx<{ id: string }[]>`select id from app.${tx(table)} where carer = ${carer} order by updated_at desc nulls last limit 1 for update`;

export async function superOf(carer: string): Promise<Super> {
  const [r] = await sql<Super[]>`
    select coalesce(fund_name, '') as fund_name, coalesce(fund_abn, '') as fund_abn, coalesce(fund_usi, '') as fund_usi, coalesce(member_no, '') as member_no
      from app.superannuation where carer = ${carer} order by updated_at desc nulls last limit 1`;
  return r ?? { fund_name: "", fund_abn: "", fund_usi: "", member_no: "" };
}

export async function saveSuper(carer: string, i: Super) {
  const fund_name = i.fund_name.trim().replace(/\s+/g, " ").slice(0, 120);
  const fund_abn = i.fund_abn.replace(/\s/g, "");
  const fund_usi = i.fund_usi.trim().toUpperCase().replace(/\s/g, "").slice(0, 20);
  const member_no = i.member_no.trim().replace(/\s/g, "").slice(0, 30);
  if (fund_name.length < 2) throw new MoneyError("Enter your super fund's name.");
  if (fund_abn && !/^\d{11}$/.test(fund_abn)) throw new MoneyError("A fund ABN is 11 digits.");
  if (!member_no) throw new MoneyError("Enter your member account number.");
  await sql.begin(async (txx) => {
    const tx = txx as unknown as typeof sql;
    const vals = { fund_name, fund_abn: fund_abn || null, fund_usi: fund_usi || null, member_no };
    const [r] = await latest("superannuation", carer, tx);
    if (r) await tx`update app.superannuation set ${tx(vals)}, updated_at = now() where id = ${r.id}`;
    else {
      const [n] = await tx<{ id: string }[]>`insert into app.superannuation ${tx({ ...vals, carer, created_by: carer })} returning id`;
      await tx`update app.users set superannuation = ${n.id} where id = ${carer}`;
    }
  });
}

export async function tfnOf(carer: string): Promise<Tfn> {
  const [r] = await sql<Tfn[]>`
    select coalesce(tax_file_number, '') as tfn, coalesce(working_rights, '') as residency, tax_free_threshold as threshold,
           student_loan_debt as student_debt, signature
      from app.tfn_declarations where carer = ${carer} order by updated_at desc nulls last limit 1`;
  return r ?? { tfn: "", residency: "", threshold: null, student_debt: null, signature: null };
}

/** ATO check digit for a 9-digit TFN (8-digit TFNs are older and not checked). */
export function validTfn(t: string) {
  if (/^\d{8}$/.test(t)) return true;
  if (!/^\d{9}$/.test(t)) return false;
  const w = [1, 4, 3, 7, 5, 8, 6, 9, 10];
  return [...t].reduce((s, d, i) => s + Number(d) * w[i], 0) % 11 === 0;
}

export async function saveTfn(carer: string, i: Omit<Tfn, "signature">, signatureDataUrl: string) {
  const tfn = i.tfn.replace(/[\s-]/g, "");
  if (!validTfn(tfn)) throw new MoneyError("That doesn't look like a valid tax file number. Please check it.");
  if (!(RESIDENCY as readonly string[]).includes(i.residency)) throw new MoneyError("Choose your residency for tax purposes.");
  if (i.threshold === null) throw new MoneyError("Tell us whether you're claiming the tax-free threshold.");
  if (i.threshold && i.residency !== RESIDENCY[0]) throw new MoneyError("Only Australian residents for tax purposes can claim the tax-free threshold.");
  if (i.student_debt === null) throw new MoneyError("Tell us whether you have a student debt.");
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(signatureDataUrl);
  const bytes = m ? Buffer.from(m[1], "base64") : null;
  if (!bytes || bytes.length < 200) throw new MoneyError("Please sign in the box.");
  if (bytes.length > 400 * 1024) throw new MoneyError("That signature is too large. Please clear it and sign again.");
  await sql.begin(async (txx) => {
    const tx = txx as unknown as typeof sql;
    const [f] = await tx<{ id: string }[]>`
      insert into app.compliance_files (carer, doc, file_name, mime, bytes, uploaded_by)
      values (${carer}, 'tfn_signature', 'tfn-signature.png', 'image/png', ${bytes}, ${carer}) returning id`;
    const vals = { tax_file_number: tfn, working_rights: i.residency, tax_free_threshold: i.threshold, student_loan_debt: i.student_debt, signature: `/files/${f.id}` };
    const [r] = await latest("tfn_declarations", carer, tx);
    if (r) await tx`update app.tfn_declarations set ${tx(vals)}, updated_at = now() where id = ${r.id}`;
    else {
      const [n] = await tx<{ id: string }[]>`insert into app.tfn_declarations ${tx({ ...vals, carer, created_by: carer })} returning id`;
      await tx`update app.users set tax_file_number = ${n.id} where id = ${carer}`;
    }
  });
}
