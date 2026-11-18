-- Expiry of the carer's insurance certificate of currency (typed in by the carer).
alter table app.identity_documents add column if not exists insurance_expiry timestamptz;
