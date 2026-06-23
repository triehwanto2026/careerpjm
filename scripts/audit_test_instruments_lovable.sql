-- Audit bank soal dan kunci jawaban semua alat tes.
-- Copy-paste ke Lovable Cloud / Supabase SQL editor.

-- 1) Ringkasan per alat tes.
SELECT
  i.id,
  i.name,
  i.scoring_method,
  i.question_count AS expected_question_count,
  count(q.id) AS actual_question_count,
  count(q.id) FILTER (WHERE q.question_type = 'text') AS text_questions,
  count(q.id) FILTER (WHERE q.question_type = 'numeric') AS numeric_questions,
  count(q.id) FILTER (WHERE q.question_type IN ('single_choice', 'multi_choice', 'likert', 'true_false', 'disc_pair')) AS option_questions,
  count(q.id) FILTER (WHERE coalesce(opt.option_count, 0) = 0 AND q.question_type NOT IN ('text', 'numeric')) AS option_questions_without_options,
  count(q.id) FILTER (WHERE coalesce(opt.key_count, 0) = 0 AND q.scoring_rule = 'correct_only') AS correct_only_without_key
FROM public.test_instruments i
LEFT JOIN public.test_questions q ON q.instrument_id = i.id
LEFT JOIN LATERAL (
  SELECT
    count(*) AS option_count,
    count(*) FILTER (WHERE o.is_correct OR o.score_value > 0) AS key_count
  FROM public.test_question_options o
  WHERE o.question_id = q.id
) opt ON true
GROUP BY i.id, i.name, i.scoring_method, i.question_count
ORDER BY i.name;

-- 2) Detail soal yang kemungkinan bermasalah.
SELECT
  i.name AS instrument_name,
  q.question_number,
  q.question_type,
  q.scoring_rule,
  q.subtest_code,
  q.category,
  left(q.question_text, 120) AS question_preview,
  coalesce(opt.option_count, 0) AS option_count,
  coalesce(opt.key_count, 0) AS key_count
FROM public.test_questions q
JOIN public.test_instruments i ON i.id = q.instrument_id
LEFT JOIN LATERAL (
  SELECT
    count(*) AS option_count,
    count(*) FILTER (WHERE o.is_correct OR o.score_value > 0) AS key_count
  FROM public.test_question_options o
  WHERE o.question_id = q.id
) opt ON true
WHERE
  (q.question_type NOT IN ('text', 'numeric') AND coalesce(opt.option_count, 0) = 0)
  OR (q.scoring_rule = 'correct_only' AND coalesce(opt.key_count, 0) = 0)
  OR (i.name ILIKE '%IST%' AND q.question_number BETWEEN 61 AND 76 AND q.question_type <> 'text')
ORDER BY i.name, q.question_number;

-- 3) Khusus IST: cek distribusi 9 subtes dan kunci jawaban.
SELECT
  coalesce(q.subtest_code,
    CASE
      WHEN q.question_number BETWEEN 1 AND 20 THEN 'SE'
      WHEN q.question_number BETWEEN 21 AND 40 THEN 'WA'
      WHEN q.question_number BETWEEN 41 AND 60 THEN 'AN'
      WHEN q.question_number BETWEEN 61 AND 76 THEN 'GE'
      WHEN q.question_number BETWEEN 77 AND 96 THEN 'RA'
      WHEN q.question_number BETWEEN 97 AND 116 THEN 'ZR'
      WHEN q.question_number BETWEEN 117 AND 136 THEN 'FA'
      WHEN q.question_number BETWEEN 137 AND 156 THEN 'WU'
      WHEN q.question_number BETWEEN 157 AND 176 THEN 'ME'
      ELSE 'OUT_OF_RANGE'
    END
  ) AS ist_subtest,
  min(q.question_number) AS first_question,
  max(q.question_number) AS last_question,
  count(*) AS questions,
  count(*) FILTER (WHERE q.question_type = 'text') AS text_questions,
  count(*) FILTER (WHERE q.question_type = 'numeric') AS numeric_questions,
  sum(coalesce(opt.key_count, 0)) AS answer_key_rows
FROM public.test_questions q
JOIN public.test_instruments i ON i.id = q.instrument_id
LEFT JOIN LATERAL (
  SELECT count(*) FILTER (WHERE o.is_correct OR o.score_value > 0) AS key_count
  FROM public.test_question_options o
  WHERE o.question_id = q.id
) opt ON true
WHERE i.name ILIKE '%IST%' OR i.name_en ILIKE '%IST%' OR i.name ILIKE '%Intelligenz%'
GROUP BY ist_subtest
ORDER BY first_question;
