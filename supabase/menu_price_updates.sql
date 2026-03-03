-- Menu sync — price corrections & new items based on physical menu (2026)
-- Safe to re-run. Run in Supabase SQL editor.
-- ────────────────────────────────────────────────────────────────────────────

-- ── CATEGORIES ──────────────────────────────────────────────────────────────
-- Street Tacos gets its own category (separate section on physical menu)
insert into public.menu_categories (id, title, sort_order)
values ('street-tacos', 'Street Tacos', 13)
on conflict (id) do update set title = excluded.title, sort_order = excluded.sort_order;

-- ── PRICE / DESCRIPTION CORRECTIONS ─────────────────────────────────────────

-- APPETIZERS
update public.menu_items set price = 4.99                                      where id = 'elote';
update public.menu_items set
  name = 'Chicken or Beef Flautas',
  description = 'Chicken or beef rolled in corn tortillas, fried and served with guacamole & sour cream.',
  price = null,
  price_text = 'Chicken 10.99 | Beef 14.99'
  where id = 'chicken-flautas';
update public.menu_items set price = 11.00                                     where id = 'mini-tacos';
update public.menu_items set price = 15.99, description = '6 stuffed chicken jalapeños with cheese, served with yellow queso.' where id = 'picosos';
update public.menu_items set price = 11.99                                     where id = 'party-pork-nachos';

-- ENSALADA
update public.menu_items set price_text = 'Chicken 12.99 | Beef 14.99'        where id = 'fajita-salad';

-- LUNCH SPECIALS
update public.menu_items set price_text = 'Before 2PM $6.75 | After 2PM $7.50'  where id = 'lunch-one';
update public.menu_items set price_text = 'Before 2PM $8.50 | After 2PM $9.25'  where id = 'lunch-two';
update public.menu_items set price_text = 'Before 2PM $9.75 | After 2PM $10.50' where id = 'lunch-three';

-- HOUSE SPECIALTIES
update public.menu_items set price = 14.99 where id = 'cozumel';
update public.menu_items set price = 14.99 where id = 'fiesta';
update public.menu_items set price = 16.99 where id = 'grilled-shrimp';

-- LOCAL FAVORITES
update public.menu_items set price_text = 'Chicken 11.99 | Beef 13.99'        where id = 'bowl';
update public.menu_items set price = 12.99                                     where id = 'avocado-bowl';
update public.menu_items set price_text = 'Chicken 13.99 | Beef 18.99'        where id = 'super-burrito';
-- Old catch-all street-tacos item in local-favorites replaced by dedicated category below
update public.menu_items set is_active = false                                 where id = 'street-tacos';

-- AMERICAN FOOD
update public.menu_items set price = 11.99 where id = 'hamburger';
update public.menu_items set price = 12.99 where id = 'cheeseburger';
update public.menu_items set price = 14.99 where id = 'guacamole-burger';
update public.menu_items set price = 15.99 where id = 'bacon-burger';
update public.menu_items set price = 15.99 where id = 'chile-relleno-burger';
update public.menu_items set price = 13.99 where id = 'quesadilla-burger';
update public.menu_items set price = 12.99 where id = 'chicken-strips';
update public.menu_items set price = 12.99 where id = 'chicken-wings';
-- chicken-wrap price_text already set correctly (Grilled 12.99 | Crispy 12.99)

-- FAJITAS
update public.menu_items set price_text = 'Single 16.99 | Double 32.99' where id = 'fajitas-chicken';
update public.menu_items set price_text = 'Single 24.99 | Double 48.99' where id = 'fajitas-beef';
update public.menu_items set price_text = 'Single 20.99 | Double 40.99' where id = 'fajitas-combo';
update public.menu_items set price_text = 'Single 22.99 | Double 43.99' where id = 'fajitas-super';
update public.menu_items set price_text = 'Single 11.99 | Double 21.99' where id = 'fajitas-veggie';
update public.menu_items set price_text = '(8) 18.99 | (16) 36.99'      where id = 'fajitas-shrimp';

-- NACHOS
update public.menu_items set price_text = 'Chicken 14.99 | Beef 15.99' where id = 'fajita-nachos';
update public.menu_items set price = 11.99                              where id = 'chicken-nachos';
update public.menu_items set price = 9.99                              where id = 'bean-nachos';

-- QUESADILLAS
update public.menu_items set price_text = 'Chicken 13.99 | Beef 17.99 | Pork 14.99' where id = 'fajita-quesadilla';

