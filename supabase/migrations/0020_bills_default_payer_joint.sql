-- Drop the profiles FK so default_payer can also hold the literal 'joint'
-- sentinel, meaning "always attribute to Compte Joint, never ask" — distinct
-- from null, which still means "ask each time".
alter table bills drop constraint if exists bills_default_payer_fkey;
alter table bills alter column default_payer type text using default_payer::text;
