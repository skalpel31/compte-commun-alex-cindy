-- Clear out data created while verifying the app end-to-end, keep the
-- category catalog clean of the throwaway "Cadeaux" test category.
truncate transactions, budgets, settlements, goals, push_subscriptions;
delete from categories where name = 'Cadeaux';
