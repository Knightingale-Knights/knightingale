-- Compliance files uploaded in the new app (Bubble's own files stay as links to Bubble's storage).
create table if not exists app.compliance_files (
  id uuid primary key default gen_random_uuid(),
  carer uuid not null references app.users(id) on delete cascade,
  doc text not null,
  file_name text not null,
  mime text not null,
  bytes bytea not null,
  reading jsonb,
  uploaded_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table app.compliance_files enable row level security;
create index if not exists compliance_files_carer on app.compliance_files (carer, doc);
-- The daily expiry email is sent once per document record and expiry date.
create table if not exists app.compliance_alerts (
  doc text not null,
  record uuid not null,
  expiry date not null,
  sent_at timestamptz not null default now(),
  primary key (doc, record, expiry)
);
alter table app.compliance_alerts enable row level security;
