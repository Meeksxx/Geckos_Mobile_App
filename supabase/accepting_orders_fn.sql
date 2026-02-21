-- Public function that returns whether the restaurant is currently accepting orders.
-- Checks kitchen_days for an open session (closed_at IS NULL).
-- Uses security definer so anon/authenticated users can call it without
-- needing direct read access to the kitchen_days table.
--
-- Run this once in the Supabase SQL editor.

create or replace function public.is_accepting_orders()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.kitchen_days
    where closed_at is null
  );
$$;

grant execute on function public.is_accepting_orders() to anon, authenticated;
