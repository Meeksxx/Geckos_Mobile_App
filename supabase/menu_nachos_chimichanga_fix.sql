-- Nachos Combo → fold into fajita-nachos price_text (not its own card)
-- Chimichanga → shorter price_text & description so the card doesn't clip
-- Run in Supabase SQL editor.

-- ── Nachos Combo: deactivate the standalone item ────────────────────────────
update public.menu_items set is_active = false where id = 'nachos-combo';

-- ── Fajita Nachos: add Combo as a third price option ────────────────────────
update public.menu_items
set price_text = 'Chicken 14.99 | Beef 15.99 | Combo 13.99'
where id = 'fajita-nachos';

-- ── Restore nachos sort order (Combo is gone, Supreme moves back to 2) ───────
update public.menu_items set sort_order = 2 where id = 'supreme-nachos';
update public.menu_items set sort_order = 3 where id = 'chicken-nachos';
update public.menu_items set sort_order = 4 where id = 'bean-nachos';

-- ── Remove orphaned nachos-combo add-ons ────────────────────────────────────
delete from public.menu_item_addons where item_id = 'nachos-combo';

-- ── Chimichanga: shorter price_text + trimmed description ───────────────────
update public.menu_items
set
  price_text  = 'S.Chicken 14.99 | F.Chicken 13.99 | S.Beef 16.99 | F.Beef 15.99 | Grd.Beef 14.99',
  description = 'Flour tortilla stuffed with chicken or beef, topped with queso, chili, ranchero, or sour cream sauce. Served with rice & refried beans.'
where id = 'chimichanga';
