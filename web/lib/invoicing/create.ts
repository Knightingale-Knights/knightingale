import { sql } from "@/lib/db";
import { ndisPdf, residentialPdf } from "@/lib/pdf";
import { sendInvoiceEmail } from "@/lib/postmark";
import { sendWeeklyRoster } from "@/lib/roster/weekly";
import { billableShifts, billableTravel, invoiceShifts } from "./queries";
import {
  NDIA_HEADERS, auDate, dueDate, ndiaCsvRows, ndisShiftItems, residentialLineItems, toCsv, totals, TRAVEL_ITEMS, travelItemFor, travelItems,
  type InvoiceKind, type TravelRow,
} from "./rules";

export type CreateInvoiceInput = {
  kind: InvoiceKind;
  target: string; // location id (residential) or participant id (NDIS/NDIA)
  through: string; // yyyy-mm-dd
  invoiceNumber: string;
  invoiceDate: string; // yyyy-mm-dd
  paymentTerms: string;
  sendTo: string;
  travelItemNo: string;
  expectedShiftIds: string[]; // what the person reviewed; must still match
  createdBy: string | null;
};

export type CreateInvoiceResult = {
  invoiceId: string;
  amount: number;
  shifts: number;
  travel: number;
  emailed: boolean;
  warnings: string[];
};

type Target = {
  name: string; address: string | null; email: string | null; ndis_number: string | null; location_id: string | null;
};

async function loadTarget(kind: InvoiceKind, id: string): Promise<Target> {
  const rows = kind === "residential"
    ? await sql<Target[]>`
        select coalesce(name, '') as name, address->>'address' as address, email, null as ndis_number, id as location_id
          from app.locations where id = ${id}`
    : await sql<Target[]>`
        select trim(concat_ws(' ', u.first_name, u.last_name)) as name, l.address->>'address' as address,
               l.email, u.ndis_number, l.id as location_id
          from app.users u
          left join lateral (
            select l.* from app.users_locations ul join app.locations l on l.id = ul.locations_id
             where ul.users_id = u.id order by l.name limit 1) l on true
         where u.id = ${id} and u.account_type = 'participant'`;
  if (!rows[0]) throw new Error("That location or participant no longer exists.");
  return rows[0];
}

const firstName = (full: string) => full.split(" ")[0] ?? full;

export async function createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  const t = await loadTarget(input.kind, input.target);
  const due = dueDate(input.invoiceDate, input.paymentTerms);
  const number = input.invoiceNumber.trim();
  if (!number) throw new Error("Enter an invoice number.");

  // 1. Record the invoice and the shifts it bills, in one transaction.
  const created = await sql.begin(async (tx) => {
    // One invoice at a time, so two people can't bill the same shifts.
    await tx`select pg_advisory_xact_lock(hashtext('app.invoicing'))`;

    const taken = await tx`select 1 from app.invoices where invoice_number = ${number} limit 1`;
    if (taken.length) throw new Error(`Invoice number ${number} is already used.`);

    const shifts = await billableShifts(input.kind, input.target, input.through, tx as unknown as typeof sql);
    const travel: TravelRow[] = input.kind === "residential" ? [] : await billableTravel(input.target, input.through, tx as unknown as typeof sql);
    if (!shifts.length && !travel.length) throw new Error("There is nothing left to invoice for this selection.");

    const ids = shifts.map((s) => s.id).sort();
    const expected = [...input.expectedShiftIds].sort();
    if (ids.join() !== expected.join()) {
      throw new Error("The shifts changed since you loaded the page. Reload and check them again.");
    }

    if (travel.length) {
      const unmatched = travel.some((l) => !travelItemFor(l, shifts));
      if (unmatched && !TRAVEL_ITEMS.some((o) => o.no === input.travelItemNo)) {
        throw new Error("Choose a travel NDIS item for the travel that doesn't match a shift.");
      }
    }

    const sum = totals(input.kind, shifts, travel);
    const periodStart = shifts[0]?.date ?? null;
    const [inv] = await tx<{ id: string }[]>`
      insert into app.invoices (
        kind, state, created_in_app, invoice_number, invoice_date, due_date, payment_terms,
        period_start, period_ending, amount, subtotal, gst, location, participant, invoice_name,
        issued_at, created_by, emailed_to)
      values (
        ${input.kind}, 'issued', true, ${number}, ${input.invoiceDate}, ${due}, ${input.paymentTerms},
        ${periodStart}, ((${input.through}::date)::timestamp at time zone 'Australia/Melbourne'),
        ${sum.amount}, ${sum.subtotal}, ${sum.gst},
        ${input.kind === "residential" ? input.target : t.location_id},
        ${input.kind === "residential" ? null : input.target},
        ${input.kind === "residential" ? null : input.target},
        now(), ${input.createdBy}, ${input.sendTo})
      returning id`;

    if (shifts.length) {
      await tx`insert into app.invoice_shifts (invoice_id, shift_id) select ${inv.id}, unnest(${shifts.map((s) => s.id)}::uuid[])`;
    }
    if (travel.length) {
      await tx`insert into app.invoice_travel (invoice_id, shift_log_id) select ${inv.id}, unnest(${travel.map((l) => l.id)}::uuid[])`;
    }
    return { id: inv.id, shifts, travel, sum };
  });

  // Everything after this point is best effort: the invoice is saved, so
  // problems become warnings rather than errors (a retry would double-bill).
  const warnings: string[] = [];
  const attempt = async (what: string, fn: () => Promise<void>) => {
    try { await fn(); } catch (e) { warnings.push(`${what}: ${String((e as Error).message ?? e)}`); }
  };
  let emailed = false;

  await attempt("The invoice was saved but sending it failed", async () => {
    // 2. Make the PDF with the existing designs and keep a copy.
    const locName = input.kind === "residential" ? t.name : (await locationName(t.location_id)) ?? "";
    const common = {
      invoice_number: number,
      period_ending: auDate(input.through),
      invoice_date: auDate(input.invoiceDate),
      payment_terms: input.paymentTerms,
      due_date: auDate(due),
      location_address: t.address ?? "",
    };
    const pdf = input.kind === "residential"
      ? await residentialPdf({ ...common, location_name: t.name, line_items: residentialLineItems(created.shifts) })
      : await ndisPdf({
          ...common,
          participant: t.name, // first and last name on the PDF
          ndis_number: t.ndis_number ?? "",
          location_name: locName,
          shift_items: ndisShiftItems(created.shifts),
          travel_items: travelItems(created.travel, created.shifts, input.travelItemNo),
        });
    const filename = `${t.name} - Invoice ${number}.pdf`;
    await sql`insert into app.invoice_files (invoice_id, filename, pdf) values (${created.id}, ${filename}, ${Buffer.from(pdf, "base64")})`;

    // 3. Email it (NDIA also gets the claims CSV).
    const attachments = [{ Name: filename, Content: pdf, ContentType: "application/pdf" }];
    if (input.kind === "ndia") {
      const csv = toCsv(NDIA_HEADERS, ndiaCsvRows(created.shifts, number));
      attachments.push({ Name: `ndia-claims-${number}.csv`, Content: Buffer.from(csv, "utf8").toString("base64"), ContentType: "text/csv" });
    }
    try {
      await sendInvoiceEmail({
        to: input.sendTo,
        participant: input.kind === "residential" ? t.name : firstName(t.name),
        locationName: locName,
        invoiceNumber: number,
        attachments,
      });
      emailed = true;
      await sql`update app.invoices set emailed_at = now(), email_error = null where id = ${created.id}`;
      // As in Bubble: a plan-managed NDIS invoice also sends next week's roster to the coordinator.
      if (input.kind === "ndis") {
        try {
          await sendWeeklyRoster(input.target);
        } catch (e) {
          warnings.push(`The invoice was sent, but next week's roster wasn't: ${String((e as Error).message ?? e)}`);
        }
      }
    } catch (e) {
      await sql`update app.invoices set email_error = ${String((e as Error).message ?? e)} where id = ${created.id}`;
      throw e;
    }
  });

  return {
    invoiceId: created.id, amount: created.sum.amount, shifts: created.shifts.length,
    travel: created.travel.length, emailed, warnings,
  };
}

