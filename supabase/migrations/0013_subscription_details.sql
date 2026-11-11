-- Details the SubTrack extension also tracks: where it was bought, next renewal and the card it's charged to.
alter table public.subscriptions
  add column source_enc text,
  add column renews_on date,
  add column card_id uuid,
  add column updated_at timestamptz not null default now(),
  add constraint subscriptions_card_fk foreign key (card_id, user_id) references public.credit_cards (id, user_id) on delete set null (card_id);
create index on public.subscriptions (card_id, user_id);
