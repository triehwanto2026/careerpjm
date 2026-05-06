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
  console.log('Recalculating DISC M and L values...');

  // Get all instruments and find DISC
  const { data: allInstruments } = await supabase
    .from('test_instruments')
    .select('id, name, questions');

  const discInstrument = allInstruments?.find(inst => 
    inst.name.toUpperCase().includes('DISC')
  );

  if (!discInstrument) {
    console.log('No DISC instrument found. Available:', allInstruments?.map(i => i.name).join(', '));
    return;
  }

  console.log(`Found DISC instrument: ${discInstrument.name}`);
  
  const questions = discInstrument.questions || [];
  console.log(`Found ${questions.length} questions`);
  
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

  // Get all test results with DISC in name
  const { data: allResults } = await supabase
    .from('test_results')
    .select('*');

  const discResults = allResults?.filter(r => 
    r.test_name.toUpperCase().includes('DISC')
  );

  if (!discResults || discResults.length === 0) {
    console.log('No DISC results found');
    return;
  }

  console.log(`Processing ${discResults.length} DISC results...`);

  let updated = 0;
  for (const result of discResults) {
    const cats = result.categories || {};
    
    const newM = { D: 0, I: 0, S: 0, C: 0 };
    const newL = { D: 0, I: 0, S: 0, C: 0 };
    const newNet = { D: 0, I: 0, S: 0, C: 0 };

    // Get answers for this result
    const { data: answers } = await supabase
      .from('test_result_details')
      .select('*')
      .eq('test_result_id', result.id);

    if (!answers) continue;

    // Process each answer - read from selected_answer_label
    for (const answer of answers) {
      if (answer.selected_answer_label && answer.selected_answer_label.includes('M:')) {
        const label = answer.selected_answer_label;
        
        const mMatch = label.match(/M:([^/]+)/);
        if (mMatch) {
          const mCategory = mMatch[1].trim();
          const d = mapCategoryToCode(mCategory);
          if (d) {
            newM[d]++;
            newNet[d]++;
          }
        }
        
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

    // Update categories
    const updatedCats = { ...cats };
    for (const dim of ['D', 'I', 'S', 'C']) {
      updatedCats[dim] = newNet[dim];
      updatedCats[`${dim}_M`] = newM[dim];
      updatedCats[`${dim}_L`] = newL[dim];
    }

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
