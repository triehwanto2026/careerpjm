-- Cek instrument Kraepelin duplikat
SELECT 
  id,
  name,
  question_count,
  duration_minutes,
  is_active,
  created_at
FROM test_instruments
WHERE name ILIKE '%Kraepelin%'
ORDER BY created_at DESC;
