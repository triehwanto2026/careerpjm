-- Add used_at column to activation_codes table if it doesn't exist
-- Run this in Supabase SQL Editor

ALTER TABLE activation_codes 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Update existing used codes to have used_at = created_at for now
UPDATE activation_codes 
SET used_at = created_at 
WHERE is_used = true AND used_at IS NULL;
