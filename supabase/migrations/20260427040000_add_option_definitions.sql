-- Add definition columns to test_question_options table
-- This allows storing word definitions for personality test options

ALTER TABLE test_question_options
ADD COLUMN IF NOT EXISTS option_definition TEXT,
ADD COLUMN IF NOT EXISTS option_definition_en TEXT;

COMMENT ON COLUMN test_question_options.option_definition IS 'Definition/explanation of the option text in Indonesian';
COMMENT ON COLUMN test_question_options.option_definition_en IS 'Definition/explanation of the option text in English';
