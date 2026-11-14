-- Invoicing in the new app.
--
-- The Bubble sync owns every column it copies, so anything the new app decides
-- lives in tables the sync never touches:
--   app.invoice_shifts / app.invoice_travel  which shifts and travel logs an invoice bills
--   app.invoice_files                        the PDF that was sent
--   app.wintringham_csv_sent                 shifts already sent to Wintringham
-- Invoices created here have no bubble_id, so the sync never overwrites them.
-- shifts.invoice (from Bubble) and app.attach_shifts_to_invoice() are no longer used.

alter table app.invoices
  add column created_in_app boolean default false, -- nullable: the sync writes null for Bubble invoices
  add column invoice_date date,
  add column due_date date,
  add column payment_terms text,
  add column subtotal numeric,
  add column gst numeric,
  add column emailed_to text,
  add column emailed_at timestamptz,
  add column email_error text,
  add column bubble_writeback_at timestamptz,
  add column bubble_writeback_error text;

create table app.invoice_shifts (
  invoice_id uuid not null references app.invoices(id) on delete cascade,
  shift_id uuid not null unique references app.shifts(id) on delete cascade,
  primary key (invoice_id, shift_id)
);

create table app.invoice_travel (
  invoice_id uuid not null references app.invoices(id) on delete cascade,
  shift_log_id uuid not null unique references app.shift_logs(id) on delete cascade,
  primary key (invoice_id, shift_log_id)
);

create table app.invoice_files (
  invoice_id uuid primary key references app.invoices(id) on delete cascade,
  filename text not null,
  pdf bytea not null,
  created_at timestamptz not null default now()
);

create table app.wintringham_csv_sent (
  shift_id uuid primary key references app.shifts(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table app.invoice_shifts enable row level security;
alter table app.invoice_travel enable row level security;
alter table app.invoice_files enable row level security;
alter table app.wintringham_csv_sent enable row level security;

-- A shift is billable when Bubble hasn't marked it invoiced and no invoice here bills it.
create view app.uninvoiced_shifts with (security_invoker = true) as
select s.* from app.shifts s
 where not coalesce(s.invoiced, false)
   and not exists (select 1 from app.invoice_shifts x where x.shift_id = s.id);

create view app.uninvoiced_travel with (security_invoker = true) as
select l.* from app.shift_logs l
 where not coalesce(l.invoiced, false)
   and not exists (select 1 from app.invoice_travel x where x.shift_log_id = l.id);

-- Next free numeric invoice number, across Bubble and new-app invoices.
create or replace function app.next_invoice_number() returns text
language sql stable as $$
  select (coalesce(max(invoice_number::bigint), 0) + 1)::text
    from app.invoices where invoice_number ~ '^[0-9]{1,15}$'
$$;
