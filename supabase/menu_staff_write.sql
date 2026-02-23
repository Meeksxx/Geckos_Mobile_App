-- Grant staff users write access to all menu management tables.
-- Without these policies, RLS silently blocks all UPDATE/DELETE operations
-- (no error is returned — the operation just affects 0 rows).
--
-- Run this in the Supabase SQL editor.

-- ── menu_categories ──────────────────────────────────────────
drop policy if exists "staff can manage menu_categories" on public.menu_categories;
create policy "staff can manage menu_categories"
  on public.menu_categories
  for all
  to authenticated
  using     (exists (select 1 from public.staff_users where user_id = auth.uid()))
  with check(exists (select 1 from public.staff_users where user_id = auth.uid()));

-- ── menu_items ───────────────────────────────────────────────
drop policy if exists "staff can manage menu_items" on public.menu_items;
create policy "staff can manage menu_items"
  on public.menu_items
  for all
  to authenticated
  using     (exists (select 1 from public.staff_users where user_id = auth.uid()))
  with check(exists (select 1 from public.staff_users where user_id = auth.uid()));

-- ── menu_item_addons ─────────────────────────────────────────
drop policy if exists "staff can manage menu_item_addons" on public.menu_item_addons;
create policy "staff can manage menu_item_addons"
  on public.menu_item_addons
  for all
  to authenticated
  using     (exists (select 1 from public.staff_users where user_id = auth.uid()))
  with check(exists (select 1 from public.staff_users where user_id = auth.uid()));

-- ── lunch_choices ────────────────────────────────────────────
drop policy if exists "staff can manage lunch_choices" on public.lunch_choices;
create policy "staff can manage lunch_choices"
  on public.lunch_choices
  for all
  to authenticated
  using     (exists (select 1 from public.staff_users where user_id = auth.uid()))
  with check(exists (select 1 from public.staff_users where user_id = auth.uid()));

-- ── lunch_sauces ─────────────────────────────────────────────
drop policy if exists "staff can manage lunch_sauces" on public.lunch_sauces;
create policy "staff can manage lunch_sauces"
  on public.lunch_sauces
  for all
  to authenticated
  using     (exists (select 1 from public.staff_users where user_id = auth.uid()))
  with check(exists (select 1 from public.staff_users where user_id = auth.uid()));
