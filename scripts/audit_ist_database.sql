-- AUDIT DATABASE IST
-- Langkah 1: Audit struktur database IST
-- Cek tabel: test_questions, test_question_options, test_answers, test_results

-- 1. Cek instrument IST
SELECT 
  id,
  name,
  name_en,
  category,
  scoring_method,
  question_count
FROM test_instruments
WHERE name ILIKE '%IST%' 
   OR name_en ILIKE '%IST%'
   OR name ILIKE '%Intelligenz%';

-- 2. Total soal per subtes IST
SELECT 
  subtest_code,
  COUNT(*) as total_questions,
  MIN(question_number) as min_number,
  MAX(question_number) as max_number
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'
GROUP BY subtest_code
ORDER BY subtest_code;

-- 3. Cek soal tanpa subtest_code
SELECT 
  q.id,
  q.question_number,
  q.question_text,
  q.subtest_code
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
WHERE (i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%')
  AND (q.subtest_code IS NULL OR q.subtest_code = '');

-- 4. Total kunci jawaban per soal IST
SELECT 
  q.question_number,
  q.subtest_code,
  COUNT(DISTINCT o.id) as total_options,
  COUNT(DISTINCT CASE WHEN o.is_correct = true THEN o.id END) as correct_options,
  COUNT(DISTINCT CASE WHEN o.score_value > 0 THEN o.id END) as scored_options
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
LEFT JOIN test_question_options o ON o.question_id = q.id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'
GROUP BY q.question_number, q.subtest_code
ORDER BY q.question_number;

-- 5. Cek soal tanpa kunci jawaban (tanpa option dengan is_correct=true atau score_value>0)
SELECT 
  q.id,
  q.question_number,
  q.subtest_code,
  q.question_text
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
LEFT JOIN test_question_options o ON o.question_id = q.id
WHERE (i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%')
  AND NOT EXISTS (
    SELECT 1 FROM test_question_options o2 
    WHERE o2.question_id = q.id 
    AND (o2.is_correct = true OR o2.score_value > 0)
  )
ORDER BY q.question_number;

-- 6. Total jawaban peserta per instrument IST
SELECT 
  i.name,
  COUNT(DISTINCT tr.id) as total_results,
  COUNT(DISTINCT ta.id) as total_answers
FROM test_instruments i
LEFT JOIN test_results tr ON tr.instrument_id = i.id
LEFT JOIN test_answers ta ON ta.test_result_id = tr.id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'
GROUP BY i.name, i.id;

-- 7. Cek jawaban ganda (satu soal dijawab lebih dari 1 kali oleh peserta yang sama)
SELECT 
  ta.test_result_id,
  ta.question_id,
  q.question_number,
  q.subtest_code,
  COUNT(*) as answer_count
FROM test_answers ta
JOIN test_questions q ON q.question_id = ta.id
JOIN test_results tr ON tr.id = ta.test_result_id
JOIN test_instruments i ON i.id = tr.instrument_id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'
GROUP BY ta.test_result_id, ta.question_id, q.question_number, q.subtest_code
HAVING COUNT(*) > 1;

-- 8. Distribusi soal IST per nomor (verifikasi 176 soal)
SELECT 
  q.question_number,
  q.subtest_code,
  q.question_type,
  q.scoring_rule,
  COUNT(DISTINCT o.id) as option_count
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
LEFT JOIN test_question_options o ON o.question_id = q.id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'
GROUP BY q.question_number, q.subtest_code, q.question_type, q.scoring_rule
ORDER BY q.question_number;

-- 9. Summary audit
SELECT 
  'Total Instruments IST' as metric,
  COUNT(*) as value
FROM test_instruments
WHERE name ILIKE '%IST%' 
   OR name_en ILIKE '%IST%'
   OR name ILIKE '%Intelligenz%'

UNION ALL

SELECT 
  'Total Questions IST',
  COUNT(*)
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'

UNION ALL

SELECT 
  'Questions with Subtest Code',
  COUNT(*)
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
WHERE (i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%')
  AND q.subtest_code IS NOT NULL 
  AND q.subtest_code != ''

UNION ALL

SELECT 
  'Questions with Answer Keys',
  COUNT(DISTINCT q.id)
FROM test_questions q
JOIN test_instruments i ON i.id = q.instrument_id
WHERE (i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%')
  AND EXISTS (
    SELECT 1 FROM test_question_options o 
    WHERE o.question_id = q.id 
    AND (o.is_correct = true OR o.score_value > 0)
  )

UNION ALL

SELECT 
  'Total Test Results IST',
  COUNT(*)
FROM test_results tr
JOIN test_instruments i ON i.id = tr.instrument_id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%'

UNION ALL

SELECT 
  'Total Test Answers IST',
  COUNT(*)
FROM test_answers ta
JOIN test_results tr ON tr.id = ta.test_result_id
JOIN test_instruments i ON i.id = tr.instrument_id
WHERE i.name ILIKE '%IST%' 
   OR i.name_en ILIKE '%IST%'
   OR i.name ILIKE '%Intelligenz%';
