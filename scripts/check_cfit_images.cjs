const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

(async () => {
  try {
    // Use the specific CFIT instrument ID provided by user
    const cfitInstrumentId = 'bf822dab-dc32-45c9-b6d4-2b92c3a6e847';
    
    // Get CFIT instrument details
    const { data: cfitInstrument, error: cfitError } = await supabase
      .from('test_instruments')
      .select('*')
      .eq('id', cfitInstrumentId)
      .single();
    
    if (cfitError || !cfitInstrument) {
      console.error('CFIT instrument not found:', cfitError);
      process.exit(1);
    }
    
    console.log('CFIT Instrument:', cfitInstrument.name);
    console.log('Instrument ID:', cfitInstrument.id);
    
    // Check CFIT questions and their image status
    const { data: questions, error: qError } = await supabase
      .from('test_questions')
      .select('id, question_number, question_image, options_image, image_url')
      .eq('instrument_id', cfitInstrumentId)
      .order('question_number');
    
    if (qError) {
      console.error('Error fetching questions:', qError);
      process.exit(1);
    }
    
    if (!questions || questions.length === 0) {
      console.log('No CFIT questions found');
      process.exit(0);
    }
    
    console.log('\nTotal CFIT questions:', questions.length);
    
    const withQuestionImage = questions.filter(q => q.question_image).length;
    const withOptionsImage = questions.filter(q => q.options_image).length;
    const withImageUrl = questions.filter(q => q.image_url).length;
    const withAnyImage = questions.filter(q => q.question_image || q.options_image || q.image_url).length;
    
    console.log('Questions with question_image:', withQuestionImage);
    console.log('Questions with options_image:', withOptionsImage);
    console.log('Questions with image_url (old):', withImageUrl);
    console.log('Questions with any image:', withAnyImage);
    console.log('Questions without images:', questions.length - withAnyImage);
    
    console.log('\nDetailed image status (first 10 questions):');
    questions.slice(0, 10).forEach(q => {
      console.log(`Q${q.question_number}: question_image=${q.question_image ? 'YES' : 'NO'}, options_image=${q.options_image ? 'YES' : 'NO'}, image_url=${q.image_url ? 'YES' : 'NO'}`);
      if (q.question_image) console.log(`  question_image preview: ${q.question_image.substring(0, 60)}...`);
      if (q.options_image) console.log(`  options_image preview: ${q.options_image.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
