-- Customer profiles and auth-linked orders.
-- Run after kitchen_staff_access.sql and kitchen_orders_setup.sql.

-- 1) Customer profiles table (NOT affected by orders retention)
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

-- Users can read their own profile
drop policy if exists profiles_select_own on public.customer_profiles;
create policy profiles_select_own
on public.customer_profiles
for select
to authenticated
using (user_id = auth.uid());

-- Users can insert their own profile
drop policy if exists profiles_insert_own on public.customer_profiles;
create policy profiles_insert_own
on public.customer_profiles
for insert
to authenticated
with check (user_id = auth.uid());

-- Users can update their own profile
drop policy if exists profiles_update_own on public.customer_profiles;
create policy profiles_update_own
on public.customer_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Staff can view customer profiles (to see names on orders)
drop policy if exists profiles_select_staff on public.customer_profiles;
create policy profiles_select_staff
on public.customer_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.staff_users su where su.user_id = auth.uid()
  )
);

-- 2) Add user_id column to orders so orders are linked to accounts
alter table public.orders
  add column if not exists user_id uuid references auth.users(id);

create index if not exists idx_orders_user_id on public.orders(user_id);

-- 3) Update orders insert policy: require authenticated user
drop policy if exists "Anyone can place orders" on public.orders;
drop policy if exists orders_insert_authenticated on public.orders;
create policy orders_insert_authenticated
on public.orders
for insert
to authenticated
with check (auth.uid() is not null);

-- 4) Customers can view their own orders (order history)
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
on public.orders
for select
to authenticated
using (user_id = auth.uid());
