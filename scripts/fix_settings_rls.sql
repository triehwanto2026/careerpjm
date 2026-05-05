-- Fix RLS for app_settings (tables already exist)
-- Run this in Supabase Dashboard SQL Editor

-- ============================================
-- FIX RLS FOR app_settings
-- ============================================

-- Drop existing anon policies if any
DROP POLICY IF EXISTS "Allow anon to read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow anon to insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow anon to update app_settings" ON public.app_settings;

-- Keep the authenticated policy
DROP POLICY IF EXISTS "Allow authenticated full access on app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated full access on app_settings"
  ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon can read all settings (needed for Settings page to load)
CREATE POLICY "Allow anon to read app_settings"
  ON public.app_settings FOR SELECT TO anon USING (true);

-- Anon can update settings (needed for Settings page save)
CREATE POLICY "Allow anon to update app_settings"
  ON public.app_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Anon can insert settings (if adding new ones)
CREATE POLICY "Allow anon to insert app_settings"
  ON public.app_settings FOR INSERT TO anon WITH CHECK (true);

-- ============================================
-- FIX RLS FOR storage.objects (settings-images bucket)
-- ============================================

-- Allow anon upload to settings-images
DROP POLICY IF EXISTS "Allow anon upload to settings-images" ON storage.objects;
CREATE POLICY "Allow anon upload to settings-images"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'settings-images');

-- Allow anon update settings-images
DROP POLICY IF EXISTS "Allow anon update settings-images" ON storage.objects;
CREATE POLICY "Allow anon update settings-images"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'settings-images');

-- Allow anon delete from settings-images
DROP POLICY IF EXISTS "Allow anon delete settings-images" ON storage.objects;
CREATE POLICY "Allow anon delete settings-images"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'settings-images');

-- Keep public read
DROP POLICY IF EXISTS "Allow public read settings-images" ON storage.objects;
CREATE POLICY "Allow public read settings-images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'settings-images');

-- Verify policies exist
SELECT tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename IN ('app_settings', 'objects')
ORDER BY tablename, policyname;
