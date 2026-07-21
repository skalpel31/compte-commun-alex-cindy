-- A new signup either joins an existing household (invite_code in metadata)
-- or creates a brand new one — and a brand new household gets seeded with the
-- same starter categories 0001_init.sql gave the very first household, so it
-- isn't a totally blank slate.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
  v_invite_code text;
  v_household_name text;
begin
  v_invite_code := new.raw_user_meta_data ->> 'invite_code';
  v_household_name := new.raw_user_meta_data ->> 'household_name';

  if v_invite_code is not null then
    select id into v_household_id from households where invite_code = v_invite_code;
    if v_household_id is null then
      raise exception 'Code d''invitation invalide';
    end if;
  else
    insert into households (name) values (coalesce(v_household_name, 'Mon foyer'))
    returning id into v_household_id;

    insert into categories (name, icon, color, type, household_id) values
      ('Courses', 'shopping-cart', 'chart-1', 'expense', v_household_id),
      ('Logement', 'home', 'chart-2', 'expense', v_household_id),
      ('Transport', 'car', 'chart-3', 'expense', v_household_id),
      ('Loisirs', 'party-popper', 'chart-4', 'expense', v_household_id),
      ('Santé', 'heart-pulse', 'chart-5', 'expense', v_household_id),
      ('Autre', 'more-horizontal', 'chart-7', 'expense', v_household_id),
      ('Salaire', 'wallet', 'chart-8', 'income', v_household_id);
  end if;

  insert into public.profiles (id, display_name, household_id)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email), v_household_id);
  return new;
end;
$$;
