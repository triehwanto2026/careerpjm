
-- 1. Fix RLS: izinkan anon untuk INSERT/DELETE activation_codes (admin login custom, bukan Supabase Auth)
CREATE POLICY "Allow anon to insert activation_codes"
ON public.activation_codes FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to delete activation_codes"
ON public.activation_codes FOR DELETE TO anon USING (true);

-- 2. Fix RLS test_instruments: anon bisa CRUD penuh (admin pakai custom auth)
CREATE POLICY "Allow anon to read all test_instruments"
ON public.test_instruments FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to insert test_instruments"
ON public.test_instruments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update test_instruments"
ON public.test_instruments FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete test_instruments"
ON public.test_instruments FOR DELETE TO anon USING (true);

-- 3. Fix RLS candidates: anon bisa update/delete
CREATE POLICY "Allow anon to update candidates"
ON public.candidates FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete candidates"
ON public.candidates FOR DELETE TO anon USING (true);

-- 4. Buat tabel test_questions: soal per instrumen
CREATE TABLE public.test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES public.test_instruments(id) ON DELETE CASCADE,
  question_number integer NOT NULL DEFAULT 1,
  question_text text NOT NULL,
  question_text_en text DEFAULT '',
  category text DEFAULT '',
  question_type text NOT NULL DEFAULT 'single_choice', -- single_choice, multi_choice, likert, true_false, text
  scoring_rule text DEFAULT 'sum', -- sum, ipsative, weighted
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Buat tabel test_question_options: opsi jawaban + bobot
CREATE TABLE public.test_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  option_label text NOT NULL,        -- A, B, C, D atau teks bebas
  option_text text NOT NULL,         -- isi pilihan ID
  option_text_en text DEFAULT '',
  score_value numeric NOT NULL DEFAULT 0,  -- bobot/skor
  category_target text DEFAULT '',   -- dimensi yang ditambah skornya (DISC: D/I/S/C, MBTI: E/I dll)
  is_correct boolean DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_test_questions_instrument ON public.test_questions(instrument_id);
CREATE INDEX idx_test_question_options_question ON public.test_question_options(question_id);

-- RLS
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test_questions" ON public.test_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert test_questions" ON public.test_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can update test_questions" ON public.test_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete test_questions" ON public.test_questions FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read test_question_options" ON public.test_question_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert test_question_options" ON public.test_question_options FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can update test_question_options" ON public.test_question_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete test_question_options" ON public.test_question_options FOR DELETE TO anon, authenticated USING (true);

-- Trigger updated_at
CREATE TRIGGER update_test_questions_updated_at
BEFORE UPDATE ON public.test_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
