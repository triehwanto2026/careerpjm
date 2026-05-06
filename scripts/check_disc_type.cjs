const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
  // Find DISC instrument
  const { data: insts } = await supabase.from('test_instruments').select('id, name');
  const disc = insts?.find(i => i.name.toUpperCase().includes('DISC'));
  
  if (!disc) {
    console.log('DISC not found');
    return;
  }
  
  console.log('DISC ID:', disc.id);
  console.log('DISC Name:', disc.name);
  
  // Get first few questions
  const { data: questions } = await supabase
    .from('test_questions')
    .select('*')
    .eq('instrument_id', disc.id)
    .order('question_number')
    .limit(3);
  
  questions?.forEach(q => {
    console.log('\nSoal', q.question_number, ':');
    console.log('  question_type:', JSON.stringify(q.question_type));
    console.log('  question_text:', q.question_text?.substring(0, 50));
  });
}

check().catch(console.error);
