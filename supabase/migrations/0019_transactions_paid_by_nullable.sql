-- null paid_by means "Compte Joint" — the charge came straight off the
-- shared account with no personal attribution (many direct debits).
alter table transactions alter column paid_by drop not null;
