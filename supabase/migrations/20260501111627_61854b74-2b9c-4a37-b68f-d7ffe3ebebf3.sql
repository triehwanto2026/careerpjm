-- =========================================================
-- RESEED: Aptitude (60), CFIT 3A (50 placeholder), IST GE (perbaiki)
-- =========================================================

-- ===================== APTITUDE (60) =====================
DO $$
DECLARE
  apt_id uuid := 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
BEGIN
  DELETE FROM public.test_question_options WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = apt_id);
  DELETE FROM public.test_questions WHERE instrument_id = apt_id;

  UPDATE public.test_instruments SET
    description = 'Tes kemampuan kognitif standar nasional: Numerik, Verbal, dan Logical Reasoning',
    question_count = 60, duration_minutes = 60, scoring_method = 'correct_only'
  WHERE id = apt_id;
END $$;

CREATE OR REPLACE FUNCTION public._seed_apt(
  p_inst uuid, p_no int, p_cat text, p_text text, p_subtest text,
  p_a text, p_b text, p_c text, p_d text, p_correct char
) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE qid uuid;
BEGIN
  INSERT INTO public.test_questions (instrument_id, question_number, question_text, category, question_type, scoring_rule, subtest_code, time_limit_minutes)
  VALUES (p_inst, p_no, p_text, p_cat, 'single_choice', 'correct_only', p_subtest, 20)
  RETURNING id INTO qid;
  INSERT INTO public.test_question_options (question_id, option_label, option_text, score_value, is_correct, display_order) VALUES
    (qid, 'A', p_a, CASE WHEN p_correct='A' THEN 1 ELSE 0 END, p_correct='A', 1),
    (qid, 'B', p_b, CASE WHEN p_correct='B' THEN 1 ELSE 0 END, p_correct='B', 2),
    (qid, 'C', p_c, CASE WHEN p_correct='C' THEN 1 ELSE 0 END, p_correct='C', 3),
    (qid, 'D', p_d, CASE WHEN p_correct='D' THEN 1 ELSE 0 END, p_correct='D', 4);
END $fn$;

-- Numerik 1-20
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 1, 'Numerik', 'Berapakah hasil dari 12 + 8 × 3?', 'NUM', '36', '60', '54', '32', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 2, 'Numerik', 'Lanjutkan deret: 2, 4, 8, 16, ...', 'NUM', '20', '24', '32', '64', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 3, 'Numerik', 'Jika 3x + 5 = 20, berapakah nilai x?', 'NUM', '3', '5', '7', '15', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 4, 'Numerik', '25% dari 240 adalah?', 'NUM', '40', '50', '60', '80', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 5, 'Numerik', 'Lanjutkan deret: 1, 4, 9, 16, 25, ...', 'NUM', '30', '36', '42', '49', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 6, 'Numerik', 'Sebuah barang dijual Rp 120.000 dengan diskon 25%. Berapa harga awalnya?', 'NUM', 'Rp 150.000', 'Rp 160.000', 'Rp 144.000', 'Rp 180.000', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 7, 'Numerik', 'Rata-rata dari 12, 18, 24, dan 30 adalah?', 'NUM', '20', '21', '22', '24', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 8, 'Numerik', 'Lanjutkan deret: 5, 10, 20, 40, ...', 'NUM', '60', '70', '80', '100', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 9, 'Numerik', 'Jika 5 pekerja menyelesaikan tugas dalam 12 hari, berapa hari untuk 6 pekerja?', 'NUM', '8', '10', '11', '14', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 10, 'Numerik', '2/3 dari 90 adalah?', 'NUM', '45', '50', '60', '75', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 11, 'Numerik', 'Lanjutkan deret: 100, 95, 85, 70, ...', 'NUM', '50', '55', '60', '65', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 12, 'Numerik', 'Berapa hasil dari (15² − 5²)?', 'NUM', '100', '150', '200', '250', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 13, 'Numerik', 'Sebuah segitiga memiliki alas 12 cm dan tinggi 8 cm. Luasnya?', 'NUM', '40 cm²', '48 cm²', '56 cm²', '96 cm²', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 14, 'Numerik', 'Hasil dari √144 + √64 adalah?', 'NUM', '16', '18', '20', '22', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 15, 'Numerik', 'Lanjutkan deret: 3, 6, 12, 24, ...', 'NUM', '36', '42', '48', '60', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 16, 'Numerik', 'Jika harga 3 buku Rp 45.000, berapa harga 7 buku?', 'NUM', 'Rp 90.000', 'Rp 95.000', 'Rp 100.000', 'Rp 105.000', 'D');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 17, 'Numerik', 'Berapa persen 18 dari 72?', 'NUM', '20%', '25%', '30%', '40%', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 18, 'Numerik', 'Lanjutkan deret: 1, 1, 2, 3, 5, 8, ...', 'NUM', '11', '12', '13', '14', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 19, 'Numerik', 'Sebuah kendaraan menempuh 240 km dalam 4 jam. Kecepatan rata-ratanya?', 'NUM', '50 km/jam', '55 km/jam', '60 km/jam', '70 km/jam', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 20, 'Numerik', 'Jika a = 3 dan b = 4, hitung a² + b².', 'NUM', '7', '12', '25', '49', 'C');

