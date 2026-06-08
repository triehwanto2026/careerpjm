
-- 1) Lock down activation_codes.password at column level
REVOKE SELECT (password) ON public.activation_codes FROM anon, authenticated, PUBLIC;

-- 2) Lock down scoring keys in test_answers at column level
REVOKE SELECT (correct_answer, is_correct, expected_answer) ON public.test_answers FROM anon, authenticated, PUBLIC;

-- 3) Restrict test_instruments public read to non-sensitive columns only.
-- Drop the broad anon SELECT policy and replace with authenticated-only.
DROP POLICY IF EXISTS "Public read test_instruments" ON public.test_instruments;
CREATE POLICY "Authenticated read test_instruments"
  ON public.test_instruments
  FOR SELECT
  TO authenticated
  USING (true);
-- Revoke direct anon access to sensitive columns
REVOKE SELECT (scoring_method, norm_reference) ON public.test_instruments FROM anon, PUBLIC;

-- 4) Activity logs: allow admins to read and delete
DROP POLICY IF EXISTS "Admins read all activity logs" ON public.activity_logs;
CREATE POLICY "Admins read all activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete activity logs" ON public.activity_logs;
CREATE POLICY "Admins delete activity logs"
  ON public.activity_logs
  FOR DELETE
  TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- 5) Enforce candidate email uniqueness to prevent duplicate rows
CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_unique_idx
  ON public.candidates (lower(email));
