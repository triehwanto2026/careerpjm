-- Fix RLS policies only (tables already exist)
-- Run this in Supabase Dashboard SQL Editor

-- ============================================
-- FIX RLS FOR admin_roles
-- ============================================

-- Drop existing anon policies if any
DROP POLICY IF EXISTS "Allow anon to insert admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to update admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to delete admin_roles" ON public.admin_roles;

-- Create new anon policies
CREATE POLICY "Allow anon to insert admin_roles"
  ON public.admin_roles FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update admin_roles"
  ON public.admin_roles FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete admin_roles"
  ON public.admin_roles FOR DELETE TO anon USING (true);

-- ============================================
-- FIX RLS FOR admin_users
-- ============================================

-- Drop existing anon policies if any
DROP POLICY IF EXISTS "Allow anon to insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to delete admin_users" ON public.admin_users;

-- Create new anon policies
CREATE POLICY "Allow anon to insert admin_users"
  ON public.admin_users FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update admin_users"
  ON public.admin_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete admin_users"
  ON public.admin_users FOR DELETE TO anon USING (true);

-- Verify policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('admin_roles', 'admin_users')
ORDER BY tablename, policyname;
