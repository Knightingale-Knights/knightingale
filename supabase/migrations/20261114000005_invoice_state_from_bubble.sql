-- Invoices synced from Bubble have no state. Derive it from Bubble's
-- status flag (true = paid) so they satisfy the not-null state column.
create or replace function app.invoices_default_state() returns trigger language plpgsql as $$
begin
  if new.state is null then
    new.state := case when coalesce(new.status, false) then 'paid' else 'issued' end;
  end if;
  return new;
end $$;

create trigger invoices_default_state before insert or update on app.invoices
for each row execute function app.invoices_default_state();
