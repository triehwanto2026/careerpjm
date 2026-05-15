CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_reset_candidate_password(
  candidate_email TEXT,
  new_password TEXT DEFAULT '123456'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF candidate_email IS NULL OR trim(candidate_email) = '' THEN
    RAISE EXCEPTION 'Email kandidat wajib diisi';
  END IF;

  IF new_password IS NULL OR length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password minimal 6 karakter';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(candidate_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User auth dengan email % tidak ditemukan', candidate_email;
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    updated_at = now()
  WHERE id = target_user_id;

  WITH target_profile AS (
    SELECT id
    FROM public.candidate_profiles
    WHERE lower(email) = lower(trim(candidate_email))
      AND (user_id = target_user_id OR user_id IS NULL)
    ORDER BY (user_id = target_user_id) DESC, updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  )
  UPDATE public.candidate_profiles
  SET user_id = target_user_id, updated_at = now()
  WHERE id IN (SELECT id FROM target_profile);

  RETURN 'SUCCESS: Password kandidat berhasil direset dan login sudah aktif';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_activate_candidate_login(
  candidate_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF candidate_email IS NULL OR trim(candidate_email) = '' THEN
    RAISE EXCEPTION 'Email kandidat wajib diisi';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(candidate_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User auth dengan email % tidak ditemukan', candidate_email;
  END IF;

  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token = '',
    updated_at = now()
  WHERE id = target_user_id;

  WITH target_profile AS (
    SELECT id
    FROM public.candidate_profiles
    WHERE lower(email) = lower(trim(candidate_email))
      AND (user_id = target_user_id OR user_id IS NULL)
    ORDER BY (user_id = target_user_id) DESC, updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  )
  UPDATE public.candidate_profiles
  SET user_id = target_user_id, updated_at = now()
  WHERE id IN (SELECT id FROM target_profile);

  RETURN 'SUCCESS: Login kandidat berhasil diaktivasi';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_candidate_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activate_candidate_login(TEXT) TO anon, authenticated;

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
  normalized_email TEXT;
BEGIN
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

  IF to_regclass('public.test_answers') IS NOT NULL AND to_regclass('public.test_results') IS NOT NULL THEN
    DELETE FROM public.test_answers
    WHERE test_result_id IN (
      SELECT id FROM public.test_results WHERE candidate_id = ANY(target_candidate_ids)
    );
  END IF;

  IF to_regclass('public.test_results') IS NOT NULL THEN
    DELETE FROM public.test_results
    WHERE candidate_id = ANY(target_candidate_ids);
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

    -- Storage objects cannot be deleted directly from storage internal tables.
    -- Use the Storage API for removing files from buckets instead.
    -- Skipping direct storage.objects deletion here.
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

GRANT EXECUTE ON FUNCTION public.admin_delete_candidate_account(TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
