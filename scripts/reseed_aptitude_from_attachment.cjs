const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const env = {};
fs.readFileSync(".env", "utf8").split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").replace(/["']/g, "").trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const sourceSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260615111500_seed_attached_aptitude_questions.sql"),
  "utf8",
);
const questions = JSON.parse(sourceSql.match(/questions JSONB := \$json\$\n([\s\S]*?)\n\$json\$::JSONB;/)[1]);

const answerKey = {
  1: "B", 2: "E", 3: "D", 4: "C", 5: "B", 6: "B", 7: "E", 8: "E", 9: "C", 10: "C",
  11: "C", 12: "B", 13: "D", 14: "E", 15: "H", 16: "D", 17: "B", 18: "D", 19: "D", 20: "D",
  21: "D", 22: "B", 23: "C", 24: "B", 25: "B", 26: "B", 27: "E", 28: "C", 29: "D", 30: "E",
  31: "D", 32: "C", 33: "C", 34: "C", 35: "B", 36: "D", 37: "B", 38: "D", 39: "D", 40: "C",
  41: "D", 42: "B", 43: "E", 44: "A", 45: "B", 46: "D", 47: "D", 48: "C", 49: "E", 50: "B",
  51: "C", 52: "B", 53: "B", 54: "H", 55: "C", 56: "A", 57: "E", 58: "C", 59: "C", 60: "D",
};

const textOverrides = {
  3: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  5: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  10: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?",
  13: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
  17: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  22: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
  25: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?",
  27: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  30: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  35: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  37: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?",
  39: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?",
  41: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?",
  43: "Which one of the five designs makes the best comparison? Jika tangan adalah sarung tangan, maka kaki/telapak kaki adalah:",
  46: "Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar-gambar ini?",
  49: "Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar-gambar ini?",
  51: "Mana gambar yang paling mengikuti logika dari diagram di bawah ini?",
  57: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
  59: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?",
};

const imageQuestions = new Set(Object.keys(textOverrides).map(Number));

const specialOptions = {
  15: [["A", "9"], ["B", "7"], ["C", "8"], ["D", "6"], ["E", "7"], ["F", "5"], ["G", "6"], ["H", "3"]],
};

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, max = 72) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > max) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines;
}

function figureSvg(q) {
  const width = 1180;
  const height = 520;
  const options = (specialOptions[q.n] || q.options).map(([label, text]) => `${label}. ${text}`).join("    ");
  const lines = wrapText(textOverrides[q.n] || q.text, 86);
  const optionLines = wrapText(options, 95);
  const primitives = {
    3: `<polygon points="210,135 240,80 270,135 240,190" fill="none" stroke="#111" stroke-width="3"/><line x1="210" y1="135" x2="270" y2="135" stroke="#111" stroke-width="2"/><rect x="420" y="105" width="150" height="80" fill="none" stroke="#111" stroke-width="3"/><line x1="495" y1="105" x2="495" y2="185" stroke="#111" stroke-width="3"/><rect x="755" y="80" width="80" height="150" fill="none" stroke="#111" stroke-width="3"/><line x1="755" y1="155" x2="835" y2="155" stroke="#111" stroke-width="3"/>`,
    57: `<circle cx="210" cy="145" r="58" fill="none" stroke="#111" stroke-width="3"/><ellipse cx="210" cy="145" rx="17" ry="24" fill="none" stroke="#111" stroke-width="3"/><rect x="385" y="85" width="82" height="115" fill="#050505"/><rect x="423" y="125" width="14" height="20" fill="#fff"/><circle cx="660" cy="145" r="58" fill="#050505"/><circle cx="660" cy="145" r="17" fill="#fff"/>`,
    59: `<rect x="170" y="105" width="90" height="90" fill="none" stroke="#111" stroke-width="3"/><rect x="400" y="98" width="96" height="96" fill="none" stroke="#111" stroke-width="3"/><line x1="448" y1="98" x2="448" y2="194" stroke="#111" stroke-width="3"/><line x1="400" y1="146" x2="496" y2="146" stroke="#111" stroke-width="3"/><polygon points="725,80 655,205 795,205" fill="none" stroke="#111" stroke-width="3"/>`,
  };
  const main = primitives[q.n] || `<rect x="155" y="95" width="840" height="165" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="2"/><text x="575" y="160" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#111">Gambar soal nomor ${q.n}</text><text x="575" y="205" text-anchor="middle" font-family="Arial" font-size="24" fill="#475569">Direkonstruksi dari lampiran user</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="42" y="52" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#111">${q.n}. ${esc(lines[0] || "")}</text>
  ${lines.slice(1).map((line, i) => `<text x="82" y="${90 + i * 32}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#111">${esc(line)}</text>`).join("")}
  <text x="80" y="145" font-family="Arial" font-size="28" fill="#111">Jika</text>
  <text x="310" y="145" font-family="Arial" font-size="28" fill="#111">adalah</text>
  <text x="570" y="145" font-family="Arial" font-size="28" fill="#111">maka</text>
  <text x="850" y="145" font-family="Arial" font-size="28" fill="#111">adalah</text>
  ${main}
  <line x1="50" y1="300" x2="1130" y2="300" stroke="#e5e7eb" stroke-width="2"/>
  ${optionLines.map((line, i) => `<text x="70" y="${350 + i * 34}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#111">${esc(line)}</text>`).join("")}
</svg>`;
}

