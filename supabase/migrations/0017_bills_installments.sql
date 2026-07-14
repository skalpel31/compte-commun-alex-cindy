alter table bills add column if not exists installments_total smallint;
alter table bills add column if not exists final_amount numeric(10,2);
