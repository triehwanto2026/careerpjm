-- Add Aptitude Test interpretations
-- Clear existing interpretations for Aptitude Test
DELETE FROM public.test_interpretations 
WHERE instrument_id = (SELECT id FROM public.test_instruments WHERE name ILIKE '%aptitude%');

-- Insert overall score interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['overall_score', 'overall_score', 'overall_score', 'overall_score', 'overall_score']) as interpretation_key,
  unnest(ARRAY[
    'Kemampuan umum sangat rendah. Memerlukan pengembangan fundamental dalam semua aspek kognitif. Tidak direkomendasikan untuk posisi yang menuntut analisis kompleks.',
    'Kemampuan umum rendah. Perlu pelatihan intensif. Cocok untuk pekerjaan rutin dengan supervisi ketat.',
    'Kemampuan umum rata-rata. Cukup untuk pekerjaan administratif standar. Dapat berkembang dengan pelatihan yang tepat.',
    'Kemampuan umum tinggi. Mampu menangani tugas kompleks dan multitasking. Potensial untuk posisi supervisory.',
    'Kemampuan umum sangat tinggi. Unggul dalam problem solving dan analisis. Cocok untuk posisi manajerial atau spesialis.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Very low general ability. Requires fundamental development in all cognitive aspects. Not recommended for positions requiring complex analysis.',
    'Low general ability. Needs intensive training. Suitable for routine work with close supervision.',
    'Average general ability. Sufficient for standard administrative work. Can develop with proper training.',
    'High general ability. Able to handle complex tasks and multitasking. Potential for supervisory positions.',
    'Very high general ability. Excellent in problem solving and analysis. Suitable for managerial or specialist positions.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';

-- Insert verbal ability interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['verbal_ability', 'verbal_ability', 'verbal_ability', 'verbal_ability', 'verbal_ability']) as interpretation_key,
  unnest(ARRAY[
    'Kemampuan verbal sangat rendah. Kesulitan dalam memahami instruksi tertulis dan komunikasi verbal.',
    'Kemampuan verbal rendah. Perlu bantuan dalam komunikasi tertulis dan pemahaman konsep abstrak.',
    'Kemampuan verbal rata-rata. Mampu komunikasi dasar dan memahami instruksi standar.',
    'Kemampuan verbal tinggi. Baik dalam komunikasi, negosiasi, dan pemahaman konsep kompleks.',
    'Kemampuan verbal sangat tinggi. Unggul dalam komunikasi, presentasi, dan analisis teks.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Very low verbal ability. Difficulty understanding written instructions and verbal communication.',
    'Low verbal ability. Needs assistance in written communication and understanding abstract concepts.',
    'Average verbal ability. Able to communicate basic ideas and understand standard instructions.',
    'High verbal ability. Good in communication, negotiation, and understanding complex concepts.',
    'Very high verbal ability. Excellent in communication, presentation, and text analysis.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';

-- Insert numerical ability interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['numerical_ability', 'numerical_ability', 'numerical_ability', 'numerical_ability', 'numerical_ability']) as interpretation_key,
  unnest(ARRAY[
    'Kemampuan numerik sangat rendah. Kesulitan dengan perhitungan dasar dan data angka.',
    'Kemampuan numerik rendah. Perlu alat bantu untuk perhitungan dan analisis data sederhana.',
    'Kemampuan numerik rata-rata. Mampu perhitungan standar dan analisis data dasar.',
    'Kemampuan numerik tinggi. Baik dalam analisis data, perhitungan kompleks, dan problem solving.',
    'Kemampuan numerik sangat tinggi. Unggul dalam matematika, statistik, dan analisis kuantitatif.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Very low numerical ability. Difficulty with basic calculations and numerical data.',
    'Low numerical ability. Needs tools for calculations and simple data analysis.',
    'Average numerical ability. Able to perform standard calculations and basic data analysis.',
    'High numerical ability. Good in data analysis, complex calculations, and problem solving.',
    'Very high numerical ability. Excellent in mathematics, statistics, and quantitative analysis.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';

-- Insert logical reasoning interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['logical_reasoning', 'logical_reasoning', 'logical_reasoning', 'logical_reasoning', 'logical_reasoning']) as interpretation_key,
  unnest(ARRAY[
    'Penalaran logis sangat rendah. Kesulitan dalam mengidentifikasi pola dan hubungan logika.',
    'Penalaran logis rendah. Perlu bimbingan dalam problem solving dan pengambilan keputusan.',
    'Penalaran logis rata-rata. Mampu problem solving standar dan pengambilan keputusan sederhana.',
    'Penalaran logis tinggi. Baik dalam analisis masalah, strategi, dan pengambilan keputusan kompleks.',
    'Penalaran logis sangat tinggi. Unggul dalam analisis sistem, strategi, dan problem solving kompleks.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Very low logical reasoning. Difficulty identifying patterns and logical relationships.',
    'Low logical reasoning. Needs guidance in problem solving and decision making.',
    'Average logical reasoning. Able to perform standard problem solving and simple decision making.',
    'High logical reasoning. Good in problem analysis, strategy, and complex decision making.',
    'Very high logical reasoning. Excellent in system analysis, strategy, and complex problem solving.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';

-- Insert spatial ability interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['spatial_ability', 'spatial_ability', 'spatial_ability', 'spatial_ability', 'spatial_ability']) as interpretation_key,
  unnest(ARRAY[
    'Kemampuan spasial sangat rendah. Kesulitan dengan orientasi ruang dan visualisasi.',
    'Kemampuan spasial rendah. Perlu bantuan dalam navigasi dan desain visual.',
    'Kemampuan spasial rata-rata. Cukup untuk tugas visual dasar dan navigasi standar.',
    'Kemampuan spasial tinggi. Baik dalam desain, arsitektur, dan visualisasi 3D.',
    'Kemampuan spasial sangat tinggi. Unggul dalam desain, engineering, dan kreativitas visual.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Very low spatial ability. Difficulty with spatial orientation and visualization.',
    'Low spatial ability. Needs assistance with navigation and visual design.',
    'Average spatial ability. Sufficient for basic visual tasks and standard navigation.',
    'High spatial ability. Good in design, architecture, and 3D visualization.',
    'Very high spatial ability. Excellent in design, engineering, and visual creativity.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';

-- Insert job recommendation interpretations
INSERT INTO public.test_interpretations (instrument_id, interpretation_key, interpretation_text, interpretation_text_en, min_value, max_value, category)
SELECT 
  id as instrument_id,
  unnest(ARRAY['job_recommendation', 'job_recommendation', 'job_recommendation', 'job_recommendation', 'job_recommendation']) as interpretation_key,
  unnest(ARRAY[
    'Rekomendasi: Posisi entry-level dengan supervisi ketat. Fokus pada pengembangan fundamental. Contoh: Admin junior, helper, pekerjaan manual sederhana.',
    'Rekomendasi: Posisi rutin dengan prosedur jelas. Contoh: Data entry, warehouse staff, customer service basic.',
    'Rekomendasi: Posisi administratif dan operasional. Contoh: Admin, sales, marketing support, technician junior.',
    'Rekomendasi: Posisi supervisory dan spesialis. Contoh: Supervisor, team lead, analyst, specialist, sales senior.',
    'Rekomendasi: Posisi manajerial dan strategis. Contoh: Manager, senior analyst, consultant, department head, specialist expert.'
  ]) as interpretation_text,
  unnest(ARRAY[
    'Recommendation: Entry-level positions with close supervision. Focus on fundamental development. Examples: Junior admin, helper, simple manual work.',
    'Recommendation: Routine positions with clear procedures. Examples: Data entry, warehouse staff, basic customer service.',
    'Recommendation: Administrative and operational positions. Examples: Admin, sales, marketing support, junior technician.',
    'Recommendation: Supervisory and specialist positions. Examples: Supervisor, team lead, analyst, specialist, senior sales.',
    'Recommendation: Managerial and strategic positions. Examples: Manager, senior analyst, consultant, department head, expert specialist.'
  ]) as interpretation_text_en,
  unnest(ARRAY[0, 20, 40, 60, 80]) as min_value,
  unnest(ARRAY[20, 40, 60, 80, 100]) as max_value,
  unnest(ARRAY['Very Low', 'Low', 'Average', 'High', 'Very High']) as category
FROM public.test_instruments 
WHERE name ILIKE '%aptitude%';
