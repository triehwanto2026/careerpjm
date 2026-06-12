-- Rebuild Kraepelin as a manual-style column test:
-- 20 columns/sessions x 30 additions = 600 items, 30 seconds per column in the frontend.

DO $$
DECLARE
  kraepelin_id uuid;
  col_no int;
  row_no int;
  q_no int;
  a int;
  b int;
BEGIN
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
      600,
      10,
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
      question_count = 600,
      duration_minutes = 10,
      is_active = true
    WHERE id = kraepelin_id;
  END IF;

  DELETE FROM public.test_question_options
  WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = kraepelin_id);
  DELETE FROM public.test_questions WHERE instrument_id = kraepelin_id;

  FOR col_no IN 1..20 LOOP
    FOR row_no IN 1..30 LOOP
      q_no := ((col_no - 1) * 30) + row_no;
      a := ((q_no * 7 + col_no * 3) % 9) + 1;
      b := ((q_no * 5 + row_no * 2) % 9) + 1;

      INSERT INTO public.test_questions (
        instrument_id, question_number, question_text, question_text_en, category,
        question_type, scoring_rule, subtest_code, time_limit_minutes, group_number
      ) VALUES (
        kraepelin_id,
        q_no,
        a || ' + ' || b,
        'CORRECT_ANSWER: ' || ((a + b) % 10),
        'Kolom ' || lpad(col_no::text, 2, '0'),
        'numeric',
        'speed_accuracy',
        'K' || lpad(col_no::text, 2, '0'),
        1,
        col_no
      );
    END LOOP;
  END LOOP;
END $$;
