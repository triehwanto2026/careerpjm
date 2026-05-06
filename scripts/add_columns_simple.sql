-- Add image columns to test_questions table
-- This should work with regular permissions

-- Check if columns already exist first
DO $$
BEGIN
    -- Add question_image column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_questions' AND column_name = 'question_image'
    ) THEN
        ALTER TABLE test_questions ADD COLUMN question_image TEXT;
        RAISE NOTICE 'Added question_image column';
    ELSE
        RAISE NOTICE 'question_image column already exists';
    END IF;
    
    -- Add options_image column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_questions' AND column_name = 'options_image'
    ) THEN
        ALTER TABLE test_questions ADD COLUMN options_image TEXT;
        RAISE NOTICE 'Added options_image column';
    ELSE
        RAISE NOTICE 'options_image column already exists';
    END IF;
END $$;

-- Verify columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'test_questions' 
AND column_name IN ('question_image', 'options_image')
ORDER BY column_name;
