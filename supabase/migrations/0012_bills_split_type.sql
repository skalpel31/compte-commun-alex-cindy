-- A bill's cost may be a joint household expense (shared, split between
-- both) or one person's own expense paid from the joint account (personal,
-- doesn't count toward the other person's contribution target). Mirrors
-- transactions.split_type.
alter table bills add column if not exists split_type text not null default 'shared' check (split_type in ('shared', 'personal'));
