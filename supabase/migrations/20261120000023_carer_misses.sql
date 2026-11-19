-- Missed calls and opportunities on days a carer marked themselves available (Availability page dropdown).
-- One row per carer per day; kept for a future reliability score. Reasons are the option set "miss_reason".
create table if not exists app.carer_misses (
  id uuid primary key default gen_random_uuid(),
  carer uuid not null references app.users(id) on delete cascade,
  day date not null,
  reason text not null,
  created_by uuid references app.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (carer, day)
);
create index if not exists carer_misses_carer_idx on app.carer_misses (carer, day);
alter table app.carer_misses enable row level security;

insert into app.option_values (set_key, value, display, sort) values
  ('miss_reason', 'no_answer', 'didn''t answer', 1),
  ('miss_reason', 'refused', 'refused', 2),
  ('miss_reason', 'unavailable', 'unavailable', 3)
on conflict (set_key, value) do nothing;
