-- Games can be paid in USD. amount_enc stays the COP equivalent so every total keeps working;
-- original_amount_enc keeps the USD cents and fx_rate the USD→COP rate used.
alter table public.transactions
  add column currency text not null default 'COP' check (currency in ('COP', 'USD')),
  add column original_amount_enc text,
  add column fx_rate numeric;

-- Wishlist prices are stored in their own currency (USD in cents).
alter table public.wishlist
  add column currency text not null default 'COP' check (currency in ('COP', 'USD'));
