-- Add image columns to test_questions table for IST subtest FA (117-136)
-- Run this in Supabase SQL Editor

-- Add question_image column (Gambar 1: soal/pattern)
ALTER TABLE test_questions 
ADD COLUMN IF NOT EXISTS question_image TEXT;

-- Add options_image column (Gambar 2: pilihan jawaban A-E)
ALTER TABLE test_questions 
ADD COLUMN IF NOT EXISTS options_image TEXT;

-- Add comment to document the usage
COMMENT ON COLUMN test_questions.question_image IS 'Gambar soal/pattern untuk subtest visual seperti FA (117-136)';
COMMENT ON COLUMN test_questions.options_image IS 'Gambar pilihan jawaban A-E untuk subtest visual seperti FA (117-136)';

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'test_questions' 
AND column_name IN ('question_image', 'options_image');
