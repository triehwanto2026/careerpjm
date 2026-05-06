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

async function checkDiscData() {
  const { data: results } = await supabase
    .from('test_results')
    .select('*')
    .ilike('test_name', '%DISC%')
    .limit(1);

  if (results && results.length > 0) {
    const result = results[0];
    console.log('Sample DISC result:');
    console.log('ID:', result.id);
    console.log('Test Name:', result.test_name);
    console.log('Categories:', JSON.stringify(result.categories, null, 2));
  } else {
    console.log('No DISC results found');
  }
}

checkDiscData().catch(err => {
  console.error('Error:', err);
});
