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

const INSTRUMENT_ID = 'fed00477-3c19-4d02-b1fb-31a12da87966';
const TOTAL_QUESTIONS = 600;

// Generate simple addition problems
function generateKraepelinQuestions(count) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    // Generate two random numbers between 1 and 9
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    const answer = num1 + num2;
    
    questions.push({
      instrument_id: INSTRUMENT_ID,
      question_number: i,
      question_text: `${num1} + ${num2} = ?`,
      question_text_en: `${num1} + ${num2} = ?`,
      category: 'Addition',
      question_type: 'numeric',
      scoring_rule: 'speed_accuracy',
      image_url: null
    });
  }
  return questions;
}

async function createKraepelinQuestions() {
  console.log(`Generating ${TOTAL_QUESTIONS} Kraepelin questions...`);
  
  const questions = generateKraepelinQuestions(TOTAL_QUESTIONS);
  
  console.log('Inserting questions into database...');
  
  // Insert in batches of 50 to avoid hitting limits
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const { error } = await supabase.from('test_questions').insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${i}-${i + batchSize}:`, error);
      process.exit(1);
    }
    
    insertedCount += batch.length;
    console.log(`Inserted ${insertedCount}/${TOTAL_QUESTIONS} questions`);
  }
  
  console.log(`✅ Successfully inserted ${insertedCount} Kraepelin questions!`);
  console.log('Each question is a simple addition problem (e.g., "3 + 5 = ?")');
  console.log('Answers will be typed by candidates during the test.');
}

createKraepelinQuestions();
