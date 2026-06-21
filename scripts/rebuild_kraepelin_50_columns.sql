-- Rebuild Kraepelin with 50 columns and 27 answers per column
-- Total: 50 x 27 = 1350 questions
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  kraepelin_id uuid;
  col_no int;
  row_no int;
  q_no int;
  a int;
  b int;
  correct_digit int;
BEGIN
  -- Get or create Kraepelin instrument
  SELECT id INTO kraepelin_id
  FROM public.test_instruments
  WHERE name ILIKE '%Kraepelin%'
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF kraepelin_id IS NULL THEN
    INSERT INTO public.test_instruments (
      name, name_en, description, category, scoring_method, target_audience,
      norm_reference, question_count, duration_minutes, is_active
    ) VALUES (
      'Tes Kraepelin',
      'Kraepelin Test',
      'Tes kerja hitung berkolom untuk mengukur tempo kerja, ketelitian, stabilitas, dan kapasitas kerja.',
      'Work Aptitude',
      'speed_accuracy',
      'Kandidat kerja',
      'Kraepelin/Pauli style speed-accuracy work curve',
      1350,
      25,
      true
    )
    RETURNING id INTO kraepelin_id;
  ELSE
    UPDATE public.test_instruments
    SET
      name = CASE WHEN name ILIKE '%Kraepelin%' THEN name ELSE 'Tes Kraepelin' END,
      name_en = COALESCE(NULLIF(name_en, ''), 'Kraepelin Test'),
      description = 'Tes kerja hitung berkolom untuk mengukur tempo kerja, ketelitian, stabilitas, dan kapasitas kerja.',
      category = COALESCE(NULLIF(category, ''), 'Work Aptitude'),
      scoring_method = 'speed_accuracy',
      question_count = 1350,
      duration_minutes = 25, -- 50 columns × 30 seconds = 1500 seconds = 25 minutes
      is_active = true
    WHERE id = kraepelin_id;
  END IF;

  -- Delete existing questions and options for this instrument
  DELETE FROM public.test_question_options
  WHERE question_id IN (
    SELECT id FROM public.test_questions WHERE instrument_id = kraepelin_id
  );
  
  DELETE FROM public.test_questions WHERE instrument_id = kraepelin_id;

  -- Generate 50 columns with 27 questions each
  FOR col_no IN 1..50 LOOP
    FOR row_no IN 1..27 LOOP
      q_no := (col_no - 1) * 27 + row_no;
      
      -- Generate random numbers for addition
      a := FLOOR(RANDOM() * 9) + 1; -- 1-9
      b := FLOOR(RANDOM() * 9) + 1; -- 1-9
      
      -- Calculate correct answer (unit digit of sum)
      correct_digit := (a + b) % 10;
      
      -- Insert question
      INSERT INTO public.test_questions (
        instrument_id,
        question_number,
        question_text,
        question_text_en,
        question_type,
        scoring_rule,
        subtest_code,
        group_number,
        time_limit_minutes,
        category
      ) VALUES (
        kraepelin_id,
        q_no,
        a::text || ' + ' || b::text || ' = ?',
        a::text || ' + ' || b::text || ' = ?',
        'numeric',
        'speed_accuracy',
        'K' || col_no::text,
        col_no,
        0.5,
        'Addition'
      );
      
      -- Insert option with correct answer marker
      INSERT INTO public.test_question_options (
        question_id,
        option_label,
        option_text,
        option_text_en,
        score_value,
        is_correct,
        category_target,
        display_order
      ) VALUES (
        (SELECT id FROM public.test_questions WHERE instrument_id = kraepelin_id AND question_number = q_no),
        '1',
        'CORRECT_ANSWER: ' || correct_digit::text,
        'CORRECT_ANSWER: ' || correct_digit::text,
        1,
        true,
        NULL,
        1
      );
      
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Kraepelin rebuilt successfully with 50 columns x 27 questions = 1350 total questions';
  RAISE NOTICE 'Instrument ID: %', kraepelin_id;
END $$;
