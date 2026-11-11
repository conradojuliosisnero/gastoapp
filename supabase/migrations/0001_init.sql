-- Columnas *_enc guardan texto cifrado con AES-256-GCM desde el servidor (lib/crypto.js).
-- Todo lo demás queda en claro para poder filtrar y ordenar.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  module text not null check (module in ('gastos', 'juegos')),
  name text not null check (char_length(name) between 1 and 40),
  monthly_budget_enc text,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  module text not null check (module in ('gastos', 'juegos')),
  category_id uuid,
  occurred_on date not null default current_date,
  amount_enc text not null,
  description_enc text,
  kind text not null default 'variable' check (kind in ('fijo', 'variable')),
  platform text check (platform in ('PS5', 'PC', 'Otra')),
  created_at timestamptz not null default now(),
  -- Composite FK: a row can only point to a category of the same user.
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id)
);

create table public.internet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  amount_enc text not null,
  due_day smallint not null check (due_day between 1 and 31),
  split_mode text not null default 'equal' check (split_mode in ('equal', 'custom')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.internet_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  plan_id uuid not null,
  name_enc text not null,
  share_enc text,
  is_me boolean not null default false,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (plan_id, user_id) references public.internet_plans (id, user_id) on delete cascade
);

create table public.internet_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  member_id uuid not null,
  period text not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount_enc text not null,
  paid_at timestamptz not null default now(),
  unique (member_id, period),
  foreign key (member_id, user_id) references public.internet_members (id, user_id) on delete cascade
);

create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  platform text check (platform in ('PS5', 'PC', 'Otra')),
  current_price_enc text,
  target_price_enc text,
  created_at timestamptz not null default now()
);

create index on public.categories (user_id, module);
create index on public.transactions (user_id, occurred_on desc);
create index on public.transactions (category_id, user_id);
create index on public.internet_plans (user_id);
create index on public.internet_members (plan_id, user_id);
create index on public.internet_payments (member_id, user_id);
create index on public.internet_payments (user_id, period);
create index on public.wishlist (user_id);

-- Each account only sees and writes its own rows.
do $$
declare t text;
begin
  foreach t in array array['categories', 'transactions', 'internet_plans', 'internet_members', 'internet_payments', 'wishlist'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end $$;
