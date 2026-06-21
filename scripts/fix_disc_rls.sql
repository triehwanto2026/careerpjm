-- Fix RLS policies for DISC setup
-- Run this in Supabase SQL Editor

-- Drop existing policies and recreate to allow anon operations
DROP POLICY IF EXISTS "Allow anon to insert test_instruments" ON public.test_instruments;
DROP POLICY IF EXISTS "Allow anon to update test_instruments" ON public.test_instruments;
DROP POLICY IF EXISTS "Allow anon to delete test_instruments" ON public.test_instruments;

CREATE POLICY "Allow anon to insert test_instruments"
ON public.test_instruments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update test_instruments"
ON public.test_instruments FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete test_instruments"
ON public.test_instruments FOR DELETE TO anon USING (true);

-- Same for test_questions and test_question_options
DROP POLICY IF EXISTS "Anon can insert test_questions" ON public.test_questions;
DROP POLICY IF EXISTS "Anon can update test_questions" ON public.test_questions;
DROP POLICY IF EXISTS "Anon can delete test_questions" ON public.test_questions;

CREATE POLICY "Anon can insert test_questions"
ON public.test_questions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update test_questions"
ON public.test_questions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete test_questions"
ON public.test_questions FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert test_question_options" ON public.test_question_options;
DROP POLICY IF EXISTS "Anon can update test_question_options" ON public.test_question_options;
DROP POLICY IF EXISTS "Anon can delete test_question_options" ON public.test_question_options;

CREATE POLICY "Anon can insert test_question_options"
ON public.test_question_options FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update test_question_options"
ON public.test_question_options FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete test_question_options"
ON public.test_question_options FOR DELETE TO anon USING (true);
