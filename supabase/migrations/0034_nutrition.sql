-- Nutrition + Courses: shared (household-wide) recipes, a configurable
-- weekly meal-slot template, per-week meal plan entries, and the shopping
-- list generated from them. No private/shared split needed here (unlike
-- health data) — the whole household plans and shops together.

create table recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  description text,
  meal_types text[] not null default '{}',
  servings int not null default 4,
  ingredients jsonb not null default '[]',
  instructions text,
  generated_by_ai boolean not null default false,
  created_at timestamptz not null default now()
);

-- The recurring default: for each day of the week and meal type, who eats
-- it. Pre-filled with a sensible default (everyone, every day) and edited
-- from there — never hardcoded to one household's actual routine.
create table meal_slots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_type text not null check (meal_type in ('petit_dejeuner', 'dejeuner', 'gouter', 'diner')),
  participant_profile_ids uuid[] not null default '{}',
  unique (household_id, day_of_week, meal_type)
);

-- The actual plan for one specific week — starts as a copy of meal_slots
-- when a week is opened/generated, but can diverge from the template
-- (someone's away that day, a recipe gets swapped, etc.).
create table meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_type text not null check (meal_type in ('petit_dejeuner', 'dejeuner', 'gouter', 'diner')),
  recipe_id uuid references recipes(id) on delete set null,
  participant_profile_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (household_id, week_start, day_of_week, meal_type)
);

create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  source text not null default 'manual' check (source in ('generated', 'manual')),
  created_at timestamptz not null default now()
);

alter table recipes enable row level security;
alter table meal_slots enable row level security;
alter table meal_plan_entries enable row level security;
alter table shopping_list_items enable row level security;

create policy "household full access to recipes" on recipes
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

create policy "household full access to meal_slots" on meal_slots
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

create policy "household full access to meal_plan_entries" on meal_plan_entries
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());

create policy "household full access to shopping_list_items" on shopping_list_items
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());
