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
  console.log('Checking DISC test results for missing M and L values...');

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
        console.log(`Result ID ${result.id}: ${dim} has net=${net} but M=${m}, L=${l}`);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      // Recalculate M and L from the test answers
      const { data: answers } = await supabase
        .from('test_result_details')
        .select('*')
        .eq('test_result_id', result.id);

      if (!answers) continue;

      const newCats = { ...cats };
      
      for (const answer of answers) {
        if (answer.question_text && answer.question_text.includes('|')) {
          // This is a DISC pair answer
          const parts = answer.selected_answer.split('|');
          const mPart = parts.find(p => p.startsWith('M:'));
          const lPart = parts.find(p => p.startsWith('L:'));

          if (mPart) {
            const mText = mPart.substring(2);
            // Find the dimension from the answer text
            // This is a simplified approach - ideally we should match by option ID
            const dims = ['D', 'I', 'S', 'C'];
            for (const dim of dims) {
              if (mText.toLowerCase().includes(dim.toLowerCase())) {
                newCats[`${dim}_M`] = (newCats[`${dim}_M`] || 0) + 1;
                break;
              }
            }
          }
          
          if (lPart) {
            const lText = lPart.substring(2);
            const dims = ['D', 'I', 'S', 'C'];
            for (const dim of dims) {
              if (lText.toLowerCase().includes(dim.toLowerCase())) {
                newCats[`${dim}_L`] = (newCats[`${dim}_L`] || 0) + 1;
                break;
              }
            }
          }
        }
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
        updated++;
      }
    }
  }

  console.log(`\nDone! ${updated} results updated.`);
}

fixDiscMLValues().catch(err => {
  console.error('Error:', err);
});
