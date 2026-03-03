-- Temporary $0.50 test item for verifying live Stripe payments.
-- Delete it after testing with the cleanup query at the bottom.
-- Run in Supabase SQL editor.

insert into public.menu_items (id, category_id, name, description, price, sort_order, is_active)
values (
  'test-stripe-item',
  'appetizers',
  'Test Item (Dev Only)',
  'Used to verify Stripe live payments. Delete after testing.',
  0.20,
  999,
  true
)
on conflict (id) do update set
  price      = excluded.price,
  is_active  = excluded.is_active;

-- ── CLEANUP (run this after testing) ─────────────────────────────────────────
-- delete from public.menu_items where id = 'test-stripe-item';
