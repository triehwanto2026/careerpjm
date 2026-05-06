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

async function checkInstruments() {
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .order('name');

  console.log('Available instruments:');
  instruments?.forEach(inst => {
    console.log(`  - ${inst.name} (${inst.id})`);
  });

  // Check if DISC exists with different case
  const { data: disc } = await supabase
    .from('test_instruments')
    .select('id, name, questions')
    .ilike('name', '%DISC%');

  console.log('\nDISC instruments found:', disc?.length || 0);
  disc?.forEach(inst => {
    console.log(`  - ${inst.name} (${inst.id})`);
    console.log(`    Questions count: ${inst.questions?.length || 0}`);
  });
}

checkInstruments().catch(err => {
  console.error('Error:', err);
});
