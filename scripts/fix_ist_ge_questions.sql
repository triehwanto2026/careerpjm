-- Fix IST questions 61-76 (GE / Gemeinsamkeiten) for the current schema.
-- Copy-paste this whole script into Lovable Cloud / Supabase SQL editor.
--
-- Expected app behavior:
-- - question_type = 'text' makes TestPage render a textarea / essay input.
-- - test_question_options rows below are hidden answer keys used by server-side scoring.
-- - score_value is normalized to 1 for accepted answers because the current IST scoring is correct-only per item.

BEGIN;

ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS subtest_code text;

WITH ist_questions AS (
  SELECT q.id, q.question_number
  FROM public.test_questions q
  JOIN public.test_instruments i ON i.id = q.instrument_id
  WHERE q.question_number BETWEEN 61 AND 76
    AND (
      i.name ILIKE '%IST%'
      OR i.name_en ILIKE '%IST%'
      OR i.name ILIKE '%Intelligenz%'
    )
)
UPDATE public.test_questions q
SET
  question_type = 'essay',
  scoring_rule = 'correct_only',
  subtest_code = 'GE',
  category = 'GE',
  updated_at = now()
FROM ist_questions iq
WHERE q.id = iq.id;

WITH ist_questions AS (
  SELECT q.id
  FROM public.test_questions q
  JOIN public.test_instruments i ON i.id = q.instrument_id
  WHERE q.question_number BETWEEN 61 AND 76
    AND (
      i.name ILIKE '%IST%'
      OR i.name_en ILIKE '%IST%'
      OR i.name ILIKE '%Intelligenz%'
    )
)
DELETE FROM public.test_question_options o
USING ist_questions iq
WHERE o.question_id = iq.id;

