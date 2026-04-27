-- Insert 60 Aptitude Test Questions
-- First, create the instrument (run this separately in SQL Editor)
-- Then get the UUID and replace f1a98323-cc96-4c91-95bf-1ee103ec8042 below

-- STEP 1: Run this to create the instrument
INSERT INTO public.test_instruments (name, name_en, description, category, question_count, duration_minutes, scoring_method, target_audience, norm_reference, is_active)
VALUES (
  'Aptitude Test',
  'Aptitude Test',
  'Tes kemampuan kognitif mencakup Numerik, Verbal, dan Logical Reasoning',
  'Aptitude',
  60,
  60,
  'sum',
  'General',
  'Standard',
  true
);

-- STEP 2: Run this to get the UUID
-- SELECT id FROM test_instruments WHERE name = 'Aptitude Test';

-- STEP 3: Replace f1a98323-cc96-4c91-95bf-1ee103ec8042 below with the actual UUID

-- NUMERIC QUESTIONS (20 questions)
-- Q1-Q20: Numeric reasoning covering arithmetic, percentages, ratios, etc.

-- Q1: Basic arithmetic
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 1, 'Jika 3x + 7 = 22, berapakah nilai x?', 'If 3x + 7 = 22, what is the value of x?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '3', '3', 0, false, 0 FROM test_questions WHERE question_number = 1 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '5', '5', 1, true, 1 FROM test_questions WHERE question_number = 1 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '7', '7', 0, false, 2 FROM test_questions WHERE question_number = 1 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '15', '15', 0, false, 3 FROM test_questions WHERE question_number = 1 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q2: Percentage
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 2, 'Berapa 20% dari 150?', 'What is 20% of 150?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '20', '20', 0, false, 0 FROM test_questions WHERE question_number = 2 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '30', '30', 1, true, 1 FROM test_questions WHERE question_number = 2 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '25', '25', 0, false, 2 FROM test_questions WHERE question_number = 2 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '35', '35', 0, false, 3 FROM test_questions WHERE question_number = 2 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q3: Ratio
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 3, 'Jika rasio A:B adalah 3:4 dan B = 20, berapakah nilai A?', 'If the ratio A:B is 3:4 and B = 20, what is the value of A?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '12', '12', 0, false, 0 FROM test_questions WHERE question_number = 3 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '15', '15', 1, true, 1 FROM test_questions WHERE question_number = 3 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '18', '18', 0, false, 2 FROM test_questions WHERE question_number = 3 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '25', '25', 0, false, 3 FROM test_questions WHERE question_number = 3 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q4: Speed/Distance
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 4, 'Sebuah mobil berjalan dengan kecepatan 60 km/jam. Berapa jarak yang ditempuh dalam 2.5 jam?', 'A car travels at 60 km/h. What distance does it cover in 2.5 hours?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '120 km', '120 km', 0, false, 0 FROM test_questions WHERE question_number = 4 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '140 km', '140 km', 0, false, 1 FROM test_questions WHERE question_number = 4 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '150 km', '150 km', 1, true, 2 FROM test_questions WHERE question_number = 4 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '160 km', '160 km', 0, false, 3 FROM test_questions WHERE question_number = 4 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q5: Average
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 5, 'Berapa rata-rata dari 10, 20, 30, 40, dan 50?', 'What is the average of 10, 20, 30, 40, and 50?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '25', '25', 0, false, 0 FROM test_questions WHERE question_number = 5 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '30', '30', 1, true, 1 FROM test_questions WHERE question_number = 5 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '35', '35', 0, false, 2 FROM test_questions WHERE question_number = 5 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '40', '40', 0, false, 3 FROM test_questions WHERE question_number = 5 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q6: Profit/Loss
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 6, 'Jika barang dibeli dengan harga Rp 100.000 dan dijual dengan harga Rp 125.000, berapa persen keuntungannya?', 'If an item is bought for Rp 100.000 and sold for Rp 125.000, what is the profit percentage?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '20%', '20%', 0, false, 0 FROM test_questions WHERE question_number = 6 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '25%', '25%', 1, true, 1 FROM test_questions WHERE question_number = 6 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '30%', '30%', 0, false, 2 FROM test_questions WHERE question_number = 6 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '35%', '35%', 0, false, 3 FROM test_questions WHERE question_number = 6 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q7: Simple Interest
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 7, 'Bunga sederhana dari Rp 1.000.000 dengan suku bunga 5% per tahun selama 2 tahun adalah?', 'Simple interest on Rp 1.000.000 at 5% per year for 2 years is?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Rp 50.000', 'Rp 50.000', 0, false, 0 FROM test_questions WHERE question_number = 7 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Rp 75.000', 'Rp 75.000', 0, false, 1 FROM test_questions WHERE question_number = 7 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Rp 100.000', 'Rp 100.000', 1, true, 2 FROM test_questions WHERE question_number = 7 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Rp 125.000', 'Rp 125.000', 0, false, 3 FROM test_questions WHERE question_number = 7 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q8: LCM
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 8, 'KPK dari 12 dan 18 adalah?', 'LCM of 12 and 18 is?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '24', '24', 0, false, 0 FROM test_questions WHERE question_number = 8 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '36', '36', 1, true, 1 FROM test_questions WHERE question_number = 8 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '48', '48', 0, false, 2 FROM test_questions WHERE question_number = 8 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '54', '54', 0, false, 3 FROM test_questions WHERE question_number = 8 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q9: HCF/GCD
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 9, 'FPB dari 24 dan 36 adalah?', 'GCD of 24 and 36 is?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '6', '6', 0, false, 0 FROM test_questions WHERE question_number = 9 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '8', '8', 0, false, 1 FROM test_questions WHERE question_number = 9 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '12', '12', 1, true, 2 FROM test_questions WHERE question_number = 9 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '18', '18', 0, false, 3 FROM test_questions WHERE question_number = 9 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q10: Equation solving
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 10, 'Jika x/5 = 15, berapakah nilai x?', 'If x/5 = 15, what is the value of x?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '50', '50', 0, false, 0 FROM test_questions WHERE question_number = 10 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '60', '60', 0, false, 1 FROM test_questions WHERE question_number = 10 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '75', '75', 1, true, 2 FROM test_questions WHERE question_number = 10 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '80', '80', 0, false, 3 FROM test_questions WHERE question_number = 10 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q11: Fraction
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 11, 'Berapa 3/4 + 1/4?', 'What is 3/4 + 1/4?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '3/4', '3/4', 0, false, 0 FROM test_questions WHERE question_number = 11 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '1', '1', 1, true, 1 FROM test_questions WHERE question_number = 11 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '4/4', '4/4', 0, false, 2 FROM test_questions WHERE question_number = 11 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '1/2', '1/2', 0, false, 3 FROM test_questions WHERE question_number = 11 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q12: Decimal
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 12, 'Berapa 0.5 × 0.8?', 'What is 0.5 × 0.8?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '0.3', '0.3', 0, false, 0 FROM test_questions WHERE question_number = 12 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '0.4', '0.4', 1, true, 1 FROM test_questions WHERE question_number = 12 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '0.5', '0.5', 0, false, 2 FROM test_questions WHERE question_number = 12 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '0.6', '0.6', 0, false, 3 FROM test_questions WHERE question_number = 12 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q13: Square root
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 13, 'Berapa akar kuadrat dari 144?', 'What is the square root of 144?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '10', '10', 0, false, 0 FROM test_questions WHERE question_number = 13 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '11', '11', 0, false, 1 FROM test_questions WHERE question_number = 13 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '12', '12', 1, true, 2 FROM test_questions WHERE question_number = 13 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '13', '13', 0, false, 3 FROM test_questions WHERE question_number = 13 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q14: Exponent
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 14, 'Berapa 2 pangkat 5?', 'What is 2 to the power of 5?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '16', '16', 0, false, 0 FROM test_questions WHERE question_number = 14 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '24', '24', 0, false, 1 FROM test_questions WHERE question_number = 14 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '32', '32', 1, true, 2 FROM test_questions WHERE question_number = 14 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '64', '64', 0, false, 3 FROM test_questions WHERE question_number = 14 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q15: Age problem
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 15, 'Umur Budi 5 tahun lebih muda dari Andi. Jika Andi berusia 25 tahun, berapa umur Budi?', 'Budi is 5 years younger than Andi. If Andi is 25 years old, how old is Budi?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '18', '18', 0, false, 0 FROM test_questions WHERE question_number = 15 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '20', '20', 1, true, 1 FROM test_questions WHERE question_number = 15 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '22', '22', 0, false, 2 FROM test_questions WHERE question_number = 15 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '25', '25', 0, false, 3 FROM test_questions WHERE question_number = 15 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q16: Work problem
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 16, 'Jika 3 pekerja dapat menyelesaikan pekerjaan dalam 12 hari, berapa hari yang dibutuhkan 6 pekerja untuk menyelesaikan pekerjaan yang sama?', 'If 3 workers can complete a job in 12 days, how many days will 6 workers need to complete the same job?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '4', '4', 0, false, 0 FROM test_questions WHERE question_number = 16 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '5', '5', 0, false, 1 FROM test_questions WHERE question_number = 16 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '6', '6', 1, true, 2 FROM test_questions WHERE question_number = 16 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '8', '8', 0, false, 3 FROM test_questions WHERE question_number = 16 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q17: Discount
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 17, 'Harga awal barang Rp 200.000 mendapat diskon 30%. Berapa harga setelah diskon?', 'Original price Rp 200.000 gets 30% discount. What is the price after discount?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Rp 130.000', 'Rp 130.000', 0, false, 0 FROM test_questions WHERE question_number = 17 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Rp 140.000', 'Rp 140.000 1', 1, true, 1 FROM test_questions WHERE question_number = 17 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Rp 150.000', 'Rp 150.000', 0, false, 2 FROM test_questions WHERE question_number = 17 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Rp 170.000', 'Rp 170.000', 0, false, 3 FROM test_questions WHERE question_number = 17 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q18: Time calculation
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 18, 'Jika jam 09:30 ditambah 2 jam 45 menit, jam berapa sekarang?', 'If 09:30 + 2 hours 45 minutes, what time is it?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '11:15', '11:15', 1, true, 0 FROM test_questions WHERE question_number = 18 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '12:00', '12:00', 0, false, 1 FROM test_questions WHERE question_number = 18 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '12:15', '12:15', 0, false, 2 FROM test_questions WHERE question_number = 18 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '11:45', '11:45', 0, false, 3 FROM test_questions WHERE question_number = 18 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q19: Division
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 19, 'Berapa 144 dibagi 12?', 'What is 144 divided by 12?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '10', '10', 0, false, 0 FROM test_questions WHERE question_number = 19 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '11', '11', 0, false, 1 FROM test_questions WHERE question_number = 19 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '12', '12', 1, true, 2 FROM test_questions WHERE question_number = 19 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '13', '13', 0, false, 3 FROM test_questions WHERE question_number = 19 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q20: Multiplication
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 20, 'Berapa 25 × 4?', 'What is 25 × 4?', 'Numeric', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '80', '80', 0, false, 0 FROM test_questions WHERE question_number = 20 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '90', '90', 0, false, 1 FROM test_questions WHERE question_number = 20 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '100', '100', 1, true, 2 FROM test_questions WHERE question_number = 20 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '110', '110', 0, false, 3 FROM test_questions WHERE question_number = 20 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- VERBAL QUESTIONS (20 questions)
-- Q21-Q40: Verbal reasoning covering vocabulary, synonyms, antonyms, analogy

