-- Lets a household delete a memberless profile it created by mistake or no
-- longer needs — the app layer (deleteMember action) is responsible for
-- refusing when the profile has any real data attached (transactions,
-- budgets, settlements all CASCADE on profiles.id, so an unguarded delete
-- would silently destroy real financial history).
create policy "household can delete memberless profiles" on profiles
  for delete to authenticated
  using (household_id = current_household_id() and user_id is null);
