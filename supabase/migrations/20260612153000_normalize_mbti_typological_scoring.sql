-- Normalize MBTI as a typological/personality preference test.
-- MBTI is not scored as correct/incorrect; selected options add 1 point to
-- one of the four preference pairs: E/I, S/N, T/F, J/P.

UPDATE public.test_instruments
SET scoring_method = 'typological',
    duration_minutes = COALESCE(NULLIF(duration_minutes, 0), 20)
WHERE upper(name) LIKE '%MBTI%'
   OR upper(name) LIKE '%MYERS%';

UPDATE public.test_questions q
SET question_type = 'single_choice',
    scoring_rule = 'typological'
FROM public.test_instruments i
WHERE q.instrument_id = i.id
  AND (upper(i.name) LIKE '%MBTI%' OR upper(i.name) LIKE '%MYERS%');

WITH normalized AS (
  SELECT
    o.id,
    CASE
      WHEN upper(trim(o.category_target)) IN ('E','I','S','N','T','F','J','P') THEN upper(trim(o.category_target))
      WHEN upper(trim(o.option_label)) IN ('E','I','S','N','T','F','J','P') THEN upper(trim(o.option_label))
      WHEN upper(o.option_text) LIKE '%EXTRAVERSION%' OR upper(o.option_text) LIKE '%EXTROVERSION%' OR upper(o.option_text) LIKE '%EXTROVERT%' THEN 'E'
      WHEN upper(o.option_text) LIKE '%INTROVERSION%' OR upper(o.option_text) LIKE '%INTROVERT%' THEN 'I'
      WHEN upper(o.option_text) LIKE '%SENSING%' THEN 'S'
      WHEN upper(o.option_text) LIKE '%INTUITION%' OR upper(o.option_text) LIKE '%INTUITIVE%' THEN 'N'
      WHEN upper(o.option_text) LIKE '%THINKING%' THEN 'T'
      WHEN upper(o.option_text) LIKE '%FEELING%' THEN 'F'
      WHEN upper(o.option_text) LIKE '%JUDGING%' THEN 'J'
      WHEN upper(o.option_text) LIKE '%PERCEIVING%' THEN 'P'
      ELSE NULL
    END AS dim
  FROM public.test_question_options o
  JOIN public.test_questions q ON q.id = o.question_id
  JOIN public.test_instruments i ON i.id = q.instrument_id
  WHERE upper(i.name) LIKE '%MBTI%'
     OR upper(i.name) LIKE '%MYERS%'
)
UPDATE public.test_question_options o
SET category_target = n.dim,
    score_value = 1,
    is_correct = true
FROM normalized n
WHERE o.id = n.id
  AND n.dim IS NOT NULL;

DELETE FROM public.test_interpretations ti
USING public.test_instruments i
WHERE ti.instrument_id = i.id
  AND (upper(i.name) LIKE '%MBTI%' OR upper(i.name) LIKE '%MYERS%')
  AND ti.category = 'MBTI';

INSERT INTO public.test_interpretations (instrument_id, interpretation_key, category, min_value, max_value, interpretation_text, interpretation_text_en)
SELECT i.id, seed.key, 'MBTI', seed.min_value, seed.max_value, seed.text_id, seed.text_en
FROM public.test_instruments i
CROSS JOIN (
  VALUES
    ('E', 0, 999, 'Extraversion: kandidat cenderung mendapatkan energi dari interaksi, diskusi, dan lingkungan sosial. Cocok pada konteks kerja yang membutuhkan komunikasi aktif, kolaborasi, dan respons cepat terhadap orang lain.', 'Extraversion: the candidate tends to gain energy from interaction, discussion, and social environments.'),
    ('I', 0, 999, 'Introversion: kandidat cenderung memproses informasi secara reflektif, membutuhkan ruang berpikir, dan nyaman bekerja mandiri. Cocok pada pekerjaan yang membutuhkan konsentrasi, kedalaman analisis, dan persiapan matang.', 'Introversion: the candidate tends to process information reflectively and work well with focused independence.'),
    ('S', 0, 999, 'Sensing: kandidat cenderung praktis, faktual, detail, dan mengandalkan data nyata. Cocok untuk pekerjaan yang membutuhkan ketelitian, prosedur, eksekusi operasional, dan konsistensi.', 'Sensing: the candidate tends to be practical, factual, detail-oriented, and grounded in concrete data.'),
    ('N', 0, 999, 'Intuition: kandidat cenderung konseptual, melihat pola, dan terbuka pada kemungkinan baru. Cocok untuk pekerjaan strategis, pengembangan ide, pemecahan masalah, dan inovasi.', 'Intuition: the candidate tends to be conceptual, pattern-oriented, and open to possibilities.'),
    ('T', 0, 999, 'Thinking: kandidat cenderung mengambil keputusan berdasarkan logika, objektivitas, dan prinsip yang konsisten. Cocok pada konteks yang membutuhkan analisis rasional, evaluasi, dan ketegasan keputusan.', 'Thinking: the candidate tends to decide through logic, objectivity, and consistent principles.'),
    ('F', 0, 999, 'Feeling: kandidat cenderung mempertimbangkan dampak personal, empati, dan harmoni relasi dalam mengambil keputusan. Cocok pada konteks kerja yang membutuhkan sensitivitas interpersonal dan pelayanan.', 'Feeling: the candidate tends to consider personal impact, empathy, and relational harmony.'),
    ('J', 0, 999, 'Judging: kandidat cenderung menyukai struktur, rencana, target jelas, dan penyelesaian tepat waktu. Cocok untuk pekerjaan yang membutuhkan pengorganisasian, kontrol progres, dan kepastian prioritas.', 'Judging: the candidate tends to prefer structure, planning, clear targets, and timely closure.'),
    ('P', 0, 999, 'Perceiving: kandidat cenderung fleksibel, adaptif, dan nyaman dengan perubahan atau opsi terbuka. Cocok pada lingkungan dinamis yang membutuhkan respons cepat dan penyesuaian berkelanjutan.', 'Perceiving: the candidate tends to be flexible, adaptive, and comfortable with change or open options.')
) AS seed(key, min_value, max_value, text_id, text_en)
WHERE upper(i.name) LIKE '%MBTI%'
   OR upper(i.name) LIKE '%MYERS%';
