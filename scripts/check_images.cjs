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

async function checkImages() {
  console.log('Checking IST questions with images...\n');
  
  // Check columns exist
  const { data: columns, error: colError } = await supabase
    .rpc('get_table_columns', { table_name: 'test_questions' });
  
  if (colError) {
    console.log('Could not check columns via RPC, checking directly...');
  } else {
    const hasQuestionImage = columns?.some(c => c.column_name === 'question_image');
    const hasOptionsImage = columns?.some(c => c.column_name === 'options_image');
    console.log('Columns status:');
    console.log(`  - question_image: ${hasQuestionImage ? 'EXISTS' : 'MISSING'}`);
    console.log(`  - options_image: ${hasOptionsImage ? 'EXISTS' : 'MISSING'}`);
    console.log('');
  }
  
  // Check questions 117-136
  const { data: questions, error } = await supabase
    .from('test_questions')
    .select('id, question_number, question_text, question_image, options_image, image_url')
    .eq('instrument_id', IST_ID)
    .gte('question_number', 117)
    .lte('question_number', 136)
    .order('question_number');
  
  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }
  
  console.log(`Found ${questions?.length || 0} questions (117-136):\n`);
  
  questions?.forEach(q => {
    const hasQImg = q.question_image ? '✓' : '✗';
    const hasOImg = q.options_image ? '✓' : '✗';
    const hasOldImg = q.image_url ? '✓' : '✗';
    console.log(`Soal ${q.question_number}: question_image=${hasQImg}, options_image=${hasOImg}, image_url=${hasOldImg}`);
    if (q.question_image) console.log(`  -> question_image: ${q.question_image.substring(0, 60)}...`);
    if (q.options_image) console.log(`  -> options_image: ${q.options_image.substring(0, 60)}...`);
  });
  
  // Check storage
  console.log('\nChecking storage bucket test-images...');
  const { data: files, error: fileError } = await supabase
    .storage
    .from('test-images')
    .list();
  
  if (fileError) {
    console.error('Error listing files:', fileError.message);
  } else {
    const faFiles = files?.filter(f => f.name.startsWith('q117') || f.name.startsWith('q118')) || [];
    console.log(`Found ${files?.length || 0} total files, ${faFiles.length} FA files`);
    faFiles.slice(0, 5).forEach(f => console.log(`  - ${f.name}`));
  }
}

checkImages().catch(console.error);
