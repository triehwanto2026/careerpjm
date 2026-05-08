
-- ============================================
-- CANDIDATE PROFILES
-- ============================================
CREATE TABLE public.candidate_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  birth_place TEXT DEFAULT '',
  birth_date DATE,
  gender TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  province TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  marital_status TEXT DEFAULT '',
  religion TEXT DEFAULT '',
  nationality TEXT DEFAULT 'Indonesia',
  education_level TEXT DEFAULT '',
  education_major TEXT DEFAULT '',
  education_institution TEXT DEFAULT '',
  education_year INTEGER,
  gpa NUMERIC(3,2),
  experience_years INTEGER DEFAULT 0,
  current_position TEXT DEFAULT '',
  current_company TEXT DEFAULT '',
  expected_salary BIGINT,
  skills TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT,
  linkedin_url TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own profile" ON public.candidate_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own profile" ON public.candidate_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own profile" ON public.candidate_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on candidate_profiles" ON public.candidate_profiles
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on candidate_profiles" ON public.candidate_profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CANDIDATE DOCUMENTS
-- ============================================
CREATE TABLE public.candidate_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- cv, ktp, photo, ijazah, transkrip
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own documents" ON public.candidate_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own documents" ON public.candidate_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own documents" ON public.candidate_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Candidates can delete own documents" ON public.candidate_documents
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on candidate_documents" ON public.candidate_documents
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on candidate_documents" ON public.candidate_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_candidate_documents_user ON public.candidate_documents(user_id);

-- ============================================
-- JOB VACANCIES
-- ============================================
CREATE TABLE public.job_vacancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract, internship
  description TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  responsibilities TEXT DEFAULT '',
  min_salary BIGINT,
  max_salary BIGINT,
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, draft
  posted_by UUID,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open vacancies" ON public.job_vacancies
  FOR SELECT USING (status = 'open' OR status = 'closed');
CREATE POLICY "Anon admin full access on job_vacancies" ON public.job_vacancies
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on job_vacancies" ON public.job_vacancies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_job_vacancies_updated_at
  BEFORE UPDATE ON public.job_vacancies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- JOB APPLICATIONS
-- ============================================
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, screening, test, interview, offered, accepted, rejected, withdrawn
  cover_letter TEXT DEFAULT '',
  admin_notes TEXT DEFAULT '',
  activation_code_id UUID,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vacancy_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates can insert own applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates can update own applications status" ON public.job_applications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anon admin full access on job_applications" ON public.job_applications
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated admin full access on job_applications" ON public.job_applications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_vacancy ON public.job_applications(vacancy_id);

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_candidate_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.candidate_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_candidate
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_candidate_user();

-- ============================================
-- STORAGE BUCKET FOR CANDIDATE DOCUMENTS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Candidates can view own documents storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can upload own documents storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can update own documents storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can delete own documents storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated admin can read all candidate documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-documents');

CREATE POLICY "Anon admin can read all candidate documents"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'candidate-documents');
