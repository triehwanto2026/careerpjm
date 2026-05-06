const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function fixDiscMLValues() {
  console.log('Fixing DISC test results M and L values...');

  const { data: results, error } = await supabase
    .from('test_results')
    .select('*')
    .ilike('test_name', '%DISC%');

  if (error) {
    console.error('Error fetching DISC results:', error);
    return;
  }

  console.log(`Found ${results?.length || 0} DISC test results`);

  let updated = 0;
  for (const result of results || []) {
    const cats = result.categories || {};
    const dims = ['D', 'I', 'S', 'C'];
    let needsUpdate = false;

    // Check if M and L values are missing or zero when they shouldn't be
    for (const dim of dims) {
      const net = cats[dim] || 0;
      const m = cats[`${dim}_M`] || 0;
      const l = cats[`${dim}_L`] || 0;

      // If net is non-zero but M and L are both zero, we need to recalculate
      if (net !== 0 && m === 0 && l === 0) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      // Get the test instrument to fetch questions with options
      const { data: instruments } = await supabase
        .from('test_instruments')
        .select('id, questions')
        .ilike('name', '%DISC%')
        .limit(1);

      if (!instruments || instruments.length === 0) continue;

      const questions = instruments[0].questions || [];
      const questionMap = new Map();
      
      questions.forEach(q => {
        if (q.question_type === 'disc_pair') {
          const optionsMap = new Map();
          q.options.forEach(opt => {
            optionsMap.set(opt.id, opt.category_target);
          });
          questionMap.set(q.id, optionsMap);
        }
      });

      // Get the test result details
      const { data: answers } = await supabase
        .from('test_result_details')
        .select('*')
        .eq('test_result_id', result.id);

      if (!answers) continue;

      const newCats = { ...cats };
      const newM = { D: 0, I: 0, S: 0, C: 0 };
      const newL = { D: 0, I: 0, S: 0, C: 0 };
      const newNet = { D: 0, I: 0, S: 0, C: 0 };
      
      for (const answer of answers) {
        const optionsMap = questionMap.get(answer.question_id);
        if (!optionsMap) continue;

        if (answer.selected_answer && answer.selected_answer.includes('|')) {
          const parts = answer.selected_answer.split('|');
          const mPart = parts.find(p => p.startsWith('M:'));
          const lPart = parts.find(p => p.startsWith('L:'));

          if (mPart) {
            const mOptId = mPart.substring(2);
            const category = optionsMap.get(mOptId);
            if (category && dims.includes(category)) {
              newM[category]++;
              newNet[category]++;
            }
          }
          
          if (lPart) {
            const lOptId = lPart.substring(2);
            const category = optionsMap.get(lOptId);
            if (category && dims.includes(category)) {
              newL[category]++;
              newNet[category]--;
            }
          }
        }
      }

      // Update the categories with correct M and L values
      for (const dim of dims) {
        newCats[`${dim}_M`] = newM[dim];
        newCats[`${dim}_L`] = newL[dim];
        newCats[dim] = newNet[dim];
      }

      // Update the categories
      const { error: updateError } = await supabase
        .from('test_results')
        .update({ categories: newCats })
        .eq('id', result.id);

      if (updateError) {
        console.error(`Error updating result ${result.id}:`, updateError);
      } else {
        console.log(`✓ Updated result ${result.id}`);
        console.log(`  M: D=${newM.D}, I=${newM.I}, S=${newM.S}, C=${newM.C}`);
        console.log(`  L: D=${newL.D}, I=${newL.I}, S=${newL.S}, C=${newL.C}`);
        updated++;
      }
    }
  }

  console.log(`\nDone! ${updated} results updated.`);
}

fixDiscMLValues().catch(err => {
  console.error('Error:', err);
});
