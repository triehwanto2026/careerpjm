
-- Activation codes table
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT '',
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on activation_codes"
  ON public.activation_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read activation_codes for login"
  ON public.activation_codes FOR SELECT TO anon USING (true);

-- Test instruments table
CREATE TABLE IF NOT EXISTS public.test_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Personality',
  question_count INTEGER NOT NULL DEFAULT 10,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  scoring_method TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  norm_reference TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on test_instruments"
  ON public.test_instruments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read active test_instruments"
  ON public.test_instruments FOR SELECT TO anon USING (is_active = true);

-- Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  activation_code_id UUID REFERENCES public.activation_codes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','expired')),
  birth_date TEXT,
  education TEXT,
  gender TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on candidates"
  ON public.candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to insert candidates"
  ON public.candidates FOR INSERT TO anon WITH CHECK (true);

-- Test results table
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT '',
  test_name TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  categories JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('passed','review','failed')),
  interpretation TEXT,
  candidate_profile JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on test_results"
  ON public.test_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to insert test_results"
  ON public.test_results FOR INSERT TO anon WITH CHECK (true);

-- Test answers table (jawaban per soal)
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_result_id UUID NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_text_en TEXT,
  selected_answer TEXT NOT NULL,
  selected_answer_label TEXT NOT NULL DEFAULT '',
  correct_answer TEXT,
  is_correct BOOLEAN,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on test_answers"
  ON public.test_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to insert test_answers"
  ON public.test_answers FOR INSERT TO anon WITH CHECK (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_activation_codes_updated_at ON public.activation_codes;
CREATE TRIGGER update_activation_codes_updated_at
  BEFORE UPDATE ON public.activation_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_instruments_updated_at ON public.test_instruments;
CREATE TRIGGER update_test_instruments_updated_at
  BEFORE UPDATE ON public.test_instruments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
