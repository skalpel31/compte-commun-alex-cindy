-- Lets a bill be pre-assigned to whoever usually pays it, so marking it
-- paid each month doesn't require re-picking the payer every time.
alter table bills add column if not exists default_payer uuid references profiles (id) on delete set null;
