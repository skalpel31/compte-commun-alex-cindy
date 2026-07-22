-- Per-person health tracking (weight/BMI). Private to each adult, but a
-- memberless profile (a child, who has no account) is visible to every adult
-- in the household — they're the ones actually logging it on the child's
-- behalf.
create table health_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  height_cm numeric,
  target_weight_kg numeric,
  daily_calorie_target numeric,
  goal_type text check (goal_type in ('perte_de_poids', 'prise_de_masse', 'maintien')),
  protein_target_g numeric,
  carbs_target_g numeric,
  fat_target_g numeric,
  updated_at timestamptz not null default now()
);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  measurements jsonb,
  note text,
  created_at timestamptz not null default now(),
  unique (profile_id, date)
);

alter table health_profiles enable row level security;
alter table weight_logs enable row level security;

create policy "health data private-per-adult, shared for kids" on health_profiles
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ));

create policy "weight logs private-per-adult, shared for kids" on weight_logs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ));
