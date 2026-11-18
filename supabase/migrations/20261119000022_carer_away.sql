-- A carer telling us they're away (on holiday or sick) for a run of days. If they're rostered in that time,
-- Paul is emailed straight away, and the Saturday Klarra shift check lists any such shift still rostered.
create table if not exists app.carer_away (
  id uuid primary key default gen_random_uuid(),
  carer uuid not null references app.users(id) on delete cascade,
  from_day date not null,
  to_day date not null,
  reason text not null check (reason in ('holiday', 'sick')),
  note text,
  created_at timestamptz not null default now(),
  check (to_day >= from_day)
);
create index if not exists carer_away_carer_idx on app.carer_away (carer, to_day);
alter table app.carer_away enable row level security;
