-- Cek jumlah soal dan kolom Kraepelin di database
SELECT 
  i.name as instrument_name,
  i.question_count as configured_count,
  COUNT(q.id) as actual_question_count,
  COUNT(DISTINCT q.group_number) as column_count,
  MAX(q.question_number) as max_question_number
FROM test_instruments i
LEFT JOIN test_questions q ON i.id = q.instrument_id
WHERE i.name ILIKE '%Kraepelin%'
GROUP BY i.id, i.name, i.question_count
ORDER BY i.created_at DESC;
