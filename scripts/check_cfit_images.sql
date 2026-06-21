-- Check CFIT 3A question images status
-- Run this in Supabase SQL Editor

-- Get CFIT instrument details
SELECT 
  id, 
  name, 
  name_en, 
  description, 
  category, 
  question_count 
FROM test_instruments 
WHERE id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';

-- Check CFIT questions image status
SELECT 
  question_number,
  CASE WHEN question_image IS NOT NULL THEN 'YES' ELSE 'NO' END as has_question_image,
  CASE WHEN options_image IS NOT NULL THEN 'YES' ELSE 'NO' END as has_options_image,
  CASE WHEN image_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_image_url,
  LEFT(question_image, 50) as question_image_preview,
  LEFT(options_image, 50) as options_image_preview,
  LEFT(image_url, 50) as image_url_preview
FROM test_questions 
WHERE instrument_id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847'
ORDER BY question_number;

-- Summary statistics
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN question_image IS NOT NULL THEN 1 END) as with_question_image,
  COUNT(CASE WHEN options_image IS NOT NULL THEN 1 END) as with_options_image,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_image_url,
  COUNT(CASE WHEN question_image IS NOT NULL OR options_image IS NOT NULL OR image_url IS NOT NULL THEN 1 END) as with_any_image,
  COUNT(CASE WHEN question_image IS NULL AND options_image IS NULL AND image_url IS NULL THEN 1 END) as without_images
FROM test_questions 
WHERE instrument_id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';
