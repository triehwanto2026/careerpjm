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

async function checkData() {
  const { data: results } = await supabase
    .from('test_results')
    .select('id, test_name, categories')
    .ilike('test_name', '%DISC%')
    .limit(2);

  console.log('DISC Results:');
  results?.forEach(r => {
    console.log(`\nResult ID: ${r.id}`);
    console.log(`Categories keys: ${Object.keys(r.categories || {}).join(', ')}`);
    console.log(`Full categories:`, JSON.stringify(r.categories, null, 2));
  });
}

checkData().catch(err => console.error('Error:', err));
