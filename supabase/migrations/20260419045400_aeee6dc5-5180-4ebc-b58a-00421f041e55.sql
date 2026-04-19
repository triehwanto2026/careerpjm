
-- Add image_url to questions and options
ALTER TABLE public.test_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.test_question_options ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Storage buckets (public for easy display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('test-images', 'test-images', true)
ON CONFLICT (id) DO NOTHING;

-- Permissive policies for both buckets (anon + authenticated read/write)
DROP POLICY IF EXISTS "Public can read candidate photos" ON storage.objects;
CREATE POLICY "Public can read candidate photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'candidate-photos');

DROP POLICY IF EXISTS "Anyone can upload candidate photos" ON storage.objects;
CREATE POLICY "Anyone can upload candidate photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'candidate-photos');

DROP POLICY IF EXISTS "Anyone can update candidate photos" ON storage.objects;
CREATE POLICY "Anyone can update candidate photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'candidate-photos');

DROP POLICY IF EXISTS "Anyone can delete candidate photos" ON storage.objects;
CREATE POLICY "Anyone can delete candidate photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'candidate-photos');

DROP POLICY IF EXISTS "Public can read test images" ON storage.objects;
CREATE POLICY "Public can read test images" ON storage.objects
  FOR SELECT USING (bucket_id = 'test-images');

DROP POLICY IF EXISTS "Anyone can upload test images" ON storage.objects;
CREATE POLICY "Anyone can upload test images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'test-images');

DROP POLICY IF EXISTS "Anyone can update test images" ON storage.objects;
CREATE POLICY "Anyone can update test images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'test-images');

DROP POLICY IF EXISTS "Anyone can delete test images" ON storage.objects;
CREATE POLICY "Anyone can delete test images" ON storage.objects
  FOR DELETE USING (bucket_id = 'test-images');
