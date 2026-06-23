import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const envFilePath of ['.env', '.env.local']) {
  if (!fs.existsSync(envFilePath)) continue;
  fs.readFileSync(envFilePath, 'utf8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) return;
    env[key.trim()] = rest.join('=').replace(/['"]+/g, '').trim();
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  || env.SUPABASE_SERVICE_ROLE_KEY
  || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing admin Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, or pass SUPABASE_SERVICE_ROLE_KEY in the shell.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_IST_INSTRUMENT_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';

const answers = new Map([
  [1, 'E'], [2, 'C'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'B'], [7, 'C'], [8, 'A'], [9, 'E'], [10, 'B'],
  [11, 'C'], [12, 'D'], [13, 'D'], [14, 'E'], [15, 'C'], [16, 'A'], [17, 'B'], [18, 'B'], [19, 'C'], [20, 'B'],
  [21, 'B'], [22, 'B'], [23, 'D'], [24, 'C'], [25, 'C'], [26, 'C'], [27, 'C'], [28, 'D'], [29, 'D'], [30, 'A'],
  [31, 'E'], [32, 'A'], [33, 'A'], [34, 'B'], [35, 'C'], [36, 'A'], [37, 'D'], [38, 'E'], [39, 'B'], [40, 'C'],
  [41, 'C'], [42, 'E'], [43, 'D'], [44, 'D'], [45, 'D'], [46, 'A'], [47, 'D'], [48, 'B'], [49, 'E'], [50, 'D'],
  [51, 'C'], [52, 'C'], [53, 'C'], [54, 'C'], [55, 'D'], [56, 'C'], [57, 'C'], [58, 'D'], [59, 'E'], [60, 'E'],
  [61, 'B'], [62, 'C'], [63, 'D'], [64, 'C'], [65, 'A'], [66, 'B'], [67, 'A'], [68, 'B'], [69, 'A'], [70, 'B'],
  [71, 'C'], [72, 'A'], [73, 'A'], [74, 'B'], [75, 'D'], [76, 'A'],
  [77, 35], [78, 280], [79, 205], [80, 26], [81, 30], [82, 70], [83, 45], [84, 50], [85, 84], [86, 78],
  [87, 19], [88, 6], [89, 75], [90, 90], [91, 120], [92, 17], [93, 36], [94, 5], [95, 48], [96, 1],
  [97, 27], [98, 25], [99, 27], [100, 15], [101, 46], [102, 10], [103, 42], [104, 7], [105, 5], [106, 14],
  [107, 8], [108, 14], [109, 45], [110, 63], [111, 12], [112, 80], [113, 14], [114, 12], [115, 63], [116, 10],
  [117, 'A'], [118, 'C'], [119, 'B'], [120, 'A'], [121, 'D'], [122, 'B'], [123, 'C'], [124, 'E'], [125, 'E'], [126, 'D'],
  [127, 'E'], [128, 'B'], [129, 'D'], [130, 'C'], [131, 'B'], [132, 'A'], [133, 'B'], [134, 'D'], [135, 'C'], [136, 'A'],
  [137, 'A'], [138, 'C'], [139, 'D'], [140, 'E'], [141, 'A'], [142, 'C'], [143, 'D'], [144, 'C'], [145, 'E'], [146, 'A'],
  [147, 'B'], [148, 'D'], [149, 'E'], [150, 'B'], [151, 'D'], [152, 'B'], [153, 'A'], [154, 'E'], [155, 'B'], [156, 'C'],
  [157, 'D'], [158, 'E'], [159, 'B'], [160, 'C'], [161, 'A'], [162, 'A'], [163, 'D'], [164, 'E'], [165, 'C'], [166, 'B'],
  [167, 'B'], [168, 'A'], [169, 'E'], [170, 'C'], [171, 'D'], [172, 'B'], [173, 'E'], [174, 'A'], [175, 'C'], [176, 'D'],
]);

const geScoreKey = new Map([
  [61, { bunga: 2, kembang: 2, perdu: 2, 'tumbuh tumbuhan': 1, tangkai: 1, harum: 1, pohon: 0 }],
  [62, { 'alat indera': 2, indera: 2, 'panca indera': 2, organ: 1, 'alat tubuh': 1, kepala: 0 }],
  [63, { hablur: 2, kristal: 2, 'zat arang': 2, berkilauan: 1, mengkilat: 1, bening: 1 }],
  [64, { musim: 2, cuaca: 1, iklim: 0 }],
  [65, { 'pembawa berita': 2, 'alat perhubungan': 2, telekomunikasi: 1, perhubungan: 1, komunikasi: 1 }],
  [66, { 'alat optik': 2, optik: 2, lensa: 1, melihat: 0, alat: 0, 'alat melihat': 0 }],
  [67, { 'alat pencernaan': 2, 'jalan makanan': 1, perut: 1, 'isi perut': 1, 'pencernaan makanan': 1, makanan: 0 }],
  [68, { jumlah: 2, kuantitas: 2, 'jumlah kuantitas': 2, 'penyebut jumlah': 2, 'penyertaan jumlah': 2, mengukur: 1, ukuran: 1, uang: 0 }],
  [69, { bibit: 2, bakal: 2, embrio: 2, 'bibit bakal embrio': 2, 'alat pembiak': 2, 'permulaan penghidupan': 2, sel: 1, pembiakan: 1, pertanian: 0, keturunan: 0 }],
  [70, { simbol: 2, lambang: 2, tanda: 2, 'lambang tanda': 2, nama: 1, 'tanda pengenal': 1, warna: 0 }],
  [71, { makhluk: 2, organism: 2, organisme: 2, 'makhluk organism': 2, 'makhluk hidup': 2, tumbuh: 1, 'ilmu hayat': 1, biologi: 1, hidup: 0, hutan: 0, 'hidup hutan': 0, hayat: 0 }],
  [72, { wadah: 2, 'tempat pengisi': 2, 'wadah tempat pengisi': 2, 'tempat penyimpan': 2, alat: 1, 'tempat sesuatu': 1, 'alat tempat sesuatu': 1, tempat: 1, benda: 1, 'tempat benda': 1, lubang: 0 }],
  [73, { 'pengertian waktu': 2, batas: 2, waktu: 1, lamanya: 1, 'waktu lamanya': 1, masa: 1, saat: 1, 'masa saat': 1, 'kata waktu': 0, buku: 0 }],
  [74, { 'kata sifat': 2, 'kata sifat watak': 2, 'sifat karakter': 2, sifat: 1, uang: 0, karakter: 0, 'uang karakter': 0, watak: 0 }],
  [75, { 'regulator harga': 2, 'pengertian ekonomi': 2, dagang: 1, pembelian: 1, 'dagang pembelian': 1, penjualan: 1, niaga: 1, 'jual beli': 1, 'niaga jual beli': 1, 'lawan kata': 0 }],
  [76, { 'pengertian ruang': 2, 'penyebut ruang': 2, arah: 1, tempat: 1, ruang: 1, 'tempat ruang': 1, 'arah tempat ruang': 1, letak: 1, 'penunjuk tempat': 1, 'letak penunjuk tempat': 1, 'penentuan daerah': 1, daerah: 0, ruangan: 0, 'daerah ruangan': 0, tingkatan: 0, kata: 0, 'tingkatan kata': 0 }],
]);

const geSeedOptions = new Map([
  [61, [{ text: 'Bunga', score: 2 }, { text: 'Kembang', score: 2 }, { text: 'Perdu', score: 2 }, { text: 'Tumbuh-tumbuhan', score: 1 }, { text: 'Tangkai', score: 1 }, { text: 'Harum', score: 1 }, { text: 'Pohon', score: 0 }]],
  [62, [{ text: 'Alat indera', score: 2 }, { text: 'Indera', score: 2 }, { text: 'Panca Indera', score: 2 }, { text: 'Organ', score: 1 }, { text: 'Alat tubuh', score: 1 }, { text: 'Kepala', score: 0 }]],
  [63, [{ text: 'Hablur', score: 2 }, { text: 'Kristal', score: 2 }, { text: 'Zat arang', score: 2 }, { text: 'Berkilauan', score: 1 }, { text: 'Mengkilat', score: 1 }, { text: 'Bening', score: 1 }]],
  [64, [{ text: 'Musim', score: 2 }, { text: 'Cuaca', score: 1 }, { text: 'Iklim', score: 0 }]],
  [65, [{ text: 'Pembawa Berita', score: 2 }, { text: 'Alat Perhubungan', score: 2 }, { text: 'Telekomunikasi', score: 1 }, { text: 'Perhubungan', score: 1 }, { text: 'Komunikasi', score: 1 }]],
  [66, [{ text: 'alat optik', score: 2 }, { text: 'Optik', score: 2 }, { text: 'Lensa', score: 1 }, { text: 'Melihat', score: 0 }, { text: 'alat', score: 0 }, { text: 'Alat Melihat', score: 0 }]],
  [67, [{ text: 'Alat Pencernaan', score: 2 }, { text: 'Jalan Makanan', score: 1 }, { text: 'Perut', score: 1 }, { text: 'Isi Perut', score: 1 }, { text: 'Pencernaan Makanan', score: 1 }, { text: 'Makanan', score: 0 }]],
  [68, [{ text: 'Jumlah/Kuantitas', score: 2 }, { text: 'Penyebut Jumlah', score: 2 }, { text: 'Penyertaan Jumlah', score: 2 }, { text: 'Mengukur', score: 1 }, { text: 'Ukuran', score: 1 }, { text: 'Uang', score: 0 }]],
  [69, [{ text: 'Bibit/bakal/embrio', score: 2 }, { text: 'Alat Pembiak', score: 2 }, { text: 'Permulaan Penghidupan', score: 2 }, { text: 'Sel', score: 1 }, { text: 'Pembiakan', score: 1 }, { text: 'Pertanian', score: 0 }, { text: 'Keturunan', score: 0 }]],
  [70, [{ text: 'Simbol', score: 2 }, { text: 'Lambang', score: 2 }, { text: 'Tanda', score: 2 }, { text: 'Nama', score: 1 }, { text: 'Tanda Pengenal', score: 1 }, { text: 'Warna', score: 0 }]],
  [71, [{ text: 'Makhluk', score: 2 }, { text: 'Organism', score: 2 }, { text: 'Makhluk Hidup', score: 2 }, { text: 'Tumbuh', score: 1 }, { text: 'Ilmu hayat', score: 1 }, { text: 'Biologi', score: 1 }, { text: 'Hidup', score: 0 }, { text: 'Hutan', score: 0 }, { text: 'Hayat', score: 0 }]],
  [72, [{ text: 'Wadah', score: 2 }, { text: 'Tempat pengisi', score: 2 }, { text: 'Tempat Penyimpan', score: 2 }, { text: 'Alat', score: 1 }, { text: 'Tempat sesuatu', score: 1 }, { text: 'Tempat', score: 1 }, { text: 'Benda', score: 1 }, { text: 'Lubang', score: 0 }]],
  [73, [{ text: 'Pengertian Waktu', score: 2 }, { text: 'Batas', score: 2 }, { text: 'Waktu', score: 1 }, { text: 'Lamanya', score: 1 }, { text: 'Masa/saat', score: 1 }, { text: 'Kata Waktu', score: 0 }, { text: 'Buku', score: 0 }]],
  [74, [{ text: 'Kata Sifat - Watak', score: 2 }, { text: 'Sifat Karakter', score: 2 }, { text: 'Sifat', score: 1 }, { text: 'Uang', score: 0 }, { text: 'Karakter', score: 0 }, { text: 'Watak', score: 0 }]],
  [75, [{ text: 'Regulator harga', score: 2 }, { text: 'Pengertian Ekonomi', score: 2 }, { text: 'Dagang', score: 1 }, { text: 'Pembelian', score: 1 }, { text: 'Penjualan', score: 1 }, { text: 'Niaga', score: 1 }, { text: 'Jual beli', score: 1 }, { text: 'Lawan kata', score: 0 }]],
  [76, [{ text: 'Pengertian ruang', score: 2 }, { text: 'Penyebut ruang', score: 2 }, { text: 'Arah', score: 1 }, { text: 'Tempat/ruang', score: 1 }, { text: 'Letak', score: 1 }, { text: 'penunjuk tempat', score: 1 }, { text: 'Penentuan Daerah', score: 1 }, { text: 'Daerah', score: 0 }, { text: 'Ruangan', score: 0 }, { text: 'Tingkatan', score: 0 }, { text: 'Kata', score: 0 }]],
]);

const optionLabel = (idx) => String.fromCharCode(65 + idx);

const getSeedOptions = (questionNumber, answerValue) => {
  const geOptions = geSeedOptions.get(questionNumber);
  if (geOptions) return geOptions.map((option, idx) => ({ ...option, label: optionLabel(idx) }));
  if (questionNumber >= 77 && questionNumber <= 116 && answerValue !== undefined) {
    return [{ label: String(answerValue), text: String(answerValue), score: 1 }];
  }
  return [];
};

const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[–—-]/g, ' ')
  .replace(/\//g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const answerCandidates = (value) => {
  const rawParts = String(value ?? '')
    .split(/[–—/\-]/g)
    .map((part) => normalize(part))
    .filter(Boolean);
  return Array.from(new Set([normalize(value), ...rawParts]));
};

const scoreAnswer = (scoreKey, value) => {
  const scores = answerCandidates(value)
    .map((candidate) => scoreKey[candidate])
    .filter((score) => score !== undefined);
  return scores.length > 0 ? Math.max(...scores) : 0;
};

async function resolveIstInstrumentId() {
  const configuredId = process.env.IST_INSTRUMENT_ID || env.IST_INSTRUMENT_ID;
  if (configuredId) return configuredId;

  const { data, error } = await supabase
    .from('test_questions')
    .select('instrument_id, question_text')
    .eq('question_number', 61)
    .ilike('question_text', '%mawar%')
    .limit(1);

  if (!error && data?.[0]?.instrument_id) return data[0].instrument_id;

  return DEFAULT_IST_INSTRUMENT_ID;
}

async function main() {
  const instrumentId = await resolveIstInstrumentId();
  console.log('Updating IST answer keys for instrument', instrumentId);

  for (const [questionNumber, answerValue] of answers.entries()) {
    const { data: questions, error: questionError } = await supabase
      .from('test_questions')
      .select('id, question_number')
      .eq('instrument_id', instrumentId)
      .eq('question_number', questionNumber)
      .limit(1);

    if (questionError) {
      console.error(`Failed to fetch question ${questionNumber}:`, questionError.message || questionError);
      continue;
    }

    const question = questions?.[0];
    if (!question) {
      console.warn(`Question ${questionNumber} not found, skipping.`);
      continue;
    }

    const qid = question.id;
    if (questionNumber >= 61 && questionNumber <= 76) {
      const { error: typeError } = await supabase
        .from('test_questions')
        .update({ question_type: 'text', scoring_rule: 'correct_only', subtest_code: 'GE' })
        .eq('id', qid);
      if (typeError) {
        console.error(`Failed to update question ${questionNumber} to text/essay:`, typeError.message || typeError);
      }
    }

    let { data: options, error: optionsError } = await supabase
      .from('test_question_options')
      .select('id, option_label, option_text')
      .eq('question_id', qid);

    if (optionsError) {
      console.error(`Failed to fetch options for question ${questionNumber}:`, optionsError.message || optionsError);
      continue;
    }

    const seedOptions = getSeedOptions(questionNumber, answerValue);
    const missingSeedOptions = seedOptions.filter((option) => (
      !(options || []).some((existing) => normalize(existing.option_text) === normalize(option.text))
    ));

    if (missingSeedOptions.length > 0) {
      if (seedOptions.length === 0) {
        console.warn(`No options found for question ${questionNumber}.`);
        continue;
      }

      const rowsToInsert = missingSeedOptions.map((option, idx) => ({
        question_id: qid,
        option_label: option.label || optionLabel(idx),
        option_text: option.text,
        option_text_en: option.text,
        score_value: option.score,
        is_correct: option.score > 0,
        display_order: (options || []).length + idx,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('test_question_options')
        .insert(rowsToInsert)
        .select('id, option_label, option_text');

      if (insertError) {
        console.error(`Failed to create options for question ${questionNumber}:`, insertError.message || insertError);
        continue;
      }

      options = [...(options || []), ...(inserted || [])];
      console.log(`Question ${questionNumber} created ${options.length} options.`);
    } else if (!options || options.length === 0) {
      console.warn(`No options found for question ${questionNumber}.`);
      continue;
    }

    const scoreKey = geScoreKey.get(questionNumber);
    if (scoreKey) {
      for (const opt of options) {
        const scoreValue = scoreAnswer(scoreKey, opt.option_text);
        const { error } = await supabase
          .from('test_question_options')
          .update({ is_correct: scoreValue > 0, score_value: scoreValue > 0 ? 1 : 0 })
          .eq('id', opt.id);
        if (error) {
          console.error(`Failed to update option ${opt.id} for question ${questionNumber}:`, error.message || error);
        }
      }
      console.log(`Question ${questionNumber} updated with GE score key.`);
      continue;
    }

    const isLabelAnswer = typeof answerValue === 'string';
    let matchedOption = null;

    if (isLabelAnswer) {
      matchedOption = options.find((opt) => normalize(opt.option_label) === normalize(answerValue));
    } else {
      matchedOption = options.find((opt) => normalize(opt.option_text) === normalize(answerValue) || normalize(opt.option_label) === normalize(answerValue));
    }

    if (!matchedOption) {
      console.warn(`No matching option found for question ${questionNumber} with answer ${answerValue}.`);
    }

    const updates = options.map((opt) => ({
      id: opt.id,
      is_correct: matchedOption ? opt.id === matchedOption.id : false,
      score_value: matchedOption ? (opt.id === matchedOption.id ? 1 : 0) : 0,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('test_question_options')
        .update({ is_correct: update.is_correct, score_value: update.score_value })
        .eq('id', update.id);
      if (error) {
        console.error(`Failed to update option ${update.id} for question ${questionNumber}:`, error.message || error);
      }
    }

    console.log(`Question ${questionNumber} updated${matchedOption ? ` (matched option ${matchedOption.option_label})` : ''}.`);
  }

  console.log('IST answer key update completed.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
