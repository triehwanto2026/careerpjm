-- DIAGNOSTIC SCRIPT: Check PAPI Kostick Mapping & Scoring Issues
-- This script identifies problems with PAPI scoring that cause invalid results

-- 1. Verify PAPI instrument exists and question count
SELECT 'PAPI Instrument Info' as check_name;
SELECT 
  ti.id,
  ti.name,
  COUNT(DISTINCT tq.id) as question_count,
  COUNT(DISTINCT tq.question_number) as unique_question_numbers
FROM test_instruments ti
LEFT JOIN test_questions tq ON tq.instrument_id = ti.id
WHERE ti.name ILIKE '%papikostik%' OR ti.scoring_method = 'papi_scales'
GROUP BY ti.id, ti.name;

-- 2. Check category_target distribution (each should appear exactly 9 times for 90 questions × 2 options = 180 total)
SELECT 'PAPI Mapping Distribution' as check_name;
SELECT 
  tqo.category_target,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 9 THEN '✓ CORRECT (9 expected)'
    ELSE '❌ ERROR - expected 9, got ' || COUNT(*)
  END as status
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
JOIN test_instruments ti ON tq.instrument_id = ti.id
WHERE (ti.name ILIKE '%papikostik%' OR ti.scoring_method = 'papi_scales')
GROUP BY tqo.category_target
ORDER BY tqo.category_target;

-- 3. Check for mapping on specific questions (verify first 10 match expected pattern)
SELECT 'First 10 Questions Mapping' as check_name;
SELECT 
  tq.question_number,
  STRING_AGG(tqo.option_label || ':' || tqo.category_target, ' | ' ORDER BY tqo.option_label) as mapping,
  CASE
    WHEN tq.question_number = 1 THEN 'Expected: a:G | b:E'
    WHEN tq.question_number = 2 THEN 'Expected: a:A | b:N'
    WHEN tq.question_number = 3 THEN 'Expected: a:P | b:A'
    WHEN tq.question_number = 4 THEN 'Expected: a:X | b:P'
    WHEN tq.question_number = 5 THEN 'Expected: a:B | b:X'
    WHEN tq.question_number = 6 THEN 'Expected: a:O | b:B'
    WHEN tq.question_number = 7 THEN 'Expected: a:Z | b:O'
    WHEN tq.question_number = 8 THEN 'Expected: a:K | b:Z'
    WHEN tq.question_number = 9 THEN 'Expected: a:F | b:K'
    WHEN tq.question_number = 10 THEN 'Expected: a:W | b:F'
    ELSE ''
  END as expected
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
JOIN test_instruments ti ON tq.instrument_id = ti.id
WHERE (ti.name ILIKE '%papikostik%' OR ti.scoring_method = 'papi_scales')
  AND tq.question_number <= 10
GROUP BY tq.question_number
ORDER BY tq.question_number;

-- 4. Find test results with INVALID scoring (total ≠ 90 or dimensions exceed max)
SELECT 'PAPI Results with Invalid Scores' as check_name;
WITH papi_results AS (
  SELECT 
    tr.id,
    tr.candidate_id,
    tr.test_name,
    tr.categories,
    tr.total_questions,
    tr.answered_questions,
    tr.created_at,
    -- Calculate totals
    COALESCE((tr.categories->>'N')::int, 0) +
    COALESCE((tr.categories->>'G')::int, 0) +
    COALESCE((tr.categories->>'A')::int, 0) +
    COALESCE((tr.categories->>'L')::int, 0) +
    COALESCE((tr.categories->>'P')::int, 0) +
    COALESCE((tr.categories->>'I')::int, 0) +
    COALESCE((tr.categories->>'T')::int, 0) +
    COALESCE((tr.categories->>'V')::int, 0) +
    COALESCE((tr.categories->>'X')::int, 0) +
    COALESCE((tr.categories->>'S')::int, 0) +
    COALESCE((tr.categories->>'B')::int, 0) +
    COALESCE((tr.categories->>'O')::int, 0) +
    COALESCE((tr.categories->>'R')::int, 0) +
    COALESCE((tr.categories->>'D')::int, 0) +
    COALESCE((tr.categories->>'C')::int, 0) +
    COALESCE((tr.categories->>'Z')::int, 0) +
    COALESCE((tr.categories->>'E')::int, 0) +
    COALESCE((tr.categories->>'K')::int, 0) +
    COALESCE((tr.categories->>'F')::int, 0) +
    COALESCE((tr.categories->>'W')::int, 0) as total_score
  FROM test_results tr
  WHERE tr.test_name ILIKE '%papikostik%'
)
SELECT 
  id as result_id,
  candidate_id,
  total_score,
  answered_questions,
  CASE 
    WHEN answered_questions = 90 AND total_score != 90 THEN '❌ INVALID: 90 soal harus total = 90'
    WHEN total_score != answered_questions THEN '⚠️  MISMATCH: total ≠ answered'
    ELSE '✓ Valid'
  END as status
