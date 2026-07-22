-- Calisthenics training: private to each adult, same rule as weight/BMI
-- tracking (health_profiles/weight_logs) — a memberless profile (a child)
-- stays visible to every adult in the household, an adult's own data does
-- not.
create table fitness_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  term text not null check (term in ('moyen_terme', 'long_terme')),
  target_date date,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);

create table training_programs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  level text not null default 'debutant' check (level in ('debutant', 'intermediaire', 'avance')),
  has_pullup_bar boolean not null default false,
  sessions_per_week int not null default 1,
  sessions jsonb not null default '[]',
  generated_by_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  program_id uuid references training_programs(id) on delete set null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (profile_id, date)
);

alter table fitness_goals enable row level security;
alter table training_programs enable row level security;
alter table workout_logs enable row level security;

create policy "fitness goals private-per-adult, shared for kids" on fitness_goals
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ));

create policy "training programs private-per-adult, shared for kids" on training_programs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ));

create policy "workout logs private-per-adult, shared for kids" on workout_logs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or user_id is null)
  ));