async function ensureBucket() {
  const { error } = await supabase.storage.createBucket("test-images", { public: true });
  if (error && !/already exists|Duplicate/i.test(error.message)) {
    console.warn("Bucket create warning:", error.message);
  }
}

async function uploadSvg(q) {
  const filename = `aptitude/aptitude-q${String(q.n).padStart(2, "0")}.svg`;
  const svg = figureSvg(q);
  const { error } = await supabase.storage
    .from("test-images")
    .upload(filename, Buffer.from(svg), { upsert: true, contentType: "image/svg+xml", cacheControl: "3600" });
  if (error) throw new Error(`Upload ${filename}: ${error.message}`);
  return supabase.storage.from("test-images").getPublicUrl(filename).data.publicUrl;
}

function aptitudeInterpretations(instrumentId) {
  const overall = [
    ["overall_score", "Kecerdasan di bawah rata-rata", 0, 84, "Estimasi IQ aptitude berada di bawah rata-rata. Kandidat cenderung membutuhkan instruksi konkret, pembelajaran bertahap, contoh kerja yang jelas, dan pendampingan lebih intensif pada tugas yang menuntut penalaran baru."],
    ["overall_score", "Kecerdasan rata-rata", 85, 99, "Estimasi IQ aptitude berada pada rentang rata-rata. Kandidat umumnya mampu memahami instruksi dan menyelesaikan tugas standar, terutama bila tujuan, prosedur, dan prioritas kerja dijelaskan dengan jelas."],
    ["overall_score", "Kecerdasan di atas rata-rata", 100, 114, "Estimasi IQ aptitude berada di atas rata-rata. Kandidat menunjukkan kapasitas belajar dan penalaran praktis yang baik untuk memahami konsep baru, membandingkan informasi, dan menyelesaikan masalah kerja rutin hingga menengah."],
    ["overall_score", "Kecerdasan tinggi", 115, 129, "Estimasi IQ aptitude berada pada rentang tinggi. Kandidat cenderung cepat menangkap pola, memahami instruksi kompleks, dan menyusun solusi secara lebih mandiri pada situasi kerja yang berubah."],
    ["overall_score", "Kecerdasan superior", 130, 144, "Estimasi IQ aptitude berada pada rentang superior. Kandidat menunjukkan kemampuan penalaran umum, pemecahan masalah, dan integrasi informasi yang kuat untuk tuntutan kerja analitis dan kompleks."],
    ["overall_score", "Sangat berbakat", 145, 200, "Estimasi IQ aptitude berada pada rentang sangat berbakat. Kandidat berpotensi sangat cepat memahami struktur baru, menemukan pola abstrak, dan menyelesaikan masalah kompleks dengan ketelitian tinggi."],
    ["selection_recommendation", "Perlu Pertimbangan", 0, 84, "Perlu pertimbangan kuat melalui wawancara, simulasi kerja, dan bukti pengalaman. Lebih sesuai untuk peran dengan prosedur jelas, risiko kesalahan rendah, serta dukungan supervisi memadai."],
    ["selection_recommendation", "Cukup Disarankan", 85, 99, "Cukup disarankan untuk peran operasional atau administratif standar, terutama bila pengalaman kerja, motivasi, dan hasil wawancara mendukung kebutuhan jabatan."],
    ["selection_recommendation", "Disarankan", 100, 114, "Disarankan untuk peran yang membutuhkan pembelajaran cukup cepat, analisis praktis, dan pemecahan masalah rutin hingga menengah."],
    ["selection_recommendation", "Disarankan", 115, 129, "Disarankan untuk peran yang membutuhkan penalaran cepat, adaptasi terhadap instruksi kompleks, dan pengambilan keputusan berbasis informasi."],
    ["selection_recommendation", "Sangat Disarankan", 130, 144, "Sangat disarankan untuk peran yang menuntut kemampuan analitis, adaptasi cepat, pemetaan masalah, dan penyelesaian tugas kompleks."],
    ["selection_recommendation", "Sangat Disarankan", 145, 200, "Sangat disarankan untuk peran strategis atau analitis kompleks, dengan tetap memvalidasi kesesuaian perilaku kerja, motivasi, komunikasi, dan pengalaman."],
    ["scoring_note", "Standar Skoring", 0, 200, "Skoring menggunakan correct-only: setiap jawaban benar bernilai 1, salah/kosong bernilai 0. Raw score 0-60 dikonversi menjadi estimasi IQ untuk laporan hasil. Waktu pengerjaan 60 menit."],
  ];
  return overall.map(([interpretation_key, category, min_value, max_value, interpretation_text]) => ({
    instrument_id: instrumentId,
    interpretation_key,
    category,
    min_value,
    max_value,
    interpretation_text,
  }));
}

