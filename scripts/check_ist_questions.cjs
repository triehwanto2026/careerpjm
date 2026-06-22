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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkIstQuestions() {
  console.log('Checking IST questions in the database...');
  
  // Check all instruments
  const { data: instruments, error: instError } = await supabase
    .from('test_instruments')
    .select('id, name')
    .order('name');
  
  if (instError) {
    console.error('Error checking test_instruments:', instError);
  } else {
    console.log('All instruments found:', instruments.map(i => ({ id: i.id, name: i.name })));
  }
  
  // Check if there are any questions at all
  const { data: allQuestions, error: allQError } = await supabase
    .from('test_questions')
    .select('*')
    .limit(5);
  
  if (allQError) {
    console.error('Error checking test_questions:', allQError);
  } else {
    console.log('Sample questions found:', allQuestions.length);
    if (allQuestions.length > 0) {
      console.log('Sample question structure:', JSON.stringify(allQuestions[0], null, 2));
    }
  }
}

checkIstQuestions();
