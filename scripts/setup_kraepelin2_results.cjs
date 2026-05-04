const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

const KRAEPELIN2_NAME = 'Kraepelin 2';

async function setupKraepelin2Results() {
  console.log('Setting up Kraepelin 2 result schema...');
  
  // Get Kraepelin 2 instrument ID
  const { data: instrument } = await supabase
    .from('test_instruments')
    .select('id')
    .ilike('name', 'Kraepelin 2')
    .maybeSingle();
  
  if (!instrument) {
    console.error('Kraepelin 2 instrument not found!');
    process.exit(1);
  }
  
  const instrumentId = instrument.id;
  console.log('Found Kraepelin 2 ID:', instrumentId);
  
  // Check if test_interpretations table exists and has data
  const { data: existing } = await supabase
    .from('test_interpretations')
    .select('count')
    .eq('instrument_id', instrumentId)
    .maybeSingle();
  
  if (existing && existing.count > 0) {
    console.log('Interpretations already exist for Kraepelin 2');
    return;
  }
  
  // Insert interpretations for Kraepelin 2
  const interpretations = [
    // Speed interpretations
    { interpretation_key: 'speed', interpretation_text: 'Kecepatan sangat rendah. Perlu latihan intensif dalam kecepatan kerja.', interpretation_text_en: 'Speed is very low. Needs intensive training in work speed.', min_value: 0, max_value: 20, category: 'Very Low' },
    { interpretation_key: 'speed', interpretation_text: 'Kecepatan rendah. Perlu peningkatan dalam kecepatan pemrosesan informasi.', interpretation_text_en: 'Speed is low. Needs improvement in information processing speed.', min_value: 20, max_value: 40, category: 'Low' },
    { interpretation_key: 'speed', interpretation_text: 'Kecepatan rata-rata. Cukup untuk pekerjaan standar.', interpretation_text_en: 'Average speed. Sufficient for standard work.', min_value: 40, max_value: 60, category: 'Average' },
    { interpretation_key: 'speed', interpretation_text: 'Kecepatan tinggi. Mampu bekerja dengan cepat dan efisien.', interpretation_text_en: 'High speed. Able to work fast and efficiently.', min_value: 60, max_value: 80, category: 'High' },
    { interpretation_key: 'speed', interpretation_text: 'Kecepatan sangat tinggi. Unggul dalam pekerjaan yang membutuhkan kecepatan.', interpretation_text_en: 'Very high speed. Excellent in jobs requiring speed.', min_value: 80, max_value: 100, category: 'Very High' },
    
    // Accuracy interpretations
    { interpretation_key: 'accuracy', interpretation_text: 'Ketelitian sangat rendah. Banyak kesalahan, perlu perhatian khusus terhadap detail.', interpretation_text_en: 'Accuracy is very low. Many errors, needs special attention to detail.', min_value: 0, max_value: 20, category: 'Very Low' },
    { interpretation_key: 'accuracy', interpretation_text: 'Ketelitian rendah. Terdapat kesalahan yang signifikan dalam pekerjaan.', interpretation_text_en: 'Accuracy is low. Significant errors in work.', min_value: 20, max_value: 40, category: 'Low' },
    { interpretation_key: 'accuracy', interpretation_text: 'Ketelitian rata-rata. Cukup untuk pekerjaan yang memerlukan akurasi moderat.', interpretation_text_en: 'Average accuracy. Sufficient for work requiring moderate accuracy.', min_value: 40, max_value: 60, category: 'Average' },
    { interpretation_key: 'accuracy', interpretation_text: 'Ketelitian tinggi. Mampu bekerja dengan presisi dan minim kesalahan.', interpretation_text_en: 'High accuracy. Able to work with precision and minimal errors.', min_value: 60, max_value: 80, category: 'High' },
    { interpretation_key: 'accuracy', interpretation_text: 'Ketelitian sangat tinggi. Sangat teliti dan akurat dalam pekerjaan.', interpretation_text_en: 'Very high accuracy. Very meticulous and accurate in work.', min_value: 80, max_value: 100, category: 'Very High' },
    
    // Stability interpretations
    { interpretation_key: 'stability', interpretation_text: 'Stabilitas sangat rendah. Kinerja menurun drastis seiring waktu.', interpretation_text_en: 'Stability is very low. Performance drops drastically over time.', min_value: 0, max_value: 20, category: 'Very Low' },
    { interpretation_key: 'stability', interpretation_text: 'Stabilitas rendah. Kinerja cenderung menurun dalam periode kerja panjang.', interpretation_text_en: 'Stability is low. Performance tends to decrease over long work periods.', min_value: 20, max_value: 40, category: 'Low' },
    { interpretation_key: 'stability', interpretation_text: 'Stabilitas rata-rata. Konsistensi cukup untuk pekerjaan standar.', interpretation_text_en: 'Average stability. Sufficient consistency for standard work.', min_value: 40, max_value: 60, category: 'Average' },
    { interpretation_key: 'stability', interpretation_text: 'Stabilitas tinggi. Mampu menjaga konsistensi kinerja dalam waktu lama.', interpretation_text_en: 'High stability. Able to maintain consistent performance for long periods.', min_value: 60, max_value: 80, category: 'High' },
    { interpretation_key: 'stability', interpretation_text: 'Stabilitas sangat tinggi. Kinerja tetap optimal bahkan dalam kerja berjam-jam.', interpretation_text_en: 'Very high stability. Optimal performance even in hours-long work.', min_value: 80, max_value: 100, category: 'Very High' },
    
    // Work capacity interpretations
    { interpretation_key: 'work_capacity', interpretation_text: 'Kapasitas kerja sangat rendah. Tidak cocok untuk pekerjaan klerikal.', interpretation_text_en: 'Work capacity is very low. Not suitable for clerical work.', min_value: 0, max_value: 20, category: 'Very Low' },
    { interpretation_key: 'work_capacity', interpretation_text: 'Kapasitas kerja rendah. Hanya cocok untuk pekerjaan sederhana dengan supervisi.', interpretation_text_en: 'Low work capacity. Only suitable for simple work with supervision.', min_value: 20, max_value: 40, category: 'Low' },
    { interpretation_key: 'work_capacity', interpretation_text: 'Kapasitas kerja rata-rata. Cukup untuk pekerjaan administrasi standar.', interpretation_text_en: 'Average work capacity. Sufficient for standard administrative work.', min_value: 40, max_value: 60, category: 'Average' },
    { interpretation_key: 'work_capacity', interpretation_text: 'Kapasitas kerja tinggi. Cocok untuk pekerjaan klerikal kompleks dan multitasking.', interpretation_text_en: 'High work capacity. Suitable for complex clerical work and multitasking.', min_value: 60, max_value: 80, category: 'High' },
    { interpretation_key: 'work_capacity', interpretation_text: 'Kapasitas kerja sangat tinggi. Ideal untuk posisi yang menuntut produktivitas tinggi.', interpretation_text_en: 'Very high work capacity. Ideal for positions demanding high productivity.', min_value: 80, max_value: 100, category: 'Very High' },
  ];
  
  // Add instrument_id to all interpretations
  const dataToInsert = interpretations.map(i => ({ ...i, instrument_id: instrumentId }));
  
  const { error } = await supabase.from('test_interpretations').insert(dataToInsert);
  
  if (error) {
    console.error('Error inserting interpretations:', error);
    process.exit(1);
  }
  
  console.log(`✅ Inserted ${dataToInsert.length} Kraepelin 2 interpretations`);
  console.log('\nCategories:');
  console.log('- Speed (Kecepatan)');
  console.log('- Accuracy (Ketelitian)');
  console.log('- Stability (Stabilitas)');
  console.log('- Work Capacity (Kapasitas Kerja)');
  console.log('\nEach category has 5 levels: Very Low, Low, Average, High, Very High');
}

setupKraepelin2Results();
