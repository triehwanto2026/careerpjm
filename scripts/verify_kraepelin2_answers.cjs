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

async function verifyKraepelin2Answers() {
  console.log('Verifying Kraepelin 2 answers (unit digit only)...\n');
  
  // Get sample questions to verify
  const { data: questions, error } = await supabase
    .from('test_questions')
    .select('question_number, question_text, question_text_en')
    .eq('instrument_id', KRAEPELIN2_ID)
    .order('question_number')
    .limit(20);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Sample verification (first 20 questions):');
  console.log('=====================================');
  
  questions.forEach(q => {
    const match = q.question_text.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = parseInt(match[2]);
      const sum = num1 + num2;
      const expectedAnswer = sum % 10;
      const storedAnswer = q.question_text_en?.replace('CORRECT_ANSWER:', '') || 'Not found';
      const isCorrect = expectedAnswer.toString() === storedAnswer;
      
      console.log(`Q${q.question_number}: ${num1} + ${num2} = ${sum} → ${expectedAnswer} | Stored: ${storedAnswer} ${isCorrect ? '✅' : '❌'}`);
    }
  });
  
  // Check random questions from middle and end
  console.log('\nRandom verification (questions 100, 300, 500):');
  console.log('===============================================');
  
  const randomQuestions = [100, 300, 500];
  
  for (const qNum of randomQuestions) {
    const { data: question } = await supabase
      .from('test_questions')
      .select('question_text, question_text_en')
      .eq('instrument_id', KRAEPELIN2_ID)
      .eq('question_number', qNum)
      .single();
    
    if (question) {
      const match = question.question_text.match(/(\d+)\s*\+\s*(\d+)/);
      if (match) {
        const num1 = parseInt(match[1]);
        const num2 = parseInt(match[2]);
        const sum = num1 + num2;
        const expectedAnswer = sum % 10;
        const storedAnswer = question.question_text_en?.replace('CORRECT_ANSWER:', '') || 'Not found';
        const isCorrect = expectedAnswer.toString() === storedAnswer;
        
        console.log(`Q${qNum}: ${num1} + ${num2} = ${sum} → ${expectedAnswer} | Stored: ${storedAnswer} ${isCorrect ? '✅' : '❌'}`);
      }
    }
  }
  
  console.log('\n✅ Verification complete!');
}

verifyKraepelin2Answers();
