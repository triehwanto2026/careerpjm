-- Add definitions to Personality Plus test options
-- This migration updates the existing Personality Plus options with word definitions

DO $$
BEGIN
    -- Update Strengths (Rows 1-20)
    
    -- Row 1
    UPDATE test_question_options SET option_definition = 'Penuh semangat dan energi, ekspresif dalam gerak dan bicara', option_definition_en = 'Full of spirit and energy, expressive in movement and speech' WHERE option_text = 'Animated';
    UPDATE test_question_options SET option_definition = 'Berani mengambil risiko dan mencoba hal baru', option_definition_en = 'Willing to take risks and try new things' WHERE option_text = 'Adventurous';
    UPDATE test_question_options SET option_definition = 'Suka menganalisis dan memikirkan secara mendalam', option_definition_en = 'Likes to analyze and think deeply' WHERE option_text = 'Analytical';
    UPDATE test_question_options SET option_definition = 'Mudah menyesuaikan diri dengan situasi dan orang', option_definition_en = 'Easily adapts to situations and people' WHERE option_text = 'Adaptable';
    
    -- Row 2
    UPDATE test_question_options SET option_definition = 'Dapat meyakinkan orang lain dengan kata-kata', option_definition_en = 'Able to convince others with words' WHERE option_text = 'Persuasive';
    UPDATE test_question_options SET option_definition = 'Menyukai kedamaian dan menghindari konflik', option_definition_en = 'Likes peace and avoids conflict' WHERE option_text = 'Peaceful';
    UPDATE test_question_options SET option_definition = 'Tetap pada pendirian dan tidak mudah menyerah', option_definition_en = 'Stands firm and does not give up easily' WHERE option_text = 'Persistent';
    UPDATE test_question_options SET option_definition = 'Suka bersenang-senang dan bersikap ringan', option_definition_en = 'Likes to have fun and be light-hearted' WHERE option_text = 'Playful';
    
    -- Row 3
    UPDATE test_question_options SET option_definition = 'Suka bergaul dan berinteraksi dengan orang lain', option_definition_en = 'Likes to socialize and interact with others' WHERE option_text = 'Sociable';
    UPDATE test_question_options SET option_definition = 'Memiliki kehendak kuat dan tegas', option_definition_en = 'Has strong will and is firm' WHERE option_text = 'Strong-willed';
    UPDATE test_question_options SET option_definition = 'Siap berkorban demi orang lain', option_definition_en = 'Willing to sacrifice for others' WHERE option_text = 'Self-sacrificing';
    UPDATE test_question_options SET option_definition = 'Mengikuti arahan dan tunduk pada otoritas', option_definition_en = 'Follows directions and submits to authority' WHERE option_text = 'Submissive';
    
    -- Row 4
    UPDATE test_question_options SET option_definition = 'Suka bersaing dan ingin menang', option_definition_en = 'Likes to compete and wants to win' WHERE option_text = 'Competitive';
    UPDATE test_question_options SET option_definition = 'Dapat meyakinkan orang lain untuk setuju', option_definition_en = 'Able to convince others to agree' WHERE option_text = 'Convincing';
    UPDATE test_question_options SET option_definition = 'Memperhatikan perasaan dan kebutuhan orang lain', option_definition_en = 'Considerate of others feelings and needs' WHERE option_text = 'Considerate';
    UPDATE test_question_options SET option_definition = 'Dapat mengendalikan emosi dan tindakan', option_definition_en = 'Able to control emotions and actions' WHERE option_text = 'Controlled';
    
    -- Row 5
    UPDATE test_question_options SET option_definition = 'Membawa keceriaan dan energi baru', option_definition_en = 'Brings cheerfulness and new energy' WHERE option_text = 'Refreshing';
    UPDATE test_question_options SET option_definition = 'Menghormati orang lain dan aturan', option_definition_en = 'Respects others and rules' WHERE option_text = 'Respectful';
    UPDATE test_question_options SET option_definition = 'Mampu mencari solusi dan mandiri', option_definition_en = 'Able to find solutions and be self-reliant' WHERE option_text = 'Resourceful';
    UPDATE test_question_options SET option_definition = 'Percaya pada kemampuan diri sendiri', option_definition_en = 'Believes in own abilities' WHERE option_text = 'Self-reliant';
    
    -- Row 6
    UPDATE test_question_options SET option_definition = 'Penuh semangat dan antusias', option_definition_en = 'Full of spirit and enthusiasm' WHERE option_text = 'Spirited';
    UPDATE test_question_options SET option_definition = 'Peka terhadap perasaan orang lain', option_definition_en = 'Sensitive to others feelings' WHERE option_text = 'Sensitive';
    UPDATE test_question_options SET option_definition = 'Mampu menyelesaikan konflik dengan bijak', option_definition_en = 'Able to resolve conflicts wisely' WHERE option_text = 'Diplomatic';
    UPDATE test_question_options SET option_definition = 'Memperhatikan detail dan hal-hal kecil', option_definition_en = 'Pays attention to details and small things' WHERE option_text = 'Detailed';
    
    -- Row 7
    UPDATE test_question_options SET option_definition = 'Aktif mempromosikan ide atau produk', option_definition_en = 'Actively promotes ideas or products' WHERE option_text = 'Promoter';
    UPDATE test_question_options SET option_definition = 'Selalu melihat sisi baik dari situasi', option_definition_en = 'Always sees the good side of situations' WHERE option_text = 'Positive';
    UPDATE test_question_options SET option_definition = 'Suka merencanakan dan mengatur segala sesuatu', option_definition_en = 'Likes to plan and organize everything' WHERE option_text = 'Planner';
    UPDATE test_question_options SET option_definition = 'Sabar dan tidak mudah tersinggung', option_definition_en = 'Patient and not easily offended' WHERE option_text = 'Patient';
    
    -- Row 8
    UPDATE test_question_options SET option_definition = 'Melakukan sesuatu secara spontan tanpa banyak berpikir', option_definition_en = 'Does things spontaneously without much thought' WHERE option_text = 'Spontaneous';
    UPDATE test_question_options SET option_definition = 'Yakin dan percaya diri', option_definition_en = 'Confident and sure of oneself' WHERE option_text = 'Sure';
    UPDATE test_question_options SET option_definition = 'Aktif bergerak dan mengambil inisiatif', option_definition_en = 'Active in moving and taking initiative' WHERE option_text = 'Mover';
    UPDATE test_question_options SET option_definition = 'Mudah bergaul dan beradaptasi', option_definition_en = 'Easily socializes and adapts' WHERE option_text = 'Mixes easily';
    
    -- Row 9
    UPDATE test_question_options SET option_definition = 'Teratur dan suka keteraturan', option_definition_en = 'Organized and likes order' WHERE option_text = 'Orderly';
    UPDATE test_question_options SET option_definition = 'Suka membantu dan patuh', option_definition_en = 'Likes to help and is compliant' WHERE option_text = 'Obliging';
    UPDATE test_question_options SET option_definition = 'Memiliki kemampuan kepemimpinan', option_definition_en = 'Has leadership ability' WHERE option_text = 'Leader';
    UPDATE test_question_options SET option_definition = 'Penuh kehidupan dan energi', option_definition_en = 'Full of life and energy' WHERE option_text = 'Lively';
    
    -- Row 10
    UPDATE test_question_options SET option_definition = 'Ramah dan mudah bergaul', option_definition_en = 'Friendly and easy to get along with' WHERE option_text = 'Friendly';
    UPDATE test_question_options SET option_definition = 'Setia dan dapat dipercaya', option_definition_en = 'Loyal and trustworthy' WHERE option_text = 'Faithful';
    UPDATE test_question_options SET option_definition = 'Produktif dan efisien dalam bekerja', option_definition_en = 'Productive and efficient in work' WHERE option_text = 'Productive';
    UPDATE test_question_options SET option_definition = 'Disukai banyak orang', option_definition_en = 'Liked by many people' WHERE option_text = 'Popular';
    
    -- Row 11
    UPDATE test_question_options SET option_definition = 'Berani dan tidak takut risiko', option_definition_en = 'Brave and not afraid of risks' WHERE option_text = 'Daring';
    UPDATE test_question_options SET option_definition = 'Menyenangkan dan menggembirakan', option_definition_en = 'Delightful and cheerful' WHERE option_text = 'Delightful';
    UPDATE test_question_options SET option_definition = 'Memperhatikan detail secara seksama', option_definition_en = 'Pays close attention to details' WHERE option_text = 'Detailed';
    UPDATE test_question_options SET option_definition = 'Berpikir secara mendalam dan serius', option_definition_en = 'Thinks deeply and seriously' WHERE option_text = 'Deep';
    
    -- Row 12
    UPDATE test_question_options SET option_definition = 'Selalu ceria dan optimis', option_definition_en = 'Always cheerful and optimistic' WHERE option_text = 'Cheerful';
    UPDATE test_question_options SET option_definition = 'Konsisten dan dapat diandalkan', option_definition_en = 'Consistent and reliable' WHERE option_text = 'Consistent';
    UPDATE test_question_options SET option_definition = 'Berbudaya dan berpengetahuan luas', option_definition_en = 'Cultured and knowledgeable' WHERE option_text = 'Cultured';
    UPDATE test_question_options SET option_definition = 'Percaya diri dan yakin', option_definition_en = 'Confident and sure' WHERE option_text = 'Confident';
    
    -- Row 13
    UPDATE test_question_options SET option_definition = 'Memiliki idealisme dan visi tinggi', option_definition_en = 'Has idealism and high vision' WHERE option_text = 'Idealistic';
    UPDATE test_question_options SET option_definition = 'Mandiri dan tidak bergantung orang lain', option_definition_en = 'Independent and not dependent on others' WHERE option_text = 'Independent';
    UPDATE test_question_options SET option_definition = 'Dapat menginspirasi orang lain', option_definition_en = 'Able to inspire others' WHERE option_text = 'Inspiring';
    UPDATE test_question_options SET option_definition = 'Tidak menyinggung dan menyenangkan', option_definition_en = 'Not offensive and pleasant' WHERE option_text = 'Inoffensive';
    
    -- Row 14
    UPDATE test_question_options SET option_definition = 'Ekspresif dalam menunjukkan perasaan', option_definition_en = 'Expressive in showing feelings' WHERE option_text = 'Demonstrative';
    UPDATE test_question_options SET option_definition = 'Tegas dalam mengambil keputusan', option_definition_en = 'Firm in making decisions' WHERE option_text = 'Decisive';
    UPDATE test_question_options SET option_definition = 'Berpikir mendalam dan serius', option_definition_en = 'Thinks deeply and seriously' WHERE option_text = 'Deep';
    UPDATE test_question_options SET option_definition = 'Humor kering dan tidak berlebihan', option_definition_en = 'Dry humor and not excessive' WHERE option_text = 'Dry Humor';
    
    -- Row 15
    UPDATE test_question_options SET option_definition = 'Dapat menjadi mediator dalam konflik', option_definition_en = 'Can be a mediator in conflicts' WHERE option_text = 'Mediator';
    UPDATE test_question_options SET option_definition = 'Memiliki bakat musik atau artistik', option_definition_en = 'Has musical or artistic talent' WHERE option_text = 'Musical';
    UPDATE test_question_options SET option_definition = 'Mudah bergaul dan beradaptasi', option_definition_en = 'Easily socializes and adapts' WHERE option_text = 'Mixes easily';
    UPDATE test_question_options SET option_definition = 'Aktif bergerak dan mengambil inisiatif', option_definition_en = 'Active in moving and taking initiative' WHERE option_text = 'Mover';
    
    -- Row 16
    UPDATE test_question_options SET option_definition = 'Memikirkan dan memperhatikan orang lain', option_definition_en = 'Thinks about and cares for others' WHERE option_text = 'Thoughtful';
    UPDATE test_question_options SET option_definition = 'Teguh dan tidak mudah menyerah', option_definition_en = 'Tenacious and does not give up easily' WHERE option_text = 'Tenacious';
    UPDATE test_question_options SET option_definition = 'Suka bicara dan komunikatif', option_definition_en = 'Likes to talk and is communicative' WHERE option_text = 'Talker';
    UPDATE test_question_options SET option_definition = 'Sabar dan menerima perbedaan', option_definition_en = 'Patient and accepts differences' WHERE option_text = 'Tolerant';
    
    -- Row 17
    UPDATE test_question_options SET option_definition = 'Dengar yang baik dan perhatian', option_definition_en = 'Good listener and attentive' WHERE option_text = 'Listener';
    UPDATE test_question_options SET option_definition = 'Setia dan dapat dipercaya', option_definition_en = 'Loyal and trustworthy' WHERE option_text = 'Loyal';
    UPDATE test_question_options SET option_definition = 'Penuh kehidupan dan energi', option_definition_en = 'Full of life and energy' WHERE option_text = 'Lively';
    UPDATE test_question_options SET option_definition = 'Memiliki kemampuan kepemimpinan', option_definition_en = 'Has leadership ability' WHERE option_text = 'Leader';
    
    -- Row 18
    UPDATE test_question_options SET option_definition = 'Puas dengan apa yang dimiliki', option_definition_en = 'Content with what one has' WHERE option_text = 'Contented';
    UPDATE test_question_options SET option_definition = 'Pemimpin atau atasan', option_definition_en = 'Leader or boss' WHERE option_text = 'Chief';
    UPDATE test_question_options SET option_definition = 'Suka membuat grafik dan diagram', option_definition_en = 'Likes to make charts and diagrams' WHERE option_text = 'Chartmaker';
    UPDATE test_question_options SET option_definition = 'Lucu dan menggemaskan', option_definition_en = 'Cute and adorable' WHERE option_text = 'Cute';
    
    -- Row 19
    UPDATE test_question_options SET option_definition = 'Ingin segala sesuatu sempurna', option_definition_en = 'Wants everything to be perfect' WHERE option_text = 'Perfectionist';
    UPDATE test_question_options SET option_definition = 'Menyenangkan dan ramah', option_definition_en = 'Pleasant and friendly' WHERE option_text = 'Pleasant';
    UPDATE test_question_options SET option_definition = 'Disukai banyak orang', option_definition_en = 'Liked by many people' WHERE option_text = 'Popular';
    UPDATE test_question_options SET option_definition = 'Produktif dan efisien', option_definition_en = 'Productive and efficient' WHERE option_text = 'Productive';
    
    -- Row 20
    UPDATE test_question_options SET option_definition = 'Penuh energi dan ceria', option_definition_en = 'Full of energy and cheerful' WHERE option_text = 'Bouncy';
    UPDATE test_question_options SET option_definition = 'Berani dan percaya diri', option_definition_en = 'Brave and confident' WHERE option_text = 'Bold';
    UPDATE test_question_options SET option_definition = 'Berperilaku baik dan sopan', option_definition_en = 'Well-behaved and polite' WHERE option_text = 'Behaved';
    UPDATE test_question_options SET option_definition = 'Seimbang dan stabil', option_definition_en = 'Balanced and stable' WHERE option_text = 'Balanced';
    
    -- Weaknesses (Rows 21-40)
    
    -- Row 21
    UPDATE test_question_options SET option_definition = 'Kosong atau tidak berpengaruh', option_definition_en = 'Empty or without influence' WHERE option_text = 'Blank';
    UPDATE test_question_options SET option_definition = 'Pemalu dan kurang percaya diri', option_definition_en = 'Shy and lacks confidence' WHERE option_text = 'Bashful';
    UPDATE test_question_options SET option_definition = 'Kasar dan kurang sopan', option_definition_en = 'Crude and impolite' WHERE option_text = 'Brassy';
    UPDATE test_question_options SET option_definition = 'Suka memerintah dan dominan', option_definition_en = 'Likes to command and be dominant' WHERE option_text = 'Bossy';
    
    -- Row 22
    UPDATE test_question_options SET option_definition = 'Tidak teratur dan tidak disiplin', option_definition_en = 'Undisciplined and lacks order' WHERE option_text = 'Undisciplined';
    UPDATE test_question_options SET option_definition = 'Tidak peka terhadap perasaan orang lain', option_definition_en = 'Insensitive to others feelings' WHERE option_text = 'Unsympathetic';
    UPDATE test_question_options SET option_definition = 'Tidak antusias dan kurang semangat', option_definition_en = 'Unenthusiastic and lacks spirit' WHERE option_text = 'Unenthusiastic';
    UPDATE test_question_options SET option_definition = 'Tidak mudah memaafkan', option_definition_en = 'Does not forgive easily' WHERE option_text = 'Unforgiving';
    
    -- Row 23
    UPDATE test_question_options SET option_definition = 'Sulit mengungkapkan perasaan', option_definition_en = 'Difficulty expressing feelings' WHERE option_text = 'Reticent';
    UPDATE test_question_options SET option_definition = 'Menyimpan dendam', option_definition_en = 'Holds grudges' WHERE option_text = 'Resentful';
    UPDATE test_question_options SET option_definition = 'Menolak perubahan', option_definition_en = 'Resists change' WHERE option_text = 'Resistant';
    UPDATE test_question_options SET option_definition = 'Suka memotong pembicaraan', option_definition_en = 'Likes to interrupt conversations' WHERE option_text = 'Interrupts';
    
    -- Row 24
    UPDATE test_question_options SET option_definition = 'Terlalu detail dan perfeksionis', option_definition_en = 'Too detailed and perfectionist' WHERE option_text = 'Fussy';
    UPDATE test_question_options SET option_definition = 'Takut dan cemas', option_definition_en = 'Afraid and anxious' WHERE option_text = 'Fearful';
    UPDATE test_question_options SET option_definition = 'Sering lupa', option_definition_en = 'Often forgets' WHERE option_text = 'Forgetful';
    UPDATE test_question_options SET option_definition = 'Ragu-ragu dalam mengambil keputusan', option_definition_en = 'Hesitant in making decisions' WHERE option_text = 'Hesitant';
    
    -- Row 25
    UPDATE test_question_options SET option_definition = 'Tidak sabar', option_definition_en = 'Impatient' WHERE option_text = 'Impatient';
    UPDATE test_question_options SET option_definition = 'Kurang percaya diri', option_definition_en = 'Lacks confidence' WHERE option_text = 'Insecure';
    UPDATE test_question_options SET option_definition = 'Sulit mengambil keputusan', option_definition_en = 'Difficulty making decisions' WHERE option_text = 'Indecisive';
    UPDATE test_question_options SET option_definition = 'Terasa terasing dan terpisah', option_definition_en = 'Feels alienated and separated' WHERE option_text = 'Alienated';
    
    -- Row 26
    UPDATE test_question_options SET option_definition = 'Tidak disukai orang lain', option_definition_en = 'Not liked by others' WHERE option_text = 'Unpopular';
    UPDATE test_question_options SET option_definition = 'Tidak terlibat dan acuh', option_definition_en = 'Uninvolved and indifferent' WHERE option_text = 'Uninvolved';
    UPDATE test_question_options SET option_definition = 'Sulit diprediksi', option_definition_en = 'Hard to predict' WHERE option_text = 'Unpredictable';
    UPDATE test_question_options SET option_definition = 'Suka mendapat pengakuan', option_definition_en = 'Likes to get recognition' WHERE option_text = 'Wants credit';
    
    -- Row 27
    UPDATE test_question_options SET option_definition = 'Keras kepala dan tidak mau mendengar', option_definition_en = 'Stubborn and refuses to listen' WHERE option_text = 'Headstrong';
    UPDATE test_question_options SET option_definition = 'Tidak teratur', option_definition_en = 'Disorganized' WHERE option_text = 'Haphazard';
    UPDATE test_question_options SET option_definition = 'Sulit dipuaskan', option_definition_en = 'Hard to please' WHERE option_text = 'Hard to Please';
    UPDATE test_question_options SET option_definition = 'Merasa depresi', option_definition_en = 'Feels depressed' WHERE option_text = 'Depressed';
    
    -- Row 28
    UPDATE test_question_options SET option_definition = 'Biasa saja dan tidak menarik', option_definition_en = 'Plain and uninteresting' WHERE option_text = 'Plain';
    UPDATE test_question_options SET option_definition = 'Selalu melihat sisi negatif', option_definition_en = 'Always sees the negative side' WHERE option_text = 'Pessimistic';
    UPDATE test_question_options SET option_definition = 'Sombong dan angkuh', option_definition_en = 'Proud and arrogant' WHERE option_text = 'Proud';
    UPDATE test_question_options SET option_definition = 'Suka memanipulasi orang lain', option_definition_en = 'Likes to manipulate others' WHERE option_text = 'Manipulative';
    
    -- Row 29
    UPDATE test_question_options SET option_definition = 'Mudah marah', option_definition_en = 'Easily angered' WHERE option_text = 'Angered easily';
    UPDATE test_question_options SET option_definition = 'Tidak memiliki tujuan', option_definition_en = 'Has no purpose' WHERE option_text = 'Aimless';
    UPDATE test_question_options SET option_definition = 'Suka berdebat', option_definition_en = 'Likes to argue' WHERE option_text = 'Argumentative';
    UPDATE test_question_options SET option_definition = 'Bicara keras dan berisik', option_definition_en = 'Speaks loudly and noisily' WHERE option_text = 'Loud';
    
    -- Row 30
    UPDATE test_question_options SET option_definition = 'Polos dan tidak berpengalaman', option_definition_en = 'Naive and inexperienced' WHERE option_text = 'Naive';
    UPDATE test_question_options SET option_definition = 'Sikap negatif', option_definition_en = 'Negative attitude' WHERE option_text = 'Negative attitude';
    UPDATE test_question_options SET option_definition = 'Berani dan nekat', option_definition_en = 'Bold and reckless' WHERE option_text = 'Nervy';
    UPDATE test_question_options SET option_definition = 'Acuh dan tidak peduli', option_definition_en = 'Indifferent and uncaring' WHERE option_text = 'Nonchalant';
    
    -- Row 31
    UPDATE test_question_options SET option_definition = 'Sering khawatir', option_definition_en = 'Often worries' WHERE option_text = 'Worrier';
    UPDATE test_question_options SET option_definition = 'Menarik diri dari orang lain', option_definition_en = 'Withdraws from others' WHERE option_text = 'Withdrawn';
    UPDATE test_question_options SET option_definition = 'Kecanduan kerja', option_definition_en = 'Workaholic' WHERE option_text = 'Workaholic';
    UPDATE test_question_options SET option_definition = 'Terlalu peka', option_definition_en = 'Too sensitive' WHERE option_text = 'Too sensitive';
    
    -- Row 32
    UPDATE test_question_options SET option_definition = 'Tidak sopan dalam bicara', option_definition_en = 'Tactless in speech' WHERE option_text = 'Tactless';
    UPDATE test_question_options SET option_definition = 'Pemalu', option_definition_en = 'Timid' WHERE option_text = 'Timid';
    UPDATE test_question_options SET option_definition = 'Suka bicara terus menerus', option_definition_en = 'Talks continuously' WHERE option_text = 'Talkative';
    UPDATE test_question_options SET option_definition = 'Ragu-ragu', option_definition_en = 'Doubtful' WHERE option_text = 'Doubtful';
    
    -- Row 33
    UPDATE test_question_options SET option_definition = 'Tidak teratur', option_definition_en = 'Disorganized' WHERE option_text = 'Disorganized';
    UPDATE test_question_options SET option_definition = 'Suka mendominasi', option_definition_en = 'Likes to dominate' WHERE option_text = 'Domineering';
    UPDATE test_question_options SET option_definition = 'Mood berubah-ubah', option_definition_en = 'Moody' WHERE option_text = 'Moody';
    UPDATE test_question_options SET option_definition = 'Bicara tidak jelas', option_definition_en = 'Mumbles' WHERE option_text = 'Mumbles';
    
    -- Row 34
    UPDATE test_question_options SET option_definition = 'Tidak konsisten', option_definition_en = 'Inconsistent' WHERE option_text = 'Inconsistent';
    UPDATE test_question_options SET option_definition = 'Suka menyendiri', option_definition_en = 'Introverted' WHERE option_text = 'Introvert';
    UPDATE test_question_options SET option_definition = 'Tidak toleran', option_definition_en = 'Intolerant' WHERE option_text = 'Intolerant';
    UPDATE test_question_options SET option_definition = 'Skeptis dan curiga', option_definition_en = 'Skeptical and suspicious' WHERE option_text = 'Skeptical';
    
    -- Row 35
    UPDATE test_question_options SET option_definition = 'Berantakan', option_definition_en = 'Messy' WHERE option_text = 'Messy';
    UPDATE test_question_options SET option_definition = 'Mood berubah-ubah', option_definition_en = 'Moody' WHERE option_text = 'Moody';
    UPDATE test_question_options SET option_definition = 'Bicara tidak jelas', option_definition_en = 'Mumbles' WHERE option_text = 'Mumbles';
    UPDATE test_question_options SET option_definition = 'Lambat', option_definition_en = 'Slow' WHERE option_text = 'Slow';
    
    -- Row 36
    UPDATE test_question_options SET option_definition = 'Keras kepala', option_definition_en = 'Stubborn' WHERE option_text = 'Stubborn';
    UPDATE test_question_options SET option_definition = 'Suka pamer', option_definition_en = 'Show-off' WHERE option_text = 'Show-off';
    UPDATE test_question_options SET option_definition = 'Skeptis dan curiga', option_definition_en = 'Skeptical and suspicious' WHERE option_text = 'Skeptical';
    UPDATE test_question_options SET option_definition = 'Lambat dan malas', option_definition_en = 'Sluggish and lazy' WHERE option_text = 'Sluggish';
    
    -- Row 37
    UPDATE test_question_options SET option_definition = 'Suka menyendiri', option_definition_en = 'Likes to be alone' WHERE option_text = 'Loner';
    UPDATE test_question_options SET option_definition = 'Suka mengatur orang lain', option_definition_en = 'Likes to control others' WHERE option_text = 'Lord over others';
    UPDATE test_question_options SET option_definition = 'Malas', option_definition_en = 'Lazy' WHERE option_text = 'Lazy';
    UPDATE test_question_options SET option_definition = 'Curiga', option_definition_en = 'Suspicious' WHERE option_text = 'Suspicious';
    
    -- Row 38
    UPDATE test_question_options SET option_definition = 'Mudah marah', option_definition_en = 'Short-tempered' WHERE option_text = 'Short-tempered';
    UPDATE test_question_options SET option_definition = 'Pikiran berantakan', option_definition_en = 'Scatterbrained' WHERE option_text = 'Scatterbrained';
    UPDATE test_question_options SET option_definition = 'Ingin balas dendam', option_definition_en = 'Wants revenge' WHERE option_text = 'Revengeful';
    UPDATE test_question_options SET option_definition = 'Gelisah dan tidak tenang', option_definition_en = 'Restless and uneasy' WHERE option_text = 'Restless';
    
    -- Row 39
    UPDATE test_question_options SET option_definition = 'Enggan dan tidak mau', option_definition_en = 'Reluctant and unwilling' WHERE option_text = 'Reluctant';
    UPDATE test_question_options SET option_definition = 'Terburu-buru', option_definition_en = 'Rash' WHERE option_text = 'Rash';
    UPDATE test_question_options SET option_definition = 'Berkompromi', option_definition_en = 'Compromising' WHERE option_text = 'Compromising';
    UPDATE test_question_options SET option_definition = 'Kritis', option_definition_en = 'Critical' WHERE option_text = 'Critical';
    
    -- Row 40
    UPDATE test_question_options SET option_definition = 'Sering berubah', option_definition_en = 'Often changes' WHERE option_text = 'Changeable';
    UPDATE test_question_options SET option_definition = 'Licik', option_definition_en = 'Crafty' WHERE option_text = 'Crafty';
    UPDATE test_question_options SET option_definition = 'Berkompromi', option_definition_en = 'Compromising' WHERE option_text = 'Compromising';
    UPDATE test_question_options SET option_definition = 'Kritis', option_definition_en = 'Critical' WHERE option_text = 'Critical';
    
    RAISE NOTICE '✅ Definitions added to Personality Plus test options';
END $$;
