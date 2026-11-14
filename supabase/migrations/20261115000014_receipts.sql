-- Receipts carers upload on a shift. The file is kept here; the total is read from it by AI and added to shifts.receipts_total.
create table if not exists app.receipt_files (
  id uuid primary key default gen_random_uuid(),
  shift uuid not null references app.shifts(id) on delete cascade,
  carer uuid references app.users(id) on delete set null,
  file_name text not null,
  mime text not null,
  bytes bytea not null,
  total numeric,
  merchant text,
  needs_review boolean not null default true,
  reason text,
  created_at timestamptz not null default now()
);
alter table app.receipt_files enable row level security;
create index if not exists receipt_files_shift on app.receipt_files (shift);
create index if not exists shift_logs_shift on app.shift_logs (shift);
