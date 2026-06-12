-- Allow the admin candidates page to delete candidate accounts through RPC.
-- The function is still protected internally, so authenticated candidates cannot use it.

CREATE OR REPLACE FUNCTION public.admin_delete_candidate_account(
  candidate_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  target_user_id UUID;
  target_candidate_ids UUID[];
  target_profile_ids UUID[];
  normalized_email TEXT;
  request_role TEXT;
BEGIN
  request_role := current_setting('request.jwt.claim.role', true);

  IF COALESCE(request_role, '') <> 'service_role' AND NOT public.is_any_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat menghapus kandidat.';
  END IF;

  IF candidate_email IS NULL OR trim(candidate_email) = '' THEN
    RAISE EXCEPTION 'Email kandidat wajib diisi';
  END IF;

  normalized_email := lower(trim(candidate_email));

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = normalized_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    SELECT user_id INTO target_user_id
    FROM public.candidate_profiles
    WHERE lower(email) = normalized_email
      AND user_id IS NOT NULL
    LIMIT 1;
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO target_candidate_ids
  FROM public.candidates
  WHERE lower(email) = normalized_email;

  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO target_profile_ids
  FROM public.candidate_profiles
  WHERE lower(email) = normalized_email
    OR (target_user_id IS NOT NULL AND user_id = target_user_id);

  IF to_regclass('public.test_answers') IS NOT NULL AND to_regclass('public.test_results') IS NOT NULL THEN
    DELETE FROM public.test_answers
    WHERE test_result_id IN (
      SELECT id
      FROM public.test_results
      WHERE candidate_id = ANY(target_candidate_ids)
        OR candidate_id = ANY(target_profile_ids)
        OR (target_user_id IS NOT NULL AND candidate_id = target_user_id)
    );
  END IF;

  IF to_regclass('public.test_results') IS NOT NULL THEN
    DELETE FROM public.test_results
    WHERE candidate_id = ANY(target_candidate_ids)
      OR candidate_id = ANY(target_profile_ids)
      OR (target_user_id IS NOT NULL AND candidate_id = target_user_id);
  END IF;

  IF to_regclass('public.test_sessions') IS NOT NULL THEN
    DELETE FROM public.test_sessions ts
    WHERE lower(ts.candidate_email) = normalized_email;
  END IF;

  IF to_regclass('public.activation_codes') IS NOT NULL THEN
    DELETE FROM public.activation_codes ac
    WHERE lower(ac.candidate_email) = normalized_email;
  END IF;

  IF target_user_id IS NOT NULL THEN
    IF to_regclass('public.job_applications') IS NOT NULL THEN
      DELETE FROM public.job_applications WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_documents') IS NOT NULL THEN
      DELETE FROM public.candidate_documents WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_work_experience') IS NOT NULL THEN
      DELETE FROM public.candidate_work_experience WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_education_detail') IS NOT NULL THEN
      DELETE FROM public.candidate_education_detail WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_certifications') IS NOT NULL THEN
      DELETE FROM public.candidate_certifications WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_languages') IS NOT NULL THEN
      DELETE FROM public.candidate_languages WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_family_members') IS NOT NULL THEN
      DELETE FROM public.candidate_family_members WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.candidate_education') IS NOT NULL THEN
      DELETE FROM public.candidate_education WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.notifications') IS NOT NULL THEN
      DELETE FROM public.notifications WHERE user_id = target_user_id;
    END IF;

    IF to_regclass('public.activity_logs') IS NOT NULL THEN
      DELETE FROM public.activity_logs WHERE user_id = target_user_id;
    END IF;
  END IF;

  DELETE FROM public.candidate_profiles
  WHERE lower(email) = normalized_email
    OR (target_user_id IS NOT NULL AND user_id = target_user_id);

  DELETE FROM public.candidates
  WHERE lower(email) = normalized_email;

  IF target_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  END IF;

  RETURN 'SUCCESS: Data kandidat berhasil dihapus seluruhnya';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_candidate_account(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_candidate_account(TEXT) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
