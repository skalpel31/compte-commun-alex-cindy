-- Running: shared with the whole household (kids included, to motivate
-- them too) — unlike weight/BMI tracking, no private-per-adult split here.
create table runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  distance_m numeric not null,
  duration_s int not null,
  route jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table runs enable row level security;

create policy "household full access to runs" on runs
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());
