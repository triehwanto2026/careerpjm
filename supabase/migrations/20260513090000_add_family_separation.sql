-- Add separate columns for family and immediate family data
-- This migration separates the family data into two distinct fields
-- for better data organization and management

-- Add new columns for separated family data
ALTER TABLE candidate_profiles 
ADD COLUMN family_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN immediate_family_data JSONB DEFAULT '[]'::jsonb;

-- Migrate existing family_members data to new structure
-- Split existing family data based on relationship types
UPDATE candidate_profiles 
SET 
  family_data = COALESCE(
    (
      SELECT JSON_AGG(
        jsonb_build_object(
          'relation', member->>'relation',
          'name', member->>'name',
          'gender', member->>'gender',
          'age', member->>'age',
          'education', member->>'education',
          'occupation', member->>'occupation',
          'company', member->>'company'
        )
      )
      FROM jsonb_array_elements(family_members) AS member
      WHERE member->>'relation' IN ('Bapak', 'Ibu', 'Ayah', 'Saudara', 'Kakak', 'Adik')
    ),
    '[]'::jsonb
  ),
  immediate_family_data = COALESCE(
    (
      SELECT JSON_AGG(
        jsonb_build_object(
          'relation', member->>'relation',
          'name', member->>'name',
          'gender', member->>'gender',
          'age', member->>'age',
          'education', member->>'education',
          'occupation', member->>'occupation',
          'company', member->>'company'
        )
      )
      FROM jsonb_array_elements(family_members) AS member
      WHERE member->>'relation' IN ('Suami', 'Istri', 'Anak')
    ),
    '[]'::jsonb
  )
WHERE family_members IS NOT NULL AND jsonb_typeof(family_members::jsonb) = 'array';

-- Create indexes for better query performance
CREATE INDEX idx_candidate_profiles_family_data ON candidate_profiles USING GIN (family_data);
CREATE INDEX idx_candidate_profiles_immediate_family_data ON candidate_profiles USING GIN (immediate_family_data);

-- Add comments to document the new columns
COMMENT ON COLUMN candidate_profiles.family_data IS 'Family data for Bapak, Ibu, and Saudara relationships';
COMMENT ON COLUMN candidate_profiles.immediate_family_data IS 'Immediate family data for Suami, Istri, and Anak relationships';

-- Set default values for existing records that don't have family_members
UPDATE candidate_profiles 
SET 
  family_data = '[]'::jsonb,
  immediate_family_data = '[]'::jsonb
WHERE family_data IS NULL OR immediate_family_data IS NULL;
