-- The daily compliance email now also lists expired documents, each once: alerts are kept per kind ('soon' or 'expired').
alter table app.compliance_alerts add column if not exists kind text not null default 'soon';
alter table app.compliance_alerts drop constraint if exists compliance_alerts_pkey;
alter table app.compliance_alerts add primary key (doc, record, expiry, kind);