-- BEVERAGES
update public.menu_items set
  price = 3.49,
  description = 'Coke, Diet Coke, Sprite, Dr. Pepper, Lemonade, Mountain Berry Blast Powerade'
  where id = 'soda';
update public.menu_items set price = 3.29, description = 'Sweet or Unsweetened' where id = 'iced-tea';
update public.menu_items set price = 3.75, description = 'Mexican Coke, Fanta'  where id = 'bottled-soda';
update public.menu_items set price = 3.00, name = 'Jarrito''s'                  where id = 'jarritos';
update public.menu_items set price = null, description = 'Check with your server for daily flavors.' where id = 'horchata';
update public.menu_items set price = null, name = 'Agua de Fresca', description = 'Check with your server for daily flavors.' where id = 'agua-fresca';

-- ── NEW ITEMS ─────────────────────────────────────────────────────────────────

-- APPETIZERS — jalapeño relish (listed separately on menu at $1.50)
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('jalapeno-relish', 'appetizers', 'Jalapeño Relish', null, 1.50, 4)
on conflict (id) do update set price = excluded.price, sort_order = excluded.sort_order;

-- HOUSE SPECIALTIES — items missing from original seed
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('carne-asada',
   'house-specialties',
   'Carne Asada',
   'Beef steak served with sliced potatoes, smothered with cheese & pico de gallo. Served with refried beans & 3 tortillas.',
   25.99, null, 8),

  ('juarez',
   'house-specialties',
   'Juarez',
   '3 flour tortillas filled with shredded beef, rolled and fried, topped with sour cream sauce. Served with rice, charro beans & a salad.',
   15.99, null, 9),

  ('chile-relleno',
   'house-specialties',
   'Chile Relleno',
   'One chile relleno topped with ranchero sauce. Served with rice, refried beans & one crispy taco.',
   14.99, null, 10),

  ('tamale-dinner',
   'house-specialties',
   'Tamale Dinner',
   'Beef tamales & one crispy taco, served with rice and refried beans.',
   null, '1 Tamale 11.99 | 2 Tamales 13.99 | 3 Tamales 15.99', 11),

  ('el-ranchero',
   'house-specialties',
   'El Ranchero',
   'Fajita meat topped with ranchero sauce and Monterey Jack cheese. Served with rice, refried beans, guacamole & 3 tortillas.',
   null, 'Fajita Chicken 14.99 | Fajita Beef 26.99', 12),

  ('poblano',
   'house-specialties',
   'Poblano',
   'Poblano pepper filled with shredded beef & cheese, topped with ranchero sauce. Served with rice, sliced avocado & pico de gallo.',
   17.99, null, 13),

  ('tacos-al-carbon',
   'house-specialties',
   'Tacos al Carbon',
   'Three flour tortillas filled with fajita chicken or fajita beef. Served with guacamole, sour cream, pico de gallo & charro beans.',
   null, 'Fajita Chicken 14.99 | Fajita Beef 20.99', 14),

  ('chimichanga',
   'house-specialties',
   'Chimichanga',
   'Flour tortilla filled with chicken or beef, topped with queso, chili, ranchero or sour cream sauce. Served with rice & refried beans. Sub white queso +$0.50.',
   null, 'Shredded Chicken 14.99 | Fajita Chicken 13.99 | Shredded Beef 16.99 | Fajita Beef 15.99 | Ground Beef 14.99', 15),

  ('guiso',
   'house-specialties',
   'Guiso',
   'Spicy beef & potatoes with sautéed onions and tomatoes. Served with rice, refried beans & 3 tortillas.',
   17.99, null, 16)

on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  price_text  = excluded.price_text,
  sort_order  = excluded.sort_order;

-- NACHOS — "Nachos Combo" was on the menu but missing from seed
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('nachos-combo', 'nachos', 'Nachos Combo', 'Beans & sour cream.', 13.99, 2)
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  sort_order  = excluded.sort_order;

-- Fix sort orders: Combo sits between Fajita Nachos (1) and Supreme (was 2, now 3)
update public.menu_items set sort_order = 3 where id = 'supreme-nachos';
update public.menu_items set sort_order = 4 where id = 'chicken-nachos';
update public.menu_items set sort_order = 5 where id = 'bean-nachos';