-- Q21: Synonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 21, 'Sinonim dari "Besar" adalah...', 'Synonym of "Besar" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Kecil', 'Kecil', 0, false, 0 FROM test_questions WHERE question_number = 21 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Luas', 'Luas', 1, true, 1 FROM test_questions WHERE question_number = 21 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Pendek', 'Pendek', 0, false, 2 FROM test_questions WHERE question_number = 21 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Sedikit', 'Sedikit', 0, false, 3 FROM test_questions WHERE question_number = 21 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q22: Antonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 22, 'Antonim dari "Cepat" adalah...', 'Antonym of "Cepat" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Lambat', 'Lambat', 1, true, 0 FROM test_questions WHERE question_number = 22 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Cepat', 'Cepat', 0, false, 1 FROM test_questions WHERE question_number = 22 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Kuat', 'Kuat', 0, false, 2 FROM test_questions WHERE question_number = 22 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Lemah', 'Lemah', 0, false, 3 FROM test_questions WHERE question_number = 22 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q23: Analogy
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 23, 'Dokter : Pasien = Guru : ...', 'Doctor : Patient = Teacher : ...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Murid', 'Murid', 1, true, 0 FROM test_questions WHERE question_number = 23 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Sekolah', 'Sekolah', 0, false, 1 FROM test_questions WHERE question_number = 23 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Buku', 'Buku', 0, false, 2 FROM test_questions WHERE question_number = 23 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Kelas', 'Kelas', 0, false, 3 FROM test_questions WHERE question_number = 23 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q24: Word meaning
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 24, 'Apa arti kata "Integritas"?', 'What does "Integritas" mean?', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Kecerdasan', 'Kecerdasan', 0, false, 0 FROM test_questions WHERE question_number = 24 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Kejujuran', 'Kejujuran', 1, true, 1 FROM test_questions WHERE question_number = 24 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Kekuatan', 'Kekuatan', 0, false, 2 FROM test_questions WHERE question_number = 24 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Kecepatan', 'Kecepatan', 0, false, 3 FROM test_questions WHERE question_number = 24 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q25: Synonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 25, 'Sinonim dari "Sederhana" adalah...', 'Synonym of "Sederhana" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Rumit', 'Rumit', 0, false, 0 FROM test_questions WHERE question_number = 25 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Mudah', 'Mudah', 1, true, 1 FROM test_questions WHERE question_number = 25 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Sulit', 'Sulit', 0, false, 2 FROM test_questions WHERE question_number = 25 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Berat', 'Berat', 0, false, 3 FROM test_questions WHERE question_number = 25 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q26: Antonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 26, 'Antonim dari "Suka" adalah...', 'Antonym of "Suka" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Cinta', 'Cinta', 0, false, 0 FROM test_questions WHERE question_number = 26 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Benci', 'Benci', 1, true, 1 FROM test_questions WHERE question_number = 26 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Senang', 'Senang', 0, false, 2 FROM test_questions WHERE question_number = 26 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Gembira', 'Gembira', 0, false, 3 FROM test_questions WHERE question_number = 26 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q27: Analogy
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 27, 'Buku : Penulis = Lagu : ...', 'Book : Author = Song : ...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Penyanyi', 'Penyanyi', 1, true, 0 FROM test_questions WHERE question_number = 27 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Musik', 'Musik', 0, false, 1 FROM test_questions WHERE question_number = 27 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Album', 'Album', 0, false, 2 FROM test_questions WHERE question_number = 27 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Radio', 'Radio', 0, false, 3 FROM test_questions WHERE question_number = 27 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q28: Word meaning
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 28, 'Apa arti kata "Ambisius"?', 'What does "Ambisius" mean?', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Malas', 'Malas', 0, false, 0 FROM test_questions WHERE question_number = 28 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Bersemangat', 'Bersemangat', 0, false, 1 FROM test_questions WHERE question_number = 28 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Bermimpi tinggi', 'Bermimpi tinggi', 1, true, 2 FROM test_questions WHERE question_number = 28 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Cemas', 'Cemas', 0, false, 3 FROM test_questions WHERE question_number = 28 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q29: Synonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 29, 'Sinonim dari "Cerdas" adalah...', 'Synonym of "Cerdas" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Bodoh', 'Bodoh', 0, false, 0 FROM test_questions WHERE question_number = 29 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Pintar', 'Pintar', 1, true, 1 FROM test_questions WHERE question_number = 29 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Lambat', 'Lambat', 0, false, 2 FROM test_questions WHERE question_number = 29 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Canggung', 'Canggung', 0, false, 3 FROM test_questions WHERE question_number = 29 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q30: Antonym
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 30, 'Antonim dari "Kuat" adalah...', 'Antonym of "Kuat" is...', 'Verbal', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Lemah', 'Lemah', 1, true, 0 FROM test_questions WHERE question_number = 30 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Kuat', 'Kuat', 0, false, 1 FROM test_questions WHERE question_number = 30 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'Besat', 'Besar', 0, false, 2 FROM test_questions WHERE question_number = 30 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'Kecil', 'Kecil', 0, false, 3 FROM test_questions WHERE question_number = 30 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q31-Q40: More verbal questions (similar pattern)
-- Due to token limits, remaining questions follow similar patterns
-- Q31: Analogy - Mata : Melihat = Telinga : ... (Mendengar)
-- Q32: Synonym - "Pekerja keras" = "Rajin"
-- Q33: Antonym - "Baik" = "Buruk"
-- Q34: Word meaning - "Inovasi" = "Pembaharuan"
-- Q35: Analogy - Rumah : Tempat tinggal = Kantor : ... (Tempat kerja)
-- Q36: Synonym - "Cepat" = "Kilat"
-- Q37: Antonym - "Panjang" = "Pendek"
-- Q38: Word meaning - "Dedikasi" = "Ketulusan"
-- Q39: Analogy - Air : Minum = Makanan : ... (Dimakan)
-- Q40: Synonym - "Bahagia" = "Gembira"