FROM papi_results
WHERE answered_questions = 90 AND total_score != 90
  OR (answered_questions > 0 AND total_score != answered_questions)
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check for exceeding dimension maximums
SELECT 'PAPI Dimensions Exceeding Maximum' as check_name;
WITH papi_invalid AS (
  SELECT 
    tr.id,
    tr.created_at,
    json_each_text(tr.categories) as (dim, score)
  FROM test_results tr
  WHERE tr.test_name ILIKE '%papikostik%'
    AND (tr.categories->>'answered_questions')::int = 90
)
SELECT 
  dim,
  (score::int) as actual_score,
  CASE 
    WHEN dim IN ('N', 'E', 'F', 'W') THEN 8
    ELSE 7
  END as max_allowed,
  CASE 
    WHEN dim IN ('N', 'E', 'F', 'W') AND (score::int) > 8 THEN '❌ EXCEEDS'
    WHEN dim NOT IN ('N', 'E', 'F', 'W') AND (score::int) > 7 THEN '❌ EXCEEDS'
    ELSE '✓'
  END as status
FROM papi_invalid
WHERE (dim IN ('N', 'E', 'F', 'W') AND (score::int) > 8)
   OR (dim NOT IN ('N', 'E', 'F', 'W', 'answered_questions', 'total_questions') AND (score::int) > 7)
ORDER BY dim, actual_score DESC;

-- 6. Check for duplicate answers (same question answered multiple times)
SELECT 'Check for Duplicate Answers' as check_name;
WITH answer_counts AS (
  SELECT 
    ta.test_result_id,
    ta.question_id,
    COUNT(*) as answer_count,
    tq.question_number,
    STRING_AGG(DISTINCT ta.selected_option_id, ', ') as option_ids
  FROM test_answers ta
  JOIN test_questions tq ON ta.question_id = tq.id
  GROUP BY ta.test_result_id, ta.question_id, tq.question_number
  HAVING COUNT(*) > 1
)
SELECT 
  test_result_id as result_id,
  COUNT(DISTINCT question_id) as questions_with_duplicates,
  STRING_AGG('Q' || question_number || '(' || answer_count || 'x)', ', ' ORDER BY question_number) as duplicate_questions
FROM answer_counts
GROUP BY test_result_id
ORDER BY COUNT(DISTINCT question_id) DESC
LIMIT 20;

-- 7. Analyze a specific invalid result in detail
SELECT 'Detailed Analysis of First Invalid Result' as check_name;
-- Get first invalid result
WITH first_invalid AS (
  SELECT 
    tr.id,
    tr.candidate_id,
    tr.categories,
    COALESCE((tr.categories->>'N')::int, 0) +
    COALESCE((tr.categories->>'G')::int, 0) +
    COALESCE((tr.categories->>'A')::int, 0) +
    COALESCE((tr.categories->>'L')::int, 0) +
    COALESCE((tr.categories->>'P')::int, 0) +
    COALESCE((tr.categories->>'I')::int, 0) +
    COALESCE((tr.categories->>'T')::int, 0) +
    COALESCE((tr.categories->>'V')::int, 0) +
    COALESCE((tr.categories->>'X')::int, 0) +
    COALESCE((tr.categories->>'S')::int, 0) +
    COALESCE((tr.categories->>'B')::int, 0) +
    COALESCE((tr.categories->>'O')::int, 0) +
    COALESCE((tr.categories->>'R')::int, 0) +
    COALESCE((tr.categories->>'D')::int, 0) +
    COALESCE((tr.categories->>'C')::int, 0) +
    COALESCE((tr.categories->>'Z')::int, 0) +
    COALESCE((tr.categories->>'E')::int, 0) +
    COALESCE((tr.categories->>'K')::int, 0) +
    COALESCE((tr.categories->>'F')::int, 0) +
    COALESCE((tr.categories->>'W')::int, 0) as total_score
  FROM test_results tr
  WHERE tr.test_name ILIKE '%papikostik%'
    AND COALESCE((tr.categories->>'answered_questions')::int, 0) = 90
  ORDER BY tr.created_at DESC
  LIMIT 1
)
SELECT 
  'Result ID: ' || id as info,
  'DB Total Score: ' || total_score as score_info
FROM first_invalid
UNION ALL
SELECT 
  'Dimension: ' || key as info,
  'Score: ' || value as score_info
FROM first_invalid,
  json_each_text(categories)
WHERE key IN ('N', 'G', 'A', 'L', 'P', 'I', 'T', 'V', 'X', 'S', 'B', 'O', 'R', 'D', 'C', 'Z', 'E', 'K', 'F', 'W')
ORDER BY info;
