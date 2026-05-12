-- ============================================
-- ADD CANDIDATE PROFILE TABLES - PHC FORMAT
-- ============================================

-- Add BPJS fields to candidate_profiles table
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS bpjs_kesehatan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS alamat_domisili TEXT DEFAULT '';

-- Create family members table
CREATE TABLE IF NOT EXISTS public.candidate_family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  gender TEXT DEFAULT '',
  age INTEGER DEFAULT NULL,
  education TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  company TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create education history table
CREATE TABLE IF NOT EXISTS public.candidate_education_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  major TEXT DEFAULT '',
  start_year INTEGER DEFAULT NULL,
  end_year INTEGER DEFAULT NULL,
  grade TEXT DEFAULT '',
  status TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create informal education table
CREATE TABLE IF NOT EXISTS public.candidate_informal_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  institution TEXT DEFAULT '',
  year INTEGER DEFAULT NULL,
  certificate TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work experience table
CREATE TABLE IF NOT EXISTS public.candidate_work_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  position_start TEXT NOT NULL DEFAULT '',
  position_end TEXT DEFAULT '',
  salary_start TEXT DEFAULT '',
  salary_end TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  job_description TEXT DEFAULT '',
  supervisor_name TEXT DEFAULT '',
  supervisor_position TEXT DEFAULT '',
  supervisor_phone TEXT DEFAULT '',
  reason_leaving TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  level TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create languages table
CREATE TABLE IF NOT EXISTS public.candidate_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  level TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS policies
ALTER TABLE public.candidate_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_informal_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family members
DROP POLICY IF EXISTS "Candidates can view own family members" ON public.candidate_family_members;
CREATE POLICY "Candidates can view own family members" ON public.candidate_family_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own family members" ON public.candidate_family_members;
CREATE POLICY "Candidates can insert own family members" ON public.candidate_family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own family members" ON public.candidate_family_members;
CREATE POLICY "Candidates can update own family members" ON public.candidate_family_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own family members" ON public.candidate_family_members;
CREATE POLICY "Candidates can delete own family members" ON public.candidate_family_members
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on family members" ON public.candidate_family_members;
CREATE POLICY "Anon admin full access on family members" ON public.candidate_family_members
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on family members" ON public.candidate_family_members;
CREATE POLICY "Authenticated admin full access on family members" ON public.candidate_family_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for education history
DROP POLICY IF EXISTS "Candidates can view own education history" ON public.candidate_education_history;
CREATE POLICY "Candidates can view own education history" ON public.candidate_education_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own education history" ON public.candidate_education_history;
CREATE POLICY "Candidates can insert own education history" ON public.candidate_education_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own education history" ON public.candidate_education_history;
CREATE POLICY "Candidates can update own education history" ON public.candidate_education_history
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own education history" ON public.candidate_education_history;
CREATE POLICY "Candidates can delete own education history" ON public.candidate_education_history
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on education history" ON public.candidate_education_history;
CREATE POLICY "Anon admin full access on education history" ON public.candidate_education_history
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on education history" ON public.candidate_education_history;
CREATE POLICY "Authenticated admin full access on education history" ON public.candidate_education_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for informal education
DROP POLICY IF EXISTS "Candidates can view own informal education" ON public.candidate_informal_education;
CREATE POLICY "Candidates can view own informal education" ON public.candidate_informal_education
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own informal education" ON public.candidate_informal_education;
CREATE POLICY "Candidates can insert own informal education" ON public.candidate_informal_education
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own informal education" ON public.candidate_informal_education;
CREATE POLICY "Candidates can update own informal education" ON public.candidate_informal_education
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own informal education" ON public.candidate_informal_education;
CREATE POLICY "Candidates can delete own informal education" ON public.candidate_informal_education
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on informal education" ON public.candidate_informal_education;
CREATE POLICY "Anon admin full access on informal education" ON public.candidate_informal_education
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on informal education" ON public.candidate_informal_education;
CREATE POLICY "Authenticated admin full access on informal education" ON public.candidate_informal_education
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for work experience
DROP POLICY IF EXISTS "Candidates can view own work experience" ON public.candidate_work_experience;
CREATE POLICY "Candidates can view own work experience" ON public.candidate_work_experience
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own work experience" ON public.candidate_work_experience;
CREATE POLICY "Candidates can insert own work experience" ON public.candidate_work_experience
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own work experience" ON public.candidate_work_experience;
CREATE POLICY "Candidates can update own work experience" ON public.candidate_work_experience
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own work experience" ON public.candidate_work_experience;
CREATE POLICY "Candidates can delete own work experience" ON public.candidate_work_experience
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on work experience" ON public.candidate_work_experience;
CREATE POLICY "Anon admin full access on work experience" ON public.candidate_work_experience
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on work experience" ON public.candidate_work_experience;
CREATE POLICY "Authenticated admin full access on work experience" ON public.candidate_work_experience
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for skills
DROP POLICY IF EXISTS "Candidates can view own skills" ON public.candidate_skills;
CREATE POLICY "Candidates can view own skills" ON public.candidate_skills
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own skills" ON public.candidate_skills;
CREATE POLICY "Candidates can insert own skills" ON public.candidate_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own skills" ON public.candidate_skills;
CREATE POLICY "Candidates can update own skills" ON public.candidate_skills
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own skills" ON public.candidate_skills;
CREATE POLICY "Candidates can delete own skills" ON public.candidate_skills
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on skills" ON public.candidate_skills;
CREATE POLICY "Anon admin full access on skills" ON public.candidate_skills
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on skills" ON public.candidate_skills;
CREATE POLICY "Authenticated admin full access on skills" ON public.candidate_skills
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for languages
DROP POLICY IF EXISTS "Candidates can view own languages" ON public.candidate_languages;
CREATE POLICY "Candidates can view own languages" ON public.candidate_languages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can insert own languages" ON public.candidate_languages;
CREATE POLICY "Candidates can insert own languages" ON public.candidate_languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can update own languages" ON public.candidate_languages;
CREATE POLICY "Candidates can update own languages" ON public.candidate_languages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Candidates can delete own languages" ON public.candidate_languages;
CREATE POLICY "Candidates can delete own languages" ON public.candidate_languages
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon admin full access on languages" ON public.candidate_languages;
CREATE POLICY "Anon admin full access on languages" ON public.candidate_languages
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin full access on languages" ON public.candidate_languages;
CREATE POLICY "Authenticated admin full access on languages" ON public.candidate_languages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_candidate_family_members_updated_at ON public.candidate_family_members;
CREATE TRIGGER update_candidate_family_members_updated_at
  BEFORE UPDATE ON public.candidate_family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_education_history_updated_at ON public.candidate_education_history;
CREATE TRIGGER update_candidate_education_history_updated_at
  BEFORE UPDATE ON public.candidate_education_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_informal_education_updated_at ON public.candidate_informal_education;
CREATE TRIGGER update_candidate_informal_education_updated_at
  BEFORE UPDATE ON public.candidate_informal_education
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_work_experience_updated_at ON public.candidate_work_experience;
CREATE TRIGGER update_candidate_work_experience_updated_at
  BEFORE UPDATE ON public.candidate_work_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_skills_updated_at ON public.candidate_skills;
CREATE TRIGGER update_candidate_skills_updated_at
  BEFORE UPDATE ON public.candidate_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_languages_updated_at ON public.candidate_languages;
CREATE TRIGGER update_candidate_languages_updated_at
  BEFORE UPDATE ON public.candidate_languages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
