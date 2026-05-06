-- Check if columns exist and have data
-- Run this in Supabase SQL Editor

-- 1. Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_questions' 
AND column_name IN ('question_image', 'options_image', 'image_url');

-- 2. Check IST questions 117-136 image status
SELECT 
  question_number,
  CASE WHEN question_image IS NOT NULL THEN 'YES' ELSE 'NO' END as has_question_image,
  CASE WHEN options_image IS NOT NULL THEN 'YES' ELSE 'NO' END as has_options_image,
  CASE WHEN image_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_image_url,
  LEFT(question_image, 50) as question_image_preview,
  LEFT(options_image, 50) as options_image_preview
FROM test_questions
WHERE instrument_id = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c'
AND question_number BETWEEN 117 AND 136
ORDER BY question_number;
