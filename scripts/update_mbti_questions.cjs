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

async function updateMBTIQuestions() {
  console.log('Updating MBTI questions with 70 new questions...');
  
  // Find MBTI instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .ilike('name', '%mbti%');
  
  if (!instruments || instruments.length === 0) {
    console.error('MBTI instrument not found');
    return;
  }
  
  const mbtiTest = instruments[0];
  console.log(`Found MBTI: ${mbtiTest.name} (ID: ${mbtiTest.id})`);
  
  // Delete existing questions and options
  console.log('Deleting existing questions...');
  const { data: existingQuestions } = await supabase
    .from('test_questions')
    .select('id')
    .eq('instrument_id', mbtiTest.id);
  
  if (existingQuestions && existingQuestions.length > 0) {
    await supabase
      .from('test_question_options')
      .delete()
      .eq('question_id', existingQuestions.map(q => q.id));
    await supabase
      .from('test_questions')
      .delete()
      .eq('instrument_id', mbtiTest.id);
  }
  
  // Define 70 new questions with MBTI dimension mapping
  const questions = [
    {
      question_number: 1,
      question_text: "Pada sebuah pesta, apakah Anda:",
      options: [
        { label: "a", text: "bergaul dengan banyak orang termasuk orang-orang yang baru Anda kenal", dimension: "E" },
        { label: "b", text: "bergaul dengan beberapa orang yang telah Anda kenal saja", dimension: "I" }
      ]
    },
    {
      question_number: 2,
      question_text: "Apakah Anda lebih:",
      options: [
        { label: "a", text: "realistik", dimension: "S" },
        { label: "b", text: "spekulatif", dimension: "N" }
      ]
    },
    {
      question_number: 3,
      question_text: "Adalah hal yang buruk:",
      options: [
        { label: "a", text: "tenggelam dalam mengandai-andai", dimension: "N" },
        { label: "b", text: "terlanjur basah kerepotan di tengah jalan", dimension: "S" }
      ]
    },
    {
      question_number: 4,
      question_text: "Biasanya Anda lebih terkesan dengan:",
      options: [
        { label: "a", text: "prinsip", dimension: "T" },
        { label: "b", text: "perasaan", dimension: "F" }
      ]
    },
    {
      question_number: 5,
      question_text: "Apakah Anda cenderung lebih terjelaskan melalui:",
      options: [
        { label: "a", text: "argumen logis", dimension: "T" },
        { label: "b", text: "argumen emotif (feeling)", dimension: "F" }
      ]
    },
    {
      question_number: 6,
      question_text: "Apakah Anda lebih menyukai bekerja:",
      options: [
        { label: "a", text: "menggunakan batas waktu", dimension: "J" },
        { label: "b", text: "kapan-kapan saja", dimension: "P" }
      ]
    },
    {
      question_number: 7,
      question_text: "Apakah Anda cenderung untuk memilih:",
      options: [
        { label: "a", text: "secara berhati-hati", dimension: "J" },
        { label: "b", text: "secara spontan", dimension: "P" }
      ]
    },
    {
      question_number: 8,
      question_text: "Di pesta-pesta, Anda:",
      options: [
        { label: "a", text: "tinggal sampai pesta berakhir dengan semakin segar", dimension: "E" },
        { label: "b", text: "meninggalkan pesta lebih cepat dengan kondisi capai/lelah", dimension: "I" }
      ]
    },
    {
      question_number: 9,
      question_text: "Apakah Anda merupakan seseorang yang lebih:",
      options: [
        { label: "a", text: "banyak menggunakan akal sehat", dimension: "S" },
        { label: "b", text: "imajinatif", dimension: "N" }
      ]
    },
    {
      question_number: 10,
      question_text: "Apakah Anda lebih tertarik pada:",
      options: [
        { label: "a", text: "apa yang aktual", dimension: "S" },
        { label: "b", text: "apa yang mungkin", dimension: "N" }
      ]
    },
    {
      question_number: 11,
      question_text: "Dalam memutuskan/memberi penilaian pada orang lain Anda lebih dipengaruhi oleh:",
      options: [
        { label: "a", text: "hukum daripada situasi/keadaannya", dimension: "T" },
        { label: "b", text: "situasi/keadaannya daripada hukum", dimension: "F" }
      ]
    },
    {
      question_number: 12,
      question_text: "Ketika pertama kali mendekati orang lain, apakah Anda lebih:",
      options: [
        { label: "a", text: "tidak melibatkan perasaan dan menjaga jarak", dimension: "I" },
        { label: "b", text: "melibatkan diri secara pribadi dan mencoba membuat orang tersebut tertarik", dimension: "E" }
      ]
    },
    {
      question_number: 13,
      question_text: "Apakah Anda biasanya lebih:",
      options: [
        { label: "a", text: "tepat waktu", dimension: "J" },
        { label: "b", text: "santai", dimension: "P" }
      ]
    },
    {
      question_number: 14,
      question_text: "Apakah mengganggu Anda, mempunyai banyak hal yang:",
      options: [
        { label: "a", text: "tidak lengkap/tidak terselesaikan", dimension: "J" },
        { label: "b", text: "sudah lengkap/terselesaikan", dimension: "P" }
      ]
    },
    {
      question_number: 15,
      question_text: "Dalam kelompok sosial Anda, Anda:",
      options: [
        { label: "a", text: "mengetahui kejadian-kejadian yang dialami oleh orang lain", dimension: "E" },
        { label: "b", text: "biasanya ketinggalan berita", dimension: "I" }
      ]
    },
    {
      question_number: 16,
      question_text: "Dalam mengerjakan sesuatu yang biasa, Anda lebih suka:",
      options: [
        { label: "a", text: "mengerjakannya dengan cara lazimnya orang", dimension: "S" },
        { label: "b", text: "mengerjakannya dengan cara Anda sendiri", dimension: "N" }
      ]
    },
    {
      question_number: 17,
      question_text: "Apakah Anda memilih penulis yang:",
      options: [
        { label: "a", text: "menuliskan kata-kata dengan arti yang sebenarnya", dimension: "S" },
        { label: "b", text: "menggunakan kiasan-kiasan", dimension: "N" }
      ]
    },
    {
      question_number: 18,
      question_text: "Bagi Anda, apa yang lebih penting:",
      options: [
        { label: "a", text: "konsisten dan teguh dengan pemikiran/ide Anda", dimension: "T" },
        { label: "b", text: "menjaga keharmonisan hubungan sosial", dimension: "F" }
      ]
    },
    {
      question_number: 19,
      question_text: "Anda merasa nyaman, membuat:",
      options: [
        { label: "a", text: "keputusan logis", dimension: "T" },
        { label: "b", text: "keputusan berdasar nilai-nilai", dimension: "F" }
      ]
    },
    {
      question_number: 20,
      question_text: "Apakah biasanya Anda:",
      options: [
        { label: "a", text: "menyukai segala hal terselesaikan", dimension: "J" },
        { label: "b", text: "membiarkan berbagai pilihan dengan berbagai kemungkinan", dimension: "P" }
      ]
    },
    {
      question_number: 21,
      question_text: "Menurut Anda, Anda orang yang:",
      options: [
        { label: "a", text: "tegas, saklek, keras pendirian/kemauan", dimension: "J" },
        { label: "b", text: "nyantai, bisa menyesuaikan pendirian/kemauan (easy-going)", dimension: "P" }
      ]
    },
    {
      question_number: 22,
      question_text: "Dalam menelpon, apaka Anda:",
      options: [
        { label: "a", text: "langsung berbicara", dimension: "E" },
        { label: "b", text: "menyusun dulu kata-kata yang diucapkan", dimension: "I" }
      ]
    },
    {
      question_number: 23,
      question_text: "Untuk Anda, fakta adalah:",
      options: [
        { label: "a", text: "menggambarkan apa yang terjadi", dimension: "S" },
        { label: "b", text: "biasanya perlu diinterpretasi", dimension: "N" }
      ]
    },
    {
      question_number: 24,
      question_text: "Apakah Anda memilih bekerja dengan:",
      options: [
        { label: "a", text: "informasi praktis", dimension: "S" },
        { label: "b", text: "ide-ide abstrak", dimension: "N" }
      ]
    },
    {
      question_number: 25,
      question_text: "Apakah Anda cenderung lebih:",
      options: [
        { label: "a", text: "berpikiran jernih", dimension: "T" },
        { label: "b", text: "berperasaan hangat", dimension: "F" }
      ]
    },
    {
      question_number: 26,
      question_text: "Apakah Anda lebih suka menjadi seorang yang:",
      options: [
        { label: "a", text: "adil daripada pemaaf", dimension: "T" },
        { label: "b", text: "pemaaf daripada adil", dimension: "F" }
      ]
    },
    {
      question_number: 27,
      question_text: "Bagi Anda, mengalami sesuatu:",
      options: [
        { label: "a", text: "harus direncanakan dan berdasarkan pilihan", dimension: "J" },
        { label: "b", text: "biarlah berjalan dengan sendirinya", dimension: "P" }
      ]
    },
    {
      question_number: 28,
      question_text: "Apakah Anda lebih nyaman dengan:",
      options: [
        { label: "a", text: "langsung beli/dipesankan", dimension: "J" },
        { label: "b", text: "mempunyai pilihan-pilihan", dimension: "P" }
      ]
    },
    {
      question_number: 29,
      question_text: "Dalam suatu pertemuan apakah Anda:",
      options: [
        { label: "a", text: "memulai pembicaraan-pembicaraan", dimension: "E" },
        { label: "b", text: "menunggu untuk ditanya", dimension: "I" }
      ]
    },
    {
      question_number: 30,
      question_text: "Akal sehat gaya tradisional:",
      options: [
        { label: "a", text: "biasanya bisa dipercaya", dimension: "S" },
        { label: "b", text: "sering menimbulkan salah tafsir", dimension: "N" }
      ]
    },
    {
      question_number: 31,
      question_text: "Anak-anak tidak:",
      options: [
        { label: "a", text: "cukup sering melakukan kegiatan bermanfaat", dimension: "S" },
        { label: "b", text: "cukup berfantasi", dimension: "N" }
      ]
    },
    {
      question_number: 32,
      question_text: "Apakah biasanya Anda lebih:",
      options: [
        { label: "a", text: "mempertahankan prinsip", dimension: "T" },
        { label: "b", text: "bersikap simpatik", dimension: "F" }
      ]
    },
    {
      question_number: 33,
      question_text: "Apakah Anda biasanya lebih bersikap:",
      options: [
        { label: "a", text: "tegas daripada lemah lembut", dimension: "T" },
        { label: "b", text: "lemah-lembut daripada tegas", dimension: "F" }
      ]
    },
    {
      question_number: 34,
      question_text: "Apakah Anda cenderung lebih menjaga hal-hal agar:",
      options: [
        { label: "a", text: "terorganisasi dengan baik", dimension: "J" },
        { label: "b", text: "terbuka untuk kemungkinan-kemungkinan", dimension: "P" }
      ]
    },
    {
      question_number: 35,
      question_text: "Apakah Anda lebih menghargai:",
      options: [
        { label: "a", text: "sesuatu yang pasti", dimension: "J" },
        { label: "b", text: "sesuatu yang berubah-ubah", dimension: "P" }
      ]
    },
    {
      question_number: 36,
      question_text: "Apakah interaksi baru dengan orang lain:",
      options: [
        { label: "a", text: "menggugah semangat Anda", dimension: "E" },
        { label: "b", text: "menguras tenaga Anda", dimension: "I" }
      ]
    },
    {
      question_number: 37,
      question_text: "Anda menggambarkan diri Anda lebih sering sebagai:",
      options: [
        { label: "a", text: "orang yang praktis", dimension: "S" },
        { label: "b", text: "orang yang teoritis", dimension: "N" }
      ]
    },
    {
      question_number: 38,
      question_text: "Anda lebih melihat orang lain:",
      options: [
        { label: "a", text: "dari bagaimana kemanfaatannya", dimension: "S" },
        { label: "b", text: "dari bagaimana kelihatannya", dimension: "N" }
      ]
    },
    {
      question_number: 39,
      question_text: "Mana yang lebih memuaskan Anda:",
      options: [
        { label: "a", text: "mendiskusikan suatu topik sampai tuntas", dimension: "T" },
        { label: "b", text: "mencapai kesepakatan tentang suatu permasalahan", dimension: "F" }
      ]
    },
    {
      question_number: 40,
      question_text: "Yang mana lebih banyak Anda gunakan:",
      options: [
        { label: "a", text: "pemikiran", dimension: "T" },
        { label: "b", text: "perasaan", dimension: "F" }
      ]
    },
    {
      question_number: 41,
      question_text: "Anda lebih nyaman dengan pekerjaan yang:",
      options: [
        { label: "a", text: "berdasarkan kontrak", dimension: "J" },
        { label: "b", text: "tidak terikat", dimension: "P" }
      ]
    },
    {
      question_number: 42,
      question_text: "Anda lebih menyukai bila segala hal:",
      options: [
        { label: "a", text: "rapi dan teratur", dimension: "J" },
        { label: "b", text: "tergantung situasi", dimension: "P" }
      ]
    },
    {
      question_number: 43,
      question_text: "Apakah Anda lebih memilih:",
      options: [
        { label: "a", text: "banyak teman dengan hubungan yang singkat", dimension: "E" },
        { label: "b", text: "beberapa teman dengan hubungan yang lama/langgeng", dimension: "I" }
      ]
    },
    {
      question_number: 44,
      question_text: "Apakah Anda lebih beranjak pada:",
      options: [
        { label: "a", text: "fakta-fakta", dimension: "S" },
        { label: "b", text: "kaidah-kaidah", dimension: "N" }
      ]
    },
    {
      question_number: 45,
      question_text: "Apakah Anda lebih tertarik pada:",
      options: [
        { label: "a", text: "produksi dan distribusi/hasil akhir", dimension: "S" },
        { label: "b", text: "perencana, penelitian", dimension: "N" }
      ]
    },
    {
      question_number: 46,
      question_text: "Mana yang lebih patut dipuji:",
      options: [
        { label: "a", text: "orang yang sangat logis", dimension: "T" },
        { label: "b", text: "orang yang sangat sentimentil (mengedepankan perasaan)", dimension: "F" }
      ]
    },
    {
      question_number: 47,
      question_text: "Apakah Anda menghargai diri Anda karena:",
      options: [
        { label: "a", text: "berpendirian teguh", dimension: "T" },
        { label: "b", text: "penuh pengabdian", dimension: "F" }
      ]
    },
    {
      question_number: 48,
      question_text: "Apakah Anda lebih suka dengan:",
      options: [
        { label: "a", text: "pernyataan-pernyataan final dan tidak bisa diganggu-gugat", dimension: "J" },
        { label: "b", text: "pernyataan-pernyataan tidak bersifat pasti (tentative)/masih awal", dimension: "P" }
      ]
    },
    {
      question_number: 49,
      question_text: "Apakah Anda lebih nyaman dengan:",
      options: [
        { label: "a", text: "sesudah pengambilan keputusan", dimension: "J" },
        { label: "b", text: "sebelum pengambilan keputusan", dimension: "P" }
      ]
    },
    {
      question_number: 50,
      question_text: "Apakah Anda:",
      options: [
        { label: "a", text: "berbicara dengan mudah dan panjang lebar dengan orang yang baru dikenal", dimension: "E" },
        { label: "b", text: "sulit bicara dengan orang yang baru dikenal", dimension: "I" }
      ]
    },
    {
      question_number: 51,
      question_text: "Apakah Anda sepertinya lebih mempercayai:",
      options: [
        { label: "a", text: "pengalaman-pengalaman", dimension: "S" },
        { label: "b", text: "firasat/dugaan/prasangka", dimension: "N" }
      ]
    },
    {
      question_number: 52,
      question_text: "Apakah Anda merasa:",
      options: [
        { label: "a", text: "lebih praktis daripada kreatif", dimension: "S" },
        { label: "b", text: "lebih kreatif daripada praktis", dimension: "N" }
      ]
    },
    {
      question_number: 53,
      question_text: "Apakah Anda memiliki ciri khas sebagai seorang dengan:",
      options: [
        { label: "a", text: "rasio jelas", dimension: "T" },
        { label: "b", text: "perasaan yang kuat", dimension: "F" }
      ]
    },
    {
      question_number: 54,
      question_text: "Apakah Anda cenderung lebih:",
      options: [
        { label: "a", text: "adil apa adanya/tanpa prasangka", dimension: "T" },
        { label: "b", text: "manruh perhatian (simpatis)", dimension: "F" }
      ]
    },
    {
      question_number: 55,
      question_text: "Anda sangat menyukai tindakan yang:",
      options: [
        { label: "a", text: "memastikan segala sesuatu ditata dahulu", dimension: "J" },
        { label: "b", text: "membiarkan hal-hal yang terjadi begitu saja", dimension: "P" }
      ]
    },
    {
      question_number: 56,
      question_text: "Apakah cara-cara Anda lebih pada:",
      options: [
        { label: "a", text: "mengatur segala sesuatu", dimension: "J" },
        { label: "b", text: "menunda-nunda penyelesaian", dimension: "P" }
      ]
    },
    {
      question_number: 57,
      question_text: "Bila telepon berbunyi, Anda akan:",
      options: [
        { label: "a", text: "segera menerima telepon tersebut", dimension: "E" },
        { label: "b", text: "berharap orang lain yang menerimanya", dimension: "I" }
      ]
    },
    {
      question_number: 58,
      question_text: "Apakah Anda lebih menghargai diri Anda dalam hal:",
      options: [
        { label: "a", text: "kemampuan memahami realita", dimension: "S" },
        { label: "b", text: "kemampuan imajinasi yang baik", dimension: "N" }
      ]
    },
    {
      question_number: 59,
      question_text: "Apakah Anda lebih tertarik pada:",
      options: [
        { label: "a", text: "azas", dimension: "T" },
        { label: "b", text: "penyesuaian", dimension: "F" }
      ]
    },
    {
      question_number: 60,
      question_text: "Dalam menilai, biasanya Anda lebih bersikap:",
      options: [
        { label: "a", text: "netral", dimension: "T" },
        { label: "b", text: "pemurah", dimension: "F" }
      ]
    },
    {
      question_number: 61,
      question_text: "Apakah Anda lebih menganggap diri Anda sebagai orang yang:",
      options: [
        { label: "a", text: "keras hati/teguh", dimension: "T" },
        { label: "b", text: "lunak hati/halus", dimension: "F" }
      ]
    },
    {
      question_number: 62,
      question_text: "Apakah Anda lebih cenderung mengalami:",
      options: [
        { label: "a", text: "kejadian-kejadian yang telah terjadwal", dimension: "J" },
        { label: "b", text: "kejadian-kejadian yang datang begitu saja", dimension: "P" }
      ]
    },
    {
      question_number: 63,
      question_text: "Apakah Anda lebih termasuk tipe orang yang menyukai:",
      options: [
        { label: "a", text: "hal-hal yang bersifat rutin", dimension: "S" },
        { label: "b", text: "hal-hal yang tidak biasa", dimension: "N" }
      ]
    },
    {
      question_number: 64,
      question_text: "Apakah Anda cenderung:",
      options: [
        { label: "a", text: "mudah didekati", dimension: "E" },
        { label: "b", text: "agak menjaga jarak", dimension: "I" }
      ]
    },
    {
      question_number: 65,
      question_text: "Bila Anda menulis, Anda lebih menyukai:",
      options: [
        { label: "a", text: "memakai kata-kata dengan arti yang sebenarnya", dimension: "S" },
        { label: "b", text: "menggunakan kata-kata kiasan", dimension: "N" }
      ]
    },
    {
      question_number: 66,
      question_text: "Apakah Anda merasa lebih senang dengan:",
      options: [
        { label: "a", text: "mengalami sendiri dan nyata", dimension: "S" },
        { label: "b", text: "membayangkan", dimension: "N" }
      ]
    },
    {
      question_number: 67,
      question_text: "Apakah biasanya Anda lebih:",
      options: [
        { label: "a", text: "berpikiran jernih", dimension: "T" },
        { label: "b", text: "menunjukkan perasaan yang kuat", dimension: "F" }
      ]
    },
    {
      question_number: 68,
      question_text: "Apakah Anda lebih:",
      options: [
        { label: "a", text: "adil daripada toleran", dimension: "T" },
        { label: "b", text: "toleran daripada adil", dimension: "F" }
      ]
    },
    {
      question_number: 69,
      question_text: "Apakah Anda lebih memilih:",
      options: [
        { label: "a", text: "kegiatan yang terencana", dimension: "J" },
        { label: "b", text: "kegiatan yang tidak terencana", dimension: "P" }
      ]
    },
    {
      question_number: 70,
      question_text: "Apakah Anda cenderung lebih:",
      options: [
        { label: "a", text: "hati-hati daripada spontan", dimension: "J" },
        { label: "b", text: "spontan daripada hati-hati", dimension: "P" }
      ]
    }
  ];
  
  // Insert questions and options
  let insertedCount = 0;
  
  for (const q of questions) {
    // Insert question
    const { data: questionData, error: questionError } = await supabase
      .from('test_questions')
      .insert({
        instrument_id: mbtiTest.id,
        question_number: q.question_number,
        question_text: q.question_text,
        question_text_en: q.question_text,
        category: 'MBTI',
        question_type: 'single_choice',
        scoring_rule: 'mbti_dimension'
      })
      .select()
      .single();
    
    if (questionError) {
      console.error(`Error inserting question ${q.question_number}:`, questionError);
      continue;
    }
    
    // Insert options with dimension mapping
    const optionsToInsert = q.options.map((opt, idx) => ({
      question_id: questionData.id,
      option_label: opt.label,
      option_text: opt.text,
      option_text_en: opt.text,
      score_value: 1,
      category_target: opt.dimension, // Store MBTI dimension (E/I, S/N, T/F, J/P)
      is_correct: null, // MBTI doesn't have correct answers, just dimensions
      display_order: idx
    }));
    
    const { error: optionsError } = await supabase
      .from('test_question_options')
      .insert(optionsToInsert);
    
    if (optionsError) {
      console.error(`Error inserting options for question ${q.question_number}:`, optionsError);
    } else {
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`Inserted ${insertedCount} questions...`);
      }
    }
  }
  
  // Update instrument question count
  await supabase
    .from('test_instruments')
    .update({ question_count: 70 })
    .eq('id', mbtiTest.id);
  
  console.log(`\n✅ Successfully inserted ${insertedCount} MBTI questions!`);
  console.log('All answers mapped to MBTI dimensions (E/I, S/N, T/F, J/P)');
}

updateMBTIQuestions();
