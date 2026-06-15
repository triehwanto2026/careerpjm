-- Apply official answer key, scoring, duration, and interpretation ranges
-- for the attached 60-question APTITUDE TEST.

DO $$
DECLARE
  aptitude_id UUID;
  qid UUID;
  rec RECORD;
BEGIN
  SELECT id INTO aptitude_id
  FROM public.test_instruments
  WHERE name ILIKE '%APTITUDE%'
  ORDER BY created_at
  LIMIT 1;

  IF aptitude_id IS NULL THEN
    RAISE NOTICE 'APTITUDE TEST not found; skipping answer key fix.';
    RETURN;
  END IF;

  UPDATE public.test_instruments
  SET question_count = 60,
      duration_minutes = 60,
      scoring_method = 'correct_only',
      category = 'Aptitude',
      norm_reference = 'User provided key - 60 items / 60 minutes',
      updated_at = now()
  WHERE id = aptitude_id;

  -- Q15 has eight answer positions in the attached sheet.
  SELECT id INTO qid
  FROM public.test_questions
  WHERE instrument_id = aptitude_id AND question_number = 15;

  IF qid IS NOT NULL THEN
    DELETE FROM public.test_question_options WHERE question_id = qid;
    INSERT INTO public.test_question_options (
      question_id, option_label, option_text, score_value, category_target, is_correct, display_order
    )
    VALUES
      (qid, 'A', '9', 0, 'Numerical', false, 0),
      (qid, 'B', '7', 0, 'Numerical', false, 1),
      (qid, 'C', '8', 0, 'Numerical', false, 2),
      (qid, 'D', '6', 0, 'Numerical', false, 3),
      (qid, 'E', '7', 0, 'Numerical', false, 4),
      (qid, 'F', '5', 0, 'Numerical', false, 5),
      (qid, 'G', '6', 0, 'Numerical', false, 6),
      (qid, 'H', '3', 1, 'Numerical', true, 7);
  END IF;

  -- Reset all answer flags first.
  UPDATE public.test_question_options o
  SET is_correct = false,
      score_value = 0
  FROM public.test_questions q
  WHERE q.id = o.question_id
    AND q.instrument_id = aptitude_id;

  -- Official answer key from the user's attachment.
  FOR rec IN
    SELECT * FROM (VALUES
      (1,'B'), (2,'E'), (3,'D'), (4,'C'), (5,'B'), (6,'B'), (7,'E'), (8,'E'), (9,'C'), (10,'C'),
      (11,'C'), (12,'B'), (13,'D'), (14,'E'), (15,'H'), (16,'D'), (17,'B'), (18,'D'), (19,'D'), (20,'D'),
      (21,'D'), (22,'B'), (23,'C'), (24,'B'), (25,'B'), (26,'B'), (27,'E'), (28,'C'), (29,'D'), (30,'E'),
      (31,'D'), (32,'C'), (33,'C'), (34,'C'), (35,'B'), (36,'D'), (37,'B'), (38,'D'), (39,'D'), (40,'C'),
      (41,'D'), (42,'B'), (43,'E'), (44,'C'), (45,'B'), (46,'D'), (47,'D'), (48,'C'), (49,'E'), (50,'B'),
      (51,'C'), (52,'B'), (53,'B'), (54,'H'), (55,'C'), (56,'A'), (57,'E'), (58,'C'), (59,'C'), (60,'D')
    ) AS k(question_number, answer_label)
  LOOP
    UPDATE public.test_question_options o
    SET is_correct = true,
        score_value = 1
    FROM public.test_questions q
    WHERE q.id = o.question_id
      AND q.instrument_id = aptitude_id
      AND q.question_number = rec.question_number
      AND upper(o.option_label) = rec.answer_label;
  END LOOP;

  DELETE FROM public.test_interpretations WHERE instrument_id = aptitude_id;

  INSERT INTO public.test_interpretations (
    instrument_id, interpretation_key, category, min_value, max_value,
    interpretation_text, interpretation_text_en
  )
  VALUES
    (aptitude_id, 'overall_score', 'Sangat Rendah', 0, 34,
      'Skor aptitude sangat rendah. Kandidat kemungkinan membutuhkan instruksi sangat konkret, pendampingan intensif, dan waktu belajar lebih panjang untuk tugas yang menuntut penalaran umum.',
      'Very low aptitude score. Candidate may need concrete instructions, intensive guidance, and more learning time for general reasoning tasks.'),
    (aptitude_id, 'overall_score', 'Rendah', 35, 49,
      'Skor aptitude rendah. Kandidat dapat menangani tugas rutin, namun perlu diperhatikan untuk posisi yang menuntut analisis cepat, pemecahan masalah, dan pemrosesan informasi kompleks.',
      'Low aptitude score. Candidate may handle routine tasks, but caution is needed for roles requiring fast analysis, problem solving, and complex information processing.'),
    (aptitude_id, 'overall_score', 'Cukup', 50, 64,
      'Skor aptitude cukup. Kandidat menunjukkan kemampuan penalaran umum yang memadai untuk tugas standar, dengan kebutuhan arahan yang jelas pada masalah baru atau kompleks.',
      'Adequate aptitude score. Candidate shows sufficient general reasoning for standard tasks, with clear guidance needed for new or complex problems.'),
    (aptitude_id, 'overall_score', 'Baik', 65, 79,
      'Skor aptitude baik. Kandidat mampu memahami instruksi, melihat pola, dan menyelesaikan masalah umum dengan cukup cepat dan akurat.',
      'Good aptitude score. Candidate can understand instructions, identify patterns, and solve general problems with good speed and accuracy.'),
    (aptitude_id, 'overall_score', 'Sangat Baik', 80, 100,
      'Skor aptitude sangat baik. Kandidat menunjukkan kemampuan penalaran umum, ketelitian, dan pemecahan masalah yang kuat untuk tuntutan kerja yang kompleks.',
      'Very good aptitude score. Candidate demonstrates strong general reasoning, accuracy, and problem solving for complex work demands.'),

    (aptitude_id, 'selection_recommendation', 'Tidak Disarankan', 0, 34,
      'Tidak disarankan untuk posisi yang membutuhkan analisis tinggi. Pertimbangkan hanya bila kompetensi teknis/pengalaman sangat relevan dan tersedia pendampingan.',
      NULL),
    (aptitude_id, 'selection_recommendation', 'Perlu Pertimbangan', 35, 49,
      'Perlu pertimbangan lanjut melalui wawancara, referensi, dan bukti kompetensi kerja. Cocok untuk peran rutin dengan prosedur jelas.',
      NULL),
    (aptitude_id, 'selection_recommendation', 'Cukup Disarankan', 50, 64,
      'Cukup disarankan untuk peran operasional/administratif standar, terutama bila hasil wawancara dan pengalaman kerja mendukung.',
      NULL),
    (aptitude_id, 'selection_recommendation', 'Disarankan', 65, 79,
      'Disarankan untuk peran yang membutuhkan pembelajaran cepat, analisis praktis, dan pengambilan keputusan rutin hingga menengah.',
      NULL),
    (aptitude_id, 'selection_recommendation', 'Sangat Disarankan', 80, 100,
      'Sangat disarankan untuk peran yang menuntut kemampuan analitis, adaptasi cepat, dan pemecahan masalah kompleks.',
      NULL),

    (aptitude_id, 'scoring_note', 'Standar Skoring', 0, 100,
      'Skoring menggunakan correct-only: setiap jawaban benar bernilai 1, salah/kosong bernilai 0. Skor akhir = jumlah benar / 60 x 100. Waktu pengerjaan 60 menit.',
      'Correct-only scoring: each correct answer is 1 point, wrong/blank answers are 0. Final score = correct answers / 60 x 100. Duration is 60 minutes.');
END $$;
