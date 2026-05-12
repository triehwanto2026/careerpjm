-- Admin Roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role_id UUID REFERENCES public.admin_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for admin_roles
CREATE POLICY "Allow authenticated full access on admin_roles"
  ON public.admin_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read admin_roles"
  ON public.admin_roles FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to insert admin_roles"
  ON public.admin_roles FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update admin_roles"
  ON public.admin_roles FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete admin_roles"
  ON public.admin_roles FOR DELETE TO anon USING (true);

-- Policies for admin_users
CREATE POLICY "Allow authenticated full access on admin_users"
  ON public.admin_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read admin_users for login"
  ON public.admin_users FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to insert admin_users"
  ON public.admin_users FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update admin_users"
  ON public.admin_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete admin_users"
  ON public.admin_users FOR DELETE TO anon USING (true);

-- Update timestamp triggers
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Super Admin role with all permissions
INSERT INTO public.admin_roles (name, description, permissions) VALUES (
  'Super Admin',
  'Akses penuh ke semua halaman dan fitur',
  '[
    "/admin/dashboard",
    "/admin/activation-codes",
    "/admin/test-instruments",
    "/admin/candidates",
    "/admin/results",
    "/admin/answer-keys",
    "/admin/interpretations",
INSERT INTO public.admin_roles (name, description, permissions) 
SELECT 'Super Admin', 'Full system access with all permissions', '[
    "/admin/dashboard",
    "/admin/candidates",
    "/admin/results",
    "/admin/settings",
    "/admin/users",
    "/admin/roles",
    "/admin/jobs",
    "/admin/applications",
    "/admin/process"
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE name = 'Super Admin');

INSERT INTO public.admin_roles (name, description, permissions) 
SELECT 'Admin', 'Administrative access with limited permissions', '[
    "/admin/dashboard",
    "/admin/candidates",
    "/admin/results",
    "/admin/jobs",
    "/admin/applications",
    "/admin/process"
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE name = 'Admin');

INSERT INTO public.admin_roles (name, description, permissions) 
SELECT 'Viewer', 'Hanya dapat melihat hasil dan kandidat', '[
    "/admin/dashboard",
    "/admin/candidates",
    "/admin/results"
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE name = 'Viewer');

-- Insert default Super Admin user (password: admin123) (only if not exists)
-- Password hash generated with simple SHA-256 for demo: admin123
INSERT INTO public.admin_users (username, email, password_hash, full_name, role_id, is_active) 
SELECT 'superadmin', 'superadmin@psytest.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Super Administrator', 
  (SELECT id FROM public.admin_roles WHERE name = 'Super Admin'), true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_users WHERE username = 'superadmin');
