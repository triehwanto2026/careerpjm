-- Recalculate old IST results from saved test_answers.
-- Copy-paste into Lovable Cloud / Supabase SQL editor.
--
-- Optional: to recalculate only one result, set the UUID below and uncomment the
-- matching WHERE line in target_results.

BEGIN;

WITH target_results AS (
  SELECT tr.id
  FROM public.test_results tr
  WHERE tr.test_name ILIKE '%IST%'
  -- AND tr.id = '40c695be-d833-4363-81c9-73e3dfa6ce87'
),
answer_scoring AS (
  SELECT
    tr.id AS result_id,
    ta.question_number,
    CASE
      WHEN ta.question_number BETWEEN 1 AND 20 THEN 'SE'
      WHEN ta.question_number BETWEEN 21 AND 40 THEN 'WA'
      WHEN ta.question_number BETWEEN 41 AND 60 THEN 'AN'
      WHEN ta.question_number BETWEEN 61 AND 76 THEN 'GE'
      WHEN ta.question_number BETWEEN 77 AND 96 THEN 'RA'
      WHEN ta.question_number BETWEEN 97 AND 116 THEN 'ZR'
      WHEN ta.question_number BETWEEN 117 AND 136 THEN 'FA'
      WHEN ta.question_number BETWEEN 137 AND 156 THEN 'WU'
      WHEN ta.question_number BETWEEN 157 AND 176 THEN 'ME'
      ELSE NULL
    END AS subtest_code,
    CASE
      WHEN ta.is_correct IS TRUE THEN 1
      ELSE 0
    END AS score_value
  FROM target_results tr
  JOIN public.test_answers ta ON ta.test_result_id = tr.id
  WHERE ta.question_number BETWEEN 1 AND 176
),
rollup AS (
  SELECT
    result_id,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'SE'), 0)::int AS se,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'WA'), 0)::int AS wa,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'AN'), 0)::int AS an,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'GE'), 0)::int AS ge,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'RA'), 0)::int AS ra,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'ZR'), 0)::int AS zr,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'FA'), 0)::int AS fa,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'WU'), 0)::int AS wu,
    coalesce(sum(score_value) FILTER (WHERE subtest_code = 'ME'), 0)::int AS me,
    count(*)::int AS answered
  FROM answer_scoring
  WHERE subtest_code IS NOT NULL
  GROUP BY result_id
),
normalized AS (
  SELECT
    result_id,
    jsonb_build_object(
      'SE', se,
      'WA', wa,
      'AN', an,
      'GE', ge,
      'RA', ra,
      'ZR', zr,
      'FA', fa,
      'WU', wu,
      'ME', me,
      'Verbal', round(((se / 20.0 * 100) + (wa / 20.0 * 100) + (an / 20.0 * 100) + (ge / 16.0 * 100)) / 4)::int,
      'Numerik', round(((ra / 20.0 * 100) + (zr / 20.0 * 100)) / 2)::int,
      'Figural / Spasial', round(((fa / 20.0 * 100) + (wu / 20.0 * 100)) / 2)::int,
      'Memori', round(me / 20.0 * 100)::int,
      'IST Raw Score', se + wa + an + ge + ra + zr + fa + wu + me,
      'IST Max Score', 176
    ) AS categories,
    round(
      (
        (se / 20.0 * 100)
        + (wa / 20.0 * 100)
        + (an / 20.0 * 100)
        + (ge / 16.0 * 100)
        + (ra / 20.0 * 100)
        + (zr / 20.0 * 100)
        + (fa / 20.0 * 100)
        + (wu / 20.0 * 100)
        + (me / 20.0 * 100)
      ) / 9
    )::int AS score,
    answered
  FROM rollup
)
UPDATE public.test_results tr
SET
  categories = n.categories,
  score = n.score,
  answered_questions = greatest(tr.answered_questions, n.answered),
  status = CASE
    WHEN n.score >= 70 THEN 'passed'
    WHEN n.score >= 50 THEN 'review'
    ELSE 'failed'
  END,
  interpretation = concat(
    'Hasil IST dihitung ulang dari jawaban tersimpan. ',
    'Raw score ',
    (n.categories->>'IST Raw Score'),
    '/',
    (n.categories->>'IST Max Score'),
    '; skor akhir ',
    n.score,
    '%. Profil subtes: ',
    'SE=', n.categories->>'SE', '/20; ',
    'WA=', n.categories->>'WA', '/20; ',
    'AN=', n.categories->>'AN', '/20; ',
    'GE=', n.categories->>'GE', '/16; ',
    'RA=', n.categories->>'RA', '/20; ',
    'ZR=', n.categories->>'ZR', '/20; ',
    'FA=', n.categories->>'FA', '/20; ',
    'WU=', n.categories->>'WU', '/20; ',
    'ME=', n.categories->>'ME', '/20.'
  )
FROM normalized n
WHERE tr.id = n.result_id;

COMMIT;

-- Verification: recent IST results should now have SE/WA/AN/GE/RA/ZR/FA/WU/ME keys.
SELECT
  id,
  candidate_name,
  score,
  answered_questions,
  total_questions,
  categories,
  completed_at
FROM public.test_results
WHERE test_name ILIKE '%IST%'
ORDER BY completed_at DESC
LIMIT 20;
