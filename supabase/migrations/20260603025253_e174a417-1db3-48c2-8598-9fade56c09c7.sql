
-- ============================================================
-- Helper: verify hashed activation code password (used by edge function)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_activation_password(_code text, _password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT password INTO stored FROM public.activation_codes WHERE code = _code LIMIT 1;
  IF stored IS NULL THEN RETURN false; END IF;
  -- bcrypt verify: crypt(plain, hash) = hash when match
  RETURN extensions.crypt(_password, stored) = stored;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_activation_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_activation_password(text, text) TO service_role;

-- Helper: is the given candidate row mine?
CREATE OR REPLACE FUNCTION public.is_my_candidate_id(_candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidates c
    JOIN auth.users u ON lower(u.email) = lower(c.email)
    WHERE c.id = _candidate_id AND u.id = auth.uid()
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_my_candidate_id(uuid) TO authenticated, service_role;

-- Helper: my own auth email lowercased
CREATE OR REPLACE FUNCTION public.my_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.my_email() TO authenticated, service_role;

-- ============================================================
-- activation_codes lockdown
-- ============================================================
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='activation_codes' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.activation_codes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Candidates read own activation code" ON public.activation_codes
  FOR SELECT TO authenticated
  USING (lower(candidate_email) = public.my_email() OR public.is_any_admin(auth.uid()));

CREATE POLICY "Candidates update own activation code" ON public.activation_codes
  FOR UPDATE TO authenticated
  USING (lower(candidate_email) = public.my_email() OR public.is_any_admin(auth.uid()))
  WITH CHECK (lower(candidate_email) = public.my_email() OR public.is_any_admin(auth.uid()));

CREATE POLICY "Admins manage activation codes" ON public.activation_codes
  FOR ALL TO authenticated
  USING (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

REVOKE ALL ON public.activation_codes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activation_codes TO authenticated;
GRANT ALL ON public.activation_codes TO service_role;

-- ============================================================
-- test_sessions lockdown
-- ============================================================
DO $$ DECLARE pol record;
BEGIN
  IF to_regclass('public.test_sessions') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='test_sessions' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.test_sessions', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Candidates manage own test_session" ON public.test_sessions FOR ALL TO authenticated USING (lower(candidate_email) = public.my_email() OR public.is_any_admin(auth.uid())) WITH CHECK (lower(candidate_email) = public.my_email() OR public.is_any_admin(auth.uid()))';

    EXECUTE 'REVOKE ALL ON public.test_sessions FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sessions TO authenticated';
    EXECUTE 'GRANT ALL ON public.test_sessions TO service_role';
  END IF;
END $$;

-- ============================================================
-- candidates table — allow candidate to read/update/insert own row
-- ============================================================
DO $$ DECLARE pol record;
BEGIN
  IF to_regclass('public.candidates') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='candidates' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidates', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Candidates read own row" ON public.candidates FOR SELECT TO authenticated USING (lower(email) = public.my_email() OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Candidates insert own row" ON public.candidates FOR INSERT TO authenticated WITH CHECK (lower(email) = public.my_email() OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Candidates update own row" ON public.candidates FOR UPDATE TO authenticated USING (lower(email) = public.my_email() OR public.is_any_admin(auth.uid())) WITH CHECK (lower(email) = public.my_email() OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Admins delete candidates" ON public.candidates FOR DELETE TO authenticated USING (public.is_any_admin(auth.uid()))';
  END IF;
END $$;

-- ============================================================
-- test_results lockdown
-- ============================================================
DO $$ DECLARE pol record;
BEGIN
  IF to_regclass('public.test_results') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='test_results' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.test_results', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Candidates read own results" ON public.test_results FOR SELECT TO authenticated USING (public.is_my_candidate_id(candidate_id) OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Candidates insert own results" ON public.test_results FOR INSERT TO authenticated WITH CHECK (public.is_my_candidate_id(candidate_id) OR public.is_any_admin(auth.uid()))';
    EXECUTE 'CREATE POLICY "Admins manage results" ON public.test_results FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))';

    EXECUTE 'REVOKE ALL ON public.test_results FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_results TO authenticated';
    EXECUTE 'GRANT ALL ON public.test_results TO service_role';
  END IF;
END $$;

-- ============================================================
-- test_answers lockdown
-- ============================================================
DO $$ DECLARE pol record;
BEGIN
  IF to_regclass('public.test_answers') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='test_answers' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.test_answers', pol.policyname);
    END LOOP;

    EXECUTE $f$
      CREATE POLICY "Candidates read own answers" ON public.test_answers
        FOR SELECT TO authenticated
        USING (EXISTS (
          SELECT 1 FROM public.test_results tr
          WHERE tr.id = test_answers.test_result_id
            AND (public.is_my_candidate_id(tr.candidate_id) OR public.is_any_admin(auth.uid()))
        ))
    $f$;
    EXECUTE $f$
      CREATE POLICY "Candidates insert own answers" ON public.test_answers
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.test_results tr
          WHERE tr.id = test_answers.test_result_id
            AND (public.is_my_candidate_id(tr.candidate_id) OR public.is_any_admin(auth.uid()))
        ))
    $f$;
    EXECUTE 'CREATE POLICY "Admins manage answers" ON public.test_answers FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))';

    EXECUTE 'REVOKE ALL ON public.test_answers FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_answers TO authenticated';
    EXECUTE 'GRANT ALL ON public.test_answers TO service_role';
  END IF;
END $$;

-- ============================================================
-- test_instruments / test_questions / test_question_options
-- Public read (test content) — admins only for writes
-- ============================================================
DO $$ DECLARE pol record; t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['test_instruments','test_questions','test_question_options'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
      END LOOP;
      EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
      EXECUTE format('CREATE POLICY "Admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()))', t);
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
      EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;
