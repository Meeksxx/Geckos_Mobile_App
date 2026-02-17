-- Kitchen staff access setup.
-- Run after kitchen_orders_setup.sql

-- 1) Staff mapping table
create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.staff_users enable row level security;

drop policy if exists staff_users_self_select on public.staff_users;
create policy staff_users_self_select
on public.staff_users
for select
to authenticated
using (user_id = auth.uid());

-- 2) Remove temporary open policies (if you created them during testing)
drop policy if exists "anyone can view orders (temp)" on public.orders;
drop policy if exists "anyone can update orders (temp)" on public.orders;

-- 3) Keep your existing insert policy for customer ordering
-- (example: "anyone can place orders")

-- 4) Staff-only read/update policies for kitchen dashboard
drop policy if exists orders_select_staff on public.orders;
create policy orders_select_staff
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.staff_users su
    where su.user_id = auth.uid()
  )
);

drop policy if exists orders_update_staff on public.orders;
create policy orders_update_staff
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.staff_users su
    where su.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.staff_users su
    where su.user_id = auth.uid()
  )
);

-- 5) Helper: add a staff user by email (run one line per staff account)
-- insert into public.staff_users (user_id)
-- select id from auth.users where email = 'staff@yourrestaurant.com'
-- on conflict (user_id) do nothing;
