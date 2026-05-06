const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file
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

async function debugTestPage() {
  console.log('=== Simulating TestPage Load ===\n');
  
  // Same query as TestPage.tsx
  const { data: qs, error } = await supabase
    .from('test_questions')
    .select('*')
    .eq('instrument_id', IST_ID)
    .gte('question_number', 117)
    .lte('question_number', 120)
    .order('question_number');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Raw data from Supabase:');
  console.log('Number of questions:', qs?.length);
  console.log('');
  
  qs?.forEach((q, idx) => {
    console.log(`Question ${q.question_number}:`);
    console.log('  All keys:', Object.keys(q).filter(k => !k.includes('_at')).join(', '));
    console.log('  question_image:', q.question_image ? 'PRESENT' : 'NULL/UNDEFINED');
    console.log('  options_image:', q.options_image ? 'PRESENT' : 'NULL/UNDEFINED');
    console.log('  image_url:', q.image_url ? 'PRESENT' : 'NULL/UNDEFINED');
    if (q.question_image) {
      console.log('  -> question_image value:', q.question_image.substring(0, 60) + '...');
    }
    console.log('');
  });
  
  // Check if this is how TestPage sees the data
  console.log('=== As DbQuestion interface ===');
  const dbQuestions = qs?.map(q => ({
    ...q,
    options: []
  })) || [];
  
  dbQuestions.forEach(q => {
    console.log(`Soal ${q.question_number}: question_image=${q.question_image ? 'YES' : 'NO'}`);
  });
}

debugTestPage().catch(console.error);
