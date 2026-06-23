-- Cek distribusi soal per kolom Kraepelin
SELECT 
  group_number,
  COUNT(*) as question_count,
  MIN(question_number) as min_q,
  MAX(question_number) as max_q
FROM test_questions 
WHERE instrument_id = 'fed00477-3c19-4d02-b1fb-31a12da87966'
GROUP BY group_number
ORDER BY group_number;
