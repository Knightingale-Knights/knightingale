-- When a carer first saw that an Account item was missing or expired: they get two weeks from then before it blocks the app.
create table if not exists app.account_nags (
  carer uuid not null references app.users(id) on delete cascade,
  item text not null,
  first_seen date not null default (now() at time zone 'Australia/Melbourne')::date,
  primary key (carer, item)
);
alter table app.account_nags enable row level security;
-- "I don't have insurance" counts as done (they can't be rostered where a participant needs a car).
alter table app.users add column if not exists no_insurance boolean not null default false;
