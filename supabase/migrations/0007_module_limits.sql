-- Límite mensual por módulo (por ahora, Videojuegos). Monto cifrado.
create table public.module_limits (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  module text not null check (module in ('gastos', 'juegos')),
  amount_enc text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.module_limits enable row level security;
create policy "solo el dueño" on public.module_limits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