-- Verbal 21-40
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 21, 'Verbal', 'Sinonim kata "ABSURD" adalah ...', 'VRB', 'Mustahil', 'Mustahil masuk akal', 'Tidak masuk akal', 'Lucu', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 22, 'Verbal', 'Antonim kata "MUTAKHIR" adalah ...', 'VRB', 'Modern', 'Kuno', 'Canggih', 'Baru', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 23, 'Verbal', 'Sinonim kata "RANCU" adalah ...', 'VRB', 'Jelas', 'Kacau', 'Rapi', 'Cermat', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 24, 'Verbal', 'Antonim kata "PROGRESIF" adalah ...', 'VRB', 'Maju', 'Konservatif', 'Liberal', 'Reformis', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 25, 'Verbal', 'Padanan: DOKTER : RUMAH SAKIT = GURU : ...', 'VRB', 'Murid', 'Buku', 'Sekolah', 'Kelas', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 26, 'Verbal', 'Padanan: BURUNG : TERBANG = IKAN : ...', 'VRB', 'Renang', 'Berenang', 'Air', 'Insang', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 27, 'Verbal', 'Sinonim kata "DAUR" adalah ...', 'VRB', 'Siklus', 'Acak', 'Permulaan', 'Akhir', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 28, 'Verbal', 'Antonim kata "KAPABEL" adalah ...', 'VRB', 'Mampu', 'Tidak mampu', 'Cakap', 'Pandai', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 29, 'Verbal', 'Padanan: DINGIN : BEKU = PANAS : ...', 'VRB', 'Hangat', 'Cair', 'Mendidih', 'Gerah', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 30, 'Verbal', 'Sinonim kata "LIHAI" adalah ...', 'VRB', 'Bodoh', 'Pintar', 'Lambat', 'Ceroboh', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 31, 'Verbal', 'Antonim kata "GANDA" adalah ...', 'VRB', 'Rangkap', 'Kembar', 'Tunggal', 'Berlipat', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 32, 'Verbal', 'Padanan: PADI : SAWAH = JAGUNG : ...', 'VRB', 'Ladang', 'Hutan', 'Kebun', 'Pantai', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 33, 'Verbal', 'Sinonim kata "RELASI" adalah ...', 'VRB', 'Hubungan', 'Permusuhan', 'Persaingan', 'Pemisahan', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 34, 'Verbal', 'Antonim kata "PRIMER" adalah ...', 'VRB', 'Utama', 'Sekunder', 'Pokok', 'Awal', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 35, 'Verbal', 'Padanan: PENA : MENULIS = PISAU : ...', 'VRB', 'Tajam', 'Memotong', 'Dapur', 'Bahaya', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 36, 'Verbal', 'Sinonim kata "PROMINEN" adalah ...', 'VRB', 'Tersembunyi', 'Terkemuka', 'Biasa', 'Sederhana', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 37, 'Verbal', 'Antonim kata "EFEKTIF" adalah ...', 'VRB', 'Berhasil', 'Tepat', 'Sia-sia', 'Cepat', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 38, 'Verbal', 'Padanan: BUKU : PERPUSTAKAAN = BAJU : ...', 'VRB', 'Tubuh', 'Lemari', 'Toko', 'Penjahit', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 39, 'Verbal', 'Sinonim kata "EVAKUASI" adalah ...', 'VRB', 'Penyelamatan', 'Penyerangan', 'Pengepungan', 'Pengasingan', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 40, 'Verbal', 'Antonim kata "EKSTRAVAGAN" adalah ...', 'VRB', 'Boros', 'Mewah', 'Hemat', 'Royal', 'C');