-- STREET TACOS — choose 1–5 tacos (chicken / beef / shrimp / carnitas)
insert into public.menu_items (id, category_id, name, description, price_text, sort_order) values
  ('street-tacos-one',
   'street-tacos',
   'Street Tacos — Choose One',
   'Fajita beef, chicken or shrimp topped with onions & cilantro. Carnitas: smoked pork with salsa verde, onions & cilantro. Served with rice & charro beans.',
   'Chicken 10.99 | Beef 12.99 | Shrimp 12.99 | Carnitas 11.99', 1),

  ('street-tacos-two',
   'street-tacos',
   'Street Tacos — Choose Two',
   'Fajita beef, chicken or shrimp topped with onions & cilantro. Carnitas: smoked pork with salsa verde, onions & cilantro. Served with rice & charro beans.',
   'Chicken 12.99 | Beef 14.99 | Shrimp 14.99 | Carnitas 13.99', 2),

  ('street-tacos-three',
   'street-tacos',
   'Street Tacos — Choose Three',
   'Fajita beef, chicken or shrimp topped with onions & cilantro. Carnitas: smoked pork with salsa verde, onions & cilantro. Served with rice & charro beans.',
   'Chicken 14.99 | Beef 16.99 | Shrimp 16.99 | Carnitas 15.99', 3),

  ('street-tacos-four',
   'street-tacos',
   'Street Tacos — Choose Four',
   'Fajita beef, chicken or shrimp topped with onions & cilantro. Carnitas: smoked pork with salsa verde, onions & cilantro. Served with rice & charro beans.',
   'Chicken 16.99 | Beef 21.99 | Shrimp 18.99 | Carnitas 17.99', 4),

  ('street-tacos-five',
   'street-tacos',
   'Street Tacos — Choose Five',
   'Fajita beef, chicken or shrimp topped with onions & cilantro. Carnitas: smoked pork with salsa verde, onions & cilantro. Served with rice & charro beans.',
   'Chicken 18.99 | Beef 24.99 | Shrimp 20.99 | Carnitas 19.99', 5)

on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  price_text  = excluded.price_text,
  sort_order  = excluded.sort_order;

-- BEVERAGES — Topo Chico was on the menu but missing from seed
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('topo-chico', 'beverage', 'Topo Chico', null, 3.00, 4)
on conflict (id) do update set price = excluded.price, sort_order = excluded.sort_order;

-- Re-sequence beverage sort orders so Topo Chico sits in the right spot
update public.menu_items set sort_order = 5 where id = 'jarritos';
update public.menu_items set sort_order = 6 where id = 'horchata';
update public.menu_items set sort_order = 7 where id = 'agua-fresca';

-- ── ADD-ONS ───────────────────────────────────────────────────────────────────

-- Nachos: "Add guacamole $1.00" (shown on physical menu for all nachos)
delete from public.menu_item_addons where name = 'Add Guacamole' and item_id in
  ('fajita-nachos','nachos-combo','supreme-nachos','chicken-nachos','bean-nachos');
insert into public.menu_item_addons (item_id, name, price, sort_order) values
  ('fajita-nachos',   'Add Guacamole', 1.00, 1),
  ('nachos-combo',    'Add Guacamole', 1.00, 1),
  ('supreme-nachos',  'Add Guacamole', 1.00, 1),
  ('chicken-nachos',  'Add Guacamole', 1.00, 1),
  ('bean-nachos',     'Add Guacamole', 1.00, 1);

-- Fajitas: smother add-ons (bacon, jack cheese, mushrooms or pineapple)
delete from public.menu_item_addons where name in
  ('Smother with Bacon','Smother with Jack Cheese','Smother with Mushrooms','Smother with Pineapple')
  and item_id in ('fajitas-chicken','fajitas-beef','fajitas-combo','fajitas-super','fajitas-veggie','fajitas-shrimp');
insert into public.menu_item_addons (item_id, name, price, sort_order)
select i.id, a.name, a.price, a.sort_order
from
  (values
    ('fajitas-chicken'), ('fajitas-beef'), ('fajitas-combo'),
    ('fajitas-super'), ('fajitas-veggie'), ('fajitas-shrimp')
  ) as i(id)
cross join (values
    ('Smother with Bacon',       2.00, 1),
    ('Smother with Jack Cheese', 2.00, 2),
    ('Smother with Mushrooms',   2.00, 3),
    ('Smother with Pineapple',   2.00, 4)
  ) as a(name, price, sort_order);

-- Local Favorites: quesadilla add-ons (white queso upgrade)
insert into public.menu_item_addons (item_id, name, price, sort_order) values
  ('nachos-combo', 'White queso upgrade', 0.50, 2)
on conflict do nothing;
