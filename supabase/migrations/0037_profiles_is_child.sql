-- "Memberless" (user_id is null) was being used as a proxy for "this is a
-- child, share their data with every parent" — but a memberless profile is
-- also what an invited ADULT looks like before they claim their own
-- account (e.g. Cindy, pre-signup). That wrongly exposed her not-yet-real
-- health/fitness data to Alex as if she were a kid. is_child makes the
-- intent explicit instead of inferring it from "has no login yet".
alter table profiles add column if not exists is_child boolean not null default false;

-- Re-scope every "private-per-adult, shared for kids" policy from
-- "user_id is null" to "is_child = true" — a pending adult invite no
-- longer matches, only an actual child does.
drop policy if exists "health data private-per-adult, shared for kids" on health_profiles;
create policy "health data private-per-adult, shared for kids" on health_profiles
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ));

drop policy if exists "weight logs private-per-adult, shared for kids" on weight_logs;
create policy "weight logs private-per-adult, shared for kids" on weight_logs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ));

drop policy if exists "fitness goals private-per-adult, shared for kids" on fitness_goals;
create policy "fitness goals private-per-adult, shared for kids" on fitness_goals
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ));

drop policy if exists "training programs private-per-adult, shared for kids" on training_programs;
create policy "training programs private-per-adult, shared for kids" on training_programs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ));

drop policy if exists "workout logs private-per-adult, shared for kids" on workout_logs;
create policy "workout logs private-per-adult, shared for kids" on workout_logs
  for all to authenticated
  using (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ))
  with check (profile_id in (
    select id from profiles
    where household_id = current_household_id() and (user_id = auth.uid() or is_child)
  ));
