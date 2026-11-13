-- Invoicing fixes on top of the generated schema.
--
-- In Bubble, typing an NDIA invoice number rewrote shifts.booked_by on every
-- shift in the batch. In the new app the invoice number lives only on
-- app.invoices, and each shift points at its invoice via shifts.invoice.
-- Data migration: where a shift's booked_by holds an NDIA invoice number,
-- link the shift to that invoice and clear booked_by.

-- What kind of invoice this is, and where it is in its life.
alter table app.invoices
  add column kind text check (kind in ('ndis', 'ndia', 'residential')),
  add column state text not null default 'draft'
    check (state in ('draft', 'issued', 'paid', 'void')),
  add column period_start timestamptz,
  add column issued_at timestamptz,
  add column paid_at timestamptz;

comment on column app.invoices.status is 'Bubble invoice.status_boolean. Superseded by state; kept for migration.';
comment on column app.invoices.state is 'draft, issued, paid or void';

-- One invoice number, one invoice.
create unique index invoices_invoice_number_key
  on app.invoices (invoice_number) where invoice_number is not null;

-- shifts.invoice is the single source of truth for "is this shift invoiced".
comment on column app.shifts.invoice is 'The invoice this shift is billed on. Null means not yet invoiced.';
comment on column app.shifts.invoiced is 'Bubble shift.invoiced_boolean. Superseded by shifts.invoice; kept for migration.';
comment on column app.shifts.needs_invoice is 'Bubble shift.needs_invoice_boolean. Superseded by shifts.invoice; kept for migration.';
comment on column app.shifts.booked_by is 'Who booked the shift. Must not hold invoice numbers (Bubble did this for NDIA).';

-- Fast lookup of shifts still waiting to be invoiced, for batch runs.
create index shifts_uninvoiced_idx
  on app.shifts (date)
  where invoice is null and coalesce(cancelled, false) = false;

-- Link a batch of shifts to one invoice in a single statement.
-- Only shifts not already invoiced are touched. Returns how many were linked.
create or replace function app.attach_shifts_to_invoice(p_invoice uuid, p_shifts uuid[])
returns integer
language sql
as $$
  with updated as (
    update app.shifts
       set invoice = p_invoice
     where id = any(p_shifts)
       and invoice is null
    returning 1
  )
  select count(*)::int from updated;
$$;

revoke all on function app.attach_shifts_to_invoice(uuid, uuid[]) from public;
