-- ============================================
-- FIX MISSING COLUMNS FOR CANDIDATE PROFILE
-- ============================================

-- Add missing ethnicity column if it doesn't exist
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS ethnicity TEXT DEFAULT '';

-- Add BPJS fields if they don't exist
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS bpjs_kesehatan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS alamat_domisili TEXT DEFAULT '';

-- Add other missing fields if they don't exist
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS birth_place TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS province TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indonesia',
  ADD COLUMN IF NOT EXISTS home_ownership TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS home_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_activities TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS salary_expectation TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS salary_exp_base TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS salary_exp_allowances TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS salary_exp_benefits TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS education_major TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS education_institution TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS education_year INTEGER,
  ADD COLUMN IF NOT EXISTS gpa NUMERIC,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_position TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_company TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_salary BIGINT,
  ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS vehicle_brand TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS strengths TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS weaknesses TEXT DEFAULT '';

-- Update existing records with default values
UPDATE public.candidate_profiles SET 
  ethnicity = COALESCE(ethnicity, ''),
  bpjs_kesehatan = COALESCE(bpjs_kesehatan, ''),
  bpjs_ketenagakerjaan = COALESCE(bpjs_ketenagakerjaan, ''),
  alamat_domisili = COALESCE(alamat_domisili, ''),
  nickname = COALESCE(nickname, ''),
  birth_place = COALESCE(birth_place, ''),
  city = COALESCE(city, ''),
  province = COALESCE(province, ''),
  postal_code = COALESCE(postal_code, ''),
  marital_status = COALESCE(marital_status, ''),
  religion = COALESCE(religion, ''),
  nationality = COALESCE(nationality, 'Indonesia'),
  home_ownership = COALESCE(home_ownership, ''),
  home_phone = COALESCE(home_phone, ''),
  social_activities = COALESCE(social_activities, ''),
  salary_expectation = COALESCE(salary_expectation, ''),
  salary_exp_base = COALESCE(salary_exp_base, ''),
  salary_exp_allowances = COALESCE(salary_exp_allowances, ''),
  salary_exp_benefits = COALESCE(salary_exp_benefits, ''),
  education_level = COALESCE(education_level, ''),
  education_major = COALESCE(education_major, ''),
  education_institution = COALESCE(education_institution, ''),
  gpa = COALESCE(gpa, NULL),
  experience_years = COALESCE(experience_years, 0),
  current_position = COALESCE(current_position, ''),
  current_company = COALESCE(current_company, ''),
  expected_salary = COALESCE(expected_salary, NULL),
  skills = COALESCE(skills, ''),
  bio = COALESCE(bio, ''),
  photo_url = COALESCE(photo_url, NULL),
  linkedin_url = COALESCE(linkedin_url, NULL),
  is_complete = COALESCE(is_complete, false),
  vehicle_type = COALESCE(vehicle_type, ''),
  vehicle_brand = COALESCE(vehicle_brand, ''),
  strengths = COALESCE(strengths, ''),
  weaknesses = COALESCE(weaknesses, '')
WHERE ethnicity IS NULL OR bpjs_kesehatan IS NULL OR bpjs_ketenagakerjaan IS NULL OR alamat_domisili IS NULL OR strengths IS NULL OR weaknesses IS NULL;
