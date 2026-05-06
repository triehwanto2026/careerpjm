-- Minimal SQL to add image columns
-- Run in Supabase SQL Editor

ALTER TABLE test_questions ADD COLUMN IF NOT EXISTS question_image TEXT;
ALTER TABLE test_questions ADD COLUMN IF NOT EXISTS options_image TEXT;

-- Show result
SELECT 'Columns added successfully' as status;
