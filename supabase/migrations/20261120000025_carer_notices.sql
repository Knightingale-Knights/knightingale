-- Notices the office writes for carers: shown as a popup on the carer pages while active, to the chosen
-- roles and/or carers (none chosen = every active carer), until each carer taps "Got it".
create table if not exists app.carer_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean not null default false,
  roles text[] not null default '{}',
  carers uuid[] not null default '{}',
  created_by uuid references app.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists app.carer_notice_reads (
  notice uuid not null references app.carer_notices(id) on delete cascade,
  carer uuid not null references app.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice, carer)
);
alter table app.carer_notices enable row level security;
alter table app.carer_notice_reads enable row level security;
