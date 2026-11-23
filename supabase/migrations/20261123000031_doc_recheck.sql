-- One-off re-check of car insurance and qualification documents (23 Nov 2026).
create table if not exists app.doc_recheck (
  carer uuid not null,
  doc text not null,
  file text not null,
  result text not null,
  checked_at timestamptz not null default now(),
  primary key (doc, file)
);
alter table app.doc_recheck enable row level security;
