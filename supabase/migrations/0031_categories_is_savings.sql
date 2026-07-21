-- Some "savings" aren't a pocket the app tracks a balance for — they're a
-- recurring bill that transfers a fixed amount to an external Livret A each
-- month (one per family member). Flagging the CATEGORY as savings lets the
-- Épargne page list each such bill as its own line with its own running
-- total, instead of only knowing about savings pockets.
alter table categories add column if not exists is_savings boolean not null default false;

update categories
set is_savings = true
where is_savings = false
  and (name ilike '%épargne%' or name ilike '%epargne%');
