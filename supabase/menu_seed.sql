-- Seed data for Gecko's menu
-- Run AFTER menu_setup.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)

-- ── Categories ───────────────────────────────────────────────
insert into public.menu_categories (id, title, sort_order) values
  ('appetizers',        'Appetizers',        1),
  ('ensalada',          'Ensalada',          2),
  ('lunch-specials',    'Lunch Specials',    3),
  ('local-favorites',   'Local Favorites',   4),
  ('house-specialties', 'House Specialties', 5),
  ('american-food',     'American Food',     6),
  ('fajitas',           'Fajitas',           7),
  ('nachos',            'Nachos',            8),
  ('dessert',           'Dessert',           9),
  ('kids',              'Kids',              10),
  ('quesadillas',       'Quesadillas',       11),
  ('beverage',          'Beverage',          12)
on conflict (id) do nothing;

-- ── Lunch Choices ────────────────────────────────────────────
insert into public.lunch_choices (name, sort_order) values
  ('Cheese Enchilada',   1),
  ('Chicken Enchilada',  2),
  ('Beef Enchilada',     3),
  ('Crispy Taco',        4),
  ('Bean Tostada',       5),
  ('Beef Tostada',       6),
  ('Guacamole Tostada',  7),
  ('Beef Burrito',       8),
  ('Cheese Burrito',     9)
on conflict (name) do nothing;

-- ── Lunch Sauces ─────────────────────────────────────────────
insert into public.lunch_sauces (name, price, sort_order) values
  ('Chili',            0.00, 1),
  ('Ranchero',         0.00, 2),
  ('Sour Cream Sauce', 0.00, 3),
  ('Yellow Queso',     0.00, 4),
  ('White Queso',      0.50, 5)
on conflict (name) do nothing;

-- ── Menu Items ───────────────────────────────────────────────

-- APPETIZERS
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('yellow-queso',       'appetizers', 'Yellow Queso',       null,                                                                                           null,  'Small 2.99 | Large 4.99',  1),
  ('white-queso',        'appetizers', 'White Queso',        null,                                                                                           null,  'Small 4.99 | Large 9.99',  2),
  ('guacamole',          'appetizers', 'Guacamole',          null,                                                                                           null,  'Small 2.79 | Large 4.99',  3),
  ('grilled-jalapeno',   'appetizers', 'Grilled Jalapeño',   null,                                                                                           1.00,  null,                        4),
  ('sliced-avocado',     'appetizers', 'Sliced Avocado',     null,                                                                                           3.99,  null,                        5),
  ('chile-con-queso-bowl','appetizers','Chile con Queso Bowl',null,                                                                                          6.99,  null,                        6),
  ('elote',              'appetizers', 'Elote',              'Mexican corn smothered in queso fresco, crema, lime & tajín.',                                 6.99,  null,                        7),
  ('layer-dip',          'appetizers', 'Layer Dip',          'Taco meat, refried beans, guacamole, sour cream, cheese, tomatoes, olives & cilantro.',        8.99,  null,                        8),
  ('chicken-flautas',    'appetizers', 'Chicken Flautas',    'Chicken rolled in corn tortillas, fried and served with guacamole & sour cream.',              7.99,  null,                        9),
  ('mini-tacos',         'appetizers', 'Mini Tacos',         '8 mini tacos served with yellow queso.',                                                       7.99,  null,                        10),
  ('empanadas',          'appetizers', 'Empanadas',          'Chicken rojo stuffed in a fried pastry shell, served with yellow queso.',                      null,  '4 for 8.99 | 6 for 12.99', 11),
  ('picosos',            'appetizers', 'Picosos',            'Stuffed chicken jalapeños with cheese, served with yellow queso.',                             9.99,  null,                        12),
  ('party-platter',      'appetizers', 'Party Platter',      '2 chicken flautas, 2 picosos, cheese quesadilla, bean nachos & queso.',                       13.99, null,                        13),
  ('loaded-fries',       'appetizers', 'Loaded Fries',       'Smoked pulled pork, white queso, jalapeños & pico de gallo.',                                 13.99, null,                        14),
  ('party-pork-nachos',  'appetizers', 'Party Pork Nachos',  'Fresh-made chips topped with smoked pork, white queso, jalapeños & pico de gallo.',           13.99, null,                        15)
