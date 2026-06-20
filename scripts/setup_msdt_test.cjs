const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').replace(/["']/g, '').trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const C = {
  DEM: 'Democratic',
  EXE: 'Executive',
  AUT: 'Autocratic',
  BUR: 'Bureaucratic',
  DEV: 'Developer',
  HR: 'Human Relations',
  COM: 'Compromiser',
  LF: 'Laissez Faire',
};

const statements = {
  s01: ['Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggar-pelanggaran tersebut.', C.LF],
  s02: ['Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur.', C.COM],
  s03: ['Bila ada seorang karyawan yang hasil kerjanya selalu tidak memuaskan saya, saya akan menunggu suatu kesempatan untuk memindahkannya dan bukan untuk memecatnya.', C.HR],
  s04: ['Bila ada bawahan saya yang dikucilkan dari kelompok kerjanya, saya akan mencarikan cara-cara agar supaya orang lain dapat berteman dengannya.', C.DEV],
  s05: ['Bila Direktur memberikan perintah yang kurang menyenangkan, saya pikir adalah cukup bijaksana bila saya menyebutkan namanya dan bukan nama saya.', C.COM],
  s06: ['Saya biasanya membuat keputusan-keputusan saya sendiri dan menyampaikannya kepada bawahan saya.', C.AUT],
  s07: ['Bila saya ditegur oleh atasan saya, saya akan memanggil semua bawahan saya dan mengatakan semua teguran tersebut kepada mereka.', C.COM],
  s08: ['Saya akan memberikan tugas-tugas yang sulit kepada bawahan saya yang belum berpengalaman, tetapi bila mereka memperoleh kesukaran, saya akan mengambil alih tanggung jawab mereka.', C.DEV],
  s09: ['Saya selalu memberikan tugas-tugas yang sangat sulit kepada karyawan-karyawan yang paling berpengalaman.', C.AUT],
  s10: ['Saya selalu melakukan diskusi-diskusi untuk mencapai kata sepakat.', C.DEM],
  s11: ['Saya selalu menganjurkan kepada bawahan saya untuk memberikan usul-usul, tetapi kadang-kadang juga saya langsung membuat suatu tindakan tertentu.', C.EXE],
  s12: ['Kadang-kadang saya berpikir bahwa perasaan-perasaan saya dan sikap-sikap saya adalah mementingkan tugas saya.', C.AUT],
  s13: ['Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan yang dibuat berdasarkan atas suara terbanyak.', C.DEM],
  s14: ['Bila jumlah dan mutu hasil kerja bagian saya tidak memuaskan, saya menjelaskan kepada bawahan-bawahan saya bahwa Direktur merasa kecewa dan oleh karena itu mereka harus memperbaiki mutu kerja mereka itu.', C.COM],
  s15: ['Saya membuat keputusan-keputusan sendiri dan kemudian saya mencoba untuk menjual keputusan-keputusan itu kepada bawahan saya.', C.EXE],
  s16: ['Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur.', C.COM],
  s17: ['Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan, tetapi sayapun menyediakan sesuatu keputusan terakhir.', C.EXE],
  s18: ['Saya tidak akan ragu-ragu untuk mempekerjakan pegawai-pegawai yang cacat jasmaninya, bilamana saya merasa pasti bahwa dia dapat mempelajari pekerjaannya.', C.DEV],
  s19: ['Saya membuat bawahan-bawahan saya bekerja keras, dan saya berusaha menyakinkan mereka bahwa biasanya mereka mendapat perlakuan yang adil dari Dewan Direksi.', C.AUT],
  s20: ['Saya merasa bahwa adalah penting agar bawahan-bawahan menyukai saya apabila saya bekerja keras untuk mereka.', C.HR],
  s21: ['Saya membiarkan orang-orang lain menangani tugas-tugas mereka masing-masing, walaupun mereka membuat banyak kesalahan.', C.LF],
  s22: ['Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa sayapun mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.', C.HR],
  s23: ['Saya merasa bahwa adalah tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.', C.AUT],
  s24: ['Saya percaya bahwa bawahan-bawahan yang disiplin tidak akan memperbaiki jumlah atau mutu kerja mereka di dalam jangka waktu yang panjang.', C.LF],
  s25: ['Bila menghadapi masalah yang sulit, saya berusaha untuk mencapai pemecahan yang paling sedikit bisa diterima oleh sebagian besar orang-orang yang bersangkutan.', C.COM],
  s26: ['Saya berpikir bahwa bila beberapa bawahan saya merasa tidak berbahagia, saya akan mencoba melakukan sesuatu mengenai hal tersebut.', C.HR],
  s27: ['Saya mengurusi pekerjaan saya sendiri dan saya merasa bahwa pekerjaan saya itu bisa mencapai Dewan Direksi untuk mengembangkan ide-ide baru.', C.EXE],
  s28: ['Saya menyetujui kenaikan tunjangan-tunjangan untuk staf dan karyawan.', C.HR],
  s29: ['Saya menunjukkan persetujuan untuk meningkatkan pengetahuan tentang pekerjaan dan perusahaan dari bawahan-bawahan saya, walaupun hal itu sebenarnya belum diperlukan untuk kedudukan mereka sekarang.', C.DEV],
  s30: ['Bila seorang karyawan tidak sanggup menyelesaikan tugasnya, saya akan membantu dia untuk menyelesaikan tugas tersebut.', C.DEV],
  s31: ['Saya percaya bahwa suatu penerapan disiplin adalah merupakan seperangkat contoh untuk karyawan-karyawan lainnya.', C.BUR],
  s32: ['Saya mencela pembicaraan-pembicaraan yang tidak perlu di antara bawahan-bawahan saya selama mereka bekerja.', C.BUR],
  s33: ['Saya selalu memperhatikan mengenai keterlambatan dan kemangkiran.', C.BUR],
  s34: ['Saya percaya bahwa Serikat-Serikat Buruh akan mencoba untuk meruntuhkan kewibawaan pimpinan perusahaan.', C.BUR],
  s35: ['Kadang-kadang saya menentang keluhan-keluhan Serikat Buruh sebagai sesuatu perkara yang prinsipil.', C.BUR],
  s36: ['Saya merasa bahwa keluhan-keluhan tidak dapat dicegah dan saya mencoba sebaik mungkin untuk dapat dilenyapkan.', C.COM],
  s37: ['Adalah penting bagi saya untuk memperoleh nilai kredit bagi ide-ide saya yang baik.', C.EXE],
  s38: ['Saya menyuarakan pendapat-pendapat saya di muka umum hanya bila saya merasa bahwa orang lain akan setuju dengan saya.', C.COM],
  s39: ['Saya percaya bahwa pertemuan-pertemuan yang sering dengan karyawan secara pribadi adalah membantu pengembangan diri mereka.', C.DEV],
  s40: ['Saya merasa bahwa tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.', C.AUT],
  s41: ['Saya merasa bahwa jam pencatat waktu datang dan pulangnya para pegawai, mengurangi keterlambatan.', C.BUR],
  s42: ['Saya merasa bangga di dalam kenyataannya bahwa saya biasanya tidak akan menanyakan kepada seseorang untuk mengerjakan suatu tugas yang kalau untuk saya sendiri, tidak akan saya kerjakan.', C.EXE],
  s43: ['Saya tidak peduli dengan apa yang dikerjakan oleh para pegawai saya di luar jam kerja kantornya.', C.LF],
  s44: ['Saya percaya bahwa latihan melalui pengalaman bekerja, adalah lebih bermanfaat daripada pendidikan teoritis.', C.DEV],
  s45: ['Saya percaya bahwa kenaikan jabatan adalah semata-mata berdasarkan kemampuan yang ada.', C.BUR],
  s46: ['Saya merasa bahwa masalah-masalah yang timbul di antara para karyawan biasanya akan dapat diselesaikan di antara mereka sendiri, tanpa campur tangan dari saya.', C.LF],
  s47: ['Bila ada tugas-tugas yang tidak dikehendaki yang harus dikerjakan, sebelumnya saya akan menanyakan kepada beberapa sukarelawan yang mau mengerjakan tugas tersebut.', C.DEM],
  s48: ['Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa sayapun mengharapkan mereka berbuat seperti itu kepada saya.', C.HR],
  s49: ['Saya adalah seorang yang sangat memperhatikan kebahagiaan karyawan-karyawan saya di dalam mereka mengerjakan tugas-tugas mereka.', C.HR],
  s50: ['Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu, tanpa kehadiran saya.', C.LF],
  s51: ['Saya memberikan informasi kepada Dewan Direksi tidak lebih daripada apa yang mereka tanyakan.', C.BUR],
  s52: ['Saya kadang-kadang merasa ragu-ragu untuk membuat suatu keputusan yang akan tidak disukai oleh bawahan-bawahan saya.', C.COM],
  s53: ['Tujuan saya adalah mencapai bagaimana tugas-tugas dapat dikerjakan, tanpa saya merasa lebih benci daripada siapapun yang mengerjakannya.', C.COM],
  s54: ['Saya dengan sabar mendengarkan keluhan-keluhan dan ketidakpuasan-ketidakpuasan dari bawahan saya, tetapi seringkali saya meralat apa yang mereka katakan.', C.COM],
  s55: ['Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu, tanpa kehadiran saya.', C.LF],
  s56: ['Saya mungkin menentukan tugas-tugas tanpa banyak mempertimbangkan pengalaman atau kemampuan, tetapi saya lebih menuntut pada pencapaian hasil-hasilnya saja.', C.AUT],
  s57: ['Bila saya memberikan perintah kepada bawahan-bawahan saya, saya menentukan batas waktu untuk mereka menyelesaikannya.', C.AUT],
  s58: ['Saya mencoba untuk membuat bawahan-bawahan saya merasa senang hatinya apabila mereka berbicara dengan saya.', C.HR],
  s59: ['Saya menyukai penggunaan dari skala penggajian karyawan.', C.BUR],
  s60: ['Saya membentuk kelompok-kelompok kerja yang terdiri dari orang-orang yang sudah menjadi teman-teman baik saya.', C.HR],
  s61: ['Saya mengawasi benar bawahan-bawahan saya yang kurang mahir di dalam bekerjanya atau bawahan-bawahan saya yang hasil kerjanya kurang memuaskan.', C.AUT],
  s62: ['Saya merasa bahwa semua karyawan pada jabatan yang sama seharusnya memperoleh gaji yang sama.', C.BUR],
  s63: ['Saya merasa bahwa tujuan-tujuan Serikat Buruh dan tujuan-tujuan perusahaan adalah saling berbeda, dan saya mencoba untuk tidak membuat pandangan saya secara jelas.', C.COM],
  s64: ['Saya percaya bahwa Serikat-Serikat Buruh dan pimpinan perusahaan adalah bekerja untuk mencapai tujuan-tujuan yang sama.', C.DEM],
  s65: ['Di dalam diskusi, saya memberikan fakta-fakta seperti apa yang mereka pahami, dan membiarkan mereka melukiskan kesimpulan-kesimpulan mereka sendiri.', C.DEM],
  s66: ['Saya membuat keputusan-keputusan sendiri, tetapi saya akan mempertimbangkan usul-usul yang masuk akal dari bawahan-bawahan saya untuk memperbaiki keputusan tersebut apabila saya bertanya kepada mereka.', C.EXE],
  s67: ['Bila ada suatu tugas yang mendesak, walaupun semua peralatannya sudah disediakan, saya akan membiarkannya saja dan mengatakan kepada salah seorang bawahan saya untuk mengerjakan tugas tersebut.', C.LF],
  s68: ['Saya percaya bahwa bawahan-bawahan saya akan merasakan kepuasan kerja mereka tanpa merasakan tekanan apa pun dari saya.', C.HR],
};

