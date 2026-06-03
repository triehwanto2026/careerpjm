
-- ============================================================
-- PART 1: Drop all anon/permissive policies on sensitive tables
-- ============================================================

-- admin_users
DROP POLICY IF EXISTS "Allow anon to delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to read admin_users for login" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow authenticated full access on admin_users" ON public.admin_users;

CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

REVOKE ALL ON public.admin_users FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- admin_roles
DROP POLICY IF EXISTS "Allow anon to delete admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to insert admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to read admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to update admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow authenticated full access on admin_roles" ON public.admin_roles;

CREATE POLICY "Admins can read admin_roles" ON public.admin_roles
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Super admins manage admin_roles" ON public.admin_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

REVOKE ALL ON public.admin_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO authenticated;
GRANT ALL ON public.admin_roles TO service_role;

-- app_settings
DROP POLICY IF EXISTS "Allow anon to insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow anon to read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow anon to update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated full access on app_settings" ON public.app_settings;
-- Keep "Allow anon to read public app_settings" (is_public = true) -- already exists

CREATE POLICY "Authenticated can read public settings" ON public.app_settings
  FOR SELECT TO authenticated USING (is_public = true OR public.is_any_admin(auth.uid()));
CREATE POLICY "Admins manage app_settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

REVOKE ALL ON public.app_settings FROM anon;
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- candidate_profiles
DROP POLICY IF EXISTS "Anon admin full access on candidate_profiles" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Authenticated admin full access on candidate_profiles" ON public.candidate_profiles;
DROP POLICY IF EXISTS "anon_full_access_candidate_profiles" ON public.candidate_profiles;

CREATE POLICY "Admins view all candidate_profiles" ON public.candidate_profiles
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Admins manage candidate_profiles" ON public.candidate_profiles
  FOR ALL TO authenticated
  USING (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

REVOKE ALL ON public.candidate_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;

-- candidate_documents
DROP POLICY IF EXISTS "Anon admin full access on candidate_documents" ON public.candidate_documents;
DROP POLICY IF EXISTS "Authenticated admin full access on candidate_documents" ON public.candidate_documents;

CREATE POLICY "Admins view candidate_documents" ON public.candidate_documents
  FOR ALL TO authenticated
  USING (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

REVOKE ALL ON public.candidate_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_documents TO authenticated;
GRANT ALL ON public.candidate_documents TO service_role;

-- candidate_certifications
DROP POLICY IF EXISTS "Anon admin full access on certifications" ON public.candidate_certifications;
DROP POLICY IF EXISTS "Authenticated admin full access on certifications" ON public.candidate_certifications;
CREATE POLICY "Admins manage certifications" ON public.candidate_certifications
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_certifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_certifications TO authenticated;
GRANT ALL ON public.candidate_certifications TO service_role;

-- candidate_education_detail
DROP POLICY IF EXISTS "Anon admin full access on education" ON public.candidate_education_detail;
DROP POLICY IF EXISTS "Authenticated admin full access on education" ON public.candidate_education_detail;
CREATE POLICY "Admins manage education_detail" ON public.candidate_education_detail
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_education_detail FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_education_detail TO authenticated;
GRANT ALL ON public.candidate_education_detail TO service_role;

-- candidate_education_history
DROP POLICY IF EXISTS "Anon admin full access on education history" ON public.candidate_education_history;
DROP POLICY IF EXISTS "Authenticated admin full access on education history" ON public.candidate_education_history;
CREATE POLICY "Admins manage education_history" ON public.candidate_education_history
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_education_history FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_education_history TO authenticated;
GRANT ALL ON public.candidate_education_history TO service_role;

-- candidate_family_members
DROP POLICY IF EXISTS "Anon admin full access on family members" ON public.candidate_family_members;
DROP POLICY IF EXISTS "Authenticated admin full access on family members" ON public.candidate_family_members;
CREATE POLICY "Admins manage family_members" ON public.candidate_family_members
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_family_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_family_members TO authenticated;
GRANT ALL ON public.candidate_family_members TO service_role;

-- candidate_informal_education
DROP POLICY IF EXISTS "Anon admin full access on informal education" ON public.candidate_informal_education;
DROP POLICY IF EXISTS "Authenticated admin full access on informal education" ON public.candidate_informal_education;
CREATE POLICY "Admins manage informal_education" ON public.candidate_informal_education
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_informal_education FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_informal_education TO authenticated;
GRANT ALL ON public.candidate_informal_education TO service_role;

-- candidate_languages
DROP POLICY IF EXISTS "Anon admin full access on languages" ON public.candidate_languages;
DROP POLICY IF EXISTS "Authenticated admin full access on languages" ON public.candidate_languages;
CREATE POLICY "Admins manage languages" ON public.candidate_languages
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
REVOKE ALL ON public.candidate_languages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_languages TO authenticated;
GRANT ALL ON public.candidate_languages TO service_role;

-- candidate_work_experience (may or may not have anon policies)
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.candidate_work_experience') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='candidate_work_experience' AND policyname ILIKE '%anon%admin%' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidate_work_experience', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='candidate_work_experience' AND policyname ILIKE '%Authenticated admin full access%' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidate_work_experience', pol.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Admins manage work_experience" ON public.candidate_work_experience FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))';
    EXECUTE 'REVOKE ALL ON public.candidate_work_experience FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_work_experience TO authenticated';
    EXECUTE 'GRANT ALL ON public.candidate_work_experience TO service_role';
  END IF;
END $$;

-- candidates table
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.candidates') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='candidates' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidates', pol.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Admins manage candidates" ON public.candidates FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))';
    -- Service role bypasses RLS but explicit grant
    EXECUTE 'REVOKE ALL ON public.candidates FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated';
    EXECUTE 'GRANT ALL ON public.candidates TO service_role';
  END IF;
END $$;

-- job_applications
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.job_applications') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND (policyname ILIKE '%anon%' OR policyname ILIKE '%Authenticated admin full access%' OR policyname ILIKE '%full access%') LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_applications', pol.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Users view own applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Users insert own applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users update own applications" ON public.job_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_any_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Admins delete applications" ON public.job_applications FOR DELETE TO authenticated USING (public.is_any_admin(auth.uid()))';
    EXECUTE 'REVOKE ALL ON public.job_applications FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated';
    EXECUTE 'GRANT ALL ON public.job_applications TO service_role';
  END IF;
END $$;

-- test_result_details: drop permissive ALL-true policy, add owner/admin
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.test_result_details') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='test_result_details' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.test_result_details', pol.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Admins read test_result_details" ON public.test_result_details FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Admins manage test_result_details" ON public.test_result_details FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))';
    EXECUTE 'GRANT ALL ON public.test_result_details TO service_role';
  END IF;
