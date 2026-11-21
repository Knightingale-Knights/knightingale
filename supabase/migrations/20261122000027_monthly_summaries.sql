-- Monthly support summaries: one row per participant per month, so each is drafted and emailed to the coordinator once.
create table if not exists app.monthly_summaries (
  participant uuid not null references app.users(id) on delete cascade,
  month date not null,
  coordinator uuid,
  claimed_at timestamptz,
  attempts int not null default 0,
  sent_at timestamptz,
  error text,
  primary key (participant, month)
);
alter table app.monthly_summaries enable row level security;
