-- Dinero casual fuera del sueldo (ventas, regalos, trabajos extra). Suma al ahorro del mes de su fecha.
create table public.extra_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  received_on date not null default current_date,
  amount_enc text not null,
  description_enc text,
  created_at timestamptz not null default now()
);

create index on public.extra_incomes (user_id, received_on desc);

alter table public.extra_incomes enable row level security;
create policy "solo el dueño" on public.extra_incomes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
