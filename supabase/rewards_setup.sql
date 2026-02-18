-- Gecko's Rewards System
-- Run after customer_profiles.sql

-- 1) Points balance per customer
create table if not exists public.customer_points (
  user_id         uuid        primary key references auth.users(id) on delete cascade,
  total_points    integer     not null default 0,
  lifetime_points integer     not null default 0,
  updated_at      timestamptz not null default now()
);

alter table public.customer_points enable row level security;

drop policy if exists customer_points_select_own on public.customer_points;
create policy customer_points_select_own
  on public.customer_points for select
  to authenticated
  using (user_id = auth.uid());

-- Staff can view for reward verification
drop policy if exists customer_points_select_staff on public.customer_points;
create policy customer_points_select_staff
  on public.customer_points for select
  to authenticated
  using (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  );

-- 2) Points transaction log
create table if not exists public.points_transactions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  order_id    uuid        references public.orders(id),
  points      integer     not null,
  type        text        not null check (type in ('earned', 'redeemed', 'expired', 'adjusted')),
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_points_transactions_user
  on public.points_transactions(user_id, created_at desc);

alter table public.points_transactions enable row level security;

drop policy if exists transactions_select_own on public.points_transactions;
create policy transactions_select_own
  on public.points_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- 3) Trigger: award 10 points per $1 spent when order status → picked_up
create or replace function public.award_order_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pts integer;
begin
  -- Only fire when transitioning TO picked_up for an authenticated user
  if new.status = 'picked_up'
    and (old.status is distinct from 'picked_up')
    and new.user_id is not null
  then
    -- Idempotency check: don't double-award for the same order
    if not exists (
      select 1 from public.points_transactions
      where order_id = new.id and type = 'earned'
    ) then
      pts := floor(coalesce(new.subtotal, 0) * 10)::integer;
      if pts > 0 then
        insert into public.points_transactions (user_id, order_id, points, type, description)
        values (new.user_id, new.id, pts, 'earned', 'Order completed');

        insert into public.customer_points (user_id, total_points, lifetime_points, updated_at)
        values (new.user_id, pts, pts, now())
        on conflict (user_id) do update set
          total_points    = public.customer_points.total_points + pts,
          lifetime_points = public.customer_points.lifetime_points + pts,
          updated_at      = now();
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_order_points on public.orders;
create trigger trg_award_order_points
  after update on public.orders
  for each row
  execute function public.award_order_points();

-- 4) RPC: redeem a reward atomically (called from the app)
create or replace function public.redeem_reward(p_reward_cost integer, p_reward_label text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  current_pts integer;
begin
  select total_points into current_pts
  from public.customer_points
  where user_id = auth.uid();

  if current_pts is null or current_pts < p_reward_cost then
    return json_build_object('success', false, 'error', 'Not enough points');
  end if;

  insert into public.points_transactions (user_id, points, type, description)
  values (auth.uid(), -p_reward_cost, 'redeemed', p_reward_label);

  update public.customer_points
  set total_points = total_points - p_reward_cost,
      updated_at   = now()
  where user_id = auth.uid();

  return json_build_object('success', true);
end;
$$;