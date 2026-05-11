-- ============================================
-- ENHANCE CANDIDATE PROFILES - PHC FORMAT
-- ============================================

-- Add new columns for more comprehensive profile (PHC format style)
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS nik TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS npwp TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS shirt_size TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pants_size TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS shoe_size TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS vehicle_license TEXT DEFAULT '', -- SIM
  ADD COLUMN IF NOT EXISTS has_vehicle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS father_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS mother_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS spouse_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medical_history TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_info TEXT DEFAULT '', -- How they found out about the job
  ADD COLUMN IF NOT EXISTS willing_relocate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS willing_overtime BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS willing_shift BOOLEAN DEFAULT false;

-- Add work experience table (for detailed employment history)
CREATE TABLE IF NOT EXISTS public.candidate_work_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  salary BIGINT,
  job_description TEXT DEFAULT '',
  reason_leaving TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own work experience" ON public.candidate_work_experience
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own work experience" ON public.candidate_work_experience
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own work experience" ON public.candidate_work_experience
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Candidates can delete own work experience" ON public.candidate_work_experience
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on work experience" ON public.candidate_work_experience
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on work experience" ON public.candidate_work_experience
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_candidate_work_experience_updated_at
  BEFORE UPDATE ON public.candidate_work_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add education detail table (for detailed education history)
CREATE TABLE IF NOT EXISTS public.candidate_education_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT '', -- SD, SMP, SMA, D3, S1, S2, S3
  institution_name TEXT NOT NULL DEFAULT '',
  major TEXT DEFAULT '',
  city TEXT DEFAULT '',
  start_year INTEGER,
  end_year INTEGER,
  gpa NUMERIC(3,2),
  is_graduated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_education_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own education" ON public.candidate_education_detail
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own education" ON public.candidate_education_detail
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own education" ON public.candidate_education_detail
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Candidates can delete own education" ON public.candidate_education_detail
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on education" ON public.candidate_education_detail
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on education" ON public.candidate_education_detail
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_candidate_education_detail_updated_at
  BEFORE UPDATE ON public.candidate_education_detail
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add certifications table
CREATE TABLE IF NOT EXISTS public.candidate_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL DEFAULT '',
  issuing_organization TEXT DEFAULT '',
  issue_date DATE,
  expiry_date DATE,
  certificate_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own certifications" ON public.candidate_certifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own certifications" ON public.candidate_certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own certifications" ON public.candidate_certifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Candidates can delete own certifications" ON public.candidate_certifications
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on certifications" ON public.candidate_certifications
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on certifications" ON public.candidate_certifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_candidate_certifications_updated_at
  BEFORE UPDATE ON public.candidate_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add languages table
CREATE TABLE IF NOT EXISTS public.candidate_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT '',
  spoken_level TEXT DEFAULT '', -- Beginner, Intermediate, Advanced, Native
  written_level TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own languages" ON public.candidate_languages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own languages" ON public.candidate_languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own languages" ON public.candidate_languages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Candidates can delete own languages" ON public.candidate_languages
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on languages" ON public.candidate_languages
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on languages" ON public.candidate_languages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidate_work_experience_user ON public.candidate_work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_education_user ON public.candidate_education_detail(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_certifications_user ON public.candidate_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_languages_user ON public.candidate_languages(user_id);
