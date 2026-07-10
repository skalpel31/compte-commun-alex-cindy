alter table bills add column if not exists pocket_id uuid references pockets (id) on delete set null;
