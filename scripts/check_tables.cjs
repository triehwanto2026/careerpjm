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

async function checkTables() {
  // Check test_result_details table
  const { data: details, error } = await supabase
    .from('test_result_details')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching test_result_details:', error);
  } else {
    console.log(`Found ${details?.length || 0} rows in test_result_details`);
    if (details && details.length > 0) {
      console.log('Sample row keys:', Object.keys(details[0]).join(', '));
      console.log('Sample row:', JSON.stringify(details[0], null, 2).substring(0, 500));
    }
  }

  // Check test_results table
  const { data: results } = await supabase
    .from('test_results')
    .select('id, test_name')
    .limit(5);

  console.log(`\nFound ${results?.length || 0} rows in test_results`);
  results?.forEach(r => {
    console.log(`  - ${r.id}: ${r.test_name}`);
  });
}

checkTables().catch(err => {
  console.error('Error:', err);
});
