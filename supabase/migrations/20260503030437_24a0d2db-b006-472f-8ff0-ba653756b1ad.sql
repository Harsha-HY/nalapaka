
-- Add image_url to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url text;

-- Create public bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;
CREATE POLICY "Public read menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Managers upload menu images" ON storage.objects;
CREATE POLICY "Managers upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images' AND public.is_manager());

DROP POLICY IF EXISTS "Managers update menu images" ON storage.objects;
CREATE POLICY "Managers update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images' AND public.is_manager());

DROP POLICY IF EXISTS "Managers delete menu images" ON storage.objects;
CREATE POLICY "Managers delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND public.is_manager());
