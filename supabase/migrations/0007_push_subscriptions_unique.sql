-- One push subscription per user (latest device wins) so upserts replace
-- rather than accumulate stale subscriptions.
alter table push_subscriptions add constraint push_subscriptions_user_id_key unique (user_id);
