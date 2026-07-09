-- Recurring bills (loyer, abonnements, factures...) with due-day reminders
-- and a per-month paid/unpaid ledger.
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 28),
  category_id uuid references categories (id) on delete set null,
  autopay boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  month date not null,
  paid_at timestamptz,
  paid_by uuid references profiles (id) on delete set null,
  unique (bill_id, month)
);

-- One row per (bill, month, threshold) so the reminder cron never re-notifies
-- for the same due date twice.
create table if not exists bill_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  month date not null,
  kind text not null check (kind in ('upcoming', 'overdue')),
  sent_at timestamptz not null default now(),
  unique (bill_id, month, kind)
);

alter table bills enable row level security;
alter table bill_payments enable row level security;
alter table bill_alerts_sent enable row level security;

create policy "household full access to bills" on bills
  for all to authenticated using (true) with check (true);
create policy "household full access to bill_payments" on bill_payments
  for all to authenticated using (true) with check (true);
create policy "household full access to bill_alerts_sent" on bill_alerts_sent
  for all to authenticated using (true) with check (true);
