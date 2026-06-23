-- Force rebuild Kraepelin: hapus semua soal dan buat 50 kolom baru
-- Jalankan script ini di Supabase SQL Editor

DO $$
DECLARE
  kraepelin_id uuid;
  col_no int;
  row_no int;
  q_no int;
  numbers int[];
  a int;
  b int;
  correct_digit int;
  total_questions int;
  total_columns int;
  invalid_columns int;
BEGIN
  -- Get or create Kraepelin instrument
  SELECT id INTO kraepelin_id
  FROM public.test_instruments
  WHERE name ILIKE '%Kraepelin%'
  ORDER BY created_at DESC
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
      duration_minutes = 25,
      is_active = true
    WHERE id = kraepelin_id;
  END IF;

  RAISE NOTICE 'Kraepelin instrument ID: %', kraepelin_id;

  -- Delete existing questions and options
  DELETE FROM public.test_question_options
  WHERE question_id IN (
    SELECT id FROM public.test_questions WHERE instrument_id = kraepelin_id
  );
  
  DELETE FROM public.test_questions WHERE instrument_id = kraepelin_id;
  
  RAISE NOTICE 'Deleted all existing questions and options';

  -- Create 50 columns with 27 questions each
  FOR col_no IN 1..50 LOOP
    CASE col_no
      WHEN 1 THEN numbers := ARRAY[8,4,7,2,9,1,5,3,6,8,2,4,7,9,1,3,5,8,6,2,7,4,9,1,3,5,8,2];
      WHEN 2 THEN numbers := ARRAY[3,7,1,8,4,6,2,9,5,3,7,1,4,8,2,6,9,5,3,7,1,4,8,2,6,9,5,3];
      WHEN 3 THEN numbers := ARRAY[5,2,8,1,7,4,9,3,6,5,2,8,1,7,4,9,3,6,5,2,8,1,7,4,9,3,6,5];
      WHEN 4 THEN numbers := ARRAY[9,3,6,1,8,5,2,7,4,9,3,6,1,8,5,2,7,4,9,3,6,1,8,5,2,7,4,9];
      WHEN 5 THEN numbers := ARRAY[2,8,4,7,1,9,3,6,5,2,8,4,7,1,9,3,6,5,2,8,4,7,1,9,3,6,5,2];
      WHEN 6 THEN numbers := ARRAY[6,1,9,4,7,2,8,5,3,6,1,9,4,7,2,8,5,3,6,1,9,4,7,2,8,5,3,6];
      WHEN 7 THEN numbers := ARRAY[7,5,2,8,3,9,1,4,6,7,5,2,8,3,9,1,4,6,7,5,2,8,3,9,1,4,6,7];
      WHEN 8 THEN numbers := ARRAY[4,9,3,6,2,7,5,1,8,4,9,3,6,2,7,5,1,8,4,9,3,6,2,7,5,1,8,4];
      WHEN 9 THEN numbers := ARRAY[1,6,8,2,5,3,9,4,7,1,6,8,2,5,3,9,4,7,1,6,8,2,5,3,9,4,7,1];
      WHEN 10 THEN numbers := ARRAY[8,2,5,9,1,7,4,6,3,8,2,5,9,1,7,4,6,3,8,2,5,9,1,7,4,6,3,8];
      WHEN 11 THEN numbers := ARRAY[3,8,1,5,7,2,9,4,6,3,8,1,5,7,2,9,4,6,3,8,1,5,7,2,9,4,6,3];
      WHEN 12 THEN numbers := ARRAY[5,9,4,2,8,1,7,3,6,5,9,4,2,8,1,7,3,6,5,9,4,2,8,1,7,3,6,5];
      WHEN 13 THEN numbers := ARRAY[7,3,6,1,9,4,8,2,5,7,3,6,1,9,4,8,2,5,7,3,6,1,9,4,8,2,5,7];
      WHEN 14 THEN numbers := ARRAY[2,5,8,4,6,9,1,7,3,2,5,8,4,6,9,1,7,3,2,5,8,4,6,9,1,7,3,2];
      WHEN 15 THEN numbers := ARRAY[6,4,9,2,7,3,8,5,1,6,4,9,2,7,3,8,5,1,6,4,9,2,7,3,8,5,1,6];
      WHEN 16 THEN numbers := ARRAY[1,7,5,8,3,6,2,9,4,1,7,5,8,3,6,2,9,4,1,7,5,8,3,6,2,9,4,1];
      WHEN 17 THEN numbers := ARRAY[9,2,7,5,1,8,4,6,3,9,2,7,5,1,8,4,6,3,9,2,7,5,1,8,4,6,3,9];
      WHEN 18 THEN numbers := ARRAY[4,6,3,9,2,7,1,8,5,4,6,3,9,2,7,1,8,5,4,6,3,9,2,7,1,8,5,4];
      WHEN 19 THEN numbers := ARRAY[8,1,4,7,3,5,9,2,6,8,1,4,7,3,5,9,2,6,8,1,4,7,3,5,9,2,6,8];
      WHEN 20 THEN numbers := ARRAY[5,7,2,6,8,4,1,9,3,5,7,2,6,8,4,1,9,3,5,7,2,6,8,4,1,9,3,5];
      WHEN 21 THEN numbers := ARRAY[3,5,9,1,7,2,8,4,6,3,5,9,1,7,2,8,4,6,3,5,9,1,7,2,8,4,6,3];
      WHEN 22 THEN numbers := ARRAY[7,2,6,8,4,1,9,5,3,7,2,6,8,4,1,9,5,3,7,2,6,8,4,1,9,5,3,7];
      WHEN 23 THEN numbers := ARRAY[2,9,4,6,3,8,5,1,7,2,9,4,6,3,8,5,1,7,2,9,4,6,3,8,5,1,7,2];
      WHEN 24 THEN numbers := ARRAY[6,1,7,3,9,5,2,8,4,6,1,7,3,9,5,2,8,4,6,1,7,3,9,5,2,8,4,6];
      WHEN 25 THEN numbers := ARRAY[4,8,2,5,1,7,3,9,6,4,8,2,5,1,7,3,9,6,4,8,2,5,1,7,3,9,6,4];
      WHEN 26 THEN numbers := ARRAY[9,5,3,8,6,2,7,4,1,9,5,3,8,6,2,7,4,1,9,5,3,8,6,2,7,4,1,9];
      WHEN 27 THEN numbers := ARRAY[1,4,8,2,5,9,3,6,7,1,4,8,2,5,9,3,6,7,1,4,8,2,5,9,3,6,7,1];
      WHEN 28 THEN numbers := ARRAY[5,3,7,1,4,8,2,9,6,5,3,7,1,4,8,2,9,6,5,3,7,1,4,8,2,9,6,5];
      WHEN 29 THEN numbers := ARRAY[8,6,1,7,2,5,9,3,4,8,6,1,7,2,5,9,3,4,8,6,1,7,2,5,9,3,4,8];
      WHEN 30 THEN numbers := ARRAY[2,7,5,3,9,4,6,1,8,2,7,5,3,9,4,6,1,8,2,7,5,3,9,4,6,1,8,2];
      WHEN 31 THEN numbers := ARRAY[7,4,9,1,6,3,8,5,2,7,4,9,1,6,3,8,5,2,7,4,9,1,6,3,8,5,2,7];
      WHEN 32 THEN numbers := ARRAY[3,8,5,2,7,1,4,9,6,3,8,5,2,7,1,4,9,6,3,8,5,2,7,1,4,9,6,3];
      WHEN 33 THEN numbers := ARRAY[6,2,7,4,8,5,1,3,9,6,2,7,4,8,5,1,3,9,6,2,7,4,8,5,1,3,9,6];
      WHEN 34 THEN numbers := ARRAY[1,5,3,9,4,6,2,8,7,1,5,3,9,4,6,2,8,7,1,5,3,9,4,6,2,8,7,1];
      WHEN 35 THEN numbers := ARRAY[9,3,6,2,8,1,5,7,4,9,3,6,2,8,1,5,7,4,9,3,6,2,8,1,5,7,4,9];
      WHEN 36 THEN numbers := ARRAY[4,7,1,5,9,3,6,2,8,4,7,1,5,9,3,6,2,8,4,7,1,5,9,3,6,2,8,4];
      WHEN 37 THEN numbers := ARRAY[8,2,5,7,1,4,9,6,3,8,2,5,7,1,4,9,6,3,8,2,5,7,1,4,9,6,3,8];
      WHEN 38 THEN numbers := ARRAY[2,6,9,3,5,8,1,4,7,2,6,9,3,5,8,1,4,7,2,6,9,3,5,8,1,4,7,2];
      WHEN 39 THEN numbers := ARRAY[5,1,4,8,2,7,3,9,6,5,1,4,8,2,7,3,9,6,5,1,4,8,2,7,3,9,6,5];
      WHEN 40 THEN numbers := ARRAY[7,3,8,1,6,2,5,4,9,7,3,8,1,6,2,5,4,9,7,3,8,1,6,2,5,4,9,7];
      WHEN 41 THEN numbers := ARRAY[3,9,2,6,1,7,4,8,5,3,9,2,6,1,7,4,8,5,3,9,2,6,1,7,4,8,5,3];
      WHEN 42 THEN numbers := ARRAY[6,4,7,2,8,5,1,9,3,6,4,7,2,8,5,1,9,3,6,4,7,2,8,5,1,9,3,6];
      WHEN 43 THEN numbers := ARRAY[1,8,5,3,7,9,2,4,6,1,8,5,3,7,9,2,4,6,1,8,5,3,7,9,2,4,6,1];
      WHEN 44 THEN numbers := ARRAY[8,5,1,7,3,6,9,2,4,8,5,1,7,3,6,9,2,4,8,5,1,7,3,6,9,2,4,8];
      WHEN 45 THEN numbers := ARRAY[4,2,9,5,1,8,6,3,7,4,2,9,5,1,8,6,3,7,4,2,9,5,1,8,6,3,7,4];
      WHEN 46 THEN numbers := ARRAY[9,7,3,1,4,2,8,5,6,9,7,3,1,4,2,8,5,6,9,7,3,1,4,2,8,5,6,9];
      WHEN 47 THEN numbers := ARRAY[5,3,8,6,2,7,1,9,4,5,3,8,6,2,7,1,9,4,5,3,8,6,2,7,1,9,4,5];
      WHEN 48 THEN numbers := ARRAY[2,8,4,9,5,1,7,6,3,2,8,4,9,5,1,7,6,3,2,8,4,9,5,1,7,6,3,2];
      WHEN 49 THEN numbers := ARRAY[7,1,6,4,8,3,5,2,9,7,1,6,4,8,3,5,2,9,7,1,6,4,8,3,5,2,9,7];
      WHEN 50 THEN numbers := ARRAY[3,6,2,8,4,9,1,7,5,3,6,2,8,4,9,1,7,5,3,6,2,8,4,9,1,7,5,3];
      ELSE numbers := NULL;
    END CASE;

    IF numbers IS NULL OR array_length(numbers, 1) <> 28 THEN
      RAISE EXCEPTION 'Invalid column data for col %: numbers=%', col_no, numbers;
    END IF;

    FOR row_no IN 1..27 LOOP
      q_no := (col_no - 1) * 27 + row_no;
      a := numbers[row_no];
      b := numbers[row_no + 1];
      IF a IS NULL OR b IS NULL THEN
        RAISE EXCEPTION 'Invalid numbers at col %, row %: a=%, b=%', col_no, row_no, a, b;
      END IF;
      correct_digit := (a + b) % 10;

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
    
    RAISE NOTICE 'Created column % with 27 questions', col_no;
  END LOOP;

  SELECT COUNT(*) INTO total_questions FROM public.test_questions WHERE instrument_id = kraepelin_id;
  SELECT COUNT(DISTINCT group_number) INTO total_columns FROM public.test_questions WHERE instrument_id = kraepelin_id;
  SELECT COUNT(*) INTO invalid_columns FROM public.test_questions
    WHERE instrument_id = kraepelin_id
    GROUP BY group_number
    HAVING COUNT(*) <> 27
    LIMIT 1;

  IF total_questions <> 1350 OR total_columns <> 50 OR invalid_columns > 0 THEN
    RAISE EXCEPTION 'Kraepelin validation failed: % questions, % columns, invalid column count %', total_questions, total_columns, invalid_columns;
  END IF;

  RAISE NOTICE 'Kraepelin rebuilt successfully with 50 columns x 27 questions = 1350 total questions';
  RAISE NOTICE 'Instrument ID: %', kraepelin_id;
END $$;
