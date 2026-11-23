-- When a carer submitted their application in the new app (pending carers without it are asked to apply here).
alter table app.users add column if not exists applied_at timestamptz;
