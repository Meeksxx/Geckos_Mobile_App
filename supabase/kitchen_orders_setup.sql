-- Kitchen dashboard setup for existing public.orders table.
-- Run this once in the Supabase SQL editor.

alter table if exists public.orders
  add column if not exists status text not null default 'new',
  add column if not exists accepted_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('new', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled'));
  end if;
end $$;

create index if not exists idx_orders_status_created_at
  on public.orders(status, created_at desc);

create index if not exists idx_orders_created_at
  on public.orders(created_at desc);

-- Ensure existing rows are visible in the active workflow.
update public.orders
set status = 'new'
where status is null or btrim(status) = '';
