-- Attach an optional receipt/invoice document (photo or PDF) to a spending
-- transaction (covers one-off dépenses AND the transaction created when a
-- bill is marked paid) or to a recurring bill's own reference document
-- (e.g. an insurance contract PDF that doesn't change month to month).
alter table transactions add column if not exists receipt_url text;
alter table bills add column if not exists receipt_url text;

-- Private bucket — these are financial documents, never public.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Objects are stored under `${household_id}/...`, mirroring the same
-- household-isolation pattern used everywhere else, just expressed via the
-- storage path's first folder segment instead of a household_id column.
drop policy if exists "household can manage its receipt files" on storage.objects;
create policy "household can manage its receipt files" on storage.objects
  for all to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = current_household_id()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = current_household_id()::text);
