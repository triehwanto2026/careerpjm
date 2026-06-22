-- Migration: Set PAPI Kostick category_target mapping (90 soal)
-- Purpose: Update test_question_options.category_target untuk setiap opsi A/B
-- Mapping: Kolom A → option_label='a', Kolom B → option_label='b'
-- Generated: 2026-06-22

WITH papi AS (
  SELECT id FROM public.test_instruments 
  WHERE name ILIKE '%papikostik%' OR name ILIKE '%papi kostick%'
  LIMIT 1
)
UPDATE public.test_question_options o
SET category_target = CASE
  -- Soal 1-10
  WHEN q.question_number = 1  AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 1  AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 2  AND o.option_label = 'a' THEN 'A'
  WHEN q.question_number = 2  AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 3  AND o.option_label = 'a' THEN 'P'
  WHEN q.question_number = 3  AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 4  AND o.option_label = 'a' THEN 'X'
  WHEN q.question_number = 4  AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 5  AND o.option_label = 'a' THEN 'B'
  WHEN q.question_number = 5  AND o.option_label = 'b' THEN 'X'
  WHEN q.question_number = 6  AND o.option_label = 'a' THEN 'O'
  WHEN q.question_number = 6  AND o.option_label = 'b' THEN 'B'
  WHEN q.question_number = 7  AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 7  AND o.option_label = 'b' THEN 'O'
  WHEN q.question_number = 8  AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 8  AND o.option_label = 'b' THEN 'Z'
  WHEN q.question_number = 9  AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 9  AND o.option_label = 'b' THEN 'K'
  WHEN q.question_number = 10 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 10 AND o.option_label = 'b' THEN 'F'
  -- Soal 11-20
  WHEN q.question_number = 11 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 11 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 12 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 12 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 13 AND o.option_label = 'a' THEN 'P'
  WHEN q.question_number = 13 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 14 AND o.option_label = 'a' THEN 'X'
  WHEN q.question_number = 14 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 15 AND o.option_label = 'a' THEN 'B'
  WHEN q.question_number = 15 AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 16 AND o.option_label = 'a' THEN 'O'
  WHEN q.question_number = 16 AND o.option_label = 'b' THEN 'X'
  WHEN q.question_number = 17 AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 17 AND o.option_label = 'b' THEN 'B'
  WHEN q.question_number = 18 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 18 AND o.option_label = 'b' THEN 'O'
  WHEN q.question_number = 19 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 19 AND o.option_label = 'b' THEN 'Z'
  WHEN q.question_number = 20 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 20 AND o.option_label = 'b' THEN 'K'
  -- Soal 21-30
  WHEN q.question_number = 21 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 21 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 22 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 22 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 23 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 23 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 24 AND o.option_label = 'a' THEN 'X'
  WHEN q.question_number = 24 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 25 AND o.option_label = 'a' THEN 'B'
  WHEN q.question_number = 25 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 26 AND o.option_label = 'a' THEN 'O'
  WHEN q.question_number = 26 AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 27 AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 27 AND o.option_label = 'b' THEN 'X'
  WHEN q.question_number = 28 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 28 AND o.option_label = 'b' THEN 'B'
  WHEN q.question_number = 29 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 29 AND o.option_label = 'b' THEN 'O'
  WHEN q.question_number = 30 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 30 AND o.option_label = 'b' THEN 'Z'
  -- Soal 31-40
  WHEN q.question_number = 31 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 31 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 32 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 32 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 33 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 33 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 34 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 34 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 35 AND o.option_label = 'a' THEN 'B'
  WHEN q.question_number = 35 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 36 AND o.option_label = 'a' THEN 'O'
  WHEN q.question_number = 36 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 37 AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 37 AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 38 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 38 AND o.option_label = 'b' THEN 'X'
  WHEN q.question_number = 39 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 39 AND o.option_label = 'b' THEN 'B'
  WHEN q.question_number = 40 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 40 AND o.option_label = 'b' THEN 'O'
  -- Soal 41-50
  WHEN q.question_number = 41 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 41 AND o.option_label = 'b' THEN 'S'
  WHEN q.question_number = 42 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 42 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 43 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 43 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 44 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 44 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 45 AND o.option_label = 'a' THEN 'V'
  WHEN q.question_number = 45 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 46 AND o.option_label = 'a' THEN 'O'
  WHEN q.question_number = 46 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 47 AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 47 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 48 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 48 AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 49 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 49 AND o.option_label = 'b' THEN 'X'
  WHEN q.question_number = 50 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 50 AND o.option_label = 'b' THEN 'B'
  -- Soal 51-60
  WHEN q.question_number = 51 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 51 AND o.option_label = 'b' THEN 'V'
  WHEN q.question_number = 52 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 52 AND o.option_label = 'b' THEN 'S'
  WHEN q.question_number = 53 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 53 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 54 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 54 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 55 AND o.option_label = 'a' THEN 'V'
  WHEN q.question_number = 55 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 56 AND o.option_label = 'a' THEN 'S'
  WHEN q.question_number = 56 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 57 AND o.option_label = 'a' THEN 'Z'
  WHEN q.question_number = 57 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 58 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 58 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 59 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 59 AND o.option_label = 'b' THEN 'P'
  WHEN q.question_number = 60 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 60 AND o.option_label = 'b' THEN 'X'
  -- Soal 61-70
  WHEN q.question_number = 61 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 61 AND o.option_label = 'b' THEN 'T'
  WHEN q.question_number = 62 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 62 AND o.option_label = 'b' THEN 'V'
  WHEN q.question_number = 63 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 63 AND o.option_label = 'b' THEN 'S'
  WHEN q.question_number = 64 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 64 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 65 AND o.option_label = 'a' THEN 'V'
  WHEN q.question_number = 65 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 66 AND o.option_label = 'a' THEN 'S'
  WHEN q.question_number = 66 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 67 AND o.option_label = 'a' THEN 'R'
  WHEN q.question_number = 67 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 68 AND o.option_label = 'a' THEN 'K'
  WHEN q.question_number = 68 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 69 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 69 AND o.option_label = 'b' THEN 'A'
  WHEN q.question_number = 70 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 70 AND o.option_label = 'b' THEN 'P'
  -- Soal 71-80
  WHEN q.question_number = 71 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 71 AND o.option_label = 'b' THEN 'I'
  WHEN q.question_number = 72 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 72 AND o.option_label = 'b' THEN 'T'
  WHEN q.question_number = 73 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 73 AND o.option_label = 'b' THEN 'V'
  WHEN q.question_number = 74 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 74 AND o.option_label = 'b' THEN 'S'
  WHEN q.question_number = 75 AND o.option_label = 'a' THEN 'V'
  WHEN q.question_number = 75 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 76 AND o.option_label = 'a' THEN 'S'
  WHEN q.question_number = 76 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 77 AND o.option_label = 'a' THEN 'R'
  WHEN q.question_number = 77 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 78 AND o.option_label = 'a' THEN 'D'
  WHEN q.question_number = 78 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 79 AND o.option_label = 'a' THEN 'F'
  WHEN q.question_number = 79 AND o.option_label = 'b' THEN 'N'
  WHEN q.question_number = 80 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 80 AND o.option_label = 'b' THEN 'A'
  -- Soal 81-90
  WHEN q.question_number = 81 AND o.option_label = 'a' THEN 'G'
  WHEN q.question_number = 81 AND o.option_label = 'b' THEN 'L'
  WHEN q.question_number = 82 AND o.option_label = 'a' THEN 'L'
  WHEN q.question_number = 82 AND o.option_label = 'b' THEN 'I'
  WHEN q.question_number = 83 AND o.option_label = 'a' THEN 'I'
  WHEN q.question_number = 83 AND o.option_label = 'b' THEN 'T'
  WHEN q.question_number = 84 AND o.option_label = 'a' THEN 'T'
  WHEN q.question_number = 84 AND o.option_label = 'b' THEN 'V'
  WHEN q.question_number = 85 AND o.option_label = 'a' THEN 'V'
  WHEN q.question_number = 85 AND o.option_label = 'b' THEN 'S'
  WHEN q.question_number = 86 AND o.option_label = 'a' THEN 'S'
  WHEN q.question_number = 86 AND o.option_label = 'b' THEN 'R'
  WHEN q.question_number = 87 AND o.option_label = 'a' THEN 'R'
  WHEN q.question_number = 87 AND o.option_label = 'b' THEN 'D'
  WHEN q.question_number = 88 AND o.option_label = 'a' THEN 'D'
  WHEN q.question_number = 88 AND o.option_label = 'b' THEN 'C'
  WHEN q.question_number = 89 AND o.option_label = 'a' THEN 'C'
  WHEN q.question_number = 89 AND o.option_label = 'b' THEN 'E'
  WHEN q.question_number = 90 AND o.option_label = 'a' THEN 'W'
  WHEN q.question_number = 90 AND o.option_label = 'b' THEN 'N'
  ELSE o.category_target
