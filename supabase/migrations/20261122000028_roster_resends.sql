-- One-off: rosters sent with NDIS invoices on 22 Nov 2026 went to participants instead of their
-- support coordinators. This records each one resent correctly, so it only happens once.
create table if not exists app.roster_resends (
  participant uuid primary key references app.users(id) on delete cascade,
  week_start date not null,
  sent_to text not null,
  sent_at timestamptz not null default now()
);
alter table app.roster_resends enable row level security;
