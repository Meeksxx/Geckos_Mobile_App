-- Run this in the Supabase SQL editor before deploying cancel/refund support.

-- 1. Add points cost column so we know how many points to restore on cancel.
alter table public.orders
  add column if not exists reward_points_cost integer not null default 0;

-- 2. Function to restore reward points when an order is cancelled.
--    Inserts a positive transaction and bumps the customer's balance.
create or replace function public.restore_reward_points(
  p_user_id  uuid,
  p_points   integer,
  p_label    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_points <= 0 then return; end if;

  insert into public.points_transactions (user_id, points, type, description)
  values (p_user_id, p_points, 'adjusted', 'Points restored — order cancelled: ' || p_label);

  insert into public.customer_points (user_id, total_points, lifetime_points)
  values (p_user_id, p_points, 0)
  on conflict (user_id) do update
    set total_points = customer_points.total_points + p_points;
end;
$$;

grant execute on function public.restore_reward_points(uuid, integer, text) to authenticated;