END,
score_value = 1,
is_correct = true
FROM public.test_questions q, papi
WHERE o.question_id = q.id
  AND q.instrument_id = papi.id
  AND q.question_number BETWEEN 1 AND 90;

-- Verification: Check mapping distribution (should be 9 per dimension)
SELECT 
  '--- VERIFIKASI MAPPING PAPI SETELAH UPDATE ---' as info;

SELECT 
  category_target as dimension,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 9 THEN '✓ CORRECT'
    ELSE '❌ ERROR (expected 9, got ' || COUNT(*) || ')'
  END as status
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
JOIN test_instruments ti ON tq.instrument_id = ti.id
WHERE (ti.name ILIKE '%papikostik%' OR ti.name ILIKE '%papi kostick%')
  AND tq.question_number BETWEEN 1 AND 90
GROUP BY category_target
ORDER BY category_target;

-- Check sample questions (Q1-10)
SELECT 
  '--- SAMPLE: Soal 1-10 Mapping ---' as info;

SELECT 
  tq.question_number,
  STRING_AGG(tqo.option_label || ':' || tqo.category_target, ' | ' ORDER BY tqo.option_label) as mapping
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
JOIN test_instruments ti ON tq.instrument_id = ti.id
WHERE (ti.name ILIKE '%papikostik%' OR ti.name ILIKE '%papi kostick%')
  AND tq.question_number BETWEEN 1 AND 10
GROUP BY tq.question_number
ORDER BY tq.question_number;

-- Summary
SELECT 
  COUNT(DISTINCT category_target) as total_dimensions,
  COUNT(*) as total_options,
  MIN(category_target) as first_dim,
  MAX(category_target) as last_dim
FROM test_question_options tqo
JOIN test_questions tq ON tqo.question_id = tq.id
JOIN test_instruments ti ON tq.instrument_id = ti.id
WHERE (ti.name ILIKE '%papikostik%' OR ti.name ILIKE '%papi kostick%')
  AND tq.question_number BETWEEN 1 AND 90;
