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

async function fixIstGeEssayType() {
  console.log('Checking database structure for IST questions...');
  
  const IST_INSTRUMENT_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';
  
  // Check if the IST instrument exists
  const { data: istInstrument, error: instError } = await supabase
    .from('test_instruments')
    .select('*')
    .eq('id', IST_INSTRUMENT_ID);
  
  if (instError) {
    console.error('Error checking IST instrument:', instError);
  } else {
    console.log('IST instrument:', istInstrument);
  }
  
  // Check questions associated with IST instrument
  const { data: istQuestions, error: qError } = await supabase
    .from('test_questions')
    .select('*')
    .eq('instrument_id', IST_INSTRUMENT_ID)
    .gte('question_number', 61)
    .lte('question_number', 76)
    .order('question_number');
  
  if (qError) {
    console.error('Error checking IST questions:', qError);
  } else {
    console.log('IST questions 61-76 found:', istQuestions?.length || 0);
    if (istQuestions && istQuestions.length > 0) {
      console.log('Sample question:', JSON.stringify(istQuestions[0], null, 2));
      console.log('Question types:', istQuestions.map(q => ({ number: q.question_number, type: q.question_type })));
    }
  }
  
  // If questions exist, update them to essay type
  if (istQuestions && istQuestions.length > 0) {
    console.log('Updating questions to essay type...');
    const { data, error } = await supabase
      .from('test_questions')
      .update({ question_type: 'essay' })
      .eq('instrument_id', IST_INSTRUMENT_ID)
      .gte('question_number', 61)
      .lte('question_number', 76);
    
    if (error) {
      console.error('Error updating questions:', error);
    } else {
      console.log('Successfully updated', data?.length || 0, 'questions to essay type');
    }
  } else {
    console.log('No questions found in database. The questions you see in the admin interface might be from a different source or the database needs to be seeded.');
  }
}

fixIstGeEssayType();
