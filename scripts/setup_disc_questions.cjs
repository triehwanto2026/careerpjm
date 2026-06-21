const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { DISC_QUESTIONS } = require('./disc_questions_data.cjs');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDiscQuestions() {
  try {
    console.log('Setting up DISC assessment questions...');
    
    // Step 1: Check if DISC instrument exists
    const { data: existingInstruments } = await supabase
      .from('test_instruments')
      .select('*')
      .ilike('name', '%DISC%');
    
    let discInstrumentId;
    
    if (existingInstruments && existingInstruments.length > 0) {
      discInstrumentId = existingInstruments[0].id;
      console.log(`Found existing DISC instrument: ${existingInstruments[0].name} (${discInstrumentId})`);
      
      // Delete existing questions for this instrument
      const { data: existingQuestions } = await supabase
        .from('test_questions')
        .select('id')
        .eq('instrument_id', discInstrumentId);
      
      if (existingQuestions && existingQuestions.length > 0) {
        const questionIds = existingQuestions.map(q => q.id);
        await supabase
          .from('test_question_options')
          .delete()
          .in('question_id', questionIds);
        
        await supabase
          .from('test_questions')
          .delete()
          .eq('instrument_id', discInstrumentId);
        
        console.log(`Deleted ${existingQuestions.length} existing DISC questions`);
      }
    } else {
      // Create new DISC instrument
      const { data: newInstrument, error: insertError } = await supabase
        .from('test_instruments')
        .insert({
          name: 'Tes DISC',
          name_en: 'DISC Assessment',
          description: 'Mengukur 4 dimensi perilaku: Dominance, Influence, Steadiness, Compliance. Setiap pertanyaan terdiri dari 4 pernyataan, pilih yang PALING dan TIDAK menggambarkan diri Anda.',
          category: 'Personality',
          question_count: 24,
          duration_minutes: 15,
          scoring_method: 'ipsative',
          target_audience: 'Karyawan & Calon Karyawan',
          norm_reference: 'Marston (1928), revisi DISC modern',
          is_active: true
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error creating DISC instrument:', insertError);
        throw insertError;
      }
      
      if (!newInstrument || !newInstrument.id) {
        throw new Error('Failed to create DISC instrument - no ID returned');
      }
      
      discInstrumentId = newInstrument.id;
      console.log(`Created new DISC instrument: ${discInstrumentId}`);
    }
    
    // Step 2: Insert DISC questions
    console.log('Inserting 24 DISC questions...');
    
    for (const question of DISC_QUESTIONS) {
      // Insert the question
      const { data: insertedQuestion } = await supabase
        .from('test_questions')
        .insert({
          instrument_id: discInstrumentId,
          question_number: question.question_number,
          question_text: question.question_text,
          question_text_en: question.question_text_en,
          category: 'DISC',
          question_type: 'disc_pair',
          scoring_rule: 'ipsative'
        })
        .select('id')
        .single();
      
      const questionId = insertedQuestion.id;
      
      // Insert the 4 options (statements) for this question
      const options = question.statements.map((statement, index) => ({
        question_id: questionId,
        option_label: String.fromCharCode(65 + index), // A, B, C, D
        option_text: statement.text,
        option_text_en: statement.text,
        score_value: 1,
        category_target: statement.category,
        is_correct: null,
        display_order: index
      }));
      
      await supabase
        .from('test_question_options')
        .insert(options);
      
      console.log(`Inserted question ${question.question_number} with 4 options`);
    }
    
    // Step 3: Update instrument question count
    await supabase
      .from('test_instruments')
      .update({ question_count: 24 })
      .eq('id', discInstrumentId);
    
    console.log('\n✅ DISC assessment setup completed successfully!');
    console.log(`Total questions: ${DISC_QUESTIONS.length}`);
    console.log(`Instrument ID: ${discInstrumentId}`);
    
  } catch (error) {
    console.error('Error setting up DISC questions:', error);
    process.exit(1);
  }
}

setupDiscQuestions();
