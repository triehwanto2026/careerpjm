-- Add Kraepelin 2 result fields to test_results
ALTER TABLE public.test_results 
  ADD COLUMN IF NOT EXISTS instrument_id UUID REFERENCES public.test_instruments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS speed_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accuracy_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stability_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS work_capacity NUMERIC DEFAULT 0;

-- Create test_result_details table (per-minute/segment results for Kraepelin)
CREATE TABLE IF NOT EXISTS public.test_result_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_result_id UUID NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL DEFAULT 1,
  questions_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  speed_per_minute NUMERIC DEFAULT 0,
  accuracy_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_result_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on test_result_details"
  ON public.test_result_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create test_interpretations table (norms and interpretation ranges)
CREATE TABLE IF NOT EXISTS public.test_interpretations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES public.test_instruments(id) ON DELETE CASCADE,
  interpretation_key TEXT NOT NULL,
  interpretation_text TEXT NOT NULL,
  interpretation_text_en TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_interpretations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on test_interpretations"
  ON public.test_interpretations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read test_interpretations"
  ON public.test_interpretations FOR SELECT TO anon USING (true);

-- Add kraepelin-specific answer fields to test_answers
ALTER TABLE public.test_answers
  ADD COLUMN IF NOT EXISTS typed_answer TEXT,
  ADD COLUMN IF NOT EXISTS expected_answer TEXT,
  ADD COLUMN IF NOT EXISTS reaction_time_ms INTEGER;

-- Insert Kraepelin 2 interpretations (Speed-Accuracy norms)
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['speed', 'speed', 'speed', 'speed', 'speed']) as interpretation_key,
  unnest(ARRAY[
    'Kecepatan sangat rendah. Perlu latihan intensif dalam kecepatan kerja.',
    'Kecepatan rendah. Perlu peningkatan dalam kecepatan pemrosesan informasi.',
    'Kecepatan rata-rata. Cukup untuk pekerjaan standar.',
    'Kecepatan tinggi. Mampu bekerja dengan cepat dan efisien.',
    'Kecepatan sangat tinggi. Unggul dalam pekerjaan yang membutuhkan kecepatan.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Speed is very low. Needs intensive training in work speed.',
    'Speed is low. Needs improvement in information processing speed.',
    'Average speed. Sufficient for standard work.',
    'High speed. Able to work fast and efficiently.',
    'Very high speed. Excellent in jobs requiring speed.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name = 'Kraepelin 2';

INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['accuracy', 'accuracy', 'accuracy', 'accuracy', 'accuracy']) as interpretation_key,
  unnest(ARRAY[
    'Ketelitian sangat rendah. Banyak kesalahan, perlu perhatian khusus terhadap detail.',
    'Ketelitian rendah. Terdapat kesalahan yang signifikan dalam pekerjaan.',
    'Ketelitian rata-rata. Cukup untuk pekerjaan yang memerlukan akurasi moderat.',
    'Ketelitian tinggi. Mampu bekerja dengan presisi dan minim kesalahan.',
    'Ketelitian sangat tinggi. Sangat teliti dan akurat dalam pekerjaan.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Accuracy is very low. Many errors, needs special attention to detail.',
    'Accuracy is low. Significant errors in work.',
    'Average accuracy. Sufficient for work requiring moderate accuracy.',
    'High accuracy. Able to work with precision and minimal errors.',
    'Very high accuracy. Very meticulous and accurate in work.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name = 'Kraepelin 2';

INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['stability', 'stability', 'stability', 'stability', 'stability']) as interpretation_key,
  unnest(ARRAY[
    'Stabilitas sangat rendah. Kinerja menurun drastis seiring waktu.',
    'Stabilitas rendah. Kinerja cenderung menurun dalam periode kerja panjang.',
    'Stabilitas rata-rata. Konsistensi cukup untuk pekerjaan standar.',
    'Stabilitas tinggi. Mampu menjaga konsistensi kinerja dalam waktu lama.',
    'Stabilitas sangat tinggi. Kinerja tetap optimal bahkan dalam kerja berjam-jam.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Stability is very low. Performance drops drastically over time.',
    'Stability is low. Performance tends to decrease over long work periods.',
    'Average stability. Sufficient consistency for standard work.',
    'High stability. Able to maintain consistent performance for long periods.',
    'Very high stability. Optimal performance even in hours-long work.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name = 'Kraepelin 2';

INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['work_capacity', 'work_capacity', 'work_capacity', 'work_capacity', 'work_capacity']) as interpretation_key,
  unnest(ARRAY[
    'Kapasitas kerja sangat rendah. Tidak cocok untuk pekerjaan klerikal.',
    'Kapasitas kerja rendah. Hanya cocok untuk pekerjaan sederhana dengan supervisi.',
    'Kapasitas kerja rata-rata. Cukup untuk pekerjaan administrasi standar.',
    'Kapasitas kerja tinggi. Cocok untuk pekerjaan klerikal kompleks dan multitasking.',
    'Kapasitas kerja sangat tinggi. Ideal untuk posisi yang menuntut produktivitas tinggi.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Work capacity is very low. Not suitable for clerical work.',
    'Low work capacity. Only suitable for simple work with supervision.',
    'Average work capacity. Sufficient for standard administrative work.',
    'High work capacity. Suitable for complex clerical work and multitasking.',
    'Very high work capacity. Ideal for positions demanding high productivity.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name = 'Kraepelin 2';
