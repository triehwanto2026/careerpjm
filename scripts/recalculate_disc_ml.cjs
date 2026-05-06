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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function recalculateDiscML() {
  console.log('Recalculating DISC M and L values from answer data...');

  // Get DISC test instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name, questions')
    .or('name.ilike.%DISC%, name.ilike.%Tes DISC%')
    .limit(5);

  if (!instruments || instruments.length === 0) {
    console.log('No DISC instrument found');
    return;
  }

  const instrument = instruments[0];
  const questions = instrument.questions || [];
  
  // Build a map of question_id -> option_id -> category_target
  const questionOptionMap = new Map();
  questions.forEach(q => {
    if (q.question_type === 'disc_pair') {
      const optionMap = new Map();
      q.options.forEach(opt => {
        optionMap.set(opt.id, opt.category_target);
      });
      questionOptionMap.set(q.id, optionMap);
    }
  });

  console.log(`Found instrument: ${instrument.name}`);
  console.log(`Found ${questions.length} DISC questions`);

  // Get all DISC test results
  const { data: results } = await supabase
    .from('test_results')
    .select('*')
    .ilike('test_name', '%DISC%');

  if (!results || results.length === 0) {
    console.log('No DISC results found');
    return;
  }

  console.log(`Processing ${results.length} DISC results...`);

  let updated = 0;
  for (const result of results) {
    const cats = result.categories || {};
    
    // Initialize M and L values
    const newM = { D: 0, I: 0, S: 0, C: 0 };
    const newL = { D: 0, I: 0, S: 0, C: 0 };
    const newNet = { D: 0, I: 0, S: 0, C: 0 };

    // Get answers for this result
    const { data: answers } = await supabase
      .from('test_result_details')
      .select('*')
      .eq('test_result_id', result.id);

    if (!answers) continue;

    // Process each answer - read from selected_answer_label (format: "M:D / L:I")
    for (const answer of answers) {
      if (answer.selected_answer_label && answer.selected_answer_label.includes('M:')) {
        // Format: "M:D / L:I" or "M:Dominance / L:Influence"
        const label = answer.selected_answer_label;
        
        // Extract M value
        const mMatch = label.match(/M:([^/]+)/);
        if (mMatch) {
          const mCategory = mMatch[1].trim();
          const d = mapCategoryToCode(mCategory);
          if (d) {
            newM[d]++;
            newNet[d]++;
          }
        }
        
        // Extract L value
        const lMatch = label.match(/L:(.+)/);
        if (lMatch) {
          const lCategory = lMatch[1].trim();
          const d = mapCategoryToCode(lCategory);
          if (d) {
            newL[d]++;
            newNet[d]--;
          }
        }
      }
    }

    // Update categories with new M and L values
    const updatedCats = { ...cats };
    for (const dim of ['D', 'I', 'S', 'C']) {
      updatedCats[dim] = newNet[dim];
      updatedCats[`${dim}_M`] = newM[dim];
      updatedCats[`${dim}_L`] = newL[dim];
    }

    // Update the database
    const { error } = await supabase
      .from('test_results')
      .update({ categories: updatedCats })
      .eq('id', result.id);

    if (error) {
      console.error(`Error updating result ${result.id}:`, error);
    } else {
      console.log(`✓ Updated result ${result.id}`);
      console.log(`  M: D=${newM.D}, I=${newM.I}, S=${newM.S}, C=${newM.C}`);
      console.log(`  L: D=${newL.D}, I=${newL.I}, S=${newL.S}, C=${newL.C}`);
      updated++;
    }
  }

  console.log(`\nDone! ${updated} results updated.`);
}

function mapCategoryToCode(target) {
  if (!target) return null;
  const t = String(target).toUpperCase().trim();
  if (t === 'D' || t === 'DOMINANCE') return 'D';
  if (t === 'I' || t === 'INFLUENCE') return 'I';
  if (t === 'S' || t === 'STEADINESS') return 'S';
  if (t === 'C' || t === 'COMPLIANCE') return 'C';
  return null;
}

recalculateDiscML().catch(err => {
  console.error('Error:', err);
});
