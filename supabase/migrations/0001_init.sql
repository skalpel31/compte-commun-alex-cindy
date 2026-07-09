-- Schéma initial : compte commun à 2 personnes (pas d'inscription publique).
-- Les 2 comptes (Alex, Cindy) sont créés à la main dans Supabase Auth.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  color text,
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  date date not null default current_date,
  description text,
  category_id uuid references categories (id) on delete set null,
  paid_by uuid not null references profiles (id) on delete cascade,
  split_type text not null default 'shared' check (split_type in ('shared', 'personal')),
  split_ratio jsonb not null default '{}'::jsonb,
  is_recurring boolean not null default false,
  recurring_rule text,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  month date not null,
  amount_limit numeric(12, 2) not null check (amount_limit > 0),
  scope text not null default 'shared' check (scope in ('shared', 'personal')),
  user_id uuid references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (category_id, month, scope, user_id)
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references profiles (id) on delete cascade,
  to_user uuid not null references profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- Un profil est créé automatiquement à la création du compte auth.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS : uniquement les 2 comptes authentifiés du foyer, pas d'accès public.
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table settlements enable row level security;
alter table push_subscriptions enable row level security;

create policy "household can read profiles" on profiles
  for select to authenticated using (true);
create policy "user can update own profile" on profiles
  for update to authenticated using (auth.uid() = id);

create policy "household full access to categories" on categories
  for all to authenticated using (true) with check (true);

create policy "household full access to transactions" on transactions
  for all to authenticated using (true) with check (true);

create policy "household full access to budgets" on budgets
  for all to authenticated using (true) with check (true);

create policy "household full access to goals" on goals
  for all to authenticated using (true) with check (true);

create policy "household full access to settlements" on settlements
  for all to authenticated using (true) with check (true);

create policy "user manages own push subscriptions" on push_subscriptions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Catégories de départ.
insert into categories (name, icon, color, type) values
  ('Courses', 'shopping-cart', 'chart-1', 'expense'),
  ('Logement', 'home', 'chart-2', 'expense'),
  ('Transport', 'car', 'chart-3', 'expense'),
  ('Loisirs', 'party-popper', 'chart-4', 'expense'),
  ('Santé', 'heart-pulse', 'chart-5', 'expense'),
  ('Salaire', 'wallet', 'chart-1', 'income')
on conflict do nothing;
