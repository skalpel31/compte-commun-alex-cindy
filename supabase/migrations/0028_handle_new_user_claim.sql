-- Extend the signup trigger with a third branch: claiming an existing
-- memberless profile (created by another household member via "+ Ajouter un
-- membre") instead of always inserting a brand new profile row.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
  v_invite_code text;
  v_household_name text;
  v_claim_code text;
  v_claimed_id uuid;
begin
  v_claim_code := new.raw_user_meta_data ->> 'claim_code';

  if v_claim_code is not null then
    update profiles
      set user_id = new.id, claim_code = null
      where claim_code = v_claim_code and user_id is null
      returning id into v_claimed_id;
    if v_claimed_id is null then
      raise exception 'Lien d''invitation invalide ou déjà utilisé';
    end if;
    return new;
  end if;

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

  insert into public.profiles (user_id, display_name, household_id, claim_code)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email), v_household_id, null);
  return new;
end;
$$;
