export const IST_SUBTESTS = [
  { code: "SE", name: "Satzergänzung", max: 20, area: "Pemahaman bahasa dan pengetahuan verbal", domain: "Verbal", insight: "kemampuan memahami makna kalimat, konsep bahasa, dan ketepatan berpikir verbal" },
  { code: "WA", name: "Wortauswahl", max: 20, area: "Asosiasi kata dan abstraksi verbal", domain: "Verbal", insight: "kemampuan menemukan hubungan makna antar kata dan membentuk asosiasi konsep" },
  { code: "AN", name: "Analogien", max: 20, area: "Penalaran analogis", domain: "Verbal", insight: "kemampuan melihat hubungan logis dan menerapkannya pada pola baru" },
  { code: "GE", name: "Gemeinsamkeiten", max: 32, area: "Pembentukan konsep umum", domain: "Verbal", insight: "kemampuan mengelompokkan informasi, membuat generalisasi, dan menangkap kategori konsep" },
  { code: "RA", name: "Rechenaufgaben", max: 20, area: "Pemecahan masalah numerik", domain: "Numerik", insight: "kemampuan berhitung praktis, memahami masalah kuantitatif, dan menjaga ketelitian numerik" },
  { code: "ZR", name: "Zahlenreihen", max: 20, area: "Pola deret angka", domain: "Numerik", insight: "kemampuan mengenali pola, berpikir induktif, dan memprediksi kelanjutan hubungan angka" },
  { code: "FA", name: "Figurenauswahl", max: 20, area: "Analisis bentuk", domain: "Figural", insight: "kemampuan menganalisis komponen bentuk dan menyusun relasi visual" },
  { code: "WU", name: "Würfelaufgaben", max: 20, area: "Daya bayang ruang", domain: "Figural", insight: "kemampuan rotasi mental, visualisasi ruang, dan manipulasi objek secara imajinatif" },
  { code: "ME", name: "Merkaufgaben", max: 20, area: "Daya ingat", domain: "Memori", insight: "kemampuan menyimpan dan mengambil kembali informasi dalam batas waktu tertentu" },
] as const;

const levelFromPct = (pct: number) =>
  pct >= 80 ? "Sangat Baik" : pct >= 60 ? "Baik" : pct >= 40 ? "Cukup" : "Rendah";

const levelDescription = (level: string) => {
  if (level === "Sangat Baik") return "menjadi kekuatan yang sangat menonjol dan dapat mendukung penyelesaian tugas kompleks";
  if (level === "Baik") return "menjadi kekuatan yang cukup stabil untuk mendukung tuntutan kerja di atas rata-rata";
  if (level === "Cukup") return "berada pada taraf fungsional dan masih dipengaruhi konteks, latihan, serta kompleksitas tugas";
  if (level === "Rendah") return "perlu dukungan struktur, instruksi jelas, dan validasi dengan data lain";
  return "perlu dibaca hati-hati serta dikonfirmasi melalui observasi, riwayat pendidikan/kerja, dan tes pendukung";
};

export const isIstName = (name?: string | null) => String(name || "").toUpperCase().includes("IST");

const IST_GROUPING: Record<string, string[]> = {
  Verbal: ["SE", "WA", "AN", "GE"],
  Numerik: ["RA", "ZR"],
  "Figural / Spasial": ["FA", "WU"],
  Memori: ["ME"],
};

export const getIstSubtestScore = (categories: Record<string, unknown>, code: string) => {
  const match = Object.entries(categories || {}).find(([key]) => key === code || key.startsWith(`${code} -`));
  return Number(match?.[1] || 0);
};

export const getIstRows = (categories: Record<string, unknown>) =>
  IST_SUBTESTS.map((subtest) => {
    const raw = getIstSubtestScore(categories, subtest.code);
    const pct = Math.round((raw / subtest.max) * 100);
    const level = levelFromPct(pct);
    return { ...subtest, raw, pct, level, description: levelDescription(level) };
  });

