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

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'test_results' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Schema:', data);
  }
}

checkSchema().catch(err => console.error('Error:', err));
