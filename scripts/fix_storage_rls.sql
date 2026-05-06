-- Fix RLS for storage bucket test-images
-- Run this in Supabase SQL Editor

-- 1. Check current bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'test-images';

-- 2. Make bucket public if not already
UPDATE storage.buckets
SET public = true
WHERE name = 'test-images';

-- 3. Enable RLS but allow public read access
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for public read access if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname = 'Public Read Access test-images'
  ) THEN
    CREATE POLICY "Public Read Access test-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'test-images');
  END IF;
END $$;

-- 5. Create policy for authenticated uploads if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname = 'Authenticated Uploads test-images'
  ) THEN
    CREATE POLICY "Authenticated Uploads test-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'test-images');
  END IF;
END $$;

-- 6. Create policy for authenticated deletes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname = 'Authenticated Deletes test-images'
  ) THEN
    CREATE POLICY "Authenticated Deletes test-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'test-images');
  END IF;
END $$;

-- 7. List all policies on storage.objects
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