export const validateIstProfile = (categories: Record<string, unknown>) => {
  const rows = getIstRows(categories);
  const raw = rows.reduce((sum, row) => sum + row.raw, 0);
  const max = rows.reduce((sum, row) => sum + row.max, 0);
  
  // Check if all subtests have valid scores (not exceeding max)
  const exceededMax = rows.filter((row) => row.raw > row.max);
  const exceededMaxCodes = exceededMax.map((row) => `${row.code}=${row.raw}/${row.max}`);
  
  // Check if all subtests are present
  const allSubtestsPresent = IST_SUBTESTS.every((subtest) => 
    categories[subtest.code] !== undefined && categories[subtest.code] !== null
  );
  
  // Check if all values are finite
  const invalidCodes = rows.filter((row) => !Number.isFinite(Number(categories[row.code]))).map((row) => row.code);
  
  const valid = exceededMax.length === 0 && allSubtestsPresent && invalidCodes.length === 0;
  
  const errors: string[] = [];
  if (exceededMax.length > 0) errors.push(`Skor melebihi maksimum: ${exceededMaxCodes.join(", ")}`);
  if (!allSubtestsPresent) errors.push(`Beberapa subtes tidak lengkap`);
  if (invalidCodes.length > 0) errors.push(`Skor tidak valid: ${invalidCodes.join(", ")}`);
  
  return { valid, raw, max, errors, exceededMax, allSubtestsPresent, invalidCodes };
};

export const getIstSummary = (categories: Record<string, unknown>, fallbackScore = 0) => {
  const rows = getIstRows(categories);
  const validity = validateIstProfile(categories);
  const raw = validity.raw;
  const max = validity.max;
  const score = max > 0 ? Math.round((raw / max) * 100) : fallbackScore;
  const strongest = [...rows].sort((a, b) => b.pct - a.pct)[0];
  const weakest = [...rows].sort((a, b) => a.pct - b.pct)[0];
  const domainScores = rows.reduce<Record<string, { raw: number; max: number; items: string[] }>>((acc, row) => {
    const item = acc[row.domain] || { raw: 0, max: 0, items: [] };
    item.raw += row.raw;
    item.max += row.max;
    item.items.push(row.code);
    acc[row.domain] = item;
    return acc;
  }, {});
  const domains = Object.entries(domainScores).map(([domain, value]) => ({
    domain,
    raw: value.raw,
    max: value.max,
    pct: value.max > 0 ? Math.round((value.raw / value.max) * 100) : 0,
    items: value.items.join(", "),
  })).sort((a, b) => b.pct - a.pct);

  const groups = Object.entries(IST_GROUPING).map(([group, codes]) => {
    const rawGroup = codes.reduce((sum, code) => sum + getIstSubtestScore(categories, code), 0);
    const maxGroup = codes.reduce((sum, code) => sum + (IST_SUBTESTS.find((sub) => sub.code === code)?.max || 0), 0);
    return {
      group,
      raw: rawGroup,
      max: maxGroup,
      pct: maxGroup > 0 ? Math.round((rawGroup / maxGroup) * 100) : 0,
      items: codes.join(", "),
    };
  });

  return { rows, raw, max, score, strongest, weakest, domains, groups, validity };
};

