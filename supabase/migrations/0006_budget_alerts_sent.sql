-- Same dedupe mechanism as bill_alerts_sent, for budget threshold pushes.
create table if not exists budget_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  month date not null,
  threshold smallint not null check (threshold in (80, 100)),
  sent_at timestamptz not null default now(),
  unique (category_id, month, threshold)
);

alter table budget_alerts_sent enable row level security;

create policy "household full access to budget_alerts_sent" on budget_alerts_sent
  for all to authenticated using (true) with check (true);
