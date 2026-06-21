-- Setup DISC Assessment Questions - Direct SQL Insert
-- Run this in Supabase SQL Editor after fixing RLS policies

-- First, check if DISC instrument exists and get its ID
DO $$
DECLARE
    disc_instrument_id UUID;
    question_id UUID;
BEGIN
    -- Try to get existing DISC instrument
    SELECT id INTO disc_instrument_id 
    FROM test_instruments 
    WHERE name ILIKE '%DISC%' 
    LIMIT 1;
    
    -- If not exists, create new one
    IF disc_instrument_id IS NULL THEN
        INSERT INTO test_instruments (name, name_en, description, category, question_count, duration_minutes, scoring_method, target_audience, norm_reference, is_active)
        VALUES (
            'Tes DISC',
            'DISC Assessment',
            'Mengukur 4 dimensi perilaku: Dominance, Influence, Steadiness, Compliance. Setiap pertanyaan terdiri dari 4 pernyataan, pilih yang PALING dan TIDAK menggambarkan diri Anda.',
            'Personality',
            24,
            15,
            'ipsative',
            'Karyawan & Calon Karyawan',
            'Marston (1928), revisi DISC modern',
            true
        )
        RETURNING id INTO disc_instrument_id;
        
        RAISE NOTICE 'Created new DISC instrument: %', disc_instrument_id;
    ELSE
        RAISE NOTICE 'Found existing DISC instrument: %', disc_instrument_id;
        
        -- Delete existing questions and options
        DELETE FROM test_question_options 
        WHERE test_question_options.question_id IN (
            SELECT id FROM test_questions WHERE instrument_id = disc_instrument_id
        );
        
        DELETE FROM test_questions WHERE instrument_id = disc_instrument_id;
        
        RAISE NOTICE 'Deleted existing DISC questions';
    END IF;
    
    -- Insert DISC Questions
    -- Question 1
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 1, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Mudah bergaul, ramah, mudah setuju', 'Mempercayai, percaya pada orang lain', 'Petualang, suka mengambil risiko', 'Penuh toleransi, menghormati orang lain']),
        unnest(ARRAY['Mudah bergaul, ramah, mudah setuju', 'Mempercayai, percaya pada orang lain', 'Petualang, suka mengambil risiko', 'Penuh toleransi, menghormati orang lain']),
        1,
        unnest(ARRAY['I', 'S', 'D', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 2
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 2, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Yang penting adalah hasil', 'Kerjakan dengan benar, ketepatan sangat penting', 'Buat agar menyenangkan', 'Kerjakan bersama-sama']),
        unnest(ARRAY['Yang penting adalah hasil', 'Kerjakan dengan benar, ketepatan sangat penting', 'Buat agar menyenangkan', 'Kerjakan bersama-sama']),
        1,
        unnest(ARRAY['D', 'C', 'I', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 3
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 3, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Pendidikan, kebudayaan', 'Prestasi, penghargaan', 'Keselamatan, keamanan', 'Sosial, pertemuan kelompok']),
        unnest(ARRAY['Pendidikan, kebudayaan', 'Prestasi, penghargaan', 'Keselamatan, keamanan', 'Sosial, pertemuan kelompok']),
        1,
        unnest(ARRAY['C', 'D', 'S', 'I']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 4
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 4, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Lembut, tertutup', 'Visionary / pandangan ke masa depan', 'Pusat perhatian, suka bersosialisasi', 'Pendamai, membawa ketenangan']),
        unnest(ARRAY['Lembut, tertutup', 'Visionary / pandangan ke masa depan', 'Pusat perhatian, suka bersosialisasi', 'Pendamai, membawa ketenangan']),
        1,
        unnest(ARRAY['S', 'D', 'I', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 5
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 5, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menahan diri bisa hidup tanpa memiliki', 'Membeli karena dorongan hasrat / impulsif', 'Akan menunggu tanpa tekanan', 'Akan membeli apa yang diinginkan']),
        unnest(ARRAY['Menahan diri bisa hidup tanpa memiliki', 'Membeli karena dorongan hasrat / impulsif', 'Akan menunggu tanpa tekanan', 'Akan membeli apa yang diinginkan']),
        1,
        unnest(ARRAY['S', 'I', 'S', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 6
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 6, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Mengambil kendali, bersikap langsung (direct)', 'Suka bergaul, antusias', 'Mudah ditebak, konsisten', 'Waspada, berhati-hati']),
        unnest(ARRAY['Mengambil kendali, bersikap langsung (direct)', 'Suka bergaul, antusias', 'Mudah ditebak, konsisten', 'Waspada, berhati-hati']),
        1,
        unnest(ARRAY['D', 'I', 'S', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 7
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 7, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menyenangkan orang lain', 'Berusaha mencapai kesempurnaan', 'Menjadi bagian dari tim / kelompok', 'Ingin menetapkan goal / tujuan']),
        unnest(ARRAY['Menyenangkan orang lain', 'Berusaha mencapai kesempurnaan', 'Menjadi bagian dari tim / kelompok', 'Ingin menetapkan goal / tujuan']),
        1,
        unnest(ARRAY['I', 'C', 'S', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 8
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 8, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Bersahabat, mudah bergaul', 'Unik, bosan pada rutinitas', 'Aktif melakukan perubahan', 'Ingin segala sesuatu akurat dan pasti']),
        unnest(ARRAY['Bersahabat, mudah bergaul', 'Unik, bosan pada rutinitas', 'Aktif melakukan perubahan', 'Ingin segala sesuatu akurat dan pasti']),
        1,
        unnest(ARRAY['I', 'I', 'D', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 9
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 9, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Sulit dikalahkan / ditundukkan', 'Melaksanakan sesuai perintah', 'Bersemangat, riang', 'Ingin keteraturan, rapi']),
        unnest(ARRAY['Sulit dikalahkan / ditundukkan', 'Melaksanakan sesuai perintah', 'Bersemangat, riang', 'Ingin keteraturan, rapi']),
        1,
        unnest(ARRAY['D', 'S', 'I', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 10
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 10, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menjadi frustrasi', 'Memendam perasaan dalam hati', 'Menyampaikan sudut pandang pribadi', 'Berani menghadapi oposisi']),
        unnest(ARRAY['Menjadi frustrasi', 'Memendam perasaan dalam hati', 'Menyampaikan sudut pandang pribadi', 'Berani menghadapi oposisi']),
        1,
        unnest(ARRAY['C', 'S', 'I', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 11
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 11, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Mengalah, tidak suka pertentangan', 'Penuh dengan hal-hal kecil / detail', 'Berubah pada menit-menit terakhir', 'Mendesak / memaksa, agak kasar']),
        unnest(ARRAY['Mengalah, tidak suka pertentangan', 'Penuh dengan hal-hal kecil / detail', 'Berubah pada menit-menit terakhir', 'Mendesak / memaksa, agak kasar']),
        1,
        unnest(ARRAY['S', 'C', 'I', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 12
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 12, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Saya akan pimpin mereka', 'Saya akan ikut / mengikuti', 'Saya akan pengaruhi / bujuk mereka', 'Saya akan mendapatkan fakta-faktanya']),
        unnest(ARRAY['Saya akan pimpin mereka', 'Saya akan ikut / mengikuti', 'Saya akan pengaruhi / bujuk mereka', 'Saya akan mendapatkan fakta-faktanya']),
        1,
        unnest(ARRAY['D', 'S', 'I', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 13
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 13, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Hidup / lincah, banyak bicara', 'Cepat, penuh keyakinan', 'Berusaha menjaga keseimbangan', 'Berusaha patuh pada peraturan']),
        unnest(ARRAY['Hidup / lincah, banyak bicara', 'Cepat, penuh keyakinan', 'Berusaha menjaga keseimbangan', 'Berusaha patuh pada peraturan']),
        1,
        unnest(ARRAY['I', 'D', 'S', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 14
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 14, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Ingin kemajuan / peningkatan', 'Puas dengan keadaan, tenang / mudah puas', 'Menunjukkan perasaan dengan terbuka', 'Rendah hati, sederhana']),
        unnest(ARRAY['Ingin kemajuan / peningkatan', 'Puas dengan keadaan, tenang / mudah puas', 'Menunjukkan perasaan dengan terbuka', 'Rendah hati, sederhana']),
        1,
        unnest(ARRAY['D', 'S', 'I', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 15
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 15, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Memikirkan orang lain dahulu', 'Suka bersaing / kompetitif, suka tantangan', 'Optimis, berpikir positif', 'Sistematis, berpikir logis']),
        unnest(ARRAY['Memikirkan orang lain dahulu', 'Suka bersaing / kompetitif, suka tantangan', 'Optimis, berpikir positif', 'Sistematis, berpikir logis']),
        1,
        unnest(ARRAY['S', 'D', 'I', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 16
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 16, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Mengelola waktu dengan efisien', 'Sering terburu-buru, merasa ditekan', 'Hal-hal sosial adalah penting', 'Suka menyelesaikan hal yang sudah dimulai']),
        unnest(ARRAY['Mengelola waktu dengan efisien', 'Sering terburu-buru, merasa ditekan', 'Hal-hal sosial adalah penting', 'Suka menyelesaikan hal yang sudah dimulai']),
        1,
        unnest(ARRAY['C', 'D', 'I', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 17
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 17, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Tenang, pendiam, tertutup', 'Gembira, bebas, riang', 'Menyenangkan, baik hati', 'Menyolok, berani']),
        unnest(ARRAY['Tenang, pendiam, tertutup', 'Gembira, bebas, riang', 'Menyenangkan, baik hati', 'Menyolok, berani']),
        1,
        unnest(ARRAY['S', 'I', 'I', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 18
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 18, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menyenangkan orang lain, ramah, penurut', 'Tertawa lepas, hidup', 'Pemberani, tegas', 'Pendiam, tertutup, tenang']),
        unnest(ARRAY['Menyenangkan orang lain, ramah, penurut', 'Tertawa lepas, hidup', 'Pemberani, tegas', 'Pendiam, tertutup, tenang']),
        1,
        unnest(ARRAY['I', 'I', 'D', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 19
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 19, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menolak perubahan yang mendadak', 'Cenderung terlalu banyak berjanji', 'Mundur apabila berada di bawah tekanan', 'Tidak takut untuk berkelahi / berdebat']),
        unnest(ARRAY['Menolak perubahan yang mendadak', 'Cenderung terlalu banyak berjanji', 'Mundur apabila berada di bawah tekanan', 'Tidak takut untuk berkelahi / berdebat']),
        1,
        unnest(ARRAY['S', 'I', 'S', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 20
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 20, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Menyediakan waktu untuk orang lain', 'Merencanakan masa depan, bersiap-siap', 'Menuju petualangan baru', 'Menerima penghargaan atas pencapaian target']),
        unnest(ARRAY['Menyediakan waktu untuk orang lain', 'Merencanakan masa depan, bersiap-siap', 'Menuju petualangan baru', 'Menerima penghargaan atas pencapaian target']),
        1,
        unnest(ARRAY['S', 'C', 'D', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 21
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 21, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Ingin wewenang / kekuasaan lebih', 'Ingin kesempatan baru', 'Menghindari perselisihan / konflik apapun', 'Ingin arahan yang jelas']),
        unnest(ARRAY['Ingin wewenang / kekuasaan lebih', 'Ingin kesempatan baru', 'Menghindari perselisihan / konflik apapun', 'Ingin arahan yang jelas']),
        1,
        unnest(ARRAY['D', 'I', 'S', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 22
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 22, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Penyemangat / pendukung yang baik', 'Pendengar yang baik', 'Penganalisa yang baik', 'Pendelegasi yang baik / pandai membagi tugas']),
        unnest(ARRAY['Penyemangat / pendukung yang baik', 'Pendengar yang baik', 'Penganalisa yang baik', 'Pendelegasi yang baik / pandai membagi tugas']),
        1,
        unnest(ARRAY['I', 'S', 'C', 'D']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 23
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 23, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Peraturan perlu diuji', 'Peraturan membuat menjadi adil', 'Peraturan membuat menjadi membosankan', 'Peraturan membuat menjadi aman']),
        unnest(ARRAY['Peraturan perlu diuji', 'Peraturan membuat menjadi adil', 'Peraturan membuat menjadi membosankan', 'Peraturan membuat menjadi aman']),
        1,
        unnest(ARRAY['D', 'C', 'I', 'S']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Question 24
    INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
    VALUES (disc_instrument_id, 24, 'Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:', 'Choose the statement that MOST and LEAST describes you:', 'DISC', 'disc_pair', 'ipsative')
    RETURNING id INTO question_id;
    
    INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order)
    SELECT 
        question_id,
        unnest(ARRAY['A', 'B', 'C', 'D']),
        unnest(ARRAY['Dapat dipercaya dan diandalkan', 'Kreatif, unik', 'Berorientasi pada hasil / profit / untung', 'Memegang teguh standar yang tinggi, akurat']),
        unnest(ARRAY['Dapat dipercaya dan diandalkan', 'Kreatif, unik', 'Berorientasi pada hasil / profit / untung', 'Memegang teguh standar yang tinggi, akurat']),
        1,
        unnest(ARRAY['S', 'I', 'D', 'C']),
        NULL,
        unnest(ARRAY[0, 1, 2, 3]);
    
    -- Update instrument question count
    UPDATE test_instruments 
    SET question_count = 24 
    WHERE id = disc_instrument_id;
    
    RAISE NOTICE 'DISC assessment setup completed successfully! Total questions: 24';
END $$;
