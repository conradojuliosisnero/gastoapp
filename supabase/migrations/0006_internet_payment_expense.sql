-- When you mark your own share as paid, it is also recorded as an expense (Gastos > Servicios).
-- This links the payment to that expense so unmarking removes it too.
alter table public.internet_payments
  add column transaction_id uuid references public.transactions (id) on delete set null;
