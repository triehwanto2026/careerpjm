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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  }
});

async function setupAptitudeInterpretations() {
  console.log('Setting up Aptitude Test interpretations...');
  
  // Find Aptitude Test instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .ilike('name', '%aptitude%');
  
  if (!instruments || instruments.length === 0) {
    console.error('Aptitude Test instrument not found');
    return;
  }
  
  const aptitudeTest = instruments[0];
  console.log(`Found Aptitude Test: ${aptitudeTest.name} (ID: ${aptitudeTest.id})`);
  
  // Clear existing interpretations for this test
  await supabase
    .from('test_interpretations')
    .delete()
    .eq('instrument_id', aptitudeTest.id);
  
  // Insert comprehensive interpretations
  const interpretations = [
    // Score-based interpretations (0-100 scale)
    {
      key: 'overall_score',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Kemampuan umum sangat rendah. Memerlukan pengembangan fundamental dalam semua aspek kognitif. Tidak direkomendasikan untuk posisi yang menuntut analisis kompleks.',
          text_en: 'Very low general ability. Requires fundamental development in all cognitive aspects. Not recommended for positions requiring complex analysis.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Kemampuan umum rendah. Perlu pelatihan intensif. Cocok untuk pekerjaan rutin dengan supervisi ketat.',
          text_en: 'Low general ability. Needs intensive training. Suitable for routine work with close supervision.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Kemampuan umum rata-rata. Cukup untuk pekerjaan administratif standar. Dapat berkembang dengan pelatihan yang tepat.',
          text_en: 'Average general ability. Sufficient for standard administrative work. Can develop with proper training.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Kemampuan umum tinggi. Mampu menangani tugas kompleks dan multitasking. Potensial untuk posisi supervisory.',
          text_en: 'High general ability. Able to handle complex tasks and multitasking. Potential for supervisory positions.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Kemampuan umum sangat tinggi. Unggul dalam problem solving dan analisis. Cocok untuk posisi manajerial atau spesialis.',
          text_en: 'Very high general ability. Excellent in problem solving and analysis. Suitable for managerial or specialist positions.'
        }
      ]
    },
    // Verbal ability interpretations
    {
      key: 'verbal_ability',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Kemampuan verbal sangat rendah. Kesulitan dalam memahami instruksi tertulis dan komunikasi verbal.',
          text_en: 'Very low verbal ability. Difficulty understanding written instructions and verbal communication.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Kemampuan verbal rendah. Perlu bantuan dalam komunikasi tertulis dan pemahaman konsep abstrak.',
          text_en: 'Low verbal ability. Needs assistance in written communication and understanding abstract concepts.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Kemampuan verbal rata-rata. Mampu komunikasi dasar dan memahami instruksi standar.',
          text_en: 'Average verbal ability. Able to communicate basic ideas and understand standard instructions.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Kemampuan verbal tinggi. Baik dalam komunikasi, negosiasi, dan pemahaman konsep kompleks.',
          text_en: 'High verbal ability. Good in communication, negotiation, and understanding complex concepts.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Kemampuan verbal sangat tinggi. Unggul dalam komunikasi, presentasi, dan analisis teks.',
          text_en: 'Very high verbal ability. Excellent in communication, presentation, and text analysis.'
        }
      ]
    },
    // Numerical ability interpretations
    {
      key: 'numerical_ability',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Kemampuan numerik sangat rendah. Kesulitan dengan perhitungan dasar dan data angka.',
          text_en: 'Very low numerical ability. Difficulty with basic calculations and numerical data.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Kemampuan numerik rendah. Perlu alat bantu untuk perhitungan dan analisis data sederhana.',
          text_en: 'Low numerical ability. Needs tools for calculations and simple data analysis.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Kemampuan numerik rata-rata. Mampu perhitungan standar dan analisis data dasar.',
          text_en: 'Average numerical ability. Able to perform standard calculations and basic data analysis.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Kemampuan numerik tinggi. Baik dalam analisis data, perhitungan kompleks, dan problem solving.',
          text_en: 'High numerical ability. Good in data analysis, complex calculations, and problem solving.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Kemampuan numerik sangat tinggi. Unggul dalam matematika, statistik, dan analisis kuantitatif.',
          text_en: 'Very high numerical ability. Excellent in mathematics, statistics, and quantitative analysis.'
        }
      ]
    },
    // Logical reasoning interpretations
    {
      key: 'logical_reasoning',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Penalaran logis sangat rendah. Kesulitan dalam mengidentifikasi pola dan hubungan logika.',
          text_en: 'Very low logical reasoning. Difficulty identifying patterns and logical relationships.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Penalaran logis rendah. Perlu bimbingan dalam problem solving dan pengambilan keputusan.',
          text_en: 'Low logical reasoning. Needs guidance in problem solving and decision making.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Penalaran logis rata-rata. Mampu problem solving standar dan pengambilan keputusan sederhana.',
          text_en: 'Average logical reasoning. Able to perform standard problem solving and simple decision making.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Penalaran logis tinggi. Baik dalam analisis masalah, strategi, dan pengambilan keputusan kompleks.',
          text_en: 'High logical reasoning. Good in problem analysis, strategy, and complex decision making.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Penalaran logis sangat tinggi. Unggul dalam analisis sistem, strategi, dan problem solving kompleks.',
          text_en: 'Very high logical reasoning. Excellent in system analysis, strategy, and complex problem solving.'
        }
      ]
    },
    // Spatial ability interpretations
    {
      key: 'spatial_ability',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Kemampuan spasial sangat rendah. Kesulitan dengan orientasi ruang dan visualisasi.',
          text_en: 'Very low spatial ability. Difficulty with spatial orientation and visualization.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Kemampuan spasial rendah. Perlu bantuan dalam navigasi dan desain visual.',
          text_en: 'Low spatial ability. Needs assistance with navigation and visual design.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Kemampuan spasial rata-rata. Cukup untuk tugas visual dasar dan navigasi standar.',
          text_en: 'Average spatial ability. Sufficient for basic visual tasks and standard navigation.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Kemampuan spasial tinggi. Baik dalam desain, arsitektur, dan visualisasi 3D.',
          text_en: 'High spatial ability. Good in design, architecture, and 3D visualization.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Kemampuan spasial sangat tinggi. Unggul dalam desain, engineering, dan kreativitas visual.',
          text_en: 'Very high spatial ability. Excellent in design, engineering, and visual creativity.'
        }
      ]
    },
    // Job recommendations based on overall score
    {
      key: 'job_recommendation',
      interpretations: [
        {
          min: 0, max: 20, category: 'Very Low',
          text: 'Rekomendasi: Posisi entry-level dengan supervisi ketat. Fokus pada pengembangan fundamental. Contoh: Admin junior, helper, pekerjaan manual sederhana.',
          text_en: 'Recommendation: Entry-level positions with close supervision. Focus on fundamental development. Examples: Junior admin, helper, simple manual work.'
        },
        {
          min: 20, max: 40, category: 'Low',
          text: 'Rekomendasi: Posisi rutin dengan prosedur jelas. Contoh: Data entry, warehouse staff, customer service basic.',
          text_en: 'Recommendation: Routine positions with clear procedures. Examples: Data entry, warehouse staff, basic customer service.'
        },
        {
          min: 40, max: 60, category: 'Average',
          text: 'Rekomendasi: Posisi administratif dan operasional. Contoh: Admin, sales, marketing support, technician junior.',
          text_en: 'Recommendation: Administrative and operational positions. Examples: Admin, sales, marketing support, junior technician.'
        },
        {
          min: 60, max: 80, category: 'High',
          text: 'Rekomendasi: Posisi supervisory dan spesialis. Contoh: Supervisor, team lead, analyst, specialist, sales senior.',
          text_en: 'Recommendation: Supervisory and specialist positions. Examples: Supervisor, team lead, analyst, specialist, senior sales.'
        },
        {
          min: 80, max: 100, category: 'Very High',
          text: 'Rekomendasi: Posisi manajerial dan strategis. Contoh: Manager, senior analyst, consultant, department head, specialist expert.',
          text_en: 'Recommendation: Managerial and strategic positions. Examples: Manager, senior analyst, consultant, department head, expert specialist.'
        }
      ]
    }
  ];
  
  let insertedCount = 0;
  
  for (const interpGroup of interpretations) {
    for (const interp of interpGroup.interpretations) {
      const { error } = await supabase
        .from('test_interpretations')
        .insert({
          instrument_id: aptitudeTest.id,
          interpretation_key: interpGroup.key,
          interpretation_text: interp.text,
          interpretation_text_en: interp.text_en,
          min_value: interp.min,
          max_value: interp.max,
          category: interp.category
        });
      
      if (error) {
        console.error(`Error inserting interpretation for ${interpGroup.key}:`, error);
      } else {
        insertedCount++;
      }
    }
  }
  
  console.log(`\n✅ Successfully inserted ${insertedCount} Aptitude Test interpretations!`);
  
  // Verify insertion
  const { data: verification } = await supabase
    .from('test_interpretations')
    .select('interpretation_key, category, interpretation_text')
    .eq('instrument_id', aptitudeTest.id)
    .order('interpretation_key, min_value');
  
  console.log('\nInterpretation categories by type:');
  const grouped = {};
  verification?.forEach(item => {
    if (!grouped[item.interpretation_key]) {
      grouped[item.interpretation_key] = [];
    }
    grouped[item.interpretation_key].push(item.category);
  });
  
  Object.entries(grouped).forEach(([key, categories]) => {
    console.log(`${key}: ${categories.join(', ')}`);
  });
}

setupAptitudeInterpretations();
