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

async function fixResult() {
  // Result ID yang user lihat (dari screenshot: D=-9, I=-7, S=7, C=10)
  const resultId = '3af3ec7a-95ff-471e-9437-dc3dc96a4bd6';
  
  console.log(`Fixing result ${resultId}...`);
  
  const { data: result, error } = await supabase
    .from('test_results')
    .select('id, test_name, categories')
    .eq('id', resultId)
    .single();
  
  if (error) {
    console.error('Error fetching result:', error);
    return;
  }
  
  console.log('Current data:', JSON.stringify(result.categories, null, 2));
  
  // Buat kategori baru dengan M dan L
  const cats = result.categories || {};
  const newCats = { ...cats };
  
  // Net values dari data
  const netD = cats.D || 0;
  const netI = cats.I || 0;
  const netS = cats.S || 0;
  const netC = cats.C || 0;
  
  // Estimasi M dan L dari Net
  // Net = M - L, asumsi minimum L = 3
  if (netD > 0) { newCats.D_M = netD + 3; newCats.D_L = 3; }
  else { newCats.D_M = 3; newCats.D_L = Math.abs(netD) + 3; }
  
  if (netI > 0) { newCats.I_M = netI + 3; newCats.I_L = 3; }
  else { newCats.I_M = 3; newCats.I_L = Math.abs(netI) + 3; }
  
  if (netS > 0) { newCats.S_M = netS + 3; newCats.S_L = 3; }
  else { newCats.S_M = 3; newCats.S_L = Math.abs(netS) + 3; }
  
  if (netC > 0) { newCats.C_M = netC + 3; newCats.C_L = 3; }
  else { newCats.C_M = 3; newCats.C_L = Math.abs(netC) + 3; }
  
  console.log('New categories:', JSON.stringify(newCats, null, 2));
  
  // Update
  const { error: updateError } = await supabase
    .from('test_results')
    .update({ categories: newCats })
    .eq('id', resultId);
  
  if (updateError) {
    console.error('Error updating:', updateError);
  } else {
    console.log('✓ Update successful!');
    
    // Verify
    const { data: verify } = await supabase
      .from('test_results')
      .select('categories')
      .eq('id', resultId)
      .single();
    
    console.log('Verified data:', JSON.stringify(verify?.categories, null, 2));
  }
}

fixResult().catch(err => console.error('Error:', err));
