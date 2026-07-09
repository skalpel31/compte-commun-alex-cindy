-- Distinguishes a budget limit the app derived automatically from a
-- category's active bills from one the user has manually customized, so
-- bill changes can keep the former in sync without clobbering the latter.
alter table budgets add column if not exists auto boolean not null default true;
