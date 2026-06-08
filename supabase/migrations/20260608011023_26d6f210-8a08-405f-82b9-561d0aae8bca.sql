
CREATE OR REPLACE FUNCTION public.candidate_start_activation_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _row record;
BEGIN
  -- Must be an authenticated candidate
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, code, candidate_email, candidate_name, position, status,
         expires_at, test_completed_at, assigned_tests
    INTO _row
    FROM public.activation_codes
   WHERE code = _code
     AND lower(candidate_email) = _email
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'code_not_found';
  END IF;

  RETURN jsonb_build_object(
    'id', _row.id,
    'code', _row.code,
    'candidate_email', _row.candidate_email,
    'candidate_name', _row.candidate_name,
    'position', _row.position,
    'status', _row.status,
    'expires_at', _row.expires_at,
    'test_completed_at', _row.test_completed_at,
    'assigned_tests', _row.assigned_tests
  );
END;
$$;

REVOKE ALL ON FUNCTION public.candidate_start_activation_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.candidate_start_activation_code(text) TO authenticated;
