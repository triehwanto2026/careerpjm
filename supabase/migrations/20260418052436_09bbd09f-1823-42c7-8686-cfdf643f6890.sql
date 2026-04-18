
-- ============= Schema additions for advanced test types =============
ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS subtest_code TEXT,
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS group_number INTEGER;

-- question_type values used: single_choice | disc_pair | ist_subtest_item | kraepelin_pair | papi_pair | likert
-- subtest_code (IST): SE, WA, AN, GE, RA, ZR, FA, WU, ME

CREATE INDEX IF NOT EXISTS idx_test_questions_instrument_subtest ON public.test_questions(instrument_id, subtest_code, question_number);
CREATE INDEX IF NOT EXISTS idx_test_question_options_question ON public.test_question_options(question_id, display_order);
