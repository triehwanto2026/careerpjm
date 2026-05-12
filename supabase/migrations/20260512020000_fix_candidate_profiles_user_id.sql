-- Fix user_id constraint in candidate_profiles table
-- Make user_id nullable to allow candidate creation without auth user

-- First, drop the foreign key constraint
ALTER TABLE candidate_profiles DROP CONSTRAINT IF EXISTS candidate_profiles_user_id_fkey;

-- Make user_id column nullable
ALTER TABLE candidate_profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add back the foreign key constraint but make it optional
ALTER TABLE candidate_profiles 
ADD CONSTRAINT candidate_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add comment explaining the change
COMMENT ON COLUMN candidate_profiles.user_id IS 'Optional reference to auth.users. Can be null for candidates created without auth user.';
