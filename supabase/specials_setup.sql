-- Stores editable weekly/seasonal specials shown on the home screen.
-- Run this in the Supabase SQL editor.

create table if not exists public.app_specials (
  id          uuid        primary key default gen_random_uuid(),
  label       text        not null default 'Weekly Special',
  title       text        not null,
  subtitle    text,
  image_url   text,
  is_active   boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.app_specials enable row level security;

-- Public (and authenticated customers) can read active specials
drop policy if exists specials_select_public on public.app_specials;
create policy specials_select_public
  on public.app_specials
  for select
  to anon, authenticated
  using (is_active = true);

-- Staff can read ALL rows (including inactive) and write
drop policy if exists specials_all_staff on public.app_specials;
create policy specials_all_staff
  on public.app_specials
  for all
  to authenticated
  using (
    exists (select 1 from public.staff_users su where su.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.staff_users su where su.user_id = auth.uid())
  );

-- Seed the default Margarita special so the home screen is not empty
insert into public.app_specials (label, title, subtitle, is_active, sort_order)
values ('Weekly Special', 'Half-Price Margaritas', 'Every Tuesday · All Year Long', true, 0)
on conflict do nothing;