on conflict (id) do nothing;

-- ENSALADA
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('taco-salad',          'ensalada', 'Taco Salad',           'Lettuce, taco meat, cheese, tomatoes & black olives in a crispy tortilla bowl.',                                                                     11.99, null,                        1),
  ('fajita-salad',        'ensalada', 'Chicken Fajita Salad', 'Lettuce, cheese, tomatoes & black olives in a crispy tortilla bowl with guacamole & sour cream.',                                                    null,  'Chicken 11.99 | Beef 13.99', 2),
  ('crispy-chicken-salad','ensalada', 'Crispy Chicken Salad', 'Lettuce, crispy chicken, bacon, Monterey Jack cheese & tomatoes, served with house-made ranch.',                                                     11.99, null,                        3),
  ('empanada-salad',      'ensalada', 'Empanada Salad',       'Lettuce, spinach, tomato, avocado & cheese topped with 3 empanadas.',                                                                                14.99, null,                        4)
on conflict (id) do nothing;

-- LUNCH SPECIALS
insert into public.menu_items (id, category_id, name, description, price_text, choice_count, sort_order) values
  ('lunch-one',   'lunch-specials', 'Lunch Special –––––– Choose One',   'Served with rice & refried beans.', 'Before 2PM $6.25 | After 2PM & Sat $7.00', 1, 1),
  ('lunch-two',   'lunch-specials', 'Lunch Special –––––– Choose Two',   'Served with rice & refried beans.', 'Before 2PM $7.75 | After 2PM & Sat $8.50', 2, 2),
  ('lunch-three', 'lunch-specials', 'Lunch Special –––––– Choose Three', 'Served with rice & refried beans.', 'Before 2PM $9.00 | After 2PM & Sat $9.99', 3, 3)
on conflict (id) do nothing;

-- HOUSE SPECIALTIES
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('pollo-sabroso',   'house-specialties', 'Pollo Sabroso',   'Chicken breast with Monterey Jack cheese, sour cream sauce. Served with rice, guacamole, pico de gallo & 3 tortillas.',                                                                                          14.99, 1),
  ('cozumel',         'house-specialties', 'Cozumel',         'Three flour tortillas filled with shredded chicken, pico de gallo & sliced avocado. Served with rice & charro beans.',                                                                                            13.99, 2),
  ('dona-lola',       'house-specialties', 'Doña Lola',       'Chicken breast topped with cheese, sautéed mushrooms, onions, bell peppers & poblano peppers. Served with rice, charro beans & 3 tortillas.',                                                                    14.99, 3),
  ('lupitas',         'house-specialties', 'Lupitas',         'One chile relleno topped with ranchero sauce, one chicken enchilada topped with sour cream sauce, and one crispy taco. Served with rice & refried beans.',                                                        14.99, 4),
  ('el-grande',       'house-specialties', 'El Grande',       'One cheese enchilada topped with chili, one chicken enchilada with sour cream sauce, one crispy taco & one bean tostada. Served with rice & refried beans.',                                                      15.99, 5),
  ('fiesta',          'house-specialties', 'Fiesta',          'One chicken enchilada topped with sour cream sauce, one beef enchilada topped with queso, one cheese enchilada topped with chili, and one crispy taco. Served with rice & refried beans.',                        13.99, 6),
  ('grilled-shrimp',  'house-specialties', 'Grilled Shrimp',  'Six large shrimp on a bed of onions & peppers, served with rice, salad & avocado slices.',                                                                                                                       15.99, 7)
on conflict (id) do nothing;

