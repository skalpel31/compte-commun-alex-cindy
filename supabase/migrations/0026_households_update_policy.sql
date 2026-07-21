-- households only had a select policy so far; members need to be able to
-- rename their own household from Settings.
create policy "household can update its own household" on households
  for update to authenticated using (id = current_household_id()) with check (id = current_household_id());
