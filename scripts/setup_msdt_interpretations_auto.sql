-- Setup MSDT Static Interpretations for Reporting (Auto-detect Instrument ID)
-- Run this in Supabase SQL Editor

-- This script automatically gets the MSDT instrument ID and inserts interpretations

DO $$
DECLARE
    msdt_instrument_id TEXT;
BEGIN
    -- Get MSDT instrument ID
    SELECT id INTO msdt_instrument_id 
    FROM test_instruments 
    WHERE name ILIKE '%MSDT%' OR scoring_method = 'msdt_style' 
    LIMIT 1;
    
    IF msdt_instrument_id IS NULL THEN
        RAISE EXCEPTION 'MSDT instrument not found. Please check if MSDT instrument exists in test_instruments table.';
    END IF;
    
    -- Delete existing MSDT interpretations (optional - uncomment if you want to reset)
    -- DELETE FROM test_interpretations WHERE instrument_id = msdt_instrument_id::uuid;
    
    -- Insert MSDT interpretations for each style at each level
    INSERT INTO test_interpretations (instrument_id, interpretation_key, category, min_value, max_value, interpretation_text, interpretation_text_en) VALUES
    -- Democratic
    (msdt_instrument_id::uuid, 'Democratic', 'Dominan', 7, 10, 
    'Gaya Demokratis yang sangat kuat. Kandidat sangat aktif melibatkan bawahan dalam pengambilan keputusan, membuka ruang diskusi yang luas, dan membangun keputusan melalui partisipasi tim. Kekuatan utama: membangun komitmen tinggi, rasa memiliki yang kuat, dan kolaborasi tim yang efektif. Risiko: proses pengambilan keputusan bisa menjadi lambat bila situasi membutuhkan keputusan cepat.',
    'Democratic style is very strong. Candidate actively involves subordinates in decision-making, opens extensive discussion space, and builds decisions through team participation. Main strength: builds high commitment, strong sense of ownership, and effective team collaboration. Risk: decision-making process can be slow when quick decisions are needed.'),
    (msdt_instrument_id::uuid, 'Democratic', 'Menonjol', 5, 6, 
    'Gaya Demokratis yang cukup menonjol. Kandidat cenderung melibatkan bawahan dalam pengambilan keputusan dan membangun keputusan melalui partisipasi. Kekuatan: baik untuk membangun komitmen dan kolaborasi tim. Risiko: perlu keseimbangan dengan situasi yang membutuhkan keputusan cepat.',
    'Democratic style is quite prominent. Candidate tends to involve subordinates in decision-making and builds decisions through participation. Strength: good for building commitment and team collaboration. Risk: needs balance with situations requiring quick decisions.'),
    (msdt_instrument_id::uuid, 'Democratic', 'Situasional', 3, 4, 
    'Gaya Demokratis muncul secara situasional. Kandidat dapat melibatkan bawahan dalam pengambilan keputusan bila situasi mengizinkan, namun tidak selalu konsisten. Perilaku ini dipengaruhi oleh konteks, tuntutan jabatan, dan dinamika tim.',
    'Democratic style appears situationally. Candidate can involve subordinates in decision-making when situation allows, but not always consistent. This behavior is influenced by context, job demands, and team dynamics.'),
    (msdt_instrument_id::uuid, 'Democratic', 'Rendah', 0, 2, 
    'Gaya Demokratis rendah. Kandidat cenderung lebih sering mengambil keputusan secara mandiri tanpa banyak melibatkan bawahan. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan dibandingkan gaya lain.',
    'Democratic style is low. Candidate tends to make decisions more independently without involving subordinates. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant compared to other styles.'),

    -- Executive
    (msdt_instrument_id::uuid, 'Executive', 'Dominan', 10, 14, 
    'Gaya Eksekutif yang sangat kuat. Kandidat sangat menyeimbangkan pencapaian tugas, ketegasan keputusan, dan perhatian terhadap orang. Kekuatan utama: kuat untuk mengarahkan tim pada target sambil menjaga akuntabilitas. Risiko: perlu menjaga agar tidak terlalu banyak mengambil kendali akhir.',
    'Executive style is very strong. Candidate very well balances task achievement, decision firmness, and attention to people. Main strength: strong for directing team toward targets while maintaining accountability. Risk: needs to ensure not taking too much final control.'),
    (msdt_instrument_id::uuid, 'Executive', 'Menonjol', 7, 9, 
    'Gaya Eksekutif cukup menonjol. Kandidat cenderung menyeimbangkan pencapaian tugas, ketegasan keputusan, dan perhatian terhadap orang. Kekuatan: baik untuk mengarahkan tim pada target sambil menjaga akuntabilitas.',
    'Executive style is quite prominent. Candidate tends to balance task achievement, decision firmness, and attention to people. Strength: good for directing team toward targets while maintaining accountability.'),
    (msdt_instrument_id::uuid, 'Executive', 'Situasional', 4, 6, 
    'Gaya Eksekutif muncul secara situasional. Kandidat dapat menyeimbangkan tugas dan orang bila situasi mengizinkan. Perilaku ini dipengaruhi oleh konteks dan tuntutan jabatan.',
    'Executive style appears situationally. Candidate can balance tasks and people when situation allows. This behavior is influenced by context and job demands.'),
    (msdt_instrument_id::uuid, 'Executive', 'Rendah', 0, 3, 
    'Gaya Eksekutif rendah. Kandidat mungkin lebih fokus pada salah satu aspek (tugas atau orang) daripada menyeimbang keduanya. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Executive style is low. Candidate may focus more on one aspect (tasks or people) rather than balancing both. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Autocratic
    (msdt_instrument_id::uuid, 'Autocratic', 'Dominan', 12, 17, 
    'Gaya Otoriter yang sangat kuat. Kandidat sangat menekankan kontrol, instruksi jelas, tenggat, dan pencapaian hasil. Kekuatan utama: efektif untuk kondisi mendesak, tim baru, atau pekerjaan yang membutuhkan kepastian arah. Risiko: berpotensi menurunkan inisiatif dan keterbukaan bawahan bila terlalu dominan.',
    'Autocratic style is very strong. Candidate very strongly emphasizes control, clear instructions, deadlines, and achievement of results. Main strength: effective for urgent conditions, new teams, or work requiring clear direction. Risk: potentially lowers initiative and openness of subordinates if too dominant.'),
    (msdt_instrument_id::uuid, 'Autocratic', 'Menonjol', 9, 11, 
    'Gaya Otoriter cukup menonjol. Kandidat cenderung menekankan kontrol, instruksi jelas, dan pencapaian hasil. Kekuatan: efektif untuk kondisi yang membutuhkan kepastian arah.',
    'Autocratic style is quite prominent. Candidate tends to emphasize control, clear instructions, and achievement of results. Strength: effective for conditions requiring clear direction.'),
    (msdt_instrument_id::uuid, 'Autocratic', 'Situasional', 6, 8, 
    'Gaya Otoriter muncul secara situasional. Kandidat dapat bersikap otoriter bila situasi membutuhkan, namun tidak selalu konsisten. Perilaku ini dipengaruhi oleh konteks dan tekanan target.',
    'Autocratic style appears situationally. Candidate can be authoritarian when situation requires, but not always consistent. This behavior is influenced by context and target pressure.'),
    (msdt_instrument_id::uuid, 'Autocratic', 'Rendah', 0, 5, 
    'Gaya Otoriter rendah. Kandidat cenderung lebih memberikan ruang pada bawahan untuk mengambil inisiatif. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Autocratic style is low. Candidate tends to give more room for subordinates to take initiative. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Bureaucratic
    (msdt_instrument_id::uuid, 'Bureaucratic', 'Dominan', 14, 20, 
    'Gaya Birokratis yang sangat kuat. Kandidat sangat menekankan prosedur, aturan, struktur, data formal, dan kepatuhan organisasi. Kekuatan utama: membantu konsistensi, ketertiban, dan kontrol risiko operasional. Risiko: dapat terasa kaku dan kurang adaptif bila perubahan cepat diperlukan.',
    'Bureaucratic style is very strong. Candidate very strongly emphasizes procedures, rules, structure, formal data, and organizational compliance. Main strength: helps consistency, order, and operational risk control. Risk: can feel rigid and less adaptive when quick changes are needed.'),
    (msdt_instrument_id::uuid, 'Bureaucratic', 'Menonjol', 10, 13, 
    'Gaya Birokratis cukup menonjol. Kandidat cenderung menekankan prosedur, aturan, dan struktur organisasi. Kekuatan: membantu konsistensi dan ketertiban.',
    'Bureaucratic style is quite prominent. Candidate tends to emphasize procedures, rules, and organizational structure. Strength: helps consistency and order.'),
    (msdt_instrument_id::uuid, 'Bureaucratic', 'Situasional', 5, 9, 
    'Gaya Birokratis muncul secara situasional. Kandidat dapat mengikuti prosedur dan aturan bila situasi mengizinkan. Perilaku ini dipengaruhi oleh konteks dan kebutuhan organisasi.',
    'Bureaucratic style appears situationally. Candidate can follow procedures and rules when situation allows. This behavior is influenced by context and organizational needs.'),
    (msdt_instrument_id::uuid, 'Bureaucratic', 'Rendah', 0, 4, 
    'Gaya Birokratis rendah. Kandidat cenderung lebih fleksibel dan kurang terpaku pada struktur formal. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Bureaucratic style is low. Candidate tends to be more flexible and less bound to formal structure. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Developer
    (msdt_instrument_id::uuid, 'Developer', 'Dominan', 10, 14, 
    'Gaya Pengembang yang sangat kuat. Kandidat sangat berorientasi pada pembinaan, pengembangan kemampuan, bantuan, dan pertumbuhan bawahan. Kekuatan utama: baik untuk membangun kapasitas tim dan loyalitas jangka panjang. Risiko: perlu menjaga batas agar bantuan tidak berubah menjadi mengambil alih tanggung jawab.',
    'Developer style is very strong. Candidate is very oriented toward coaching, capability development, assistance, and subordinate growth. Main strength: good for building team capacity and long-term loyalty. Risk: needs to maintain boundaries so assistance does not become taking over responsibility.'),
    (msdt_instrument_id::uuid, 'Developer', 'Menonjol', 7, 9, 
    'Gaya Pengembang cukup menonjol. Kandidat cenderung berorientasi pada pembinaan dan pengembangan kemampuan bawahan. Kekuatan: baik untuk membangun kapasitas tim.',
    'Developer style is quite prominent. Candidate tends to be oriented toward coaching and developing subordinate capabilities. Strength: good for building team capacity.'),
    (msdt_instrument_id::uuid, 'Developer', 'Situasional', 4, 6, 
    'Gaya Pengembang muncul secara situasional. Kandidat dapat membina bawahan bila situasi mengizinkan. Perilaku ini dipengaruhi oleh konteks dan kebutuhan tim.',
    'Developer style appears situationally. Candidate can coach subordinates when situation allows. This behavior is influenced by context and team needs.'),
    (msdt_instrument_id::uuid, 'Developer', 'Rendah', 0, 3, 
    'Gaya Pengembang rendah. Kandidat mungkin lebih fokus pada hasil daripada proses pembinaan. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Developer style is low. Candidate may focus more on results than coaching process. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Human Relations
    (msdt_instrument_id::uuid, 'Human Relations', 'Dominan', 13, 18, 
    'Gaya Relasi Manusia yang sangat kuat. Kandidat sangat mengutamakan kenyamanan, hubungan personal, penerimaan, dan suasana kerja yang menyenangkan. Kekuatan utama: menciptakan iklim kerja hangat dan mendukung komunikasi informal. Risiko: dapat menghindari konfrontasi atau keputusan sulit bila harmoni terlalu diutamakan.',
    'Human Relations style is very strong. Candidate very strongly prioritizes comfort, personal relationships, acceptance, and pleasant work atmosphere. Main strength: creates warm work climate and supports informal communication. Risk: can avoid confrontation or difficult decisions if harmony is overly prioritized.'),
    (msdt_instrument_id::uuid, 'Human Relations', 'Menonjol', 9, 12, 
    'Gaya Relasi Manusia cukup menonjol. Kandidat cenderung mengutamakan kenyamanan dan hubungan personal dalam tim. Kekuatan: menciptakan iklim kerja yang hangat.',
    'Human Relations style is quite prominent. Candidate tends to prioritize comfort and personal relationships in the team. Strength: creates a warm work climate.'),
    (msdt_instrument_id::uuid, 'Human Relations', 'Situasional', 5, 8, 
    'Gaya Relasi Manusia muncul secara situasional. Kandidat dapat membangun hubungan personal bila situasi mengizinkan. Perilaku ini dipengaruhi oleh konteks dan dinamika tim.',
    'Human Relations style appears situationally. Candidate can build personal relationships when situation allows. This behavior is influenced by context and team dynamics.'),
    (msdt_instrument_id::uuid, 'Human Relations', 'Rendah', 0, 4, 
    'Gaya Relasi Manusia rendah. Kandidat mungkin lebih menjaga jarak emosional atau fokus pada tugas daripada hubungan. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Human Relations style is low. Candidate may maintain more emotional distance or focus on tasks rather than relationships. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Compromiser
    (msdt_instrument_id::uuid, 'Compromiser', 'Dominan', 15, 21, 
    'Gaya Kompromis yang sangat kuat. Kandidat sangat mencari jalan tengah, menghindari resistensi, dan menyesuaikan posisi dengan penerimaan orang lain. Kekuatan utama: berguna untuk meredakan konflik dan menjaga dukungan lintas pihak. Risiko: arah keputusan bisa kurang tegas bila terlalu fokus pada penerimaan.',
    'Compromiser style is very strong. Candidate very strongly seeks middle ground, avoids resistance, and adjusts position with acceptance of others. Main strength: useful for reducing conflict and maintaining cross-party support. Risk: decision direction can be less firm if too focused on acceptance.'),
    (msdt_instrument_id::uuid, 'Compromiser', 'Menonjol', 11, 14, 
    'Gaya Kompromis cukup menonjol. Kandidat cenderung mencari jalan tengah dan menyesuaikan posisi dengan penerimaan orang lain. Kekuatan: berguna untuk meredakan konflik.',
    'Compromiser style is quite prominent. Candidate tends to seek middle ground and adjust position with acceptance of others. Strength: useful for reducing conflict.'),
    (msdt_instrument_id::uuid, 'Compromiser', 'Situasional', 6, 10, 
    'Gaya Kompromis muncul secara situasional. Kandidat dapat mencari kompromi bila situasi membutuhkan. Perilaku ini dipengaruhi oleh konteks dan kebutuhan politik organisasi.',
    'Compromiser style appears situationally. Candidate can seek compromise when situation requires. This behavior is influenced by context and organizational political needs.'),
    (msdt_instrument_id::uuid, 'Compromiser', 'Rendah', 0, 5, 
    'Gaya Kompromis rendah. Kandidat mungkin lebih tegas dalam mengambil posisi daripada mencari kompromi. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Compromiser style is low. Candidate may be more firm in taking positions rather than seeking compromise. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.'),

    -- Laissez Faire
    (msdt_instrument_id::uuid, 'Laissez Faire', 'Dominan', 10, 14, 
    'Gaya Laissez Faire yang sangat kuat. Kandidat sangat cenderung melepas kontrol, membiarkan masalah berjalan sendiri, atau minim intervensi. Kekuatan utama: memberi ruang otonomi pada anggota tim yang sangat matang. Risiko: berisiko menurunkan kontrol, disiplin, dan kualitas bila tim masih membutuhkan arahan.',
    'Laissez Faire style is very strong. Candidate very strongly tends to release control, let problems run themselves, or minimal intervention. Main strength: gives autonomy to very mature team members. Risk: risks lowering control, discipline, and quality if team still needs direction.'),
    (msdt_instrument_id::uuid, 'Laissez Faire', 'Menonjol', 7, 9, 
    'Gaya Laissez Faire cukup menonjol. Kandidat cenderung melepas kontrol dan membiarkan bawahan bekerja dengan otonomi. Kekuatan: memberi ruang otonomi pada tim.',
    'Laissez Faire style is quite prominent. Candidate tends to release control and let subordinates work with autonomy. Strength: gives autonomy to the team.'),
    (msdt_instrument_id::uuid, 'Laissez Faire', 'Situasional', 4, 6, 
    'Gaya Laissez Faire muncul secara situasional. Kandidat dapat memberi otonomi bila situasi mengizinkan. Perilaku ini dipengaruhi oleh konteks dan kematangan tim.',
    'Laissez Faire style appears situationally. Candidate can give autonomy when situation allows. This behavior is influenced by context and team maturity.'),
    (msdt_instrument_id::uuid, 'Laissez Faire', 'Rendah', 0, 3, 
    'Gaya Laissez Faire rendah. Kandidat cenderung lebih terlibat dalam pengawasan dan arahan. Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.',
    'Laissez Faire style is low. Candidate tends to be more involved in supervision and direction. This area is not an absolute weakness; its meaning should be read as a preference that is relatively less dominant.');
    
    RAISE NOTICE 'MSDT interpretations inserted successfully for instrument ID: %', msdt_instrument_id;
END $$;
