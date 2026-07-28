-- Recurring/expected income: lets a household declare "this income repeats
-- every N days" (Sécu indemnités, exactly every 14 days) or "every N months,
-- landing on roughly the same day" (a salary, ~monthly around a given date)
-- — distinct from bills, which are recurring OUTGOING charges. Powers the
-- "next payment due" reminder and the bill-coverage forecast.
create table income_schedules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  payer_id uuid references profiles(id) on delete cascade,
  label text not null,
  interval_type text not null check (interval_type in ('days', 'months')),
  interval_value int not null check (interval_value > 0),
  anchor_date date not null,
  amount_estimate numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table income_schedules enable row level security;

create policy "household full access to income_schedules" on income_schedules
  for all to authenticated using (household_id = current_household_id()) with check (household_id = current_household_id());