-- Logical 41-60
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 41, 'Logical', 'Semua mahasiswa rajin belajar. Andi mahasiswa. Maka ...', 'LOG', 'Andi tidak rajin', 'Andi rajin belajar', 'Andi mungkin rajin', 'Tidak dapat disimpulkan', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 42, 'Logical', 'Semua mamalia bernapas. Paus adalah mamalia. Maka ...', 'LOG', 'Paus tidak bernapas', 'Paus bernapas', 'Paus bernapas dengan insang', 'Tidak dapat disimpulkan', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 43, 'Logical', 'Jika hari hujan, jalan akan basah. Hari ini hujan. Maka ...', 'LOG', 'Jalan basah', 'Jalan kering', 'Tidak hujan', 'Tidak dapat disimpulkan', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 44, 'Logical', 'Tidak ada burung yang menyusui. Ayam adalah burung. Maka ...', 'LOG', 'Ayam menyusui', 'Ayam tidak menyusui', 'Ayam mamalia', 'Tidak dapat disimpulkan', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 45, 'Logical', 'Semua A adalah B. Sebagian B adalah C. Maka ...', 'LOG', 'Semua A adalah C', 'Tidak ada A yang C', 'Sebagian A mungkin C', 'A bukan B', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 46, 'Logical', 'Lanjutkan deret huruf: A, C, E, G, ...', 'LOG', 'H', 'I', 'J', 'K', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 47, 'Logical', 'Lanjutkan deret huruf: B, D, G, K, ...', 'LOG', 'O', 'P', 'Q', 'R', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 48, 'Logical', 'Jika 5 ⊕ 3 = 16 dan 6 ⊕ 2 = 16, maka 7 ⊕ 5 = ...', 'LOG', '24', '36', '48', '60', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 49, 'Logical', 'Ali lebih tinggi dari Budi. Budi lebih tinggi dari Cici. Maka ...', 'LOG', 'Cici tertinggi', 'Ali tertinggi', 'Sama tinggi', 'Tidak dapat disimpulkan', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 50, 'Logical', 'Jika P > Q, Q > R, dan R > S, maka ...', 'LOG', 'P > S', 'P < S', 'P = S', 'Tidak dapat disimpulkan', 'A');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 51, 'Logical', 'Pernyataan: "Semua kucing memiliki ekor". Kontrapositif yang benar adalah ...', 'LOG', 'Semua yang berekor adalah kucing', 'Yang tidak berekor bukan kucing', 'Sebagian kucing tidak berekor', 'Tidak ada kucing tanpa ekor', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 52, 'Logical', 'Lanjutkan deret: Z, X, V, T, ...', 'LOG', 'P', 'Q', 'R', 'S', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 53, 'Logical', 'Hari ini Senin. 100 hari dari sekarang adalah hari ...', 'LOG', 'Sabtu', 'Minggu', 'Selasa', 'Rabu', 'D');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 54, 'Logical', 'Jika 2 = 6, 3 = 12, 4 = 20, maka 5 = ...', 'LOG', '25', '28', '30', '35', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 55, 'Logical', 'Yang tidak termasuk kelompok: Apel, Jeruk, Wortel, Mangga.', 'LOG', 'Apel', 'Jeruk', 'Wortel', 'Mangga', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 56, 'Logical', 'Lanjutkan deret: 1, 3, 6, 10, 15, ...', 'LOG', '18', '20', '21', '24', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 57, 'Logical', 'Pernyataan benar: "Jika belajar maka lulus". Maka jika tidak lulus, ...', 'LOG', 'Pasti belajar', 'Pasti tidak belajar', 'Mungkin belajar', 'Tidak dapat disimpulkan', 'B');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 58, 'Logical', 'Yang tidak termasuk kelompok: Persegi, Lingkaran, Segitiga, Kubus.', 'LOG', 'Persegi', 'Lingkaran', 'Segitiga', 'Kubus', 'D');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 59, 'Logical', 'A 2× usia B. 5 tahun lalu, A 3× usia B. Berapa usia A sekarang?', 'LOG', '15', '18', '20', '24', 'C');
SELECT public._seed_apt('f1a98323-cc96-4c91-95bf-1ee103ec8042', 60, 'Logical', 'Lanjutkan: AZ, BY, CX, ...', 'LOG', 'DV', 'DW', 'EW', 'DX', 'B');

DROP FUNCTION public._seed_apt(uuid, int, text, text, text, text, text, text, text, char);


-- ===================== CFIT 3A (50 placeholder) =====================
DO $$
DECLARE
  cfit_id uuid := 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';
BEGIN
  DELETE FROM public.test_question_options WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = cfit_id);
  DELETE FROM public.test_questions WHERE instrument_id = cfit_id;

  UPDATE public.test_instruments SET
    description = 'Culture Fair Intelligence Test 3A — 4 subtes bergambar (Series, Classifications, Matrices, Conditions). Upload gambar via Bank Soal.',
    question_count = 50, duration_minutes = 13, scoring_method = 'correct_only'
  WHERE id = cfit_id;
