-- Check MSDT instrument and questions
-- Run this in Supabase SQL Editor

-- Get MSDT instrument details
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
WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style';

-- Check MSDT questions count
SELECT 
  COUNT(*) as total_questions,
  COUNT(DISTINCT question_number) as distinct_question_numbers
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' LIMIT 1);

-- Check MSDT question types and scoring rules
SELECT 
  question_type,
  scoring_rule,
  COUNT(*) as count
FROM test_questions 
WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' LIMIT 1)
GROUP BY question_type, scoring_rule;

-- Check MSDT options category_target distribution
SELECT 
  category_target,
  COUNT(*) as count
FROM test_question_options 
WHERE question_id IN (SELECT id FROM test_questions WHERE instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' LIMIT 1))
GROUP BY category_target
ORDER BY count DESC;

-- Sample MSDT question with options
SELECT 
  q.question_number,
  q.question_text,
  o.option_label,
  o.option_text,
  o.category_target
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' LIMIT 1)
  AND q.question_number = 1
ORDER BY o.option_label;

-- Check if MSDT questions have proper category_target values
SELECT 
  q.question_number,
  COUNT(DISTINCT o.category_target) as distinct_categories,
  STRING_AGG(DISTINCT o.category_target, ', ') as categories
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' LIMIT 1)
GROUP BY q.question_number
ORDER BY q.question_number
LIMIT 10;
