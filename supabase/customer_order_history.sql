-- Allow authenticated customers to read their own orders.
-- Run this in the Supabase SQL editor.

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid());