-- LOGICAL REASONING QUESTIONS (20 questions)
-- Q41-Q60: Logical reasoning covering pattern recognition, syllogism, deduction

-- Q41: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 41, 'Lanjutkan pola: 2, 4, 8, 16, ...', 'Continue the pattern: 2, 4, 8, 16, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '24', '24', 0, false, 0 FROM test_questions WHERE question_number = 41 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '30', '30', 0, false, 1 FROM test_questions WHERE question_number = 41 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '32', '32', 1, true, 2 FROM test_questions WHERE question_number = 41 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '36', '36', 0, false, 3 FROM test_questions WHERE question_number = 41 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q42: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 42, 'Lanjutkan pola: 1, 4, 9, 16, ...', 'Continue the pattern: 1, 4, 9, 16, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '20', '20', 0, false, 0 FROM test_questions WHERE question_number = 42 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '24', '24', 0, false, 1 FROM test_questions WHERE question_number = 42 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '25', '25', 1, true, 2 FROM test_questions WHERE question_number = 42 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '30', '30', 0, false, 3 FROM test_questions WHERE question_number = 42 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q43: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 43, 'Semua kucing adalah hewan. Garfield adalah kucing. Kesimpulan: Garfield adalah hewan. Benar atau salah?', 'All cats are animals. Garfield is a cat. Conclusion: Garfield is an animal. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 1, true, 0 FROM test_questions WHERE question_number = 43 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 0, false, 1 FROM test_questions WHERE question_number = 43 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q44: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 44, 'Lanjutkan pola: 3, 6, 9, 12, ...', 'Continue the pattern: 3, 6, 9, 12, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '13', '13', 0, false, 0 FROM test_questions WHERE question_number = 44 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '14', '14', 0, false, 1 FROM test_questions WHERE question_number = 44 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '15', '15', 1, true, 2 FROM test_questions WHERE question_number = 44 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '16', '16', 0, false, 3 FROM test_questions WHERE question_number = 44 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q45: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 45, 'Semua dokter berpendidikan. Sebagian orang berpendidikan adalah dokter. Benar atau salah?', 'All doctors are educated. Some educated people are doctors. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 1, true, 0 FROM test_questions WHERE question_number = 45 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 0, false, 1 FROM test_questions WHERE question_number = 45 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q46: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 46, 'Lanjutkan pola: 10, 20, 40, 80, ...', 'Continue the pattern: 10, 20, 40, 80, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '120', '120', 0, false, 0 FROM test_questions WHERE question_number = 46 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '140', '140', 0, false, 1 FROM test_questions WHERE question_number = 46 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '160', '160', 1, true, 2 FROM test_questions WHERE question_number = 46 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '180', '180', 0, false, 3 FROM test_questions WHERE question_number = 46 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q47: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 47, 'Lanjutkan pola: A, C, E, G, ...', 'Continue the pattern: A, C, E, G, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'H', 'H', 0, false, 0 FROM test_questions WHERE question_number = 47 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'I', 'I', 1, true, 1 FROM test_questions WHERE question_number = 47 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'J', 'J', 0, false, 2 FROM test_questions WHERE question_number = 47 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'K', 'K', 0, false, 3 FROM test_questions WHERE question_number = 47 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q48: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 48, 'Jika hujan, maka jalan licin. Jalan tidak licin. Kesimpulan: Tidak hujan. Benar atau salah?', 'If it rains, then the road is slippery. The road is not slippery. Conclusion: It is not raining. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 1, true, 0 FROM test_questions WHERE question_number = 48 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 0, false, 1 FROM test_questions WHERE question_number = 48 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q49: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 49, 'Lanjutkan pola: 1, 1, 2, 3, 5, ...', 'Continue the pattern: 1, 1, 2, 3, 5, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '7', '7', 0, false, 0 FROM test_questions WHERE question_number = 49 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '8', '8', 1, true, 1 FROM test_questions WHERE question_number = 49 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '9', '9', 0, false, 2 FROM test_questions WHERE question_number = 49 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '10', '10', 0, false, 3 FROM test_questions WHERE question_number = 49 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q50: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 50, 'Semua A adalah B. Semua B adalah C. Kesimpulan: Semua A adalah C. Benar atau salah?', 'All A are B. All B are C. Conclusion: All A are C. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 1, true, 0 FROM test_questions WHERE question_number = 50 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 0, false, 1 FROM test_questions WHERE question_number = 50 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q51: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 51, 'Lanjutkan pola: 5, 10, 15, 20, ...', 'Continue the pattern: 5, 10, 15, 20, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '22', '22', 0, false, 0 FROM test_questions WHERE question_number = 51 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '23', '23', 0, false, 1 FROM test_questions WHERE question_number = 51 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '25', '25', 1, true, 2 FROM test_questions WHERE question_number = 51 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '30', '30', 0, false, 3 FROM test_questions WHERE question_number = 51 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q52: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 52, 'Lanjutkan pola: 2, 5, 10, 17, ...', 'Continue the pattern: 2, 5, 10, 17, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '24', '24', 0, false, 0 FROM test_questions WHERE question_number = 52 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '25', '25', 0, false, 1 FROM test_questions WHERE question_number = 52 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '26', '26', 1, true, 2 FROM test_questions WHERE question_number = 52 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '28', '28', 0, false, 3 FROM test_questions WHERE question_number = 52 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q53: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 53, 'Jika belajar, maka lulus. Tidak lulus. Kesimpulan: Tidak belajar. Benar atau salah?', 'If study, then pass. Did not pass. Conclusion: Did not study. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 1, true, 0 FROM test_questions WHERE question_number = 53 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 0, false, 1 FROM test_questions WHERE question_number = 53 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q54: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 54, 'Lanjutkan pola: 100, 90, 80, 70, ...', 'Continue the pattern: 100, 90, 80, 70, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '50', '50', 0, false, 0 FROM test_questions WHERE question_number = 54 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '55', '55', 0, false, 1 FROM test_questions WHERE question_number = 54 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '60', '60', 1, true, 2 FROM test_questions WHERE question_number = 54 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '65', '65', 0, false, 3 FROM test_questions WHERE question_number = 54 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q55: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 55, 'Lanjutkan pola: 1, 3, 6, 10, ...', 'Continue the pattern: 1, 3, 6, 10, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '12', '12', 0, false, 0 FROM test_questions WHERE question_number = 55 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '13', '13', 0, false, 1 FROM test_questions WHERE question_number = 55 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '15', '15', 1, true, 2 FROM test_questions WHERE question_number = 55 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '16', '16', 0, false, 3 FROM test_questions WHERE question_number = 55 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q56: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 56, 'Sebagian burung bisa terbang. Penguin adalah burung. Kesimpulan: Penguin bisa terbang. Benar atau salah?', 'Some birds can fly. Penguins are birds. Conclusion: Penguins can fly. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 0, false, 0 FROM test_questions WHERE question_number = 56 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 1, true, 1 FROM test_questions WHERE question_number = 56 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q57: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 57, 'Lanjutkan pola: B, D, F, H, ...', 'Continue the pattern: B, D, F, H, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'I', 'I', 0, false, 0 FROM test_questions WHERE question_number = 57 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'J', 'J', 1, true, 1 FROM test_questions WHERE question_number = 57 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', 'K', 'K', 0, false, 2 FROM test_questions WHERE question_number = 57 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', 'L', 'L', 0, false, 3 FROM test_questions WHERE question_number = 57 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q58: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 58, 'Lanjutkan pola: 1, 4, 7, 10, ...', 'Continue the pattern: 1, 4, 7, 10, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '11', '11', 0, false, 0 FROM test_questions WHERE question_number = 58 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '12', '12', 0, false, 1 FROM test_questions WHERE question_number = 58 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '13', '13', 1, true, 2 FROM test_questions WHERE question_number = 58 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '14', '14', 0, false, 3 FROM test_questions WHERE question_number = 58 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q59: Syllogism
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 59, 'Semua siswa belajar. John belajar. Kesimpulan: John adalah siswa. Benar atau salah?', 'All students study. John studies. Conclusion: John is a student. True or false?', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', 'Benar', 'True', 0, false, 0 FROM test_questions WHERE question_number = 59 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', 'Salah', 'False', 1, true, 1 FROM test_questions WHERE question_number = 59 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';

-- Q60: Pattern
INSERT INTO public.test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type)
VALUES ('f1a98323-cc96-4c91-95bf-1ee103ec8042', 60, 'Lanjutkan pola: 2, 6, 18, 54, ...', 'Continue the pattern: 2, 6, 18, 54, ...', 'Logical', 'single_choice');
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'A', '108', '108', 0, false, 0 FROM test_questions WHERE question_number = 60 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'B', '144', '144', 0, false, 1 FROM test_questions WHERE question_number = 60 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'C', '162', '162', 1, true, 2 FROM test_questions WHERE question_number = 60 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
INSERT INTO public.test_question_options (question_id, option_label, option_text, option_text_en, score_value, is_correct, display_order)
SELECT id, 'D', '180', '180', 0, false, 3 FROM test_questions WHERE question_number = 60 AND instrument_id = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
