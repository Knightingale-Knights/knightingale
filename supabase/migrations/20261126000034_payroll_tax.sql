-- Victorian payroll tax (4.85% of wages + super) added to every rate and shift from 25 Nov 2026.
-- Applied via the Supabase MCP on 26 Nov 2026.

alter table app.pay_settings add column if not exists payroll_tax_rate numeric not null default 0.0485;
comment on column app.pay_settings.payroll_tax_rate is 'Victorian payroll tax, applied to wages + super on every shift (marginal rate above the $1m threshold)';

alter table app.residential_prices add column if not exists payroll_tax_per_hour numeric;
alter table app.ndis_price_items add column if not exists payroll_tax_per_hour numeric;
alter table app.shifts add column if not exists payroll_tax_cost numeric;

create or replace function app.calc_price_financials() returns trigger
language plpgsql set search_path = app, public as $$
declare s app.pay_settings; charge numeric; pay numeric;
begin
  select * into s from app.pay_settings where id = 1;
  charge := coalesce((to_jsonb(new) ->> tg_argv[0])::numeric, 0);
  pay := coalesce(new.carer_pay, 0);
  new.super_per_hour := round(pay * s.super_rate, 4);
  new.workcover_per_hour := round(pay * s.workcover_rate, 4);
  new.payroll_tax_per_hour := round((pay + new.super_per_hour) * s.payroll_tax_rate, 4);
  new.total_cost_per_hour := round(pay + new.super_per_hour + new.workcover_per_hour + new.payroll_tax_per_hour + s.overhead_per_hour, 4);
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
  new.payroll_tax_cost := round((coalesce(new.wage, 0) + new.super_cost) * s.payroll_tax_rate, 2);
  new.overhead_cost := round(coalesce(new.hours, 0) * s.overhead_per_hour, 2);
  new.total_cost := coalesce(new.wage, 0) + new.super_cost + new.workcover_cost + new.payroll_tax_cost + new.overhead_cost;
  new.revenue := round(coalesce(new.fee, 0) - new.total_cost, 2);
  new.margin := case when coalesce(new.fee, 0) > 0 then round(new.revenue / new.fee, 4) end;
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
  update public.recurring_shift_templates
    set revenue_rate = round(rate - wage * (1 + new.super_rate + new.workcover_rate + new.payroll_tax_rate * (1 + new.super_rate)) - new.overhead_per_hour, 2);
  return null;
end $$;

drop view if exists app.rate_financials;
create view app.rate_financials with (security_invoker = true) as
select 'Aged care'::text as stream, track, name as shift, null::text as ndis_item, rate as charge_per_hour,
  carer_pay, previous_carer_pay, pay_effective_from, award_min, award_classification,
  carer_pay - award_min as above_award_by, super_per_hour, workcover_per_hour, payroll_tax_per_hour, total_cost_per_hour,
  hourly_revenue as profit_per_hour, margin, breakeven_charge, target_margin_charge, archived
from app.residential_prices
union all
select 'NDIS', track, carer_pay_name, item_no, item_price,
  carer_pay, previous_carer_pay, pay_effective_from, award_min, award_classification,
  carer_pay - award_min, super_per_hour, workcover_per_hour, payroll_tax_per_hour, total_cost_per_hour,
  hourly_revenue, margin, breakeven_charge, target_margin_charge, archived
from app.ndis_price_items;

update app.pay_settings set payroll_tax_rate = 0.0485 where id = 1;
