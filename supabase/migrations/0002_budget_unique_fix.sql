-- NULL user_id (shared budgets) never conflicts with itself under a plain
-- UNIQUE constraint, so upserts would insert duplicates instead of updating.
-- The app only manages shared, household-wide budgets (one per category per
-- month), so key uniqueness on that pair directly.
alter table budgets drop constraint if exists budgets_category_id_month_scope_user_id_key;
drop index if exists budgets_shared_unique;
drop index if exists budgets_personal_unique;

create unique index if not exists budgets_category_month_unique
  on budgets (category_id, month);
