-- Sueldo mensual. Una fila por mes en que el sueldo cambia; los meses siguientes heredan el último valor.
create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  period text not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount_enc text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table public.incomes enable row level security;
create policy "solo el dueño" on public.incomes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