export const buildIstInterpretation = (categories: Record<string, unknown>, fallbackScore = 0) => {
  const summary = getIstSummary(categories, fallbackScore);
  const { valid, errors } = summary.validity;
  
  // If validation fails, return error message only
  if (!valid) {
    return `SCORING INVALID
${errors.map(err => `- ${err}`).join("\n")}

Interpretasi tidak ditampilkan karena hasil scoring belum valid. Periksa mapping kunci soal, jawaban peserta, dan rumus perhitungan.`;
  }
  
  const overall = levelFromPct(summary.score);
  const domainText = summary.domains.map((item) => `${item.domain} (${item.items}) ${item.raw}/${item.max} atau ${item.pct}%`).join("; ");
  const highRows = summary.rows.filter((row) => row.pct >= 60).sort((a, b) => b.pct - a.pct);
  const lowRows = summary.rows.filter((row) => row.pct < 40).sort((a, b) => a.pct - b.pct);
  
  // Get ability group scores
  const abilityGroups = summary.groups.map((group) => ({
    name: group.group,
    raw: group.raw,
    max: group.max,
    pct: group.pct,
    level: levelFromPct(group.pct),
  }));
  
  const istTotal = summary.score;
  const istTotalLevel = overall;
  
  // Interpretation based on IST Total
  const istTotalInterpretation = istTotal >= 80
    ? "Kategori = Sangat Baik. Rekomendasi = Cocok untuk posisi analitis, profesional, supervisor, atau posisi dengan tuntutan belajar cepat."
    : istTotal >= 60
      ? "Kategori = Baik. Rekomendasi = Cocok untuk pekerjaan administrasi, operasional, teknikal ringan, dan posisi dengan instruksi kerja jelas."
      : istTotal >= 40
        ? "Kategori = Cukup. Rekomendasi = Masih dapat dipertimbangkan untuk pekerjaan rutin dengan arahan dan SOP yang jelas."
        : "Kategori = Rendah. Rekomendasi = Perlu dipertimbangkan kembali untuk posisi yang membutuhkan analisis, kecepatan belajar, dan pemecahan masalah kompleks.";
  
  // Ability group interpretations
  const abilityInterpretations = abilityGroups.map((group) => {
    const interpretation = {
      Verbal: "Peserta mampu memahami instruksi, bahasa, konsep, dan komunikasi dengan baik.",
      Numerik: "Peserta kuat dalam berhitung, logika angka, analisis kuantitatif, dan pekerjaan berbasis data.",
      "Figural / Spasial": "Peserta kuat dalam memahami pola, bentuk, visual-spasial, dan pemecahan masalah non-verbal.",
      Memori: "Peserta mampu mengingat informasi, detail, instruksi, dan materi kerja dengan baik.",
    }[group.name];
    
    return `${group.name}: ${group.raw}/${group.max} (${group.pct}%) - ${group.level}. ${interpretation}`;
  }).join("\n");

  return `STATUS VALIDASI: VALID
Total skor seluruh subtes: ${summary.raw}/${summary.max}

RINGKASAN PROFIL IST
Skor total IST: ${istTotal}% (${istTotalLevel})
${istTotalInterpretation}

TABEL RAW SCORE 9 SUBTES
${summary.rows.map((row) => `${row.code} - ${row.name}: ${row.raw}/${row.max} (${row.pct}%) - ${row.level}`).join("\n")}

KELOMPOK KEMAMPUAN
${abilityInterpretations}

KEKUATAN UTAMA
${highRows.length ? highRows.map((row) => `${row.code} - ${row.name}: ${row.description}.`).join("\n") : "Tidak ada subtes yang menonjol sangat tinggi; profil lebih perlu dibaca dari pola keseimbangan antar aspek."}

AREA PENGEMBANGAN
${lowRows.length ? lowRows.map((row) => `${row.code} - ${row.name}: ${row.description}.`).join("\n") : "Tidak ada area rendah yang menonjol; tetap perhatikan kecocokan dengan tuntutan jabatan spesifik."}

IMPLIKASI KERJA
Profil IST membantu memetakan cara kandidat memahami informasi, menangkap pola, menyelesaikan masalah, mengolah angka, membayangkan bentuk/ruang, dan mengingat informasi. Untuk posisi yang menuntut analisis cepat, ketelitian numerik, abstraksi konsep, atau daya ingat kuat, perhatikan subtes terkait secara khusus, bukan hanya skor total.

CATATAN PSIKOLOG
IST adalah tes kemampuan intelektual, bukan tes kepribadian. Scoring utama berdasarkan jawaban benar dan salah. Interpretasi perlu dipadukan dengan riwayat pendidikan, pengalaman kerja, kompleksitas jabatan, observasi perilaku saat tes, serta hasil asesmen lain. Skor rendah pada satu subtes tidak otomatis menggugurkan kandidat bila tuntutan posisi tidak dominan pada aspek tersebut.

CATATAN IQ
Jika tersedia tabel norma IST, gunakan tabel norma untuk konversi: Raw Score → Standard Score → IQ. Jika tabel norma belum tersedia, tampilkan sebagai "Skor Kemampuan IST" berdasarkan persentase.`;
};
