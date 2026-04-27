-- Add Aptitude Test instrument and 60 questions
-- Using WITH clause to get instrument ID and insert questions atomically

WITH aptitude_instrument AS (
  INSERT INTO public.test_instruments (name, name_en, description, category, question_count, duration_minutes, scoring_method, target_audience, norm_reference, is_active)
  VALUES (
    'Aptitude Test',
    'Aptitude Test',
    'Tes kemampuan kognitif mencakup Numerik, Verbal, dan Logical Reasoning',
    'Aptitude',
    60,
    60,
    'sum',
    'General',
    'Standard',
    true
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id
)
SELECT id FROM aptitude_instrument;

-- Note: Questions will be added in a separate migration after getting the instrument ID
-- Run: SELECT id FROM test_instruments WHERE name = 'Aptitude Test';
