-- Kitchen day session controls (open/close named days).
-- Run after kitchen_staff_access.sql.

create table if not exists public.kitchen_days (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists idx_kitchen_days_one_open
  on public.kitchen_days ((closed_at is null))
  where closed_at is null;

create index if not exists idx_kitchen_days_opened_at
  on public.kitchen_days(opened_at desc);

alter table public.kitchen_days enable row level security;

drop policy if exists kitchen_days_staff_select on public.kitchen_days;
create policy kitchen_days_staff_select
on public.kitchen_days
for select
to authenticated
using (
  exists (
    select 1
    from public.staff_users su
    where su.user_id = auth.uid()
  )
);

drop policy if exists kitchen_days_staff_insert on public.kitchen_days;
create policy kitchen_days_staff_insert
on public.kitchen_days
for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_users su
    where su.user_id = auth.uid()
  )
);

drop policy if exists kitchen_days_staff_update on public.kitchen_days;
create policy kitchen_days_staff_update
on public.kitchen_days
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
