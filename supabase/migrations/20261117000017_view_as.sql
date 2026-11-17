-- Admin "View as": who looked at the app as whom, and the actions taken while doing so.
create table if not exists app.view_as_log (
  id uuid primary key default gen_random_uuid(),
  admin uuid not null references app.users(id),
  target uuid not null references app.users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table app.view_as_log enable row level security;

create table if not exists app.view_as_actions (
  id uuid primary key default gen_random_uuid(),
  session uuid not null references app.view_as_log(id) on delete cascade,
  at timestamptz not null default now(),
  page text
);
alter table app.view_as_actions enable row level security;