const items = [
  ['s01','s02'], ['s03','s04'], ['s05','s06'], ['s07','s09'], ['s10','s11'], ['s12','s13'], ['s14','s15'], ['s16','s17'],
  ['s08','s09'], ['s20','s21'], ['s22','s23'], ['s24','s25'], ['s26','s27'], ['s28','s29'], ['s21','s66'], ['s04','s30'],
  ['s31','s12'], ['s32','s28'], ['s33','s34'], ['s35','s36'], ['s37','s38'], ['s34','s39'], ['s23','s41'], ['s06','s64'],
  ['s59','s10'], ['s42','s26'], ['s67','s37'], ['s53','s56'], ['s56','s54'], ['s36','s68'], ['s25','s44'], ['s09','s45'],
  ['s46','s07'], ['s43','s24'], ['s51','s35'], ['s52','s53'], ['s54','s52'], ['s38','s55'], ['s27','s57'], ['s11','s58'],
  ['s65','s05'], ['s47','s48'], ['s49','s33'], ['s50','s67'], ['s68','s51'], ['s39','s49'], ['s29','s61'], ['s13','s19'],
  ['s62','s03'], ['s63','s20'], ['s61','s32'], ['s57','s42'], ['s44','s43'], ['s41','s13'], ['s66','s63'], ['s15','s60'],
  ['s18','s01'], ['s60','s08'], ['s19','s31'], ['s58','s59'], ['s45','s46'], ['s64','s65'], ['s30','s62'], ['s17','s18'],
];

