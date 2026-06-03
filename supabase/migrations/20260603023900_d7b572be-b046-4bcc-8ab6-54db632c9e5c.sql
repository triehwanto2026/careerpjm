-- Phase 1.1: Role infrastructure for Supabase Auth-based admin access

-- 1. App role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'hr', 'recruiter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Grants (auth-only; read via has_role security definer)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 4. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Security-definer role checker (no recursion since it bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Helper: is_any_admin (any privileged role)
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'hr', 'recruiter')
  )
$$;

-- 7. Restrict EXECUTE: only authenticated callers (still bypasses RLS via definer)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_any_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_any_admin(UUID) TO authenticated, service_role;

-- 8. RLS policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 9. Harden existing functions missing search_path (lint fix)
CREATE OR REPLACE FUNCTION public.update_status_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_application_status_flow()
RETURNS TABLE(status_value TEXT, status_label TEXT, status_order INTEGER)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'applied'::TEXT, 'Lamaran Diterima'::TEXT, 1
  UNION ALL SELECT 'screening'::TEXT, 'Screening CV'::TEXT, 2
  UNION ALL SELECT 'interview'::TEXT, 'Wawancara'::TEXT, 3
  UNION ALL SELECT 'offer'::TEXT, 'Penawaran'::TEXT, 4
  UNION ALL SELECT 'hired'::TEXT, 'Diterima'::TEXT, 5
  UNION ALL SELECT 'rejected'::TEXT, 'Ditolak'::TEXT, 6
  ORDER BY 3;
END;
$$;

-- 10. Lock down existing admin RPCs (these should only run via service role / edge functions)
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_candidate_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_activate_candidate_login(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_candidate_account(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_candidate_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_activate_candidate_login(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_candidate_account(TEXT) TO service_role;