-- Restore Personality Plus (4 Temperamen) instrument with standard Florence Littauer word list
-- Format: 40 rows of 4 words, user chooses the word that most applies
-- Positions are randomized to match the standard Personality Plus test format

DO $$
DECLARE
    personality_instrument_id UUID;
    q_id UUID;
BEGIN
    -- Add definition columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_question_options' 
        AND column_name = 'option_definition'
    ) THEN
        ALTER TABLE test_question_options
        ADD COLUMN option_definition TEXT,
        ADD COLUMN option_definition_en TEXT;
        
        COMMENT ON COLUMN test_question_options.option_definition IS 'Definition/explanation of the option text in Indonesian';
        COMMENT ON COLUMN test_question_options.option_definition_en IS 'Definition/explanation of the option text in English';
    END IF;

    -- Check if Personality Plus (4 Temperamen) already exists
    SELECT id INTO personality_instrument_id
    FROM test_instruments
    WHERE name = 'Personality Plus (4 Temperamen)'
    LIMIT 1;

    IF personality_instrument_id IS NOT NULL THEN
        RAISE NOTICE 'Personality Plus (4 Temperamen) already exists with ID: %', personality_instrument_id;
        DELETE FROM test_question_options WHERE question_id IN (SELECT id FROM test_questions WHERE instrument_id = personality_instrument_id);
        DELETE FROM test_questions WHERE instrument_id = personality_instrument_id;
    ELSE
        INSERT INTO test_instruments (name, name_en, description, category, scoring_method, target_audience, norm_reference, question_count, duration_minutes, is_active)
        VALUES ('Personality Plus (4 Temperamen)', 'Personality Plus (4 Temperaments)', 'Tes kepribadian berbasis 4 temperamen (Sanguine, Choleric, Melancholy, Phlegmatic) dari Florence Littauer.', 'Personality', 'percent_temperament', 'Umum, Pelamar kerja', 'Florence Littauer Personality Plus', 40, 20, true)
        RETURNING id INTO personality_instrument_id;
    END IF;

    -- Questions 1-40: Standard Florence Littauer Personality Plus word list with randomized positions
    -- Each row has 4 words representing the 4 temperaments
    -- S=Sanguine, C=Choleric, M=Melancholy, P=Phlegmatic
    
    FOR i IN 1..40 LOOP
        INSERT INTO test_questions (instrument_id, question_number, question_text, question_text_en, category, question_type, scoring_rule)
        VALUES (personality_instrument_id, i,
                'Pilih kata yang paling sering menggambarkan Anda:',
                'Choose the word that most often describes you:',
                'Personality', 'single_choice', 'category_based')
        RETURNING id INTO q_id;
        
        -- Randomize positions based on question number
        INSERT INTO test_question_options (question_id, option_label, option_text, option_text_en, score_value, category_target, is_correct, display_order, option_definition, option_definition_en)
        SELECT 
            q_id, opt_label, opt_text, opt_text, 1, opt_category, true, opt_order, opt_def, opt_def_en
        FROM (
            VALUES
                (CASE i % 4 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' END,
                 CASE i 
                     WHEN 1 THEN 'Animated' WHEN 2 THEN 'Persuasive' WHEN 3 THEN 'Sociable' WHEN 4 THEN 'Competitive'
                     WHEN 5 THEN 'Refreshing' WHEN 6 THEN 'Spirited' WHEN 7 THEN 'Promoter' WHEN 8 THEN 'Spontaneous'
                     WHEN 9 THEN 'Orderly' WHEN 10 THEN 'Friendly' WHEN 11 THEN 'Daring' WHEN 12 THEN 'Cheerful'
                     WHEN 13 THEN 'Idealistic' WHEN 14 THEN 'Demonstrative' WHEN 15 THEN 'Mediator' WHEN 16 THEN 'Thoughtful'
                     WHEN 17 THEN 'Listener' WHEN 18 THEN 'Contented' WHEN 19 THEN 'Perfectionist' WHEN 20 THEN 'Bouncy'
                     WHEN 21 THEN 'Blank' WHEN 22 THEN 'Undisciplined' WHEN 23 THEN 'Reticent' WHEN 24 THEN 'Fussy'
                     WHEN 25 THEN 'Impatient' WHEN 26 THEN 'Unpopular' WHEN 27 THEN 'Headstrong' WHEN 28 THEN 'Plain'
                     WHEN 29 THEN 'Angered easily' WHEN 30 THEN 'Naive' WHEN 31 THEN 'Worrier' WHEN 32 THEN 'Tactless'
                     WHEN 33 THEN 'Disorganized' WHEN 34 THEN 'Inconsistent' WHEN 35 THEN 'Messy' WHEN 36 THEN 'Stubborn'
                     WHEN 37 THEN 'Loner' WHEN 38 THEN 'Short-tempered' WHEN 39 THEN 'Reluctant' WHEN 40 THEN 'Changeable'
                 END,
                 CASE i % 4 WHEN 0 THEN 'Sanguine' WHEN 1 THEN 'Melancholy' WHEN 2 THEN 'Phlegmatic' WHEN 3 THEN 'Choleric' END,
                 CASE i % 4 WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 END,
                 CASE i 
                     WHEN 1 THEN 'Penuh semangat dan energi, ekspresif dalam gerak dan bicara' WHEN 2 THEN 'Dapat meyakinkan orang lain dengan kata-kata' WHEN 3 THEN 'Suka bergaul dan berinteraksi dengan orang lain' WHEN 4 THEN 'Suka bersaing dan ingin menang'
                     WHEN 5 THEN 'Membawa keceriaan dan energi baru' WHEN 6 THEN 'Penuh semangat dan antusias' WHEN 7 THEN 'Aktif mempromosikan ide atau produk' WHEN 8 THEN 'Melakukan sesuatu secara spontan tanpa banyak berpikir'
                     WHEN 9 THEN 'Teratur dan suka keteraturan' WHEN 10 THEN 'Ramah dan mudah bergaul' WHEN 11 THEN 'Berani dan tidak takut risiko' WHEN 12 THEN 'Selalu ceria dan optimis'
                     WHEN 13 THEN 'Memiliki idealisme dan visi tinggi' WHEN 14 THEN 'Ekspresif dalam menunjukkan perasaan' WHEN 15 THEN 'Dapat menjadi mediator dalam konflik' WHEN 16 THEN 'Memikirkan dan memperhatikan orang lain'
                     WHEN 17 THEN 'Dengar yang baik dan perhatian' WHEN 18 THEN 'Puas dengan apa yang dimiliki' WHEN 19 THEN 'Ingin segala sesuatu sempurna' WHEN 20 THEN 'Penuh energi dan ceria'
                     WHEN 21 THEN 'Kosong atau tidak berpengaruh' WHEN 22 THEN 'Tidak teratur dan tidak disiplin' WHEN 23 THEN 'Sulit mengungkapkan perasaan' WHEN 24 THEN 'Terlalu detail dan perfeksionis'
                     WHEN 25 THEN 'Tidak sabar' WHEN 26 THEN 'Tidak disukai orang lain' WHEN 27 THEN 'Keras kepala dan tidak mau mendengar' WHEN 28 THEN 'Biasa saja dan tidak menarik'
                     WHEN 29 THEN 'Mudah marah' WHEN 30 THEN 'Polos dan tidak berpengalaman' WHEN 31 THEN 'Sering khawatir' WHEN 32 THEN 'Tidak sopan dalam bicara'
                     WHEN 33 THEN 'Tidak teratur' WHEN 34 THEN 'Tidak konsisten' WHEN 35 THEN 'Berantakan' WHEN 36 THEN 'Keras kepala'
                     WHEN 37 THEN 'Suka menyendiri' WHEN 38 THEN 'Mudah marah' WHEN 39 THEN 'Enggan dan tidak mau' WHEN 40 THEN 'Sering berubah'
                 END,
                 CASE i 
                     WHEN 1 THEN 'Full of spirit and energy, expressive in movement and speech' WHEN 2 THEN 'Able to convince others with words' WHEN 3 THEN 'Likes to socialize and interact with others' WHEN 4 THEN 'Likes to compete and wants to win'
                     WHEN 5 THEN 'Brings cheerfulness and new energy' WHEN 6 THEN 'Full of spirit and enthusiasm' WHEN 7 THEN 'Actively promotes ideas or products' WHEN 8 THEN 'Does things spontaneously without much thought'
                     WHEN 9 THEN 'Organized and likes order' WHEN 10 THEN 'Friendly and easy to get along with' WHEN 11 THEN 'Brave and not afraid of risks' WHEN 12 THEN 'Always cheerful and optimistic'
                     WHEN 13 THEN 'Has idealism and high vision' WHEN 14 THEN 'Expressive in showing feelings' WHEN 15 THEN 'Can be a mediator in conflicts' WHEN 16 THEN 'Thinks about and cares for others'
                     WHEN 17 THEN 'Good listener and attentive' WHEN 18 THEN 'Content with what one has' WHEN 19 THEN 'Wants everything to be perfect' WHEN 20 THEN 'Full of energy and cheerful'
                     WHEN 21 THEN 'Empty or without influence' WHEN 22 THEN 'Undisciplined and lacks order' WHEN 23 THEN 'Difficulty expressing feelings' WHEN 24 THEN 'Too detailed and perfectionist'
                     WHEN 25 THEN 'Impatient' WHEN 26 THEN 'Not liked by others' WHEN 27 THEN 'Stubborn and refuses to listen' WHEN 28 THEN 'Plain and uninteresting'
                     WHEN 29 THEN 'Easily angered' WHEN 30 THEN 'Naive and inexperienced' WHEN 31 THEN 'Often worries' WHEN 32 THEN 'Tactless in speech'
                     WHEN 33 THEN 'Disorganized' WHEN 34 THEN 'Inconsistent' WHEN 35 THEN 'Messy' WHEN 36 THEN 'Stubborn'
                     WHEN 37 THEN 'Likes to be alone' WHEN 38 THEN 'Short-tempered' WHEN 39 THEN 'Reluctant and unwilling' WHEN 40 THEN 'Often changes'
                 END),
                (CASE (i + 1) % 4 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' END,
                 CASE i 
                     WHEN 1 THEN 'Adventurous' WHEN 2 THEN 'Peaceful' WHEN 3 THEN 'Strong-willed' WHEN 4 THEN 'Convincing'
                     WHEN 5 THEN 'Respectful' WHEN 6 THEN 'Sensitive' WHEN 7 THEN 'Positive' WHEN 8 THEN 'Sure'
                     WHEN 9 THEN 'Obliging' WHEN 10 THEN 'Faithful' WHEN 11 THEN 'Delightful' WHEN 12 THEN 'Consistent'
                     WHEN 13 THEN 'Independent' WHEN 14 THEN 'Decisive' WHEN 15 THEN 'Musical' WHEN 16 THEN 'Tenacious'
                     WHEN 17 THEN 'Loyal' WHEN 18 THEN 'Chief' WHEN 19 THEN 'Pleasant' WHEN 20 THEN 'Bold'
                     WHEN 21 THEN 'Bashful' WHEN 22 THEN 'Unsympathetic' WHEN 23 THEN 'Resentful' WHEN 24 THEN 'Fearful'
                     WHEN 25 THEN 'Insecure' WHEN 26 THEN 'Uninvolved' WHEN 27 THEN 'Haphazard' WHEN 28 THEN 'Pessimistic'
                     WHEN 29 THEN 'Aimless' WHEN 30 THEN 'Negative attitude' WHEN 31 THEN 'Withdrawn' WHEN 32 THEN 'Timid'
                     WHEN 33 THEN 'Domineering' WHEN 34 THEN 'Introvert' WHEN 35 THEN 'Moody' WHEN 36 THEN 'Show-off'
                     WHEN 37 THEN 'Lord over others' WHEN 38 THEN 'Scatterbrained' WHEN 39 THEN 'Rash' WHEN 40 THEN 'Crafty'
                 END,
                 CASE (i + 1) % 4 WHEN 0 THEN 'Choleric' WHEN 1 THEN 'Phlegmatic' WHEN 2 THEN 'Sanguine' WHEN 3 THEN 'Melancholy' END,
                 CASE (i + 1) % 4 WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 END,
                 CASE i 
                     WHEN 1 THEN 'Berani mengambil risiko dan mencoba hal baru' WHEN 2 THEN 'Menyukai kedamaian dan menghindari konflik' WHEN 3 THEN 'Memiliki kehendak kuat dan tegas' WHEN 4 THEN 'Dapat meyakinkan orang lain untuk setuju'
                     WHEN 5 THEN 'Menghormati orang lain dan aturan' WHEN 6 THEN 'Peka terhadap perasaan orang lain' WHEN 7 THEN 'Selalu melihat sisi baik dari situasi' WHEN 8 THEN 'Yakin dan percaya diri'
                     WHEN 9 THEN 'Suka membantu dan patuh' WHEN 10 THEN 'Setia dan dapat dipercaya' WHEN 11 THEN 'Menyenangkan dan menggembirakan' WHEN 12 THEN 'Konsisten dan dapat diandalkan'
                     WHEN 13 THEN 'Mandiri dan tidak bergantung orang lain' WHEN 14 THEN 'Tegas dalam mengambil keputusan' WHEN 15 THEN 'Memiliki bakat musik atau artistik' WHEN 16 THEN 'Teguh dan tidak mudah menyerah'
                     WHEN 17 THEN 'Setia dan dapat dipercaya' WHEN 18 THEN 'Pemimpin atau atasan' WHEN 19 THEN 'Menyenangkan dan ramah' WHEN 20 THEN 'Berani dan percaya diri'
                     WHEN 21 THEN 'Pemalu dan kurang percaya diri' WHEN 22 THEN 'Tidak peka terhadap perasaan orang lain' WHEN 23 THEN 'Menyimpan dendam' WHEN 24 THEN 'Takut dan cemas'
                     WHEN 25 THEN 'Kurang percaya diri' WHEN 26 THEN 'Tidak terlibat dan acuh' WHEN 27 THEN 'Tidak teratur' WHEN 28 THEN 'Selalu melihat sisi negatif'
                     WHEN 29 THEN 'Tidak memiliki tujuan' WHEN 30 THEN 'Sikap negatif' WHEN 31 THEN 'Menarik diri dari orang lain' WHEN 32 THEN 'Pemalu'
                     WHEN 33 THEN 'Suka mendominasi' WHEN 34 THEN 'Suka menyendiri' WHEN 35 THEN 'Mood berubah-ubah' WHEN 36 THEN 'Suka pamer'
                     WHEN 37 THEN 'Suka mengatur orang lain' WHEN 38 THEN 'Pikiran berantakan' WHEN 39 THEN 'Terburu-buru' WHEN 40 THEN 'Licik'
                 END,
                 CASE i 
                     WHEN 1 THEN 'Willing to take risks and try new things' WHEN 2 THEN 'Likes peace and avoids conflict' WHEN 3 THEN 'Has strong will and is firm' WHEN 4 THEN 'Able to convince others to agree'
                     WHEN 5 THEN 'Respects others and rules' WHEN 6 THEN 'Sensitive to others feelings' WHEN 7 THEN 'Always sees the good side of situations' WHEN 8 THEN 'Confident and sure of oneself'
                     WHEN 9 THEN 'Likes to help and is compliant' WHEN 10 THEN 'Loyal and trustworthy' WHEN 11 THEN 'Delightful and cheerful' WHEN 12 THEN 'Consistent and reliable'
                     WHEN 13 THEN 'Independent and not dependent on others' WHEN 14 THEN 'Firm in making decisions' WHEN 15 THEN 'Has musical or artistic talent' WHEN 16 THEN 'Tenacious and does not give up easily'
                     WHEN 17 THEN 'Loyal and trustworthy' WHEN 18 THEN 'Leader or boss' WHEN 19 THEN 'Pleasant and friendly' WHEN 20 THEN 'Brave and confident'
                     WHEN 21 THEN 'Shy and lacks confidence' WHEN 22 THEN 'Insensitive to others feelings' WHEN 23 THEN 'Holds grudges' WHEN 24 THEN 'Afraid and anxious'
                     WHEN 25 THEN 'Lacks confidence' WHEN 26 THEN 'Uninvolved and indifferent' WHEN 27 THEN 'Disorganized' WHEN 28 THEN 'Always sees the negative side'
                     WHEN 29 THEN 'Has no purpose' WHEN 30 THEN 'Negative attitude' WHEN 31 THEN 'Withdraws from others' WHEN 32 THEN 'Timid'
                     WHEN 33 THEN 'Likes to dominate' WHEN 34 THEN 'Introverted' WHEN 35 THEN 'Moody' WHEN 36 THEN 'Show-off'
                     WHEN 37 THEN 'Likes to control others' WHEN 38 THEN 'Scatterbrained' WHEN 39 THEN 'Rash' WHEN 40 THEN 'Crafty'
                 END),
                (CASE (i + 2) % 4 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' END,
                 CASE i 
                     WHEN 1 THEN 'Analytical' WHEN 2 THEN 'Persistent' WHEN 3 THEN 'Self-sacrificing' WHEN 4 THEN 'Considerate'
                     WHEN 5 THEN 'Resourceful' WHEN 6 THEN 'Diplomatic' WHEN 7 THEN 'Planner' WHEN 8 THEN 'Mover'
                     WHEN 9 THEN 'Leader' WHEN 10 THEN 'Productive' WHEN 11 THEN 'Detailed' WHEN 12 THEN 'Cultured'
                     WHEN 13 THEN 'Inspiring' WHEN 14 THEN 'Deep' WHEN 15 THEN 'Mixes easily' WHEN 16 THEN 'Talker'
                     WHEN 17 THEN 'Lively' WHEN 18 THEN 'Chartmaker' WHEN 19 THEN 'Popular' WHEN 20 THEN 'Behaved'
                     WHEN 21 THEN 'Brassy' WHEN 22 THEN 'Unenthusiastic' WHEN 23 THEN 'Resistant' WHEN 24 THEN 'Forgetful'
                     WHEN 25 THEN 'Indecisive' WHEN 26 THEN 'Unpredictable' WHEN 27 THEN 'Hard to Please' WHEN 28 THEN 'Proud'
                     WHEN 29 THEN 'Argumentative' WHEN 30 THEN 'Nervy' WHEN 31 THEN 'Workaholic' WHEN 32 THEN 'Talkative'
                     WHEN 33 THEN 'Moody' WHEN 34 THEN 'Intolerant' WHEN 35 THEN 'Mumbles' WHEN 36 THEN 'Skeptical'
                     WHEN 37 THEN 'Lazy' WHEN 38 THEN 'Revengeful' WHEN 39 THEN 'Compromising' WHEN 40 THEN 'Compromising'
                 END,
                 CASE (i + 2) % 4 WHEN 0 THEN 'Melancholy' WHEN 1 THEN 'Sanguine' WHEN 2 THEN 'Choleric' WHEN 3 THEN 'Phlegmatic' END,
                 CASE (i + 2) % 4 WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 END,
                 CASE i 
                     WHEN 1 THEN 'Suka menganalisis dan memikirkan secara mendalam' WHEN 2 THEN 'Tetap pada pendirian dan tidak mudah menyerah' WHEN 3 THEN 'Siap berkorban demi orang lain' WHEN 4 THEN 'Memperhatikan perasaan dan kebutuhan orang lain'
                     WHEN 5 THEN 'Mampu mencari solusi dan mandiri' WHEN 6 THEN 'Mampu menyelesaikan konflik dengan bijak' WHEN 7 THEN 'Suka merencanakan dan mengatur segala sesuatu' WHEN 8 THEN 'Aktif bergerak dan mengambil inisiatif'
                     WHEN 9 THEN 'Memiliki kemampuan kepemimpinan' WHEN 10 THEN 'Produktif dan efisien dalam bekerja' WHEN 11 THEN 'Memperhatikan detail secara seksama' WHEN 12 THEN 'Berbudaya dan berpengetahuan luas'
                     WHEN 13 THEN 'Dapat menginspirasi orang lain' WHEN 14 THEN 'Berpikir secara mendalam dan serius' WHEN 15 THEN 'Mudah bergaul dan beradaptasi' WHEN 16 THEN 'Suka bicara dan komunikatif'
                     WHEN 17 THEN 'Penuh kehidupan dan energi' WHEN 18 THEN 'Suka membuat grafik dan diagram' WHEN 19 THEN 'Disukai banyak orang' WHEN 20 THEN 'Berperilaku baik dan sopan'
                     WHEN 21 THEN 'Kasar dan kurang sopan' WHEN 22 THEN 'Tidak antusias dan kurang semangat' WHEN 23 THEN 'Menolak perubahan' WHEN 24 THEN 'Sering lupa'
                     WHEN 25 THEN 'Sulit mengambil keputusan' WHEN 26 THEN 'Sulit diprediksi' WHEN 27 THEN 'Sulit dipuaskan' WHEN 28 THEN 'Sombong dan angkuh'
                     WHEN 29 THEN 'Suka berdebat' WHEN 30 THEN 'Berani dan nekat' WHEN 31 THEN 'Kecanduan kerja' WHEN 32 THEN 'Suka bicara terus menerus'
                     WHEN 33 THEN 'Mood berubah-ubah' WHEN 34 THEN 'Tidak toleran' WHEN 35 THEN 'Bicara tidak jelas' WHEN 36 THEN 'Skeptis dan curiga'
                     WHEN 37 THEN 'Malas' WHEN 38 THEN 'Ingin balas dendam' WHEN 39 THEN 'Berkompromi' WHEN 40 THEN 'Berkompromi'
                 END,
                 CASE i 
                     WHEN 1 THEN 'Likes to analyze and think deeply' WHEN 2 THEN 'Stands firm and does not give up easily' WHEN 3 THEN 'Willing to sacrifice for others' WHEN 4 THEN 'Considerate of others feelings and needs'
                     WHEN 5 THEN 'Able to find solutions and be self-reliant' WHEN 6 THEN 'Able to resolve conflicts wisely' WHEN 7 THEN 'Likes to plan and organize everything' WHEN 8 THEN 'Active in moving and taking initiative'
                     WHEN 9 THEN 'Has leadership ability' WHEN 10 THEN 'Productive and efficient in work' WHEN 11 THEN 'Pays close attention to details' WHEN 12 THEN 'Cultured and knowledgeable'
                     WHEN 13 THEN 'Able to inspire others' WHEN 14 THEN 'Thinks deeply and seriously' WHEN 15 THEN 'Easily socializes and adapts' WHEN 16 THEN 'Likes to talk and is communicative'
                     WHEN 17 THEN 'Full of life and energy' WHEN 18 THEN 'Likes to make charts and diagrams' WHEN 19 THEN 'Liked by many people' WHEN 20 THEN 'Well-behaved and polite'
                     WHEN 21 THEN 'Crude and impolite' WHEN 22 THEN 'Unenthusiastic and lacks spirit' WHEN 23 THEN 'Resists change' WHEN 24 THEN 'Often forgets'
                     WHEN 25 THEN 'Difficulty making decisions' WHEN 26 THEN 'Hard to predict' WHEN 27 THEN 'Hard to please' WHEN 28 THEN 'Proud and arrogant'
                     WHEN 29 THEN 'Likes to argue' WHEN 30 THEN 'Bold and reckless' WHEN 31 THEN 'Workaholic' WHEN 32 THEN 'Talks continuously'
                     WHEN 33 THEN 'Moody' WHEN 34 THEN 'Intolerant' WHEN 35 THEN 'Mumbles' WHEN 36 THEN 'Skeptical and suspicious'
                     WHEN 37 THEN 'Lazy' WHEN 38 THEN 'Wants revenge' WHEN 39 THEN 'Compromising' WHEN 40 THEN 'Compromising'
                 END),
                (CASE (i + 3) % 4 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' END,
                 CASE i 
                     WHEN 1 THEN 'Adaptable' WHEN 2 THEN 'Playful' WHEN 3 THEN 'Submissive' WHEN 4 THEN 'Controlled'
                     WHEN 5 THEN 'Self-reliant' WHEN 6 THEN 'Detailed' WHEN 7 THEN 'Patient' WHEN 8 THEN 'Mixes easily'
                     WHEN 9 THEN 'Lively' WHEN 10 THEN 'Popular' WHEN 11 THEN 'Deep' WHEN 12 THEN 'Confident'
                     WHEN 13 THEN 'Inoffensive' WHEN 14 THEN 'Dry Humor' WHEN 15 THEN 'Mover' WHEN 16 THEN 'Tolerant'
                     WHEN 17 THEN 'Leader' WHEN 18 THEN 'Cute' WHEN 19 THEN 'Productive' WHEN 20 THEN 'Balanced'
                     WHEN 21 THEN 'Bossy' WHEN 22 THEN 'Unforgiving' WHEN 23 THEN 'Interrupts' WHEN 24 THEN 'Hesitant'
                     WHEN 25 THEN 'Alienated' WHEN 26 THEN 'Wants credit' WHEN 27 THEN 'Depressed' WHEN 28 THEN 'Manipulative'
                     WHEN 29 THEN 'Loud' WHEN 30 THEN 'Nonchalant' WHEN 31 THEN 'Too sensitive' WHEN 32 THEN 'Doubtful'
                     WHEN 33 THEN 'Mumbles' WHEN 34 THEN 'Skeptical' WHEN 35 THEN 'Slow' WHEN 36 THEN 'Sluggish'
                     WHEN 37 THEN 'Suspicious' WHEN 38 THEN 'Restless' WHEN 39 THEN 'Critical' WHEN 40 THEN 'Critical'
                 END,
                 CASE (i + 3) % 4 WHEN 0 THEN 'Phlegmatic' WHEN 1 THEN 'Choleric' WHEN 2 THEN 'Melancholy' WHEN 3 THEN 'Sanguine' END,
                 CASE (i + 3) % 4 WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 END,
                 CASE i 
                     WHEN 1 THEN 'Mudah menyesuaikan diri dengan situasi dan orang' WHEN 2 THEN 'Suka bersenang-senang dan bersikap ringan' WHEN 3 THEN 'Mengikuti arahan dan tunduk pada otoritas' WHEN 4 THEN 'Dapat mengendalikan emosi dan tindakan'
                     WHEN 5 THEN 'Percaya pada kemampuan diri sendiri' WHEN 6 THEN 'Memperhatikan detail dan hal-hal kecil' WHEN 7 THEN 'Sabar dan tidak mudah tersinggung' WHEN 8 THEN 'Mudah bergaul dan beradaptasi'
                     WHEN 9 THEN 'Penuh kehidupan dan energi' WHEN 10 THEN 'Disukai banyak orang' WHEN 11 THEN 'Berpikir secara mendalam dan serius' WHEN 12 THEN 'Percaya diri dan yakin'
                     WHEN 13 THEN 'Tidak menyinggung dan menyenangkan' WHEN 14 THEN 'Humor kering dan tidak berlebihan' WHEN 15 THEN 'Aktif bergerak dan mengambil inisiatif' WHEN 16 THEN 'Sabar dan menerima perbedaan'
                     WHEN 17 THEN 'Memiliki kemampuan kepemimpinan' WHEN 18 THEN 'Lucu dan menggemaskan' WHEN 19 THEN 'Produktif dan efisien' WHEN 20 THEN 'Seimbang dan stabil'
                     WHEN 21 THEN 'Suka memerintah dan dominan' WHEN 22 THEN 'Tidak mudah memaafkan' WHEN 23 THEN 'Suka memotong pembicaraan' WHEN 24 THEN 'Ragu-ragu dalam mengambil keputusan'
                     WHEN 25 THEN 'Terasa terasing dan terpisah' WHEN 26 THEN 'Suka mendapat pengakuan' WHEN 27 THEN 'Merasa depresi' WHEN 28 THEN 'Suka memanipulasi orang lain'
                     WHEN 29 THEN 'Bicara keras dan berisik' WHEN 30 THEN 'Acuh dan tidak peduli' WHEN 31 THEN 'Terlalu peka' WHEN 32 THEN 'Ragu-ragu'
                     WHEN 33 THEN 'Bicara tidak jelas' WHEN 34 THEN 'Skeptis dan curiga' WHEN 35 THEN 'Lambat' WHEN 36 THEN 'Lambat dan malas'
                     WHEN 37 THEN 'Curiga' WHEN 38 THEN 'Gelisah dan tidak tenang' WHEN 39 THEN 'Kritis' WHEN 40 THEN 'Kritis'
                 END,
                 CASE i 
                     WHEN 1 THEN 'Easily adapts to situations and people' WHEN 2 THEN 'Likes to have fun and be light-hearted' WHEN 3 THEN 'Follows directions and submits to authority' WHEN 4 THEN 'Able to control emotions and actions'
                     WHEN 5 THEN 'Believes in own abilities' WHEN 6 THEN 'Pays attention to details and small things' WHEN 7 THEN 'Patient and not easily offended' WHEN 8 THEN 'Easily socializes and adapts'
                     WHEN 9 THEN 'Full of life and energy' WHEN 10 THEN 'Liked by many people' WHEN 11 THEN 'Thinks deeply and seriously' WHEN 12 THEN 'Confident and sure'
                     WHEN 13 THEN 'Not offensive and pleasant' WHEN 14 THEN 'Dry humor and not excessive' WHEN 15 THEN 'Active in moving and taking initiative' WHEN 16 THEN 'Patient and accepts differences'
                     WHEN 17 THEN 'Has leadership ability' WHEN 18 THEN 'Cute and adorable' WHEN 19 THEN 'Productive and efficient' WHEN 20 THEN 'Balanced and stable'
                     WHEN 21 THEN 'Likes to command and be dominant' WHEN 22 THEN 'Does not forgive easily' WHEN 23 THEN 'Likes to interrupt conversations' WHEN 24 THEN 'Hesitant in making decisions'
                     WHEN 25 THEN 'Feels alienated and separated' WHEN 26 THEN 'Likes to get recognition' WHEN 27 THEN 'Feels depressed' WHEN 28 THEN 'Likes to manipulate others'
                     WHEN 29 THEN 'Speaks loudly and noisily' WHEN 30 THEN 'Indifferent and uncaring' WHEN 31 THEN 'Too sensitive' WHEN 32 THEN 'Doubtful'
                     WHEN 33 THEN 'Mumbles' WHEN 34 THEN 'Skeptical and suspicious' WHEN 35 THEN 'Slow' WHEN 36 THEN 'Sluggish and lazy'
                     WHEN 37 THEN 'Suspicious' WHEN 38 THEN 'Restless and uneasy' WHEN 39 THEN 'Critical' WHEN 40 THEN 'Critical'
                 END)
        ) AS options(opt_label, opt_text, opt_category, opt_order, opt_def, opt_def_en)
        ORDER BY opt_order;
    END LOOP;

    UPDATE test_instruments SET question_count = 40, duration_minutes = 20, scoring_method = 'percent_temperament' WHERE id = personality_instrument_id;
    RAISE NOTICE '✅ Personality Plus (4 Temperamen) restored with standard Florence Littauer word list with randomized positions';
END $$;
