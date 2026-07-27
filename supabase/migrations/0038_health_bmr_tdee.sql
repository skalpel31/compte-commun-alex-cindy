-- Adds what's needed to compute a real BMR/TDEE-based calorie target
-- (Mifflin-St Jeor) instead of asking the user to guess a number.
alter table health_profiles add column if not exists age int;
alter table health_profiles add column if not exists sex text check (sex in ('homme', 'femme'));
alter table health_profiles add column if not exists activity_level text
  check (activity_level in ('sedentaire', 'leger', 'modere', 'actif', 'tres_actif'));
alter table health_profiles add column if not exists goal_duration_months numeric;
