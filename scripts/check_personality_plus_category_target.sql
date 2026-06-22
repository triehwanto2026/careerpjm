-- Check Personality Plus test question options category_target values
-- This verifies that the category_target is correctly set for Personality Plus questions

SELECT 
  ti.name as instrument_name,
  ti.scoring_method,
  q.question_number,
  q.question_type,
  o.option_label,
  o.option_text,
  o.category_target,
  o.display_order
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
JOIN test_instruments ti ON q.instrument_id = ti.id
WHERE ti.name ILIKE '%personality%' OR ti.name ILIKE '%plus%'
ORDER BY q.question_number, o.display_order;

-- Count options by category_target for Personality Plus
SELECT 
  o.category_target,
  COUNT(*) as count
FROM test_question_options o
JOIN test_questions q ON o.question_id = q.id
JOIN test_instruments ti ON q.instrument_id = ti.id
WHERE ti.name ILIKE '%personality%' OR ti.name ILIKE '%plus%'
  AND o.category_target IS NOT NULL
GROUP BY o.category_target
ORDER BY o.category_target;
