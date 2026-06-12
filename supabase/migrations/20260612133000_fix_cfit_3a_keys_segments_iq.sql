-- Correct CFIT 3A answer keys, segment metadata, and two-answer rules for Test 2.
-- This migration preserves existing question/option images and text when present.

DO $$
DECLARE
  cfit_id uuid;
  q_id uuid;
  q_no int;
  labels text[];
  correct text[];
  subtest text;
  category_name text;
  q_type text;
  minutes int;
  label text;
  idx int;
BEGIN
  SELECT id INTO cfit_id
  FROM public.test_instruments
  WHERE name ILIKE '%CFIT%' OR name ILIKE '%Culture Fair%'
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF cfit_id IS NULL THEN
    INSERT INTO public.test_instruments (
      name, name_en, description, category, scoring_method, target_audience,
      norm_reference, question_count, duration_minutes, is_active
    ) VALUES (
      'CFIT 3A (Culture Fair Intelligence Test)',
      'Culture Fair Intelligence Test 3A',
      'Tes penalaran nonverbal CFIT 3A dengan empat segmen: Series, Classifications, Matrices, dan Conditions.',
      'Intelligence',
      'correct_only',
      'Adult',
      'CFIT 3A raw score to IQ conversion',
      50,
      13,
      true
    )
    RETURNING id INTO cfit_id;
  ELSE
    UPDATE public.test_instruments
    SET
      name = CASE WHEN name ILIKE '%CFIT%' THEN name ELSE 'CFIT 3A (Culture Fair Intelligence Test)' END,
      name_en = COALESCE(NULLIF(name_en, ''), 'Culture Fair Intelligence Test 3A'),
      category = COALESCE(NULLIF(category, ''), 'Intelligence'),
      scoring_method = 'correct_only',
      question_count = 50,
      duration_minutes = 13,
      is_active = true
    WHERE id = cfit_id;
  END IF;

  FOR q_no IN 1..50 LOOP
    IF q_no BETWEEN 1 AND 13 THEN
      subtest := 'S1';
      category_name := 'Series';
      q_type := 'single_choice';
      minutes := 3;
      labels := ARRAY['A','B','C','D','E','F'];
      correct := ARRAY[CASE q_no
        WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'B' WHEN 4 THEN 'D' WHEN 5 THEN 'E'
        WHEN 6 THEN 'B' WHEN 7 THEN 'D' WHEN 8 THEN 'B' WHEN 9 THEN 'E' WHEN 10 THEN 'C'
        WHEN 11 THEN 'B' WHEN 12 THEN 'B' ELSE 'E'
      END];
    ELSIF q_no BETWEEN 14 AND 27 THEN
      subtest := 'S2';
      category_name := 'Classifications';
      q_type := 'multi_choice';
      minutes := 4;
      labels := ARRAY['A','B','C','D','E'];
      correct := CASE q_no
        WHEN 14 THEN ARRAY['B','E'] WHEN 15 THEN ARRAY['A','E'] WHEN 16 THEN ARRAY['A','D']
        WHEN 17 THEN ARRAY['C','E'] WHEN 18 THEN ARRAY['B','E'] WHEN 19 THEN ARRAY['A','D']
        WHEN 20 THEN ARRAY['B','E'] WHEN 21 THEN ARRAY['B','E'] WHEN 22 THEN ARRAY['A','D']
        WHEN 23 THEN ARRAY['B','D'] WHEN 24 THEN ARRAY['A','E'] WHEN 25 THEN ARRAY['C','D']
        WHEN 26 THEN ARRAY['B','C'] ELSE ARRAY['A','B']
      END;
    ELSIF q_no BETWEEN 28 AND 40 THEN
      subtest := 'S3';
      category_name := 'Matrices';
      q_type := 'single_choice';
      minutes := 3;
      labels := ARRAY['A','B','C','D','E','F'];
      correct := ARRAY[CASE q_no
        WHEN 28 THEN 'E' WHEN 29 THEN 'E' WHEN 30 THEN 'E' WHEN 31 THEN 'B' WHEN 32 THEN 'C'
        WHEN 33 THEN 'D' WHEN 34 THEN 'E' WHEN 35 THEN 'E' WHEN 36 THEN 'A' WHEN 37 THEN 'A'
        WHEN 38 THEN 'F' WHEN 39 THEN 'C' ELSE 'C'
      END];
    ELSE
      subtest := 'S4';
      category_name := 'Conditions';
      q_type := 'single_choice';
      minutes := 3;
      labels := ARRAY['A','B','C','D','E'];
      correct := ARRAY[CASE q_no
        WHEN 41 THEN 'B' WHEN 42 THEN 'A' WHEN 43 THEN 'D' WHEN 44 THEN 'D' WHEN 45 THEN 'A'
        WHEN 46 THEN 'B' WHEN 47 THEN 'C' WHEN 48 THEN 'D' WHEN 49 THEN 'A' ELSE 'D'
      END];
    END IF;

    SELECT id INTO q_id
    FROM public.test_questions
    WHERE instrument_id = cfit_id AND question_number = q_no
    ORDER BY created_at NULLS LAST
    LIMIT 1;

    IF q_id IS NULL THEN
      INSERT INTO public.test_questions (
        instrument_id, question_number, question_text, question_text_en, category,
        question_type, scoring_rule, subtest_code, time_limit_minutes, group_number
      ) VALUES (
        cfit_id, q_no, 'CFIT 3A ' || category_name || ' No. ' || q_no,
        'CFIT 3A ' || category_name || ' No. ' || q_no,
        category_name, q_type, 'correct_only', subtest, minutes,
        CASE subtest WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 ELSE 4 END
      )
      RETURNING id INTO q_id;
    ELSE
      UPDATE public.test_questions
      SET
        question_text = COALESCE(NULLIF(question_text, ''), 'CFIT 3A ' || category_name || ' No. ' || q_no),
        question_text_en = COALESCE(NULLIF(question_text_en, ''), 'CFIT 3A ' || category_name || ' No. ' || q_no),
        category = category_name,
        question_type = q_type,
        scoring_rule = 'correct_only',
        subtest_code = subtest,
        time_limit_minutes = minutes,
        group_number = CASE subtest WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 ELSE 4 END,
        updated_at = now()
      WHERE instrument_id = cfit_id AND question_number = q_no;
    END IF;

    DELETE FROM public.test_question_options
    WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = cfit_id AND question_number = q_no)
      AND NOT (option_label = ANY(labels));

    idx := 0;
    FOREACH label IN ARRAY labels LOOP
      idx := idx + 1;

      UPDATE public.test_question_options
      SET
        option_text = COALESCE(NULLIF(option_text, ''), label),
        option_text_en = COALESCE(NULLIF(option_text_en, ''), label),
        score_value = CASE WHEN label = ANY(correct) THEN 1 ELSE 0 END,
        category_target = category_name,
        is_correct = label = ANY(correct),
        display_order = idx
      WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = cfit_id AND question_number = q_no)
        AND option_label = label;

      IF NOT EXISTS (
        SELECT 1 FROM public.test_question_options
        WHERE question_id = q_id AND option_label = label
      ) THEN
        INSERT INTO public.test_question_options (
          question_id, option_label, option_text, option_text_en, score_value,
          category_target, is_correct, display_order
        ) VALUES (
          q_id, label, label, label,
          CASE WHEN label = ANY(correct) THEN 1 ELSE 0 END,
          category_name,
          label = ANY(correct),
          idx
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;
