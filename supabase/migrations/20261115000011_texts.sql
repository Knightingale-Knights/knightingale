-- Carer texts sent by the new app (check in, check out, progress note reminders). One row per shift and kind, so a text never goes twice.
create table if not exists app.text_log (
  id bigserial primary key,
  shift uuid not null references app.shifts(id) on delete cascade,
  kind text not null check (kind in ('checkin', 'checkout', 'notes_1', 'notes_2', 'notes_3')),
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'dry_run', 'no_phone', 'failed')),
  carer uuid references app.users(id) on delete set null,
  phone text,
  body text,
  twilio_sid text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (shift, kind)
);
alter table app.text_log enable row level security;