-- LOCAL FAVORITES
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('bowl',          'local-favorites', 'Bowl',          'Chicken or beef on a bed of rice, topped with queso.',                                                                                                                              null,  'Chicken 11.99 | Beef 12.99',             1),
  ('avocado-bowl',  'local-favorites', 'Avocado Bowl',  'Two avocado halves filled with ground beef & rice, topped with yellow queso.',                                                                                                      11.99, null,                                     2),
  ('super-burrito', 'local-favorites', 'Super Burrito', 'A 12" flour tortilla stuffed with beef or chicken fajita meat, rice, lettuce, refried beans, guacamole & sour cream.',                                                             null,  'Chicken 12.99 | Beef 14.99',             3),
  ('cowboy-shrimp', 'local-favorites', 'Cowboy Shrimp', 'Grilled bacon-wrapped shrimp on a bed of onions, mushrooms, bell peppers & tomatoes. Served with rice, refried beans & guacamole. Served with 3 tortillas.',                       17.99, null,                                     4),
  ('street-tacos',  'local-favorites', 'Street Tacos',  'Three soft corn tortillas filled with fajita chicken, beef or shrimp. Topped with onions & cilantro. Served with rice & charro beans.',                                            null,  'Chicken 12.99 | Beef 16.99 | Shrimp 16.99', 5)
on conflict (id) do nothing;

-- AMERICAN FOOD
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('hamburger',           'american-food', 'Hamburger',           'Served with lettuce, tomatoes, onions & pickles. Served with French fries.',                                                                                           9.99,  1),
  ('cheeseburger',        'american-food', 'Cheeseburger',        'Served with cheese, lettuce, tomatoes, onions & pickles. Served with French fries.',                                                                                  10.99, 2),
  ('guacamole-burger',    'american-food', 'Guacamole Burger',    'Served with cheddar jack cheese, lettuce, tomato & guacamole. Served with French fries.',                                                                             12.99, 3),
  ('bacon-burger',        'american-food', 'Bacon Burger',        'Served with cheddar jack cheese, lettuce, tomato & bacon. Served with French fries.',                                                                                 12.99, 4),
  ('chile-relleno-burger','american-food', 'Chile Relleno Burger','Beef patty topped with mayo, lettuce, tomato & house-made chile relleno. Served with French fries.',                                                                  14.99, 5),
  ('quesadilla-burger',   'american-food', 'Quesadilla Burger',   'Quesadilla meets burger! Topped with cheddar jack cheese, lettuce & pico de gallo. Served with house-made Mexi-Ranch dressing & French fries.',                      12.99, 6),
  ('chicken-wrap',        'american-food', 'Chicken Wrap',        '12" flour tortilla wrapped with grilled or fried chicken, lettuce, tomato & cheddar jack cheese. Served with house-made ranch & French fries.',                       12.99, 7),
  ('chicken-strips',      'american-food', 'Chicken Strips (4)',  'Four chicken strips served with French fries.',                                                                                                                        11.99, 8),
  ('chicken-wings',       'american-food', 'Chicken Wings',       'Ten chicken wings served with house-made ranch, tossed in buffalo sauce or naked.',                                                                                   11.99, 9)
on conflict (id) do nothing;

-- FAJITAS
insert into public.menu_items (id, category_id, name, description, price_text, sort_order) values
  ('fajitas-chicken', 'fajitas', 'Chicken Fajitas',             'Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 15.99 | Double 29.99', 1),
  ('fajitas-beef',    'fajitas', 'Beef Fajitas',                'Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 18.99 | Double 33.99', 2),
  ('fajitas-combo',   'fajitas', 'Combo Fajitas (Beef & Chicken)', 'Served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 17.99 | Double 33.99', 3),
  ('fajitas-super',   'fajitas', 'Super Fajitas',               'Chicken, beef & shrimp fajitas served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 21.99 | Double 40.99', 4),
  ('fajitas-veggie',  'fajitas', 'Veggie Fajitas',              'Mushrooms, bell peppers, grilled onions & tomatoes served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 10.99 | Double 21.99', 5),
  ('fajitas-shrimp',  'fajitas', 'Shrimp Fajitas',              'Grilled shrimp fajitas served with guacamole, sour cream, pico de gallo, cheese, refried beans & tortillas.', 'Single 17.99 | Double 33.99', 6)
on conflict (id) do nothing;

