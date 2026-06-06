
-- Drop the views (linter flags them as Security Definer Views) and replace with explicit functions.
DROP VIEW IF EXISTS public.test_questions_safe;
DROP VIEW IF EXISTS public.test_question_options_safe;

CREATE OR REPLACE FUNCTION public.get_test_questions_safe(_instrument_ids uuid[])
RETURNS TABLE (
  id uuid,
  instrument_id uuid,
  question_number integer,
  question_text text,
  question_text_en text,
  category text,
  question_type text,
  scoring_rule text,
  subtest_code text,
  time_limit_minutes integer,
  image_url text,
  question_image text,
  options_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.instrument_id,
    q.question_number,
    regexp_replace(COALESCE(q.question_text, ''), 'CORRECT_ANSWER:[^[:space:]]*', '', 'g'),
    regexp_replace(COALESCE(q.question_text_en, ''), 'CORRECT_ANSWER:[^[:space:]]*', '', 'g'),
    q.category,
    q.question_type,
    q.scoring_rule,
    q.subtest_code,
    q.time_limit_minutes,
    q.image_url,
    q.question_image,
    q.options_image
  FROM public.test_questions q
  WHERE q.instrument_id = ANY(_instrument_ids)
  ORDER BY q.question_number;
$$;

REVOKE ALL ON FUNCTION public.get_test_questions_safe(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_questions_safe(uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_test_question_options_safe(_question_ids uuid[])
RETURNS TABLE (
  id uuid,
  question_id uuid,
  option_label text,
  option_text text,
  option_text_en text,
  category_target text,
  display_order integer,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.question_id,
    o.option_label,
    o.option_text,
    o.option_text_en,
    o.category_target,
    o.display_order,
    o.image_url
  FROM public.test_question_options o
  WHERE o.question_id = ANY(_question_ids)
  ORDER BY o.display_order;
$$;

REVOKE ALL ON FUNCTION public.get_test_question_options_safe(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_question_options_safe(uuid[]) TO authenticated, service_role;
