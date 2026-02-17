-- Orders retention for kitchen workflow.
-- Archives orders 36 hours after accepted_at (or created_at if never accepted),
-- then purges archived rows after 7 days.

create table if not exists public.orders_archive (like public.orders including all);

alter table public.orders_archive
  add column if not exists archived_at timestamptz not null default now();

create index if not exists idx_orders_archive_archived_at
  on public.orders_archive(archived_at desc);

create index if not exists idx_orders_archive_created_at
  on public.orders_archive(created_at desc);

create or replace function public.archive_and_purge_orders(
  archive_after_hours integer default 36,
  purge_after_days integer default 7
)
returns table(archived_count integer, deleted_live_count integer, purged_archive_count integer)
language plpgsql
security definer
as $$
declare
  archive_cutoff timestamptz := now() - make_interval(hours => archive_after_hours);
  purge_cutoff timestamptz := now() - make_interval(days => purge_after_days);
begin
  insert into public.orders_archive
  select o.*, now() as archived_at
  from public.orders o
  where coalesce(o.accepted_at, o.created_at) < archive_cutoff
    and not exists (
      select 1 from public.orders_archive a where a.id = o.id
    );

  get diagnostics archived_count = row_count;

  delete from public.orders o
  where coalesce(o.accepted_at, o.created_at) < archive_cutoff;

  get diagnostics deleted_live_count = row_count;

  delete from public.orders_archive
  where archived_at < purge_cutoff;

  get diagnostics purged_archive_count = row_count;
  return next;
end;
$$;

grant execute on function public.archive_and_purge_orders(integer, integer) to authenticated;

-- Manual run:
-- select * from public.archive_and_purge_orders(36, 7);
