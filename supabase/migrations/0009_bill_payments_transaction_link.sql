-- Marking a bill paid now creates a real transaction (so it counts toward
-- monthly spend / category breakdown / budgets); this links the payment
-- record to that transaction so un-marking it can clean up correctly.
alter table bill_payments add column if not exists transaction_id uuid references transactions (id) on delete set null;
