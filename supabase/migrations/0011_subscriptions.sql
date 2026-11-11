-- Subscriptions to plan the year: monthly price and/or the 12-month plan price (minor units, encrypted).
-- Planning only: the monthly charge is still recorded as an expense, so nothing is counted twice.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name_enc text not null,
  currency text not null default 'COP' check (currency in ('COP', 'USD')),
  monthly_enc text,
  annual_enc text,
  billing text not null default 'mensual' check (billing in ('mensual', 'anual')),
  created_at timestamptz not null default now(),
  check (monthly_enc is not null or annual_enc is not null)
);
create index on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;
create policy "solo el dueño" on public.subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
