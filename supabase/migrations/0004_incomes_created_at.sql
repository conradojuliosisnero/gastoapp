-- When the salary was first registered. Savings are only counted from that month on,
-- even if the salary is set "desde" an earlier month (no expenses were tracked back then).
alter table public.incomes add column created_at timestamptz not null default now();
