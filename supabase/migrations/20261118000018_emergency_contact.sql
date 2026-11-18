-- Carer's emergency contact, kept on the user (new in the app; Bubble had no field for it).
alter table app.users add column if not exists emergency_name text;
alter table app.users add column if not exists emergency_relationship text;
alter table app.users add column if not exists emergency_phone text;
