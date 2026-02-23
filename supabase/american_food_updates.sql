-- American Food updates
-- 1. Add "Substitute onion rings" add-on to all American food items
-- 2. Add crispy/grilled variant selection to Chicken Wrap

-- Remove any existing onion ring add-ons first to keep idempotent
DELETE FROM public.menu_item_addons
WHERE name = 'Onion rings (sub fries)'
  AND item_id IN (
    'hamburger','cheeseburger','guacamole-burger','bacon-burger',
    'chile-relleno-burger','quesadilla-burger','chicken-wrap',
    'chicken-strips','chicken-wings'
  );

-- Add substitute onion rings to every American food item ($2.00)
INSERT INTO public.menu_item_addons (item_id, name, price, sort_order) VALUES
  ('hamburger',            'Onion rings (sub fries)', 2.00, 1),
  ('cheeseburger',         'Onion rings (sub fries)', 2.00, 1),
  ('guacamole-burger',     'Onion rings (sub fries)', 2.00, 1),
  ('bacon-burger',         'Onion rings (sub fries)', 2.00, 1),
  ('chile-relleno-burger', 'Onion rings (sub fries)', 2.00, 1),
  ('quesadilla-burger',    'Onion rings (sub fries)', 2.00, 1),
  ('chicken-wrap',         'Onion rings (sub fries)', 2.00, 1),
  ('chicken-strips',       'Onion rings (sub fries)', 2.00, 1),
  ('chicken-wings',        'Onion rings (sub fries)', 2.00, 1);

-- Chicken Wrap: add crispy/grilled as selectable variants via price_text.
-- Update price to NULL so price_text drives the pricing display.
UPDATE public.menu_items
SET
  price      = NULL,
  price_text = 'Grilled 12.99 | Crispy 12.99'
WHERE id = 'chicken-wrap';
