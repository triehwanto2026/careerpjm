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

async function verify() {
  const resultId = '3af3ec7a-95ff-471e-9437-dc3dc96a4bd6';
  
  // Read raw data
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', resultId)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Raw categories from DB:');
  console.log(JSON.stringify(data.categories, null, 2));
  console.log('\nAll keys:', Object.keys(data.categories || {}).join(', '));
}

verify().catch(err => console.error('Error:', err));
