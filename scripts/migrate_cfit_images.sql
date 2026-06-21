-- Migrate CFIT 3A images from old image_url to new question_image field
-- Run this in Supabase SQL Editor

-- Update CFIT 3A questions: copy image_url to question_image
UPDATE test_questions 
SET question_image = image_url
WHERE instrument_id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847'
  AND image_url IS NOT NULL
  AND question_image IS NULL;

-- Verify the migration
SELECT 
  question_number,
  CASE WHEN question_image IS NOT NULL THEN 'YES' ELSE 'NO' END as has_question_image,
  CASE WHEN image_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_image_url,
  LEFT(question_image, 50) as question_image_preview,
  LEFT(image_url, 50) as image_url_preview
FROM test_questions 
WHERE instrument_id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847'
ORDER BY question_number
LIMIT 10;

-- Summary after migration
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN question_image IS NOT NULL THEN 1 END) as with_question_image,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_image_url
FROM test_questions 
WHERE instrument_id = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';