END $$;

-- ============================================================
-- PART 2: Hash activation_codes plaintext passwords with bcrypt
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Only hash rows that look like plaintext (not already a bcrypt hash starting with $2)
UPDATE public.activation_codes
SET password = crypt(password, gen_salt('bf', 10))
WHERE password IS NOT NULL
  AND password NOT LIKE '$2%';

-- ============================================================
-- PART 3: Storage bucket policies
-- ============================================================

-- candidate-documents: drop anon, restrict to owner folder + admins
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%candidate%document%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Owners read candidate-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));
CREATE POLICY "Owners upload candidate-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update candidate-documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));
CREATE POLICY "Owners delete candidate-documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));

-- candidate-photos: add ownership check on writes (keep public read since bucket is public)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%candidate%photo%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read candidate-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'candidate-photos');
CREATE POLICY "Owners upload candidate-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update candidate-photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));
CREATE POLICY "Owners delete candidate-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));

-- test-images: only admins can write; public can read (bucket is public)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%test%image%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read test-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'test-images');
CREATE POLICY "Admins upload test-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'test-images' AND public.is_any_admin(auth.uid()));
CREATE POLICY "Admins update test-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'test-images' AND public.is_any_admin(auth.uid()));
CREATE POLICY "Admins delete test-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'test-images' AND public.is_any_admin(auth.uid()));

-- ============================================================
-- PART 4: Function hardening - search_path + revoke execute
-- ============================================================

-- Set search_path on functions that may be missing it
ALTER FUNCTION public.admin_list_users() SET search_path = public;
ALTER FUNCTION public.handle_new_candidate_user() SET search_path = public;

-- Revoke EXECUTE on sensitive admin functions from anon/authenticated (service_role keeps it)
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_candidate_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_activate_candidate_login(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_candidate_account(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_candidate_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_activate_candidate_login(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_candidate_account(text) TO service_role;
