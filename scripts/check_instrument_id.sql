-- Cek instrument_id Kraepelin
SELECT 
  id,
  name,
  question_count,
  duration_minutes
FROM test_instruments
WHERE name ILIKE '%Kraepelin%';

-- Cek apakah ada instrument duplikat dengan nama berbeda
SELECT 
  id,
  name,
  question_count,
  scoring_method
FROM test_instruments
WHERE scoring_method = 'speed_accuracy'
ORDER BY created_at DESC;
