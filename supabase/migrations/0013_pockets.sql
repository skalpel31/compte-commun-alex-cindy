-- Envelope/pocket budgeting: money is allocated into named pockets (personal,
-- joint, savings, projects...) instead of tagging each transaction
-- shared/personal — replaces that confusing split with something concrete:
-- every transaction draws from (or credits) one pocket, and each pocket has
-- a running balance.
create table if not exists pockets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default 'wallet',
  color text not null,
  owner_id uuid references profiles (id) on delete set null, -- null = shared pocket
  allocation_pct smallint not null default 0 check (allocation_pct between 0 and 100),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table transactions add column if not exists pocket_id uuid references pockets (id) on delete set null;

alter table goals add column if not exists pocket_id uuid references pockets (id) on delete set null;

alter table pockets enable row level security;
create policy "household full access to pockets" on pockets
  for all to authenticated using (true) with check (true);
