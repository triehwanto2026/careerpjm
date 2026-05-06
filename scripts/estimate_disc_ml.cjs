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

async function estimateDiscML() {
  console.log('Estimating DISC M and L values from Net scores...');

  const { data: results, error } = await supabase
    .from('test_results')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const discResults = results?.filter(r => 
    r.test_name && r.test_name.toUpperCase().includes('DISC')
  );

  if (!discResults || discResults.length === 0) {
    console.log('No DISC results found');
    return;
  }

  console.log(`Processing ${discResults.length} DISC results...`);

  let updated = 0;
  for (const result of discResults) {
    const cats = result.categories || {};
    
    // Check if using old format with full names or new format with codes
    const hasFullNames = cats['Dominance'] !== undefined || cats['Influence'] !== undefined;
    
    const dims = hasFullNames 
      ? ['Dominance', 'Influence', 'Steadiness', 'Compliance']
      : ['D', 'I', 'S', 'C'];
    
    const codeMap = {
      'Dominance': 'D', 'Influence': 'I', 'Steadiness': 'S', 'Compliance': 'C',
      'D': 'D', 'I': 'I', 'S': 'S', 'C': 'C'
    };

    const newCats = { ...cats };
    let hasChanges = false;

    for (const dim of dims) {
      const net = cats[dim] || 0;
      const code = codeMap[dim];
      
      // Check if M and L already exist
      const mKey = hasFullNames ? `${dim}_M` : `${dim}_M`;
      const lKey = hasFullNames ? `${dim}_L` : `${dim}_L`;
      
      const existingM = cats[mKey];
      const existingL = cats[lKey];
      
      // If M or L is missing, estimate from Net
      if (existingM === undefined || existingL === undefined || (existingM === 0 && existingL === 0 && net !== 0)) {
        hasChanges = true;
        
        if (net > 0) {
          // Net positive means M > L
          // Estimate: M = net + base, L = base
          const base = 3; // assume minimum 3 for L
          newCats[mKey] = net + base;
          newCats[lKey] = base;
        } else if (net < 0) {
          // Net negative means L > M
          const base = 3;
          newCats[mKey] = base;
          newCats[lKey] = Math.abs(net) + base;
        } else {
          // Net = 0, assume equal
          newCats[mKey] = 3;
          newCats[lKey] = 3;
        }
        
        console.log(`  ${dim}: Net=${net} => M=${newCats[mKey]}, L=${newCats[lKey]}`);
      }
    }

    if (hasChanges) {
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
    } else {
      console.log(`  Result ${result.id}: no changes needed`);
    }
  }

  console.log(`\nDone! ${updated} results updated.`);
  console.log('\nNote: M and L values are ESTIMATED from Net scores.');
  console.log('For accurate values, candidates need to retake the DISC test.');
}

estimateDiscML().catch(err => {
  console.error('Error:', err);
});
