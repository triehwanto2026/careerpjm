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

const KRAEPELIN2_ID = 'fed00477-3c19-4d02-b1fb-31a12da87966';

async function setKraepelin2Answers() {
  console.log('Setting correct answers for Kraepelin 2...');
  
  // Get all Kraepelin 2 questions
  const { data: questions, error: questionsError } = await supabase
    .from('test_questions')
    .select('id, question_number, question_text')
    .eq('instrument_id', KRAEPELIN2_ID)
    .order('question_number');
  
  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return;
  }
  
  console.log(`Found ${questions.length} Kraepelin 2 questions`);
  
  let updatedCount = 0;
  
  for (const question of questions) {
    // Extract the numbers from the question (e.g., "5 + 3 = ?" -> 5, 3)
    const match = question.question_text.match(/(\d+)\s*\+\s*(\d+)/);
    
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = parseInt(match[2]);
      const sum = num1 + num2;
      const correctAnswer = sum % 10; // Take unit digit only
      
      // Store correct answer in question_text_en as a temporary solution
      // Format: "CORRECT_ANSWER:7"
      const { error: updateError } = await supabase
        .from('test_questions')
        .update({
          question_text_en: `CORRECT_ANSWER:${correctAnswer}`,
          scoring_rule: 'speed_accuracy' // Kraepelin uses speed-accuracy scoring
        })
        .eq('id', question.id);
      
      if (updateError) {
        console.error(`Error updating question ${question.question_number}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} questions...`);
        }
      }
    } else {
      console.warn(`Could not parse question ${question.question_number}: ${question.question_text}`);
    }
  }
  
  console.log(`\n✅ Successfully updated ${updatedCount} Kraepelin 2 questions with correct answers!`);
  
  // Verify a few examples
  console.log('\nVerification - Sample questions with answers:');
  const { data: sample } = await supabase
    .from('test_questions')
    .select('question_number, question_text, question_text_en')
    .eq('instrument_id', KRAEPELIN2_ID)
    .order('question_number')
    .limit(5);
  
  sample?.forEach(q => {
    const correctAnswer = q.question_text_en?.replace('CORRECT_ANSWER:', '') || 'Not set';
    console.log(`Q${q.question_number}: ${q.question_text} = ${correctAnswer}`);
  });
}

setKraepelin2Answers();
