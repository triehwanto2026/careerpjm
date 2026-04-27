import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function setupAptitudeTest() {
  console.log('Creating Aptitude Test instrument...');
  
  // Insert instrument
  const { data: instrument, error } = await supabase
    .from('test_instruments')
    .insert({
      name: 'Aptitude Test',
      name_en: 'Aptitude Test',
      description: 'Tes kemampuan kognitif mencakup Numerik, Verbal, dan Logical Reasoning',
      category: 'Aptitude',
      question_count: 60,
      duration_minutes: 60,
      scoring_method: 'sum',
      target_audience: 'General',
      norm_reference: 'Standard',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    // If already exists, try to get it
    if (error.code === '23505') {
      console.log('Instrument already exists, fetching existing...');
      const { data: existing } = await supabase
        .from('test_instruments')
        .select('id')
        .eq('name', 'Aptitude Test')
        .single();
      
      if (existing) {
        await replaceInstrumentId(existing.id);
      }
    } else {
      console.error('Error creating instrument:', error);
      process.exit(1);
    }
  } else {
    console.log('Instrument created with ID:', instrument.id);
    await replaceInstrumentId(instrument.id);
  }
}

async function replaceInstrumentId(instrumentId) {
  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/aptitude_questions.sql');
  
  let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Replace all occurrences of <INSTRUMENT_ID>
  const newContent = sqlContent.replace(/<INSTRUMENT_ID>/g, instrumentId);
  
  fs.writeFileSync(sqlFilePath, newContent);
  
  console.log('Replaced <INSTRUMENT_ID> with:', instrumentId);
  console.log('Updated file:', sqlFilePath);
}

setupAptitudeTest();
