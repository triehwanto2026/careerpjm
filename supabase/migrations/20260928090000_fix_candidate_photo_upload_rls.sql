-- Fix candidate photo/document upload RLS so candidates can manage their own rows
-- This resolves: "new row violates row-level security policy" when uploading profile photo.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  -- Clean up stale candidate-related policies on core tables.
  IF to_regclass('public.candidate_profiles') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidate_profiles', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Candidates manage own candidate_profiles" ON public.candidate_profiles
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "Admins manage candidate_profiles" ON public.candidate_profiles
      FOR ALL TO authenticated
      USING (public.is_any_admin(auth.uid()))
      WITH CHECK (public.is_any_admin(auth.uid()))';

    EXECUTE 'REVOKE ALL ON public.candidate_profiles FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated';
    EXECUTE 'GRANT ALL ON public.candidate_profiles TO service_role';
  END IF;
END $$;

DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.candidate_documents') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_documents' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidate_documents', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Candidates manage own candidate_documents" ON public.candidate_documents
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "Admins manage candidate_documents" ON public.candidate_documents
      FOR ALL TO authenticated
      USING (public.is_any_admin(auth.uid()))
      WITH CHECK (public.is_any_admin(auth.uid()))';

    EXECUTE 'REVOKE ALL ON public.candidate_documents FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_documents TO authenticated';
    EXECUTE 'GRANT ALL ON public.candidate_documents TO service_role';
  END IF;
END $$;

DO $$
DECLARE pol record;
BEGIN
  -- Remove all conflicting storage policies for candidate uploads before recreating them.
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND (
    policyname ILIKE '%candidate%' OR policyname ILIKE '%candidate-photos%' OR policyname ILIKE '%candidate-documents%'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Candidates read own candidate-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));

CREATE POLICY "Candidates upload own candidate-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates update own candidate-documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())))
  WITH CHECK (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates delete own candidate-documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));

CREATE POLICY "Public read candidate-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'candidate-photos');

CREATE POLICY "Candidates upload own candidate-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates update own candidate-photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())))
  WITH CHECK (bucket_id = 'candidate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates delete own candidate-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_any_admin(auth.uid())));

CREATE POLICY "Admins manage candidate-documents storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'candidate-documents' AND public.is_any_admin(auth.uid()))
  WITH CHECK (bucket_id = 'candidate-documents' AND public.is_any_admin(auth.uid()));

CREATE POLICY "Admins manage candidate-photos storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'candidate-photos' AND public.is_any_admin(auth.uid()))
  WITH CHECK (bucket_id = 'candidate-photos' AND public.is_any_admin(auth.uid()));
