// Paying a carer from Timesheets: works out the payslip for a pay period and saves it, as Bubble's Pay popup did
// (the payslip, plus the carer's running totals). Tax is worked out from their TFN declaration; Paul can change it.
import { sql } from "@/lib/db";
import { addDays } from "@/lib/roster/rules";
import { periodTax, residencyKind, thresholdFromPast, SUPER_RATE, type TaxProfile } from "./tax";

export class PayError extends Error {}

const r2 = (n: number) => Math.round(n * 100) / 100;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000) + 1;

/** Thursday after the pay week ends (pay weeks run Wednesday to Tuesday). */
export const paymentDay = (end: string) => {
  const dow = new Date(`${end}T00:00:00Z`).getUTCDay();
  return addDays(end, ((4 - dow + 7) % 7) || 7);
};

export type PayDraft = {
  gross: number; tax: number; super: number; reimbursements: number; net: number; hours: number;
  start: string; end: string; paid: string; taxNote: string; already: boolean;
};

async function taxProfile(carer: string, days: number): Promise<{ profile: TaxProfile; note: string }> {
  const [d] = await sql<{ tfn: string | null; residency: string | null; threshold: boolean | null; loan: boolean | null }[]>`
    select tax_file_number as tfn, working_rights as residency, tax_free_threshold as threshold, student_loan_debt as loan
      from app.tfn_declarations where carer = ${carer} and nullif(tax_file_number, '') is not null
     order by updated_at desc limit 1`; // a cleared declaration (waiting to be redone) leaves the last one in force
  const kind = residencyKind(d?.residency ?? null, d?.tfn ?? null);
  const studyLoan = Boolean(d?.loan);
  const loanNote = studyLoan ? ", with a study loan" : "";
  if (kind === "no_tfn") return { profile: { kind, threshold: false, studyLoan: false }, note: "No TFN on file: 47% no-TFN rate" };
  if (kind === "whm") return { profile: { kind, threshold: false, studyLoan }, note: "Working holiday maker: 15%" };
  if (kind === "foreign") return { profile: { kind, threshold: false, studyLoan }, note: `Foreign resident${loanNote}` };
  if (d?.threshold != null) {
    return { profile: { kind, threshold: d.threshold, studyLoan }, note: `${d.threshold ? "Tax-free threshold claimed" : "No tax-free threshold"}${loanNote}` };
  }
  // The declaration doesn't say: follow what their last payslip did.
  const [last] = await sql<{ gross: number; tax: number; days: number }[]>`
    select gross_pay::float8 as gross, tax::float8 as tax,
           greatest(1, coalesce((pay_period_ending::date - pay_period_start::date) + 1, 7)) as days
      from app.payslips where carer = ${carer} and gross_pay > 0 and tax is not null
     order by payment_date desc nulls last limit 1`;
  if (last) {
    const threshold = thresholdFromPast(last.gross, last.tax, last.days, studyLoan);
    return { profile: { kind, threshold, studyLoan }, note: `${threshold ? "Tax-free threshold claimed" : "No tax-free threshold"} (as on their last payslip)${loanNote}` };
  }
  return { profile: { kind, threshold: true, studyLoan }, note: `Tax-free threshold assumed (not on their TFN declaration)${loanNote}` };
}

/** The payslip as it would be for these timesheet totals. */
export async function payDraft(carer: string, start: string, end: string, t: { gross: number; hours: number; reimbursements: number }): Promise<PayDraft> {
  const days = daysBetween(start, end);
  const { profile, note } = await taxProfile(carer, days);
  const tax = periodTax(t.gross, days, profile);
  const [dup] = await sql<{ n: number }[]>`
    select count(*)::int as n from app.payslips
     where carer = ${carer} and (pay_period_ending at time zone 'Australia/Melbourne')::date = ${end}`;
  return {
    gross: r2(t.gross), tax, super: r2(t.gross * SUPER_RATE), reimbursements: r2(t.reimbursements),
    net: r2(t.gross - tax + t.reimbursements), hours: r2(t.hours),
    start, end, paid: paymentDay(end), taxNote: note, already: (dup?.n ?? 0) > 0,
  };
}

export type PayInput = {
  gross: number; tax: number; super: number; net: number; hours: number; reimbursements: number;
  start: string; end: string; paid: string;
};

const melb = (day: string) => sql`(${day}::date::timestamp at time zone 'Australia/Melbourne')`;

/** Saves the payslip and adds it to the carer's running totals. Year-to-date covers this financial year. */
export async function createPayslip(carer: string, by: string, p: PayInput) {
  for (const [k, v] of Object.entries(p)) if (typeof v === "number" && (!Number.isFinite(v) || v < 0)) throw new PayError(`Check the ${k} amount.`);
  if (![p.start, p.end, p.paid].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) throw new PayError("Check the dates.");
  if (p.end < p.start) throw new PayError("The pay period ends before it starts.");
  const fy = Number(p.paid.slice(5, 7)) >= 7 ? `${p.paid.slice(0, 4)}-07-01` : `${Number(p.paid.slice(0, 4)) - 1}-07-01`;
  await sql.begin(async (tx) => {
    const [u] = await tx<{ roles: string[] | null; address: unknown }[]>`select roles, address from app.users where id = ${carer} for update`;
    if (!u) throw new PayError("Carer not found.");
    const [dup] = await tx<{ n: number }[]>`
      select count(*)::int as n from app.payslips
       where carer = ${carer} and (pay_period_ending at time zone 'Australia/Melbourne')::date = ${p.end}`;
    if (dup.n) throw new PayError("This carer already has a payslip for this pay period.");
    const [ytd] = await tx<{ g: number; t: number; n: number }[]>`
      select coalesce(sum(gross_pay), 0)::float8 as g, coalesce(sum(tax), 0)::float8 as t, coalesce(sum(net_pay), 0)::float8 as n
        from app.payslips where carer = ${carer} and (payment_date at time zone 'Australia/Melbourne')::date >= ${fy}`;
    await tx`
      insert into app.payslips (carer, created_by, gross_pay, tax, super, net_pay, hours_worked, travel, role, address,
                                pay_period_start, pay_period_ending, payment_date, ytd_gross, ytd_tax, ytd_net)
      values (${carer}, ${by}, ${p.gross}, ${p.tax}, ${p.super}, ${p.net}, ${p.hours}, ${p.reimbursements},
              ${u.roles?.[0] ?? null}, ${u.address ? sql.json(u.address as never) : null},
              ${melb(p.start)}, ${melb(p.end)}, ${melb(p.paid)},
              ${r2(ytd.g + p.gross)}, ${r2(ytd.t + p.tax)}, ${r2(ytd.n + p.net)})`;
    await tx`
      update app.users set
        tax = coalesce(tax, 0) + ${p.tax}, super = coalesce(super, 0) + ${p.super}, hours = coalesce(hours, 0) + ${p.hours},
        ytd_gross = ${r2(ytd.g + p.gross)}, ytd_tax = ${r2(ytd.t + p.tax)}, ytd_net = ${r2(ytd.n + p.net)}, updated_at = now()
       where id = ${carer}`;
  });
}
