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

async function fixIstQuestions() {
  console.log('Checking test_questions table structure...');
  
  // First, check the table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('test_questions')
    .select('*')
    .limit(5);
  
  if (tableError) {
    console.error('Error checking table structure:', tableError);
    process.exit(1);
  }
  
  if (tableInfo && tableInfo.length > 0) {
    console.log('Available columns:', Object.keys(tableInfo[0]));
    console.log('Sample question:', JSON.stringify(tableInfo[0], null, 2));
  }
  
  // Check if there are any IST questions at all
  const { data: allQuestions, error: allError } = await supabase
    .from('test_questions')
    .select('*')
    .order('question_number')
    .limit(20);
  
  if (allError) {
    console.error('Error checking all questions:', allError);
  } else {
    console.log('Total questions found:', allQuestions.length);
    console.log('First few questions:', allQuestions.map(q => ({ number: q.question_number, type: q.question_type })));
  }
}

fixIstQuestions();
