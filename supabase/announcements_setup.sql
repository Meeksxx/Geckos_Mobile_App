-- What's Happening announcements table.
-- Run once in the Supabase SQL editor.

create table if not exists public.announcements (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  body        text,
  emoji       text        not null default '📢',
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Customers can read active announcements
alter table public.announcements enable row level security;

create policy "public read active announcements"
  on public.announcements for select
  using (active = true);

create policy "staff select announcements"
  on public.announcements for select
  to authenticated
  using (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  );

create policy "staff insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  );

create policy "staff update announcements"
  on public.announcements for update
  to authenticated
  using (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  );

create policy "staff delete announcements"
  on public.announcements for delete
  to authenticated
  using (
    exists (select 1 from public.staff_users where user_id = auth.uid())
  );

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.touch_updated_at();
