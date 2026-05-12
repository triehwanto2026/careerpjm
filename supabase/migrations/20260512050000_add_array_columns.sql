-- ============================================
-- ADD ARRAY COLUMNS FOR CANDIDATE PROFILE
-- ============================================

-- Add missing JSON array columns for candidate profile data
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS family_members TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS education_history TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS informal_education TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS work_experience TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS languages TEXT DEFAULT '[]';
