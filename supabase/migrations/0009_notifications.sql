-- Reminders: which channels each user turned on, and the devices subscribed to push.
create table public.notification_prefs (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  push boolean not null default false,
  email boolean not null default false,
  updated_at timestamptz not null default now()
);

-- keys_enc holds the device's encrypted p256dh/auth keys (they let anyone with the endpoint push to it).
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null,
  keys_enc text not null,
  created_at timestamptz not null default now()
);
create unique index on public.push_subscriptions (user_id, endpoint);

alter table public.notification_prefs enable row level security;
alter table public.push_subscriptions enable row level security;
create policy "solo el dueño" on public.notification_prefs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "solo el dueño" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
