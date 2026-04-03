-- Add user_id to archived orders so account deletion can remove retained order history.
-- Safe to run multiple times.

alter table public.orders_archive
  add column if not exists user_id uuid references auth.users(id);

create index if not exists idx_orders_archive_user_id
  on public.orders_archive(user_id);

-- Best-effort backfill for archived orders that earned rewards points.
update public.orders_archive oa
set user_id = pt.user_id
from public.points_transactions pt
where oa.user_id is null
  and pt.order_id = oa.id
  and pt.user_id is not null;
