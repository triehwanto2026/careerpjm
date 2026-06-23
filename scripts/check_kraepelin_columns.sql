-- Cek distribusi kolom Kraepelin
SELECT 
  group_number,
  COUNT(*) as question_count
FROM test_questions 
WHERE instrument_id = 'fed00477-3c19-4d02-b1fb-31a12da87966'
GROUP BY group_number
ORDER BY group_number;

-- Cek total
SELECT 
  COUNT(*) as total_questions,
  COUNT(DISTINCT group_number) as total_columns,
  MAX(question_number) as max_question_number
FROM test_questions 
WHERE instrument_id = 'fed00477-3c19-4d02-b1fb-31a12da87966';
