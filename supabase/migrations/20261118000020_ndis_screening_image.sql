-- Optional picture of the carer's NDIS worker screening clearance (Bubble kept only the ID and expiry).
alter table app.ndis_screening_checks add column if not exists image text;
