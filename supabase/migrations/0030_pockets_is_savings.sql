-- Flags a pocket as a savings account, so the Épargne page can list exactly
-- these (and only these) instead of guessing from the name. Existing
-- pockets that already look like savings get backfilled so nothing
-- disappears from view after this ships.
alter table pockets add column if not exists is_savings boolean not null default false;

update pockets
set is_savings = true
where is_savings = false
  and (name ilike '%épargne%' or name ilike '%epargne%' or name ilike '%livret%');
