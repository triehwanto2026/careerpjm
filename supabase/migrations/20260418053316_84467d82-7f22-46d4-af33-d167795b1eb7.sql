
UPDATE public.test_instruments ti
SET question_count = (SELECT COUNT(*) FROM public.test_questions tq WHERE tq.instrument_id = ti.id);

UPDATE public.test_instruments SET duration_minutes = 15, scoring_method = 'ipsative' WHERE name = 'Tes DISC';
UPDATE public.test_instruments SET duration_minutes = 90, scoring_method = 'correct_only' WHERE name = 'Intelligenz Struktur Test (IST)';
UPDATE public.test_instruments SET duration_minutes = 20, scoring_method = 'typological' WHERE name = 'Myers-Briggs Type Indicator (MBTI)';
UPDATE public.test_instruments SET duration_minutes = 30, scoring_method = 'correct_only' WHERE name = 'Culture Fair Intelligence Test (CFIT)';
UPDATE public.test_instruments SET duration_minutes = 25, scoring_method = 'papi_scales' WHERE name = 'PAPIKOSTIK (PAPI Kostick)';
UPDATE public.test_instruments SET duration_minutes = 20, scoring_method = 'percent_temperament' WHERE name = 'Personality Plus (4 Temperamen)';
UPDATE public.test_instruments SET duration_minutes = 10, scoring_method = 'speed_accuracy' WHERE name = 'Tes Kraepelin';
