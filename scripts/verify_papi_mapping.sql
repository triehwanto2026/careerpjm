-- Helper Script: Verify PAPI Mapping Correctness
-- Run this AFTER applying the migration to ensure everything is correct

-- 1. Check dimension distribution (each should be 9)
SELECT '=== VERIFIKASI MAPPING DISTRIBUTION ===' as header;
SELECT 
  category_target as dimension,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 9 THEN '✓ OK'
    ELSE '❌ ERROR'
  END as status,
  STRING_AGG(DISTINCT CASE WHEN option_label = 'a' THEN 'A' END || CASE WHEN option_label = 'b' THEN 'B' END, '') as options_present
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 90
GROUP BY category_target
ORDER BY category_target;

-- 2. Sample specific questions to verify
SELECT '=== SAMPLE VERIFICATION (Q1-10) ===' as header;
SELECT 
  tq.question_number,
  STRING_AGG(tqo.option_label || ':' || COALESCE(tqo.category_target, 'NULL'), ' | ' ORDER BY tqo.option_label) as mapping,
  CASE 
    WHEN tq.question_number = 1  THEN 'Expected: a:G | b:E'
    WHEN tq.question_number = 2  THEN 'Expected: a:A | b:N'
    WHEN tq.question_number = 3  THEN 'Expected: a:P | b:A'
    WHEN tq.question_number = 4  THEN 'Expected: a:X | b:P'
    WHEN tq.question_number = 5  THEN 'Expected: a:B | b:X'
    WHEN tq.question_number = 6  THEN 'Expected: a:O | b:B'
    WHEN tq.question_number = 7  THEN 'Expected: a:Z | b:O'
    WHEN tq.question_number = 8  THEN 'Expected: a:K | b:Z'
    WHEN tq.question_number = 9  THEN 'Expected: a:F | b:K'
    WHEN tq.question_number = 10 THEN 'Expected: a:W | b:F'
  END as expected
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 10
GROUP BY tq.question_number
ORDER BY tq.question_number;

-- 3. Check for any NULL category_target
SELECT '=== CHECK FOR NULL CATEGORIES ===' as header;
SELECT 
  COUNT(*) as null_count,
  STRING_AGG(DISTINCT tq.question_number::text, ', ') as question_numbers
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 90
  AND (tqo.category_target IS NULL OR TRIM(tqo.category_target) = '');

-- 4. Check score_value and is_correct status
SELECT '=== CHECK SCORE & CORRECT FLAG ===' as header;
SELECT 
  COUNT(*) as total_options,
  COUNT(CASE WHEN score_value = 1 THEN 1 END) as with_score_1,
  COUNT(CASE WHEN score_value != 1 THEN 1 END) as with_other_score,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as marked_correct,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as marked_incorrect,
  COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as null_correct
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 90;

-- 5. Quick mapping check for Q81-90
SELECT '=== SAMPLE VERIFICATION (Q81-90) ===' as header;
SELECT 
  tq.question_number,
  STRING_AGG(tqo.option_label || ':' || COALESCE(tqo.category_target, 'NULL'), ' | ' ORDER BY tqo.option_label) as mapping,
  CASE 
    WHEN tq.question_number = 81 THEN 'Expected: a:G | b:L'
    WHEN tq.question_number = 82 THEN 'Expected: a:L | b:I'
    WHEN tq.question_number = 83 THEN 'Expected: a:I | b:T'
    WHEN tq.question_number = 84 THEN 'Expected: a:T | b:V'
    WHEN tq.question_number = 85 THEN 'Expected: a:V | b:S'
    WHEN tq.question_number = 86 THEN 'Expected: a:S | b:R'
    WHEN tq.question_number = 87 THEN 'Expected: a:R | b:D'
    WHEN tq.question_number = 88 THEN 'Expected: a:D | b:C'
    WHEN tq.question_number = 89 THEN 'Expected: a:C | b:E'
    WHEN tq.question_number = 90 THEN 'Expected: a:W | b:N'
  END as expected
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 81 AND 90
GROUP BY tq.question_number
ORDER BY tq.question_number;

-- 6. Summary Statistics
SELECT '=== SUMMARY STATISTICS ===' as header;
SELECT 
  'Total questions' as metric,
  COUNT(DISTINCT tq.question_number)::text as value
FROM test_questions tq
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
UNION ALL
SELECT 
  'Total options (expected 180)',
  COUNT(*)::text
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 90
UNION ALL
SELECT 
  'Unique dimensions',
  COUNT(DISTINCT category_target)::text
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
WHERE tq.instrument_id = (
  SELECT id FROM test_instruments 
  WHERE name ILIKE '%papikostik%' LIMIT 1
)
  AND tq.question_number BETWEEN 1 AND 90
UNION ALL
SELECT 
  'All dimensions correct (count=9 each)',
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cnt = 9 THEN 1 END) = 20 THEN '✓ YES'
    ELSE '❌ NO'
  END
FROM (
  SELECT COUNT(*) as cnt
  FROM test_question_options tqo
  JOIN test_questions tq ON tqo.question_id = tq.id
  WHERE tq.instrument_id = (
    SELECT id FROM test_instruments 
    WHERE name ILIKE '%papikostik%' LIMIT 1
  )
    AND tq.question_number BETWEEN 1 AND 90
  GROUP BY category_target
) counts;
