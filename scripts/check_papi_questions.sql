-- Check PAPI Kostick instrument and questions
-- Run this in Supabase SQL Editor

-- Get PAPI instrument details
SELECT 
  id, 
  name, 
  name_en, 
  description, 
  category, 
  scoring_method, 
  question_count, 
  duration_minutes 
FROM test_instruments 
WHERE name ILIKE '%PAPI%' OR scoring_method = 'papi_scales';

-- Check PAPI questions count
SELECT 
  COUNT(*) as total_questions,
  COUNT(DISTINCT question_number) as distinct_question_numbers
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%PAPI%' OR scoring_method = 'papi_scales' LIMIT 1);

-- Check PAPI question types and scoring rules
SELECT 
  question_type,
  scoring_rule,
  COUNT(*) as count
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%PAPI%' OR scoring_method = 'papi_scales' LIMIT 1)
GROUP BY question_type, scoring_rule;

-- Check PAPI options category_target distribution
SELECT 
  category_target,
  COUNT(*) as count
FROM test_question_options 
WHERE question_id IN (SELECT id FROM test_questions WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%PAPI%' OR scoring_method = 'papi_scales' LIMIT 1))
GROUP BY category_target
ORDER BY count DESC;

-- Sample PAPI question with options
SELECT 
  q.question_number,
  q.question_text,
  o.option_label,
  o.option_text,
  o.category_target,
  o.score_value,
  o.is_correct
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%PAPI%' OR scoring_method = 'papi_scales' LIMIT 1)
  AND q.question_number = 1
ORDER BY o.option_label;
