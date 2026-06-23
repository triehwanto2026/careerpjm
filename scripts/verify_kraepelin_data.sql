-- Verifikasi data Kraepelin setelah rebuild
SELECT 
  COUNT(*) as total_questions,
  COUNT(DISTINCT group_number) as total_columns,
  MAX(question_number) as max_question_number,
  MIN(question_number) as min_question_number
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%Kraepelin%' LIMIT 1);

-- Cek sampel data
SELECT 
  question_number,
  group_number,
  question_text
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%Kraepelin%' LIMIT 1)
ORDER BY question_number
LIMIT 10;
