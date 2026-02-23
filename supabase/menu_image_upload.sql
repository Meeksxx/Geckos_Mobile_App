-- Menu image upload support
-- 1. Adds image_url column to menu_items and menu_categories
-- 2. Creates a public storage bucket for menu images
-- 3. Adds RLS policies so staff can upload/delete and anyone can read
--
-- Run this in the Supabase SQL editor.

-- ── Add image_url columns ─────────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.menu_categories
  ADD COLUMN IF NOT EXISTS image_url text;

-- ── Create storage bucket ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-item-images', 'menu-item-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS: public read ──────────────────────────────────
DROP POLICY IF EXISTS "public can read menu item images" ON storage.objects;
CREATE POLICY "public can read menu item images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'menu-item-images');

-- ── Storage RLS: staff can upload / update / delete ───────────
DROP POLICY IF EXISTS "staff can manage menu item images" ON storage.objects;
CREATE POLICY "staff can manage menu item images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'menu-item-images'
    AND EXISTS (SELECT 1 FROM public.staff_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'menu-item-images'
    AND EXISTS (SELECT 1 FROM public.staff_users WHERE user_id = auth.uid())
  );
