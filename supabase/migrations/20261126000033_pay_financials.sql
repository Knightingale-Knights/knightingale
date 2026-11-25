-- Award-wage update (pay rates from 25 Nov 2026): pay settings, per-rate financials,
-- per-shift costs and profit, and the rate_financials view. Applied via the Supabase MCP on 26 Nov 2026.

create table if not exists app.pay_settings (
  id int primary key default 1 check (id = 1),
  super_rate numeric not null default 0.12,
  workcover_rate numeric not null default 0.04,
  overhead_per_hour numeric not null default 0,
  target_margin numeric not null default 0.20,
  effective_from date not null default '2026-11-25',
  updated_at timestamptz not null default now()
);
insert into app.pay_settings (id) values (1) on conflict (id) do nothing;
alter table app.pay_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['residential_prices','ndis_price_items'] loop
    execute format('alter table app.%I
      add column if not exists track text,
      add column if not exists award_min numeric,
      add column if not exists award_classification text,
      add column if not exists previous_carer_pay numeric,
      add column if not exists pay_effective_from date,
      add column if not exists super_per_hour numeric,
      add column if not exists workcover_per_hour numeric,
      add column if not exists total_cost_per_hour numeric,
      add column if not exists margin numeric,
      add column if not exists breakeven_charge numeric,
      add column if not exists target_margin_charge numeric,
      add column if not exists archived boolean not null default false', t);
  end loop;
end $$;

comment on column app.residential_prices.hourly_revenue is 'Profit per hour: charge minus pay, super, WorkSafe and overheads';
comment on column app.ndis_price_items.hourly_revenue is 'Profit per hour: charge minus pay, super, WorkSafe and overheads';

alter table app.shifts
  add column if not exists super_cost numeric,
  add column if not exists workcover_cost numeric,
  add column if not exists overhead_cost numeric,
  add column if not exists total_cost numeric,
  add column if not exists margin numeric;

comment on column app.shifts.revenue is 'Profit: fee minus total_cost (from pay_settings.effective_from onwards)';

create or replace function app.calc_price_financials() returns trigger
language plpgsql set search_path = app, public as $$
declare s app.pay_settings; charge numeric; pay numeric;
begin
  select * into s from app.pay_settings where id = 1;
  charge := coalesce((to_jsonb(new) ->> tg_argv[0])::numeric, 0);
  pay := coalesce(new.carer_pay, 0);
  new.super_per_hour := round(pay * s.super_rate, 4);
  new.workcover_per_hour := round(pay * s.workcover_rate, 4);
  new.total_cost_per_hour := round(pay + new.super_per_hour + new.workcover_per_hour + s.overhead_per_hour, 4);
  new.hourly_revenue := round(charge - new.total_cost_per_hour, 2);
  new.margin := case when charge > 0 then round(new.hourly_revenue / charge, 4) end;
  new.breakeven_charge := round(new.total_cost_per_hour, 2);
  new.target_margin_charge := round(new.total_cost_per_hour / (1 - s.target_margin), 2);
  if tg_op = 'UPDATE' and new.carer_pay is distinct from old.carer_pay then
    new.previous_carer_pay := old.carer_pay;
    if new.pay_effective_from is not distinct from old.pay_effective_from then
      new.pay_effective_from := (now() at time zone 'Australia/Melbourne')::date;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists residential_prices_financials on app.residential_prices;
create trigger residential_prices_financials before insert or update on app.residential_prices
  for each row execute function app.calc_price_financials('rate');
drop trigger if exists ndis_price_items_financials on app.ndis_price_items;
create trigger ndis_price_items_financials before insert or update on app.ndis_price_items
  for each row execute function app.calc_price_financials('item_price');

create or replace function app.calc_shift_financials() returns trigger
language plpgsql set search_path = app, public as $$
declare s app.pay_settings;
begin
  select * into s from app.pay_settings where id = 1;
  if new.date is null or (new.date at time zone 'Australia/Melbourne')::date < s.effective_from then
    return new;
  end if;
  new.super_cost := round(coalesce(new.wage, 0) * s.super_rate, 2);
  new.workcover_cost := round(coalesce(new.wage, 0) * s.workcover_rate, 2);
  new.overhead_cost := round(coalesce(new.hours, 0) * s.overhead_per_hour, 2);
  new.total_cost := coalesce(new.wage, 0) + new.super_cost + new.workcover_cost + new.overhead_cost;
  new.revenue := round(coalesce(new.fee, 0) - new.total_cost, 2);
  new.margin := case when coalesce(new.fee, 0) > 0 then round(new.revenue / new.fee, 4) end;
  return new;
end $$;

drop trigger if exists shifts_financials on app.shifts;
create trigger shifts_financials before insert or update on app.shifts
  for each row execute function app.calc_shift_financials();

create or replace function app.recalc_on_pay_settings() returns trigger
language plpgsql set search_path = app, public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function app.recalc_after_pay_settings() returns trigger
language plpgsql set search_path = app, public as $$
begin
  update app.residential_prices set updated_at = updated_at;
  update app.ndis_price_items set updated_at = updated_at;
  update app.shifts set updated_at = updated_at
    where (date at time zone 'Australia/Melbourne')::date >= new.effective_from
      and not coalesce(invoiced, false);
  return null;
end $$;

drop trigger if exists pay_settings_touch on app.pay_settings;
create trigger pay_settings_touch before update on app.pay_settings
  for each row execute function app.recalc_on_pay_settings();
drop trigger if exists pay_settings_recalc on app.pay_settings;
create trigger pay_settings_recalc after update on app.pay_settings
  for each row execute function app.recalc_after_pay_settings();

create or replace view app.rate_financials with (security_invoker = true) as
select 'Aged care'::text as stream, track, name as shift, null::text as ndis_item, rate as charge_per_hour,
  carer_pay, previous_carer_pay, pay_effective_from, award_min, award_classification,
  carer_pay - award_min as above_award_by, super_per_hour, workcover_per_hour, total_cost_per_hour,
  hourly_revenue as profit_per_hour, margin, breakeven_charge, target_margin_charge, archived
from app.residential_prices
union all
select 'NDIS', track, carer_pay_name, item_no, item_price,
  carer_pay, previous_carer_pay, pay_effective_from, award_min, award_classification,
  carer_pay - award_min, super_per_hour, workcover_per_hour, total_cost_per_hour,
  hourly_revenue, margin, breakeven_charge, target_margin_charge, archived
from app.ndis_price_items;
