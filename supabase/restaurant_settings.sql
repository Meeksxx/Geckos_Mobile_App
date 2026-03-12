-- restaurant_settings table
-- Singleton row (id = true) storing global restaurant flags.
-- orders_paused: staff can manually pause orders outside normal auto-schedule.

create table if not exists restaurant_settings (
  id            boolean primary key default true check (id = true),
  orders_paused boolean not null default false,
  updated_at    timestamptz default now()
);

-- Seed the single row if it doesn't exist.
insert into restaurant_settings (id, orders_paused)
values (true, false)
on conflict (id) do nothing;

alter table restaurant_settings enable row level security;

-- Anyone (including the customer app) can read to check paused state.
create policy "Anyone can read restaurant settings"
  on restaurant_settings for select
  using (true);

-- Only staff can update.
create policy "Staff can update restaurant settings"
  on restaurant_settings for update
  using (exists (select 1 from staff_users where user_id = auth.uid()))
  with check (true);