async function main() {
  await ensureBucket();

  const { data: existing, error: findError } = await supabase
    .from("test_instruments")
    .select("id")
    .ilike("name", "%aptitude%")
    .maybeSingle();
  if (findError) throw findError;

  let instrumentId = existing?.id;
  const instrumentPayload = {
    name: "APTITUDE TEST",
    name_en: "Aptitude Test",
    description: "Tes kemampuan kognitif umum 60 soal berdasarkan lampiran user. Mengukur verbal, numerik, logika, klasifikasi, pola, dan penalaran gambar.",
    category: "Aptitude",
    scoring_method: "correct_only",
    target_audience: "Kandidat/Pelamar kerja",
    norm_reference: "User provided aptitude attachment - 60 items / 60 minutes",
    question_count: 60,
    duration_minutes: 60,
    is_active: true,
  };

  if (instrumentId) {
    const { error } = await supabase.from("test_instruments").update(instrumentPayload).eq("id", instrumentId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("test_instruments").insert(instrumentPayload).select("id").single();
    if (error) throw error;
    instrumentId = data.id;
  }

  const { data: oldQuestions } = await supabase.from("test_questions").select("id").eq("instrument_id", instrumentId);
  const oldIds = (oldQuestions || []).map((q) => q.id);
  if (oldIds.length) {
    await supabase.from("test_question_options").delete().in("question_id", oldIds);
    await supabase.from("test_questions").delete().eq("instrument_id", instrumentId);
  }
  await supabase.from("test_interpretations").delete().eq("instrument_id", instrumentId);

  let inserted = 0;
  let images = 0;
  for (const q of questions) {
    const n = Number(q.n);
    const opts = specialOptions[n] || q.options;
    const correct = answerKey[n];
    const questionImage = imageQuestions.has(n) ? await uploadSvg(q) : null;
    if (questionImage) images += 1;

    const { data: question, error: qError } = await supabase
      .from("test_questions")
      .insert({
        instrument_id: instrumentId,
        question_number: n,
        question_text: textOverrides[n] || q.text,
        question_text_en: null,
        category: q.cat,
        question_type: "single_choice",
        scoring_rule: "correct_only",
        question_image: questionImage,
        options_image: null,
      })
      .select("id")
      .single();
    if (qError) throw qError;

    const optionRows = opts.map(([label, text], index) => ({
      question_id: question.id,
      option_label: label,
      option_text: text,
      option_text_en: null,
      score_value: label === correct ? 1 : 0,
      category_target: q.cat,
      is_correct: label === correct,
      display_order: index,
    }));
    const { error: oError } = await supabase.from("test_question_options").insert(optionRows);
    if (oError) throw oError;
    inserted += 1;
  }

  const { error: iError } = await supabase.from("test_interpretations").insert(aptitudeInterpretations(instrumentId));
  if (iError) throw iError;

  console.log(`Aptitude reseed complete: ${inserted} questions, ${images} SVG images, ${Object.keys(answerKey).length} answer keys.`);
  console.log(`Instrument ID: ${instrumentId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
