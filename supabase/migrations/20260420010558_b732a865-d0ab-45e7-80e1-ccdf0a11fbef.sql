
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activation_code_id UUID NOT NULL,
  candidate_email TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  seconds_remaining INTEGER NOT NULL DEFAULT 0,
  current_test_idx INTEGER NOT NULL DEFAULT 0,
  current_question_idx INTEGER NOT NULL DEFAULT 0,
  completed_subtests TEXT[] NOT NULL DEFAULT '{}',
  violation_count INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_test_sessions_activation_email
  ON public.test_sessions(activation_code_id, candidate_email);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test_sessions" ON public.test_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert test_sessions" ON public.test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update test_sessions" ON public.test_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete test_sessions" ON public.test_sessions FOR DELETE USING (true);

CREATE TRIGGER update_test_sessions_updated_at
  BEFORE UPDATE ON public.test_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
