// A carer's payslips (Bubble's Payslip type), newest payday first.
import { sql } from "@/lib/db";

export type PayslipRow = { id: string; paid: string | null; net_pay: number | null; gross_pay: number | null };

export type Payslip = PayslipRow & {
  start: string | null; end: string | null; role: string | null; address: string | null;
  hours_worked: number | null; travel: number | null; tax: number | null; super: number | null;
  ytd_gross: number | null; ytd_tax: number | null; ytd_net: number | null;
  first_name: string | null; last_name: string | null; fund: string | null;
};

const day = (col: string) => sql.unsafe(`to_char(${col} at time zone 'Australia/Melbourne', 'YYYY-MM-DD')`);

export async function myPayslips(carer: string): Promise<PayslipRow[]> {
  return sql<PayslipRow[]>`
    select id, ${day("payment_date")} as paid, net_pay::float8 as net_pay, gross_pay::float8 as gross_pay
      from app.payslips where carer = ${carer}
     order by payment_date desc nulls last, created_at desc`;
}

/** One payslip, only if it is this carer's. */
export async function myPayslip(carer: string, id: string): Promise<Payslip | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [p] = await sql<Payslip[]>`
    select s.id, ${day("s.payment_date")} as paid, ${day("s.pay_period_start")} as start, ${day("s.pay_period_ending")} as "end",
           s.role, s.address->>'address' as address,
           s.net_pay::float8 as net_pay, s.gross_pay::float8 as gross_pay, s.hours_worked::float8 as hours_worked,
           s.travel::float8 as travel, s.tax::float8 as tax, s.super::float8 as super,
           s.ytd_gross::float8 as ytd_gross, s.ytd_tax::float8 as ytd_tax, s.ytd_net::float8 as ytd_net,
           u.first_name, u.last_name,
           (select f.fund_name from app.superannuation f where f.carer = s.carer order by f.updated_at desc limit 1) as fund
      from app.payslips s join app.users u on u.id = s.carer
     where s.id = ${id} and s.carer = ${carer}`;
  return p ?? null;
}
