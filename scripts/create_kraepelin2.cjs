const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function createKraepelin2() {
  console.log('Creating Kraepelin 2 instrument...');
  
  const { data, error } = await supabase.from('test_instruments').insert({
    name: 'Kraepelin 2',
    name_en: 'Kraepelin Test 2',
    description: 'Tes kecepatan, ketelitian, daya tahan, dan stabilitas dalam pekerjaan rutin. Mengukur kemampuan kognitif melalui penjumlahan angka berurutan.',
    category: 'Work Aptitude',
    question_count: 600,
    duration_minutes: 10,
    scoring_method: 'speed_accuracy',
    target_audience: 'Pekerja klerikal, operator, staff administrasi',
    norm_reference: 'Emil Kraepelin (1895), adaptasi modern',
    is_active: true
  }).select().single();
  
  if (error) {
    console.error('Error creating instrument:', error);
    process.exit(1);
  }
  
  console.log('✅ Kraepelin 2 created successfully!');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('Question count:', data.question_count);
  console.log('Duration:', data.duration_minutes, 'minutes');
}

createKraepelin2();
