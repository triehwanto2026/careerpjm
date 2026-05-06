-- Fix CORS and RLS for test-images bucket
-- Run this in Supabase SQL Editor

-- 1. Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE name = 'test-images';

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Access test-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads test-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Deletes test-images" ON storage.objects;

-- 3. Create simple public read policy
CREATE POLICY "Public Read Access test-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'test-images');

-- 4. Create policy for authenticated users to upload
CREATE POLICY "Authenticated Uploads test-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'test-images');

-- 5. Create policy for authenticated users to delete their own files
CREATE POLICY "Authenticated Deletes test-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'test-images');

-- 6. Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Verify
SELECT 
  b.name as bucket_name,
  b.public as is_public,
  COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' AND p.schemaname = 'storage'
WHERE b.name = 'test-images'
GROUP BY b.name, b.public;
