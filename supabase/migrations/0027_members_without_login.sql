-- Decouple "household member" from "login account": profiles.id no longer
-- has to equal an auth.users id. A member can exist with no login at all
-- (user_id null) — e.g. a spouse or child added by another member — and get
-- linked to a real account later via claim_code (see 0028).

alter table profiles add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- Every existing profile today has id == the auth user's id (that was the
-- old invariant) — backfill preserves that exact link before we sever it.
update profiles set user_id = id where user_id is null;

alter table profiles add column if not exists claim_code text unique default substr(md5(random()::text || clock_timestamp()::text), 1, 12);

-- Re-point the RLS identity check at user_id instead of id, now that both
-- are backfilled and equivalent for every existing row.
create or replace function current_household_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select household_id from profiles where user_id = auth.uid()
$$;

drop policy if exists "user can update own profile" on profiles;
create policy "user can update own profile" on profiles
  for update to authenticated using (auth.uid() = user_id);

-- A member created from the app (no login yet) can only be inserted as
-- memberless, into the caller's own household — never impersonating an
-- already-linked account.
create policy "household can add memberless profiles" on profiles
  for insert to authenticated with check (household_id = current_household_id() and user_id is null);

-- Anyone in the household can rename a memberless member (there's no owner
-- to ask). A member who HAS an account can only rename themselves, via the
-- policy above.
create policy "household can manage memberless profiles" on profiles
  for update to authenticated using (household_id = current_household_id() and user_id is null);

-- Safe now that current_household_id() no longer depends on id == auth.uid().
alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();

-- A push subscription belongs to a logged-in session, not a "member" — a
-- memberless profile can never have one. Re-point the FK at auth.users
-- directly so it keeps working once profiles.id and auth.users.id diverge.
alter table push_subscriptions drop constraint if exists push_subscriptions_user_id_fkey;
alter table push_subscriptions add constraint push_subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
