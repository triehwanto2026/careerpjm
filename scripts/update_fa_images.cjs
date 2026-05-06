const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

const IST_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';

async function updateFAImages() {
  console.log('Updating FA (117-136) images...\n');
  
  // Get all files from storage
  const { data: files, error: fileError } = await supabase
    .storage
    .from('test-images')
    .list();
  
  if (fileError) {
    console.error('Error listing files:', fileError);
    return;
  }
  
  console.log(`Found ${files?.length || 0} files in storage`);
  
  // Filter FA files (soal 117-136)
  const faFiles = files?.filter(f => {
    const num = parseInt(f.name.match(/q(\d+)/)?.[1] || '0');
    return num >= 117 && num <= 136;
  }) || [];
  
  console.log(`Found ${faFiles.length} FA files (q117-q136)`);
  
  // Group by question number
  const byQuestion = {};
  faFiles.forEach(f => {
    const match = f.name.match(/q(\d+)-(soal|pilihan)/);
    if (match) {
      const num = match[1];
      const type = match[2]; // 'soal' or 'pilihan'
      if (!byQuestion[num]) byQuestion[num] = {};
      byQuestion[num][type] = f.name;
    }
  });
  
  console.log('\nFiles by question:', Object.keys(byQuestion).length, 'questions');
  
  // Update each question
  for (const [num, files] of Object.entries(byQuestion)) {
    const questionNum = parseInt(num);
    const soalFile = files.soal;
    const pilihanFile = files.pilihan;
    
    if (!soalFile || !pilihanFile) {
      console.log(`Skipping q${num}: missing files (soal: ${!!soalFile}, pilihan: ${!!pilihanFile})`);
      continue;
    }
    
    // Get public URLs
    const soalUrl = supabase.storage.from('test-images').getPublicUrl(soalFile).data.publicUrl;
    const pilihanUrl = supabase.storage.from('test-images').getPublicUrl(pilihanFile).data.publicUrl;
    
    console.log(`\nUpdating soal ${questionNum}:`);
    console.log(`  question_image: ${soalUrl.substring(0, 60)}...`);
    console.log(`  options_image: ${pilihanUrl.substring(0, 60)}...`);
    
    // Update database
    const { error: updateError } = await supabase
      .from('test_questions')
      .update({
        question_image: soalUrl,
        options_image: pilihanUrl,
        image_url: null // Clear old image
      })
      .eq('instrument_id', IST_ID)
      .eq('question_number', questionNum);
    
    if (updateError) {
      console.error(`  ERROR updating q${num}:`, updateError.message);
    } else {
      console.log(`  ✓ Success`);
    }
  }
  
  console.log('\n✅ Done!');
}

updateFAImages().catch(console.error);