END $$;

CREATE OR REPLACE FUNCTION public._seed_cfit(
  p_inst uuid, p_no int, p_subtest text, p_text text, p_time int, p_correct char
) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE qid uuid; opts char[] := ARRAY['A','B','C','D','E']::char[]; lbl char;
BEGIN
  INSERT INTO public.test_questions (instrument_id, question_number, question_text, category, question_type, scoring_rule, subtest_code, time_limit_minutes)
  VALUES (p_inst, p_no, p_text, p_subtest, 'single_choice', 'correct_only', p_subtest, p_time)
  RETURNING id INTO qid;
  FOREACH lbl IN ARRAY opts LOOP
    INSERT INTO public.test_question_options (question_id, option_label, option_text, score_value, is_correct, display_order)
    VALUES (qid, lbl, 'Pilihan ' || lbl, CASE WHEN lbl = p_correct THEN 1 ELSE 0 END, lbl = p_correct,
      CASE lbl WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 ELSE 5 END);
  END LOOP;
END $fn$;

DO $$
DECLARE i int; correct char;
BEGIN
  FOR i IN 1..13 LOOP
    correct := (ARRAY['A','B','C','D','E'])[((i-1) % 5) + 1];
    PERFORM public._seed_cfit('bf822dab-dc32-45c9-b6d4-2b92c3a6e847', i, 'SERIES',
      'Test 1 — Series. Pilih gambar yang melanjutkan pola pada deret di samping.', 3, correct);
  END LOOP;
  FOR i IN 14..27 LOOP
    correct := (ARRAY['A','B','C','D','E'])[((i-14) % 5) + 1];
    PERFORM public._seed_cfit('bf822dab-dc32-45c9-b6d4-2b92c3a6e847', i, 'CLASSIFICATIONS',
      'Test 2 — Classifications. Pilih satu gambar yang TIDAK termasuk dalam kelompok.', 4, correct);
  END LOOP;
  FOR i IN 28..40 LOOP
    correct := (ARRAY['A','B','C','D','E'])[((i-28) % 5) + 1];
    PERFORM public._seed_cfit('bf822dab-dc32-45c9-b6d4-2b92c3a6e847', i, 'MATRICES',
      'Test 3 — Matrices. Pilih gambar yang melengkapi pola matriks di samping.', 3, correct);
  END LOOP;
  FOR i IN 41..50 LOOP
    correct := (ARRAY['A','B','C','D','E'])[((i-41) % 5) + 1];
    PERFORM public._seed_cfit('bf822dab-dc32-45c9-b6d4-2b92c3a6e847', i, 'CONDITIONS',
      'Test 4 — Conditions. Pilih gambar yang memenuhi kondisi/aturan yang ditunjukkan oleh pola di samping.', 3, correct);
  END LOOP;
END $$;

DROP FUNCTION public._seed_cfit(uuid, int, text, text, int, char);


-- ===================== IST: tambah 4 GE placeholder agar 20 (standar) =====================
DO $$
DECLARE
  ist_id uuid := '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';
  max_no int;
  qid uuid;
  i int;
BEGIN
  SELECT COALESCE(MAX(question_number), 0) INTO max_no FROM public.test_questions WHERE instrument_id = ist_id;
  FOR i IN 1..4 LOOP
    INSERT INTO public.test_questions (instrument_id, question_number, question_text, category, question_type, scoring_rule, subtest_code, time_limit_minutes)
    VALUES (ist_id, max_no + i, 'GE — Soal tambahan. Tentukan dua kata yang tergolong satu kelompok yang sama.', 'GE', 'single_choice', 'correct_only', 'GE', 8)
    RETURNING id INTO qid;
    INSERT INTO public.test_question_options (question_id, option_label, option_text, score_value, is_correct, display_order) VALUES
      (qid, 'A', 'Pilihan A', 1, true, 1),
      (qid, 'B', 'Pilihan B', 0, false, 2),
      (qid, 'C', 'Pilihan C', 0, false, 3),
      (qid, 'D', 'Pilihan D', 0, false, 4),
      (qid, 'E', 'Pilihan E', 0, false, 5);
  END LOOP;
END $$;

-- Update GE existing yang time_limit nya 8 menit (sudah benar) tetap, dan pastikan question_count 180
UPDATE public.test_instruments SET question_count = 180 WHERE id = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';