WITH answer_bank(question_number, display_order, option_text, score_value) AS (
  VALUES
    (61, 1, 'Bunga', 1), (61, 2, 'Kembang', 1), (61, 3, 'Perdu', 1), (61, 4, 'Tumbuh-tumbuhan', 1), (61, 5, 'Tangkai', 1), (61, 6, 'Harum', 1), (61, 7, 'Pohon', 0),
    (62, 1, 'Alat indera', 1), (62, 2, 'Indera', 1), (62, 3, 'Panca indera', 1), (62, 4, 'Organ', 1), (62, 5, 'Alat tubuh', 1), (62, 6, 'Kepala', 0),
    (63, 1, 'Hablur', 1), (63, 2, 'Kristal', 1), (63, 3, 'Zat arang', 1), (63, 4, 'Berkilauan', 1), (63, 5, 'Mengkilat', 1), (63, 6, 'Bening', 1),
    (64, 1, 'Musim', 1), (64, 2, 'Cuaca', 1), (64, 3, 'Iklim', 0),
    (65, 1, 'Pembawa berita', 1), (65, 2, 'Alat perhubungan', 1), (65, 3, 'Telekomunikasi', 1), (65, 4, 'Perhubungan', 1), (65, 5, 'Komunikasi', 1),
    (66, 1, 'Alat optik', 1), (66, 2, 'Optik', 1), (66, 3, 'Lensa', 1), (66, 4, 'Melihat', 0), (66, 5, 'Alat', 0), (66, 6, 'Alat melihat', 0),
    (67, 1, 'Alat pencernaan', 1), (67, 2, 'Jalan makanan', 1), (67, 3, 'Perut', 1), (67, 4, 'Isi perut', 1), (67, 5, 'Pencernaan makanan', 1), (67, 6, 'Makanan', 0),
    (68, 1, 'Jumlah', 1), (68, 2, 'Kuantitas', 1), (68, 3, 'Penyebut jumlah', 1), (68, 4, 'Penyertaan jumlah', 1), (68, 5, 'Mengukur', 1), (68, 6, 'Ukuran', 1), (68, 7, 'Uang', 0),
    (69, 1, 'Bibit', 1), (69, 2, 'Bakal', 1), (69, 3, 'Embrio', 1), (69, 4, 'Alat pembiak', 1), (69, 5, 'Permulaan penghidupan', 1), (69, 6, 'Sel', 1), (69, 7, 'Pembiakan', 1), (69, 8, 'Pertanian', 0), (69, 9, 'Keturunan', 0),
    (70, 1, 'Simbol', 1), (70, 2, 'Lambang', 1), (70, 3, 'Tanda', 1), (70, 4, 'Nama', 1), (70, 5, 'Tanda pengenal', 1), (70, 6, 'Warna', 0),
    (71, 1, 'Makhluk', 1), (71, 2, 'Organisme', 1), (71, 3, 'Organism', 1), (71, 4, 'Makhluk hidup', 1), (71, 5, 'Tumbuh', 1), (71, 6, 'Ilmu hayat', 1), (71, 7, 'Biologi', 1), (71, 8, 'Hidup', 0), (71, 9, 'Hutan', 0), (71, 10, 'Hayat', 0),
    (72, 1, 'Wadah', 1), (72, 2, 'Tempat pengisi', 1), (72, 3, 'Tempat penyimpan', 1), (72, 4, 'Alat', 1), (72, 5, 'Tempat sesuatu', 1), (72, 6, 'Tempat', 1), (72, 7, 'Benda', 1), (72, 8, 'Lubang', 0),
    (73, 1, 'Pengertian waktu', 1), (73, 2, 'Batas', 1), (73, 3, 'Waktu', 1), (73, 4, 'Lamanya', 1), (73, 5, 'Masa', 1), (73, 6, 'Saat', 1), (73, 7, 'Kata waktu', 0), (73, 8, 'Buku', 0),
    (74, 1, 'Kata sifat', 1), (74, 2, 'Kata sifat watak', 1), (74, 3, 'Sifat karakter', 1), (74, 4, 'Sifat', 1), (74, 5, 'Uang', 0), (74, 6, 'Karakter', 0), (74, 7, 'Watak', 0),
    (75, 1, 'Regulator harga', 1), (75, 2, 'Pengertian ekonomi', 1), (75, 3, 'Dagang', 1), (75, 4, 'Pembelian', 1), (75, 5, 'Penjualan', 1), (75, 6, 'Niaga', 1), (75, 7, 'Jual beli', 1), (75, 8, 'Lawan kata', 0),
    (76, 1, 'Pengertian ruang', 1), (76, 2, 'Penyebut ruang', 1), (76, 3, 'Arah', 1), (76, 4, 'Tempat', 1), (76, 5, 'Ruang', 1), (76, 6, 'Letak', 1), (76, 7, 'Penunjuk tempat', 1), (76, 8, 'Penentuan daerah', 1), (76, 9, 'Daerah', 0), (76, 10, 'Ruangan', 0), (76, 11, 'Tingkatan', 0), (76, 12, 'Kata', 0)
),
ist_questions AS (
  SELECT q.id, q.question_number
  FROM public.test_questions q
  JOIN public.test_instruments i ON i.id = q.instrument_id
  WHERE q.question_number BETWEEN 61 AND 76
    AND (
      i.name ILIKE '%IST%'
      OR i.name_en ILIKE '%IST%'
      OR i.name ILIKE '%Intelligenz%'
    )
)
INSERT INTO public.test_question_options (
  question_id,
  option_label,
  option_text,
  option_text_en,
  score_value,
  category_target,
  is_correct,
  display_order
)
SELECT
  iq.id,
  chr(64 + ab.display_order),
  ab.option_text,
  ab.option_text,
  ab.score_value,
  'GE',
  ab.score_value > 0,
  ab.display_order
FROM ist_questions iq
JOIN answer_bank ab ON ab.question_number = iq.question_number
ORDER BY iq.question_number, ab.display_order;

COMMIT;

-- Verification 1: all 16 GE questions should be text/correct_only/GE.
SELECT
  i.name AS instrument_name,
  q.question_number,
  q.question_type,
  q.scoring_rule,
  q.subtest_code,
  q.category
FROM public.test_questions q
JOIN public.test_instruments i ON i.id = q.instrument_id
WHERE q.question_number BETWEEN 61 AND 76
  AND (
    i.name ILIKE '%IST%'
    OR i.name_en ILIKE '%IST%'
    OR i.name ILIKE '%Intelligenz%'
  )
ORDER BY i.name, q.question_number;

-- Verification 2: each GE question should have hidden answer-key options.
SELECT
  q.question_number,
  count(*) AS answer_key_rows,
  count(*) FILTER (WHERE o.is_correct OR o.score_value > 0) AS accepted_answers
FROM public.test_questions q
JOIN public.test_instruments i ON i.id = q.instrument_id
LEFT JOIN public.test_question_options o ON o.question_id = q.id
WHERE q.question_number BETWEEN 61 AND 76
  AND (
    i.name ILIKE '%IST%'
    OR i.name_en ILIKE '%IST%'
    OR i.name ILIKE '%Intelligenz%'
  )
GROUP BY q.question_number
ORDER BY q.question_number;
