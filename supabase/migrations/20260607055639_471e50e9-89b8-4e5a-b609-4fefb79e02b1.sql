
-- 1) test_interpretations: restrict reads to admins
DROP POLICY IF EXISTS "Allow anon to read test_interpretations" ON public.test_interpretations;
CREATE POLICY "Admins read test_interpretations"
  ON public.test_interpretations FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- 2) job_vacancies: stop exposing closed vacancies publicly
DROP POLICY IF EXISTS "Anyone can view open vacancies" ON public.job_vacancies;
CREATE POLICY "Anyone can view open vacancies"
  ON public.job_vacancies FOR SELECT
  USING (status = 'open');

-- 3) Drop overly permissive candidate UPDATE policy on activation_codes
DROP POLICY IF EXISTS "Candidates update own activation code" ON public.activation_codes;

-- Narrow RPC for candidates to update only status / timing fields on their own code
CREATE OR REPLACE FUNCTION public.candidate_update_activation_code_status(
  _id uuid,
  _status text DEFAULT NULL,
  _test_started_at timestamptz DEFAULT NULL,
  _test_completed_at timestamptz DEFAULT NULL,
  _auto_submitted boolean DEFAULT NULL,
  _is_used boolean DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_status text;
BEGIN
  SELECT lower(candidate_email), status INTO v_email, v_status
    FROM public.activation_codes WHERE id = _id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Activation code not found';
  END IF;
  IF v_email <> public.my_email() AND NOT public.is_any_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _status IS NOT NULL AND _status NOT IN ('active','completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  IF NOT public.is_any_admin(auth.uid()) THEN
    IF v_status = 'completed' THEN
      RAISE EXCEPTION 'Code already completed';
    END IF;
    IF _is_used = false THEN
      RAISE EXCEPTION 'Cannot un-use a code';
    END IF;
  END IF;

  UPDATE public.activation_codes
  SET
    status = COALESCE(_status, status),
    test_started_at = COALESCE(_test_started_at, test_started_at),
    test_completed_at = COALESCE(_test_completed_at, test_completed_at),
    auto_submitted = COALESCE(_auto_submitted, auto_submitted),
    is_used = COALESCE(_is_used, is_used),
    updated_at = now()
  WHERE id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.candidate_update_activation_code_status(uuid,text,timestamptz,timestamptz,boolean,boolean) TO authenticated;

-- 4) Safe view for candidates that hides the password (bcrypt) column
DROP VIEW IF EXISTS public.my_activation_codes;
CREATE VIEW public.my_activation_codes
WITH (security_invoker=on) AS
  SELECT id, code, candidate_email, candidate_name, position,
         expires_at, is_used, used_at, status, assigned_tests,
         test_started_at, test_completed_at, auto_submitted,
         created_at, updated_at
  FROM public.activation_codes;

GRANT SELECT ON public.my_activation_codes TO authenticated;
GRANT SELECT ON public.my_activation_codes TO service_role;

-- 5) RPC to verify an activation login and return a safe row (no password hash)
CREATE OR REPLACE FUNCTION public.candidate_verify_activation_login(
  _code text,
  _password text
) RETURNS public.my_activation_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
  v_id uuid;
  result public.my_activation_codes;
BEGIN
  SELECT id, password INTO v_id, stored
    FROM public.activation_codes
    WHERE code = _code
    LIMIT 1;
  IF v_id IS NULL OR stored IS NULL THEN
    RETURN NULL;
  END IF;
  IF stored LIKE '$2%' THEN
    IF extensions.crypt(_password, stored) <> stored THEN
      RETURN NULL;
    END IF;
  ELSE
    IF stored <> _password THEN
      RETURN NULL;
    END IF;
  END IF;
  SELECT * INTO result FROM public.my_activation_codes WHERE id = v_id;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.candidate_verify_activation_login(text, text) TO authenticated, anon;

-- 6) Revoke direct read access to the bcrypt password column for non-privileged roles
REVOKE SELECT (password) ON public.activation_codes FROM authenticated;
REVOKE SELECT (password) ON public.activation_codes FROM anon;
