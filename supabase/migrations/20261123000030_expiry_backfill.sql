-- One-off: CPR and first aid records with a file but no expiry are read again (expiry, or issue date + 12 months / 3 years).
-- Each record tried is noted here so it is only read once.
create table if not exists app.expiry_backfill (
  record_id uuid primary key,
  doc text not null,
  result text,
  tried_at timestamptz not null default now()
);
alter table app.expiry_backfill enable row level security;
