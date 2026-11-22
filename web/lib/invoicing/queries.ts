import { sql } from "@/lib/db";
import type { InvoiceKind, ShiftRow, TravelRow, WintringhamShift } from "./rules";

// "Bill shifts up to" is a Melbourne calendar date; include the whole day.
const endOfDay = (through: string) =>
  sql`((${through}::date + 1)::timestamp at time zone 'Australia/Melbourne')`;

export type LocationOption = {
  id: string; name: string; email: string | null; address: string | null;
  invoiced_through_date: Date | null; billable: number;
};

export async function listLocations(): Promise<LocationOption[]> {
  return sql<LocationOption[]>`
    select l.id, coalesce(l.name, '(unnamed)') as name, l.email, l.address->>'address' as address,
           l.invoiced_through_date,
           (select count(*)::int from app.uninvoiced_shifts s where s.location = l.id and s.date <= now()) as billable
      from app.locations l
     order by billable desc, l.name`;
}

export type ParticipantOption = {
  id: string; bubble_id: string | null; name: string; ndis_number: string | null;
  coordinator_email: string | null; location_id: string | null; location_name: string | null;
  location_email: string | null; location_address: string | null; billable: number;
};

export async function listParticipants(): Promise<ParticipantOption[]> {
  return sql<ParticipantOption[]>`
    select u.id, u.bubble_id, trim(concat_ws(' ', u.first_name, u.last_name)) as name, u.ndis_number,
           c.email as coordinator_email,
           l.id as location_id, l.name as location_name, l.email as location_email, l.address->>'address' as location_address,
           (select count(*)::int from app.uninvoiced_shifts s where s.participant = u.id and s.date <= now()) as billable
      from app.users u
      left join app.users c on c.id = u.coordinator
      left join lateral (
        select l.* from app.users_locations ul join app.locations l on l.id = ul.locations_id
         where ul.users_id = u.id order by l.name limit 1) l on true
     where u.account_type = 'participant' and coalesce(u.active, false)
     order by lower(trim(concat_ws(' ', u.first_name, u.last_name)))`;
}

const shiftColumns = () => sql`
  s.id, s.bubble_id, s.date, s.start_time, s.end_time, s.hours, s.rate, s.fee, s.roles,
  c.first_name as carer_first, c.last_name as carer_last,
  p.item_no as ndis_item_no, p.item_name as ndis_item_name, p.item_price as ndis_item_price,
  s.registration, s.gst_code, s.abn, pt.ndis_number as participant_ndis_number, l.name as location_name`;

const shiftJoins = () => sql`
  left join app.users c on c.id = s.carer
  left join app.users pt on pt.id = s.participant
  left join app.ndis_price_items p on p.id = s.ndis_pricing
  left join app.locations l on l.id = s.location`;

/** The shifts on a saved invoice. */
export async function invoiceShifts(invoiceId: string, tx = sql): Promise<ShiftRow[]> {
  return tx<ShiftRow[]>`
    select ${shiftColumns()}, false as late
      from app.invoice_shifts x join app.shifts s on s.id = x.shift_id ${shiftJoins()}
     where x.invoice_id = ${invoiceId}
     order by s.date, s.start_time`;
}

/**
 * Shifts an invoice would bill. Same rules as Bubble's invoicing page (not yet
 * invoiced, dated on or before the cut-off, for this location or participant),
 * except late-entered shifts dated before the location's last invoiced-through
 * date are included and flagged, instead of being silently skipped.
 */
export async function billableShifts(
  kind: InvoiceKind, target: string, through: string, tx = sql,
): Promise<ShiftRow[]> {
  const where = kind === "residential" ? sql`s.location = ${target}` : sql`s.participant = ${target}`;
  return tx<ShiftRow[]>`
    select ${shiftColumns()},
           coalesce(s.date <= l.invoiced_through_date, false) as late
      from app.uninvoiced_shifts s ${shiftJoins()}
     where ${where} and s.date < ${endOfDay(through)}
     order by s.date, s.start_time`;
}

export async function billableTravel(participant: string, through: string, tx = sql): Promise<TravelRow[]> {
  return tx<TravelRow[]>`
    select t.id, t.bubble_id, t.date, c.first_name as carer_first, t.distance, p.item_no as shift_item_no
      from app.uninvoiced_travel t left join app.users c on c.id = t.carer
      left join app.shifts sh on sh.id = t.shift
      left join app.ndis_price_items p on p.id = sh.ndis_pricing
     where t.participant = ${participant} and coalesce(t.date, t.created_at) < ${endOfDay(through)}
     order by t.created_at`;
}

/** Billed residential shifts not yet sent to Wintringham (Brotherhood of St Laurence excluded, as in Bubble). */
export async function wintringhamPending(tx = sql): Promise<WintringhamShift[]> {
  return tx<WintringhamShift[]>`
    select ${shiftColumns()}, false as late,
           i.invoice_number, i.period_ending as invoice_period_ending, i.amount as invoice_amount
      from app.shifts s ${shiftJoins()}
      join lateral (
        select coalesce(
          (select x.invoice_id from app.invoice_shifts x where x.shift_id = s.id), s.invoice) as invoice_id) b on b.invoice_id is not null
      join app.invoices i on i.id = b.invoice_id
     where s.location is not null
       and coalesce(l.name, '') <> 'Brotherhood of St Laurence'
       and not coalesce(s.csv, false)
       and not exists (select 1 from app.wintringham_csv_sent w where w.shift_id = s.id)
       and s.date <= now()
     order by s.date desc`;
}

export async function nextInvoiceNumber(): Promise<string> {
  const [{ n }] = await sql<{ n: string }[]>`select app.next_invoice_number() as n`;
  return n;
}

export type InvoiceListRow = {
  id: string; invoice_number: string | null; kind: string | null; state: string; amount: number | null;
  billed_to: string | null; period_ending: Date | null; invoice_date: Date | null; created_in_app: boolean;
  emailed_to: string | null; emailed_at: Date | null; email_error: string | null; has_pdf: boolean; shift_count: number;
};

export async function recentInvoices(limit = 40): Promise<InvoiceListRow[]> {
  return sql<InvoiceListRow[]>`
    select i.id, i.invoice_number, i.kind, i.state, i.amount,
           coalesce(l.name, trim(concat_ws(' ', u.first_name, u.last_name))) as billed_to,
           i.period_ending, i.invoice_date, coalesce(i.created_in_app, false) as created_in_app, i.emailed_to, i.emailed_at, i.email_error,
           exists (select 1 from app.invoice_files f where f.invoice_id = i.id) as has_pdf,
           (select count(*)::int from app.invoice_shifts x where x.invoice_id = i.id) as shift_count
      from app.invoices i
      left join app.locations l on l.id = i.location
      left join app.users u on u.id = coalesce(i.invoice_name, i.participant)
     order by coalesce(i.created_in_app, false) desc, coalesce(i.issued_at, i.created_at) desc
     limit ${limit}`;
}
