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

async function addPAPIKOSTIKInstruction() {
  console.log('Adding instruction to all PAPIKOSTIK questions...');
  
  const instruction = "Pilihlah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini.";
  const instructionEn = "Choose the statement that is most dominant or best reflects yourself or describes your current feelings.";
  
  // Find PAPIKOSTIK instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .ilike('name', '%papikostik%');
  
  if (!instruments || instruments.length === 0) {
    console.error('PAPIKOSTIK instrument not found');
    return;
  }
  
  const papikostikTest = instruments[0];
  console.log(`Found PAPIKOSTIK: ${papikostikTest.name} (ID: ${papikostikTest.id})`);
  
  // Get all questions
  const { data: questions } = await supabase
    .from('test_questions')
    .select('id, question_text, question_text_en, question_number')
    .eq('instrument_id', papikostikTest.id)
    .order('question_number');
  
  if (!questions || questions.length === 0) {
    console.error('No questions found');
    return;
  }
  
  console.log(`Found ${questions.length} questions`);
  
  let updatedCount = 0;
  
  for (const question of questions) {
    // Remove old instruction patterns if they exist
    let questionText = question.question_text;
    let questionTextEn = question.question_text_en || question.question_text;
    
    // Remove old instruction patterns
    const oldPatterns = [
      /Pilihlah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini\. \(IN\)\n\n/,
      /Pilihlah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini\.\n\n/,
      /Choose the statement that is most dominant or best reflects yourself or describes your current feelings\. \(IN\)\n\n/,
      /Choose the statement that is most dominant or best reflects yourself or describes your current feelings\.\n\n/
    ];
    
    oldPatterns.forEach(pattern => {
      questionText = questionText.replace(pattern, '');
      questionTextEn = questionTextEn.replace(pattern, '');
    });
    
    // Remove empty lines at the beginning
    questionText = questionText.replace(/^\n+/, '');
    questionTextEn = questionTextEn.replace(/^\n+/, '');
    
    // Add new instruction to the beginning
    const newQuestionText = `${instruction}\n\n${questionText}`;
    const newQuestionTextEn = `${instructionEn}\n\n${questionTextEn}`;
    
    const { error } = await supabase
      .from('test_questions')
      .update({ question_text: newQuestionText, question_text_en: newQuestionTextEn })
      .eq('id', question.id);
    
    if (error) {
      console.error(`Error updating question ${question.question_number}:`, error);
    } else {
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} questions...`);
      }
    }
  }
  
  console.log(`\n✅ Successfully added instruction to ${updatedCount} PAPIKOSTIK questions!`);
}

addPAPIKOSTIKInstruction();