function validate() {
  if (items.length !== 64) throw new Error('MSDT must contain exactly 64 items');
  const unknown = items.flat().filter((id) => !statements[id]);
  if (unknown.length) throw new Error('Unknown statement ids: ' + unknown.join(', '));
  const invalid = Object.entries(statements).filter(([, [, category]]) => !Object.values(C).includes(category));
  if (invalid.length) throw new Error('Invalid categories: ' + invalid.map(([id]) => id).join(', '));
}

async function setup() {
  validate();
  const { data: existing, error: findError } = await supabase
    .from('test_instruments')
    .select('id')
    .or('name.ilike.%MSDT%,name.ilike.%Management Style Diagnostic%')
    .limit(1);
  if (findError) throw findError;

  let instrumentId = existing?.[0]?.id;
  if (!instrumentId) {
    const { data, error } = await supabase
      .from('test_instruments')
      .insert({
        name: 'Management Style Diagnostic Test (MSDT)',
        name_en: 'Management Style Diagnostic Test',
        description: 'Tes diagnosa gaya manajemen untuk memetakan kecenderungan gaya kepemimpinan/manajemen dalam konteks kerja.',
        category: 'Personality',
        scoring_method: 'msdt_style',
        target_audience: 'Supervisor, leader, manager, kandidat posisi struktural',
        norm_reference: 'Internal MSDT style profile',
        question_count: 64,
        duration_minutes: 30,
        is_active: true,
      })
      .select('id')
      .single();
    if (error) throw error;
    instrumentId = data.id;
  } else {
    const { error } = await supabase
      .from('test_instruments')
      .update({ question_count: 64, duration_minutes: 30, scoring_method: 'msdt_style', is_active: true })
      .eq('id', instrumentId);
    if (error) throw error;
  }

  const { data: oldQuestions, error: oldError } = await supabase.from('test_questions').select('id').eq('instrument_id', instrumentId);
  if (oldError) throw oldError;
  const ids = (oldQuestions || []).map((q) => q.id);
  if (ids.length) {
    const { error: optDelete } = await supabase.from('test_question_options').delete().in('question_id', ids);
    if (optDelete) throw optDelete;
    const { error: qDelete } = await supabase.from('test_questions').delete().eq('instrument_id', instrumentId);
    if (qDelete) throw qDelete;
  }

  for (let index = 0; index < items.length; index++) {
    const [aId, bId] = items[index];
    const [aText] = statements[aId];
    const [bText] = statements[bId];
    const { data: question, error: qError } = await supabase
      .from('test_questions')
      .insert({
        instrument_id: instrumentId,
        question_number: index + 1,
        question_text: 'Pilih pernyataan yang paling mendekati gaya manajemen Anda.\n\nA. ' + aText + '\nB. ' + bText,
        question_text_en: 'Choose the statement that best reflects your management style.\n\nA. ' + aText + '\nB. ' + bText,
        category: 'MSDT',
        question_type: 'single_choice',
        scoring_rule: 'msdt_style',
      })
      .select('id')
      .single();
    if (qError) throw qError;

    const options = [
      { label: 'A', text: aText, category: statements[aId][1], order: 0 },
      { label: 'B', text: bText, category: statements[bId][1], order: 1 },
    ].map((opt) => ({
      question_id: question.id,
      option_label: opt.label,
      option_text: opt.text,
      option_text_en: opt.text,
      score_value: 1,
      category_target: opt.category,
      is_correct: null,
      display_order: opt.order,
    }));
    const { error: oError } = await supabase.from('test_question_options').insert(options);
    if (oError) throw oError;
  }

  console.log('MSDT setup completed: 64 questions inserted.');
}

module.exports = { C, statements, items, validate };

if (require.main === module) {
  setup().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
