import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertQuestions() {
  const sqlFilePath = 'supabase/migrations/aptitude_questions.sql';
  
  console.log('Reading SQL file...');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Combine multi-line statements
  const lines = sqlContent.split('\n');
  const instrumentId = 'f1a98323-cc96-4c91-95bf-1ee103ec8042';
  
  let questionsToInsert = [];
  let optionsToInsert = [];
  
  let i = 0;
  while (i < lines.length) {
    let trimmed = lines[i].trim();
    if (trimmed.startsWith('--') || trimmed === '') {
      i++;
      continue;
    }
    
    // Parse question INSERT - might span multiple lines
    if (trimmed.includes('INSERT INTO public.test_questions')) {
      let combined = trimmed;
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('INSERT') && !lines[i].trim().startsWith('--')) {
        combined += ' ' + lines[i].trim();
        i++;
      }
      
      const match = combined.match(/VALUES \('[^']+', (\d+), '([^']+)', '([^']+)', '([^']+)', '([^']+)'\)/);
      if (match) {
        questionsToInsert.push({
          instrument_id: instrumentId,
          question_number: parseInt(match[1]),
          question_text: match[2],
          question_text_en: match[3],
          category: match[4],
          question_type: match[5]
        });
      }
    }
    // Parse option INSERT
    else if (trimmed.includes('INSERT INTO public.test_question_options')) {
      const match = trimmed.match(/SELECT id, '([A-D])', '([^']+)', '([^']+)', (\d+), (true|false), (\d+) FROM test_questions WHERE question_number = (\d+)/);
      if (!match) {
        // Try alternative pattern
        const altMatch = trimmed.match(/SELECT id, '([A-D])', '([^']+)', '([^']+)', (\d+), (true|false), (\d+) FROM/);
        if (altMatch) {
          const numMatch = trimmed.match(/question_number = (\d+)/);
          if (numMatch) {
            optionsToInsert.push({
              option_label: altMatch[1],
              option_text: altMatch[2],
              option_text_en: altMatch[3],
              score_value: parseInt(altMatch[4]),
              is_correct: altMatch[5] === 'true',
              display_order: parseInt(altMatch[6]),
              question_number: parseInt(numMatch[1])
            });
          }
        }
      } else {
        optionsToInsert.push({
          option_label: match[1],
          option_text: match[2],
          option_text_en: match[3],
          score_value: parseInt(match[4]),
          is_correct: match[5] === 'true',
          display_order: parseInt(match[6]),
          question_number: parseInt(match[7])
        });
      }
      i++;
    } else {
      i++;
    }
  }
  
  console.log(`Found ${questionsToInsert.length} questions`);
  console.log(`Found ${optionsToInsert.length} options`);
  
  // Insert questions
  console.log('\nInserting questions...');
  const { data: insertedQuestions, error: questionsError } = await supabase
    .from('test_questions')
    .insert(questionsToInsert)
    .select();
  
  if (questionsError) {
    console.error('Error inserting questions:', questionsError);
    process.exit(1);
  }
  
  console.log(`✅ Inserted ${insertedQuestions.length} questions`);
  
  // Map question numbers to IDs
  const questionIdMap = {};
  insertedQuestions.forEach(q => {
    questionIdMap[q.question_number] = q.id;
  });
  
  // Insert options
  console.log('\nInserting options...');
  const optionsWithIds = optionsToInsert.map(opt => ({
    question_id: questionIdMap[opt.question_number],
    option_label: opt.option_label,
    option_text: opt.option_text,
    option_text_en: opt.option_text_en,
    score_value: opt.score_value,
    is_correct: opt.is_correct,
    display_order: opt.display_order
  }));
  
  const batchSize = 50;
  for (let i = 0; i < optionsWithIds.length; i += batchSize) {
    const batch = optionsWithIds.slice(i, i + batchSize);
    const { error } = await supabase
      .from('test_question_options')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${i}-${i + batchSize}:`, error);
      process.exit(1);
    }
    
    console.log(`Inserted options ${i + 1}-${Math.min(i + batchSize, optionsWithIds.length)}`);
  }
  
  console.log('\n✅ All questions and options inserted successfully!');
}

insertQuestions();
