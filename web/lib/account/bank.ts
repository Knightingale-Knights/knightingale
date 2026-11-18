// Bank Details on the carer Account page. Only the carer and the office can see them.
import { sql } from "@/lib/db";

export class BankError extends Error {}
export type Bank = { acc_name: string; bsb: string; acc_no: string };

export async function bankOf(carer: string): Promise<Bank> {
  const [r] = await sql<Bank[]>`
    select coalesce(acc_name, '') as acc_name, coalesce(bsb_no, '') as bsb, coalesce(acc_no, '') as acc_no
      from app.bank_details where carer = ${carer} order by updated_at desc nulls last limit 1`;
  return r ?? { acc_name: "", bsb: "", acc_no: "" };
}

export async function saveBank(carer: string, i: Bank) {
  const acc_name = i.acc_name.trim().replace(/\s+/g, " ").slice(0, 100);
  const bsb = i.bsb.replace(/[\s-]/g, "");
  const acc_no = i.acc_no.replace(/[\s-]/g, "");
  if (acc_name.length < 2) throw new BankError("Enter the name on the account.");
  if (!/^\d{6}$/.test(bsb)) throw new BankError("A BSB is 6 digits, like 063-000.");
  if (!/^\d{5,10}$/.test(acc_no)) throw new BankError("An account number is 5 to 10 digits.");
  await sql.begin(async (txx) => {
    const tx = txx as unknown as typeof sql;
    const [r] = await tx<{ id: string }[]>`select id from app.bank_details where carer = ${carer} order by updated_at desc nulls last limit 1 for update`;
    if (r) await tx`update app.bank_details set acc_name = ${acc_name}, bsb_no = ${bsb}, acc_no = ${acc_no}, updated_at = now() where id = ${r.id}`;
    else {
      const [n] = await tx<{ id: string }[]>`
        insert into app.bank_details (carer, acc_name, bsb_no, acc_no, created_by) values (${carer}, ${acc_name}, ${bsb}, ${acc_no}, ${carer}) returning id`;
      await tx`update app.users set bank_details = ${n.id} where id = ${carer}`;
    }
  });
}
