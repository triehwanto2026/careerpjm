-- Verify DISC and Personality Plus scoring alignment
-- Run this in Supabase SQL Editor to check if the database structure matches scoring logic

-- Check DISC instrument and questions
SELECT 
  i.name,
  i.scoring_method,
  i.question_count,
  COUNT(DISTINCT q.id) as actual_question_count
FROM test_instruments i
LEFT JOIN test_questions q ON q.instrument_id = i.id
WHERE i.name ILIKE '%DISC%'
GROUP BY i.id, i.name, i.scoring_method, i.question_count;

-- Check DISC question options category_target values
SELECT 
  q.question_number,
  q.question_type,
  q.scoring_rule,
  COUNT(DISTINCT o.category_target) as distinct_categories,
  STRING_AGG(DISTINCT o.category_target, ', ') as category_targets
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%DISC%' LIMIT 1)
GROUP BY q.question_number, q.question_type, q.scoring_rule
ORDER BY q.question_number
LIMIT 10;

-- Check Personality Plus instrument and questions
SELECT 
  i.name,
  i.scoring_method,
  i.question_count,
  COUNT(DISTINCT q.id) as actual_question_count
FROM test_instruments i
LEFT JOIN test_questions q ON q.instrument_id = i.id
WHERE i.name ILIKE '%Personality%'
GROUP BY i.id, i.name, i.scoring_method, i.question_count;

-- Check Personality Plus question options category_target values
SELECT 
  q.question_number,
  q.question_type,
  q.scoring_rule,
  COUNT(DISTINCT o.category_target) as distinct_categories,
  STRING_AGG(DISTINCT o.category_target, ', ') as category_targets
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%Personality%' LIMIT 1)
GROUP BY q.question_number, q.question_type, q.scoring_rule
ORDER BY q.question_number
LIMIT 10;
