DO $$
DECLARE
  cfit_id uuid;
  q_id uuid;
  qn integer;
  sub_idx integer;
  opt_label text;
  opt_idx integer;
  subtest_specs jsonb := '[
    {"code":"S1","name":"Series","count":13,"time":3,"opts":["A","B","C","D","E","F"],"sample_text":"Pilih gambar yang melanjutkan pola pada soal ini.","sample_text_en":"Choose the figure that continues the pattern."},
    {"code":"S2","name":"Classifications","count":14,"time":4,"opts":["A","B","C","D","E"],"sample_text":"Pilih gambar yang TIDAK termasuk kelompok lainnya.","sample_text_en":"Choose the figure that does NOT belong with the others."},
    {"code":"S3","name":"Matrices","count":13,"time":3,"opts":["A","B","C","D","E","F"],"sample_text":"Pilih gambar yang melengkapi matriks 3x3 pada soal ini.","sample_text_en":"Choose the figure that completes the 3x3 matrix."},
    {"code":"S4","name":"Conditions","count":10,"time":3,"opts":["A","B","C","D","E"],"sample_text":"Pilih gambar yang memenuhi kondisi yang sama dengan gambar acuan (titik di dalam lingkaran tetapi di luar segitiga, dst).","sample_text_en":"Choose the figure that meets the same condition as the reference."}
  ]'::jsonb;
  spec jsonb;
  global_no integer := 0;
BEGIN
  SELECT id INTO cfit_id FROM public.test_instruments WHERE name ILIKE '%CFIT%' LIMIT 1;
  IF cfit_id IS NULL THEN RAISE NOTICE 'CFIT instrument not found'; RETURN; END IF;

  DELETE FROM public.test_question_options WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = cfit_id);
  DELETE FROM public.test_questions WHERE instrument_id = cfit_id;

  FOR sub_idx IN 0..3 LOOP
    spec := subtest_specs -> sub_idx;
    FOR qn IN 1..(spec->>'count')::int LOOP
      global_no := global_no + 1;
      INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule, subtest_code, time_limit_minutes, group_number, image_url)
      VALUES (
        cfit_id, global_no,
        spec->>'sample_text',
        spec->>'sample_text_en',
        spec->>'name',
        'single_choice',
        'correct_only',
        spec->>'code',
        (spec->>'time')::int,
        sub_idx + 1,
        NULL
      ) RETURNING id INTO q_id;

      opt_idx := 0;
      FOR opt_label IN SELECT jsonb_array_elements_text(spec->'opts') LOOP
        INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order, image_url)
        VALUES (q_id, opt_label, opt_label, opt_label, 0, spec->>'name', false, opt_idx, NULL);
        opt_idx := opt_idx + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE public.test_instruments SET question_count = 50, duration_minutes = 13, scoring_method = 'correct_only' WHERE id = cfit_id;
END $$;