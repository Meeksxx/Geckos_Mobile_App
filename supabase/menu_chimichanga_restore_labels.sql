-- Restore full variant labels for Chimichanga now that the list card
-- condenses 3+ variants to "From $X.XX" — the full names only show
-- on the item detail screen where there's room to display them.
-- Run in Supabase SQL editor.

update public.menu_items
set price_text = 'Shredded Chicken 14.99 | Fajita Chicken 13.99 | Shredded Beef 16.99 | Fajita Beef 15.99 | Ground Beef 14.99'
where id = 'chimichanga';
