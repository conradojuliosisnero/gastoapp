-- Credit cards: only a name and the cut/pay days. Never card numbers or any card data.
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name_enc text not null,
  cut_day int not null check (cut_day between 1 and 31),
  pay_day int not null check (pay_day between 1 and 31),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index on public.credit_cards (user_id);
alter table public.credit_cards enable row level security;
create policy "solo el dueño" on public.credit_cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A purchase paid with a card (and in how many installments). Deleting the card turns them into cash purchases.
alter table public.transactions
  add column card_id uuid,
  add column installments int check (installments between 1 and 48),
  add constraint transactions_card_fk foreign key (card_id, user_id) references public.credit_cards (id, user_id) on delete set null (card_id);
create index on public.transactions (card_id, user_id);
