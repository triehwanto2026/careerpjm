-- Fix IST questions 61-76 (GE - Generalization) to be essay type
-- Update question_type from 'multiple_choice' to 'essay' for questions 61-76

UPDATE test_questions
SET question_type = 'essay',
    options = NULL,
    correct_answer = NULL
WHERE test_name ILIKE '%IST%'
  AND question_number BETWEEN 61 AND 76;

-- Verify the update
SELECT question_number, question_type, question_text
FROM test_questions
WHERE test_name ILIKE '%IST%'
  AND question_number BETWEEN 61 AND 76
ORDER BY question_number;
