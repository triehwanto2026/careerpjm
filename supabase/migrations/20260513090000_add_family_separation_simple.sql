-- Add separate columns for family and immediate family data
-- Simple version without complex data migration

-- Add new columns for separated family data
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS family_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS immediate_family_data JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_family_data ON candidate_profiles USING GIN (family_data);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_immediate_family_data ON candidate_profiles USING GIN (immediate_family_data);

-- Add comments to document the new columns
COMMENT ON COLUMN candidate_profiles.family_data IS 'Family data for Bapak, Ibu, and Saudara relationships';
COMMENT ON COLUMN candidate_profiles.immediate_family_data IS 'Immediate family data for Suami, Istri, and Anak relationships';

-- Set default values for existing records
UPDATE candidate_profiles 
SET 
  family_data = COALESCE(family_data, '[]'::jsonb),
  immediate_family_data = COALESCE(immediate_family_data, '[]'::jsonb)
WHERE family_data IS NULL OR immediate_family_data IS NULL;
