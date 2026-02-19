-- Menu tables for Gecko's at Lake Texoma
-- Run in Supabase SQL editor before menu_seed.sql

-- ── Tables ──────────────────────────────────────────────────

create table if not exists public.menu_categories (
  id         text    primary key,
  title      text    not null,
  sort_order int     not null default 0,
  is_active  boolean not null default true
);

create table if not exists public.menu_items (
  id           text         primary key,
  category_id  text         not null references public.menu_categories(id) on delete cascade,
  name         text         not null,
  description  text,
  price        numeric(8,2),         -- null when price_text is used
  price_text   text,                  -- e.g. "Small 2.99 | Large 4.99"
  choice_count int          not null default 0,  -- lunch specials only
  sort_order   int          not null default 0,
  is_active    boolean      not null default true
);

create index if not exists idx_menu_items_cat
  on public.menu_items(category_id, sort_order);

create table if not exists public.menu_item_addons (
  id         uuid         primary key default gen_random_uuid(),
  item_id    text         not null references public.menu_items(id) on delete cascade,
  name       text         not null,
  price      numeric(8,2) not null default 0,
  sort_order int          not null default 0
);

create index if not exists idx_menu_item_addons_item
  on public.menu_item_addons(item_id, sort_order);

create table if not exists public.lunch_choices (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0
);

create table if not exists public.lunch_sauces (
  id         uuid         primary key default gen_random_uuid(),
  name       text         not null unique,
  price      numeric(8,2) not null default 0,
  sort_order int          not null default 0
);

-- ── Row Level Security ───────────────────────────────────────
-- Public read (anon + authenticated), no public write

alter table public.menu_categories    enable row level security;
alter table public.menu_items         enable row level security;
alter table public.menu_item_addons   enable row level security;
alter table public.lunch_choices      enable row level security;
alter table public.lunch_sauces       enable row level security;

drop policy if exists "menu_categories_public_read" on public.menu_categories;
create policy "menu_categories_public_read"
  on public.menu_categories for select to anon, authenticated using (true);

drop policy if exists "menu_items_public_read" on public.menu_items;
create policy "menu_items_public_read"
  on public.menu_items for select to anon, authenticated using (true);

drop policy if exists "menu_item_addons_public_read" on public.menu_item_addons;
create policy "menu_item_addons_public_read"
  on public.menu_item_addons for select to anon, authenticated using (true);

drop policy if exists "lunch_choices_public_read" on public.lunch_choices;
create policy "lunch_choices_public_read"
  on public.lunch_choices for select to anon, authenticated using (true);

drop policy if exists "lunch_sauces_public_read" on public.lunch_sauces;
create policy "lunch_sauces_public_read"
  on public.lunch_sauces for select to anon, authenticated using (true);
