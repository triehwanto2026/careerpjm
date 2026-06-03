
-- Fix permissive RLS policies (ALL with true) — restrict writes to admins only
DROP POLICY IF EXISTS "Anon admin full access on job_vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Authenticated admin full access on job_vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Anon admin full access on skills" ON public.candidate_skills;
DROP POLICY IF EXISTS "Authenticated admin full access on skills" ON public.candidate_skills;
DROP POLICY IF EXISTS "Allow authenticated full access on test_interpretations" ON public.test_interpretations;

-- test_interpretations: keep public SELECT, restrict writes to admins
CREATE POLICY "Admins can insert test_interpretations"
ON public.test_interpretations FOR INSERT TO authenticated
WITH CHECK (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can update test_interpretations"
ON public.test_interpretations FOR UPDATE TO authenticated
USING (public.is_any_admin(auth.uid()))
WITH CHECK (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete test_interpretations"
ON public.test_interpretations FOR DELETE TO authenticated
USING (public.is_any_admin(auth.uid()));

-- candidate_skills: admin can manage all (writes), candidate-owner policies already exist
CREATE POLICY "Admins can manage all candidate_skills"
ON public.candidate_skills FOR ALL TO authenticated
USING (public.is_any_admin(auth.uid()))
WITH CHECK (public.is_any_admin(auth.uid()));

-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions that should not be world-callable
REVOKE EXECUTE ON FUNCTION public.handle_new_candidate_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_activation_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_activation_password(text, text) TO service_role;

-- is_my_candidate_id and my_email are used inside RLS — restrict to authenticated only (no anon)
REVOKE EXECUTE ON FUNCTION public.is_my_candidate_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_my_candidate_id(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.my_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_email() TO authenticated, service_role;

-- has_role / is_any_admin: needed for RLS checks by authenticated users
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_any_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_any_admin(uuid) TO authenticated, service_role;
