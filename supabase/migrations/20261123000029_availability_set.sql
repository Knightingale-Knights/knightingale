-- Past availability is now deleted every night, so "has given availability" (account setup tick)
-- is kept on the carer instead of inferred from availability rows.
alter table app.users add column if not exists availability_set boolean not null default false;
update app.users u set availability_set = true
 where exists (select 1 from app.availability a where a.carer = u.id and coalesce(a.available, false));