-- NACHOS
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('fajita-nachos',   'nachos', 'Fajita Nachos',   'Beans, sour cream, chicken or beef fajita meat.',  null,  'Chicken 13.99 | Beef 14.99', 1),
  ('supreme-nachos',  'nachos', 'Supreme Nachos',  'Beans, ground beef, lettuce, tomatoes & sour cream.', 13.99, null,                      2),
  ('chicken-nachos',  'nachos', 'Chicken Nachos',  'Shredded chicken & sour cream.',                    10.99, null,                      3),
  ('bean-nachos',     'nachos', 'Bean Nachos',     'Refried beans & sour cream.',                        8.99, null,                      4)
on conflict (id) do nothing;

-- QUESADILLAS
insert into public.menu_items (id, category_id, name, description, price, price_text, sort_order) values
  ('fajita-quesadilla',  'quesadillas', 'Fajita Quesadilla',  'Served with guacamole, sour cream & pico de gallo.', null,  'Chicken 11.99 | Beef 13.99 | Pork 11.99', 1),
  ('shrimp-quesadilla',  'quesadillas', 'Shrimp Quesadilla',  'Served with guacamole, sour cream & pico de gallo.', 13.99, null,                                       2),
  ('cheese-quesadilla',  'quesadillas', 'Cheese Quesadilla',  null,                                                  9.99, null,                                       3),
  ('spinach-quesadilla', 'quesadillas', 'Spinach Quesadilla', null,                                                 10.99, null,                                       4)
on conflict (id) do nothing;

-- BEVERAGE
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('soda',         'beverage', 'Soda',                           null,                                      2.99, 1),
  ('bottled-soda', 'beverage', 'Bottled Soda',                   null,                                      3.75, 2),
  ('iced-tea',     'beverage', 'Iced Tea (Sweet or Unsweetened)', null,                                      2.99, 3),
  ('jarritos',     'beverage', 'Jarritos',                        'Check with your server for daily flavors.', 2.75, 4),
  ('horchata',     'beverage', 'Fresh Made Horchata',             'Check with your server for daily flavors.', 3.99, 5),
  ('agua-fresca',  'beverage', 'Agua Fresca',                     'Check with your server for daily flavors.', 3.99, 6)
on conflict (id) do nothing;

-- KIDS
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('kids-cheese-quesadilla', 'kids', 'Kids Cheese Quesadilla', 'Served with rice & beans.', 6.99, 1),
  ('kids-chicken-strips',    'kids', 'Kids Chicken Strips',    'Served with fries.',         6.99, 2),
  ('kids-taco',              'kids', 'Kids Taco',              'Served with rice & beans.',  6.99, 3)
on conflict (id) do nothing;

-- DESSERT
insert into public.menu_items (id, category_id, name, description, price, sort_order) values
  ('sopapilla', 'dessert', 'Sopapilla', 'Fried pastry topped with honey.',  4.99, 1),
  ('churros',   'dessert', 'Churros',   'Cinnamon sugar churros.',           5.99, 2)
on conflict (id) do nothing;

-- ── Item Add-ons ─────────────────────────────────────────────
insert into public.menu_item_addons (item_id, name, price, sort_order) values
  -- Appetizers
  ('chicken-flautas',     'Substitute beef',          1.00, 1),
  -- Local Favorites
  ('bowl',                'White queso upgrade',      0.50, 1),
  ('avocado-bowl',        'White queso upgrade',      0.50, 1),
  ('super-burrito',       'White queso upgrade',      0.50, 1),
  -- American Food
  ('hamburger',           'Onion rings (sub fries)',  2.00, 1),
  ('cheeseburger',        'Onion rings (sub fries)',  2.00, 1),
  ('guacamole-burger',    'Onion rings (sub fries)',  2.00, 1),
  ('bacon-burger',        'Add egg',                  1.00, 1),
  ('bacon-burger',        'Onion rings (sub fries)',  2.00, 2),
  ('chile-relleno-burger','Onion rings (sub fries)',  2.00, 1),
  ('quesadilla-burger',   'Onion rings (sub fries)',  2.00, 1)
on conflict do nothing;
