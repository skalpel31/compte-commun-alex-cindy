-- Lets an income entry be dated on the day it was actually received while
-- still counting toward a different month's budget (e.g. a salary paid on
-- 29/07 that's meant to fund August). budget_month is an explicit override;
-- when absent, effective_month falls back to the calendar month of `date`,
-- so every existing row and every non-income transaction behaves exactly as
-- before.
alter table transactions add column budget_month date;
alter table transactions add column effective_month date
  generated always as (
    coalesce(budget_month, make_date(extract(year from date)::int, extract(month from date)::int, 1))
  ) stored;

create index if not exists transactions_effective_month_idx on transactions (household_id, effective_month);
