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

const CFIT_INSTRUMENT_ID = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';

async function fixCFITOptions() {
  console.log('Fetching CFIT 3A questions 14-27...');
  
  const { data: questions } = await supabase
    .from('test_questions')
    .select('id, question_number')
    .eq('instrument_id', CFIT_INSTRUMENT_ID)
    .gte('question_number', 14)
    .lte('question_number', 27)
    .order('question_number');
  
  if (!questions || questions.length === 0) {
    console.log('No questions found in range 14-27');
    return;
  }
  
  console.log(`Found ${questions.length} questions (14-27)`);
  
  const questionIds = questions.map(q => q.id);
  
  const { data: options } = await supabase
    .from('test_question_options')
    .select('*')
    .in('question_id', questionIds)
    .order('question_number, display_order');
  
  if (!options || options.length === 0) {
    console.log('No options found for these questions');
    return;
  }
  
  console.log(`\nCurrent options per question:`);
  const optionsByQ = {};
  options.forEach(o => {
    if (!optionsByQ[o.question_id]) optionsByQ[o.question_id] = [];
    optionsByQ[o.question_id].push(o);
  });
  
  questions.forEach(q => {
    const opts = optionsByQ[q.id] || [];
    console.log(`Q${q.question_number}: ${opts.length} options (${opts.map(o => o.option_label).join(', ')})`);
  });
  
  console.log('\nDeleting options C and D for questions 14-27...');
  
  let deletedCount = 0;
  for (const option of options) {
    if (option.option_label === 'C' || option.option_label === 'D') {
      const { error } = await supabase
        .from('test_question_options')
        .delete()
        .eq('id', option.id);
      
      if (error) {
        console.error(`Error deleting option ${option.option_label} for question:`, error);
      } else {
        deletedCount++;
        console.log(`Deleted option ${option.option_label}`);
      }
    }
  }
  
  console.log(`\n✅ Deleted ${deletedCount} options (C and D) for questions 14-27`);
  console.log('Now each question should have only 2 options (A and B)');
}

fixCFITOptions();
