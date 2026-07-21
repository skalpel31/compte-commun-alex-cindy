-- Multi-tenant retrofit: every household's data is isolated from every other.
-- Safe to run now because every household-scoped table except profiles is
-- currently empty (data was reset to zero for this exact purpose).

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mon foyer',
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);
alter table households enable row level security;

-- profiles: backfill the one real household (Alex & Cindy) that already
-- exists before making the column mandatory. Must happen before
-- current_household_id() is defined below, since that function's body is
-- validated against profiles' columns at CREATE FUNCTION time.
alter table profiles add column if not exists household_id uuid references households(id) on delete cascade;

do $$
declare
  v_household_id uuid;
begin
  if exists (select 1 from profiles where household_id is null) then
    insert into households (name) values ('Nous Deux') returning id into v_household_id;
    update profiles set household_id = v_household_id where household_id is null;
  end if;
end $$;

alter table profiles alter column household_id set not null;

create or replace function current_household_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select household_id from profiles where id = auth.uid()
$$;

create policy "household can read its own household" on households
  for select to authenticated using (id = current_household_id());

-- Every other household-scoped table is empty right now, so the column can
-- go straight to NOT NULL with no backfill step needed.
alter table categories add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table transactions add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table budgets add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table goals add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table settlements add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table pockets add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table bills add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table bill_payments add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table bill_alerts_sent add column if not exists household_id uuid not null references households(id) on delete cascade;
alter table budget_alerts_sent add column if not exists household_id uuid not null references households(id) on delete cascade;

-- Re-scope every "household full access" policy from `using (true)` (any
-- authenticated user, any household) to the caller's own household only.
drop policy if exists "household full access to categories" on categories;
create policy "household full access to categories" on categories
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to transactions" on transactions;
create policy "household full access to transactions" on transactions
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to budgets" on budgets;
create policy "household full access to budgets" on budgets
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to goals" on goals;
create policy "household full access to goals" on goals
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to settlements" on settlements;
create policy "household full access to settlements" on settlements
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to pockets" on pockets;
create policy "household full access to pockets" on pockets
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to bills" on bills;
create policy "household full access to bills" on bills
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to bill_payments" on bill_payments;
create policy "household full access to bill_payments" on bill_payments
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to bill_alerts_sent" on bill_alerts_sent;
create policy "household full access to bill_alerts_sent" on bill_alerts_sent
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

drop policy if exists "household full access to budget_alerts_sent" on budget_alerts_sent;
create policy "household full access to budget_alerts_sent" on budget_alerts_sent
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

-- profiles: read is now scoped to the caller's own household instead of
-- every authenticated user across every household.
drop policy if exists "household can read profiles" on profiles;
create policy "household can read profiles" on profiles
  for select to authenticated using (household_id = current_household_id());

-- New-signup trigger needs to insert a household + first profile row before
-- current_household_id() has anything to find for that user, so the insert
-- itself is done as security definer in handle_new_user() (see 0025).
