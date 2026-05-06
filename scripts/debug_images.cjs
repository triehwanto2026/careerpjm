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

const IST_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';

async function debugImages() {
  console.log('=== DEBUG IST IMAGES ===\n');
  
  // 1. Check raw data from Supabase
  console.log('1. Checking test_questions data...');
  const { data: questions, error: qError } = await supabase
    .from('test_questions')
    .select('*')
    .eq('instrument_id', IST_ID)
    .gte('question_number', 117)
    .lte('question_number', 120) // Just check 4 questions first
    .order('question_number');
  
  if (qError) {
    console.error('Error:', qError);
    return;
  }
  
  console.log(`Found ${questions?.length} questions\n`);
  
  for (const q of questions || []) {
    console.log(`\n--- Soal ${q.question_number} ---`);
    console.log('Keys:', Object.keys(q).filter(k => k.includes('image')).join(', '));
    console.log('question_image:', q.question_image ? 'PRESENT' : 'NULL');
    console.log('options_image:', q.options_image ? 'PRESENT' : 'NULL');
    console.log('image_url:', q.image_url ? 'PRESENT' : 'NULL');
    
    if (q.question_image) {
      console.log('question_image URL:', q.question_image.substring(0, 80) + '...');
      // Try to check if URL is valid
      try {
        const url = new URL(q.question_image);
        console.log('  -> URL is valid');
      } catch (e) {
        console.log('  -> URL is INVALID!');
      }
    }
    
    if (q.options_image) {
      console.log('options_image URL:', q.options_image.substring(0, 80) + '...');
      try {
        const url = new URL(q.options_image);
        console.log('  -> URL is valid');
      } catch (e) {
        console.log('  -> URL is INVALID!');
      }
    }
  }
  
  // 2. Check one specific question
  console.log('\n\n2. Checking specific soal 117...');
  const { data: q117 } = await supabase
    .from('test_questions')
    .select('question_number, question_image, options_image')
    .eq('instrument_id', IST_ID)
    .eq('question_number', 117)
    .single();
  
  if (q117) {
    console.log('Soal 117 data:', JSON.stringify(q117, null, 2));
  }
}

debugImages().catch(console.error);
