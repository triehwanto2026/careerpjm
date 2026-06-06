
-- 1) Restrict test_questions / test_question_options base tables to admins only
DROP POLICY IF EXISTS "Public read test_questions" ON public.test_questions;
DROP POLICY IF EXISTS "Public read test_question_options" ON public.test_question_options;

CREATE POLICY "Admins read test_questions"
  ON public.test_questions FOR SELECT
  TO authenticated
  USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins read test_question_options"
  ON public.test_question_options FOR SELECT
  TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- 2) Safe views that strip answer-key data, used by candidates during a test.
DROP VIEW IF EXISTS public.test_questions_safe;
DROP VIEW IF EXISTS public.test_question_options_safe;

CREATE VIEW public.test_questions_safe AS
SELECT
  q.id,
  q.instrument_id,
  q.question_number,
  regexp_replace(COALESCE(q.question_text, ''), 'CORRECT_ANSWER:[^[:space:]]*', '', 'g') AS question_text,
  regexp_replace(COALESCE(q.question_text_en, ''), 'CORRECT_ANSWER:[^[:space:]]*', '', 'g') AS question_text_en,
  q.category,
  q.question_type,
  q.scoring_rule,
  q.subtest_code,
  q.time_limit_minutes,
  q.image_url,
  q.question_image,
  q.options_image,
  q.created_at,
  q.updated_at
FROM public.test_questions q;

CREATE VIEW public.test_question_options_safe AS
SELECT
  o.id,
  o.question_id,
  o.option_label,
  o.option_text,
  o.option_text_en,
  o.category_target,
  o.display_order,
  o.image_url
FROM public.test_question_options o;

GRANT SELECT ON public.test_questions_safe TO anon, authenticated;
GRANT SELECT ON public.test_question_options_safe TO anon, authenticated;

-- 3) Storage: drop broad public SELECT on listable public buckets.
DROP POLICY IF EXISTS "Public read candidate-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read test-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read settings-images" ON storage.objects;

-- Admins keep listing access for management UIs.
CREATE POLICY "Admins list candidate-photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'candidate-photos' AND public.is_any_admin(auth.uid()));

CREATE POLICY "Admins list test-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'test-images' AND public.is_any_admin(auth.uid()));

CREATE POLICY "Admins list settings-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'settings-images' AND public.is_any_admin(auth.uid()));