/**
 * Emails a saved invoice again, with the PDF kept when it was made (NDIA invoices also
 * get their claims CSV). For NDIS invoices, next week's roster goes to the coordinator too.
 */
export async function resendInvoice(id: string): Promise<{ to: string; warnings: string[] }> {
  const [inv] = await sql<{ kind: InvoiceKind; invoice_number: string; emailed_to: string | null; participant: string | null; location: string | null; state: string }[]>`
    select kind, invoice_number, emailed_to, participant, location, state from app.invoices where id = ${id} and created_in_app`;
  if (!inv) throw new Error("Invoice not found.");
  if (inv.state === "void") throw new Error("This invoice is void.");
  if (!inv.emailed_to) throw new Error("This invoice has no email address to send to.");
  const [file] = await sql<{ filename: string; pdf: Buffer }[]>`
    select filename, pdf from app.invoice_files where invoice_id = ${id} order by created_at desc limit 1`;
  if (!file) throw new Error("This invoice has no saved PDF to send.");
  const [who] = inv.kind === "residential"
    ? await sql<{ name: string }[]>`select coalesce(name, '') as name from app.locations where id = ${inv.location}`
    : await sql<{ name: string }[]>`select trim(concat_ws(' ', first_name, last_name)) as name from app.users where id = ${inv.participant}`;
  const attachments = [{ Name: file.filename, Content: Buffer.from(file.pdf).toString("base64"), ContentType: "application/pdf" }];
  if (inv.kind === "ndia") {
    const shifts = await invoiceShifts(id);
    const csv = toCsv(NDIA_HEADERS, ndiaCsvRows(shifts, inv.invoice_number));
    attachments.push({ Name: `ndia-claims-${inv.invoice_number}.csv`, Content: Buffer.from(csv, "utf8").toString("base64"), ContentType: "text/csv" });
  }
  try {
    await sendInvoiceEmail({
      to: inv.emailed_to,
      participant: inv.kind === "residential" ? who?.name ?? "" : firstName(who?.name ?? ""),
      locationName: (await locationName(inv.location)) ?? "",
      invoiceNumber: inv.invoice_number,
      attachments,
    });
  } catch (e) {
    await sql`update app.invoices set email_error = ${String((e as Error).message ?? e)} where id = ${id}`;
    throw e;
  }
  await sql`update app.invoices set emailed_at = now(), email_error = null where id = ${id}`;
  const warnings: string[] = [];
  if (inv.kind === "ndis" && inv.participant) {
    try { await sendWeeklyRoster(inv.participant); }
    catch (e) { warnings.push(`The invoice was sent, but next week's roster wasn't: ${String((e as Error).message ?? e)}`); }
  }
  return { to: inv.emailed_to, warnings };
}

async function locationName(id: string | null) {
  if (!id) return null;
  const [r] = await sql<{ name: string | null }[]>`select name from app.locations where id = ${id}`;
  return r?.name ?? null;
}
