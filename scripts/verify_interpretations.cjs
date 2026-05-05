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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function verifyInterpretations() {
  console.log('Verifying interpretations for all tests...\n');
  
  // Get all instruments
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name');
  
  for (const instrument of instruments) {
    console.log(`\n=== ${instrument.name} ===`);
    
    const { data: interpretations } = await supabase
      .from('test_interpretations')
      .select('interpretation_key, category, interpretation_text')
      .eq('instrument_id', instrument.id)
      .order('interpretation_key, min_value');
    
    if (!interpretations || interpretations.length === 0) {
      console.log('No interpretations found');
      continue;
    }
    
    const grouped = {};
    interpretations.forEach(item => {
      if (!grouped[item.interpretation_key]) {
        grouped[item.interpretation_key] = [];
      }
      grouped[item.interpretation_key].push(item);
    });
    
    Object.entries(grouped).forEach(([key, items]) => {
      console.log(`\n${key}:`);
      items.forEach(item => {
        console.log(`  ${item.category} (${item.min_value}-${item.max_value})`);
      });
    });
    
    console.log(`\nTotal interpretations: ${interpretations.length}`);
  }
}

verifyInterpretations();
