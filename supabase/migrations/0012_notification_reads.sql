-- Which alerts (by their stable id) the user already saw, so the bell only counts new ones.
create table public.notification_reads (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  alert_id text not null check (length(alert_id) <= 200),
  read_at timestamptz not null default now(),
  primary key (user_id, alert_id)
);
alter table public.notification_reads enable row level security;
create policy "solo el dueño" on public.notification_reads for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
