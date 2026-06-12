export const IST_SUBTESTS = [
  { code: "SE", name: "Sentence Completion", max: 20, area: "Pemahaman bahasa dan pengetahuan verbal", domain: "Verbal", insight: "kemampuan memahami makna kalimat, konsep bahasa, dan ketepatan berpikir verbal" },
  { code: "WA", name: "Word Association", max: 20, area: "Asosiasi kata dan abstraksi verbal", domain: "Verbal", insight: "kemampuan menemukan hubungan makna antar kata dan membentuk asosiasi konsep" },
  { code: "AN", name: "Analogy", max: 20, area: "Penalaran analogis", domain: "Verbal-Logis", insight: "kemampuan melihat hubungan logis dan menerapkannya pada pola baru" },
  { code: "GE", name: "Generalization", max: 32, area: "Pembentukan konsep umum", domain: "Konseptual", insight: "kemampuan mengelompokkan informasi, membuat generalisasi, dan menangkap kategori konsep" },
  { code: "RA", name: "Arithmetic", max: 20, area: "Pemecahan masalah numerik", domain: "Numerik", insight: "kemampuan berhitung praktis, memahami masalah kuantitatif, dan menjaga ketelitian numerik" },
  { code: "ZR", name: "Number Series", max: 20, area: "Pola deret angka", domain: "Numerik-Logis", insight: "kemampuan mengenali pola, berpikir induktif, dan memprediksi kelanjutan hubungan angka" },
  { code: "FA", name: "Figure Assembly", max: 20, area: "Analisis bentuk", domain: "Figural", insight: "kemampuan menganalisis komponen bentuk dan menyusun relasi visual" },
  { code: "WU", name: "Cube Rotation", max: 20, area: "Daya bayang ruang", domain: "Spasial", insight: "kemampuan rotasi mental, visualisasi ruang, dan manipulasi objek secara imajinatif" },
  { code: "ME", name: "Memory", max: 20, area: "Daya ingat", domain: "Memori", insight: "kemampuan menyimpan dan mengambil kembali informasi dalam batas waktu tertentu" },
] as const;

const levelFromPct = (pct: number) =>
  pct >= 80 ? "Sangat Tinggi" : pct >= 65 ? "Tinggi" : pct >= 45 ? "Sedang" : pct >= 30 ? "Rendah" : "Sangat Rendah";

const levelDescription = (level: string) => {
  if (level === "Sangat Tinggi") return "menjadi kekuatan yang sangat menonjol dan dapat mendukung penyelesaian tugas kompleks";
  if (level === "Tinggi") return "menjadi kekuatan yang cukup stabil untuk mendukung tuntutan kerja di atas rata-rata";
  if (level === "Sedang") return "berada pada taraf fungsional dan masih dipengaruhi konteks, latihan, serta kompleksitas tugas";
  if (level === "Rendah") return "perlu dukungan struktur, instruksi jelas, dan validasi dengan data lain";
  return "perlu dibaca hati-hati serta dikonfirmasi melalui observasi, riwayat pendidikan/kerja, dan tes pendukung";
};

export const isIstName = (name?: string | null) => String(name || "").toUpperCase().includes("IST");

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

export const getIstSummary = (categories: Record<string, unknown>, fallbackScore = 0) => {
  const rows = getIstRows(categories);
  const raw = Number(categories["IST Raw Score"] ?? rows.reduce((sum, row) => sum + row.raw, 0));
  const max = Number(categories["IST Max Score"] ?? rows.reduce((sum, row) => sum + row.max, 0));
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
  return { rows, raw, max, score, strongest, weakest, domains };
};

export const buildIstInterpretation = (categories: Record<string, unknown>, fallbackScore = 0) => {
  const summary = getIstSummary(categories, fallbackScore);
  const overall = levelFromPct(summary.score).toLowerCase();
  const domainText = summary.domains.map((item) => `${item.domain} (${item.items}) ${item.raw}/${item.max} atau ${item.pct}%`).join("; ");
  const highRows = summary.rows.filter((row) => row.pct >= 65).sort((a, b) => b.pct - a.pct);
  const lowRows = summary.rows.filter((row) => row.pct < 45).sort((a, b) => a.pct - b.pct);

  return `Skor total IST kandidat adalah ${summary.raw}/${summary.max} (${summary.score}%), berada pada kategori ${overall}.

Insight umum:
Hasil ini menggambarkan struktur kemampuan intelektual kandidat pada aspek verbal, konseptual, numerik, figural-spasial, dan memori. Kekuatan relatif paling menonjol terdapat pada ${summary.strongest.code} - ${summary.strongest.name} (${summary.strongest.raw}/${summary.strongest.max}; ${summary.strongest.level}), yang menunjukkan ${summary.strongest.insight}. Area yang perlu diperhatikan adalah ${summary.weakest.code} - ${summary.weakest.name} (${summary.weakest.raw}/${summary.weakest.max}; ${summary.weakest.level}), yang berkaitan dengan ${summary.weakest.insight}.

Profil domain:
${domainText}.

Kekuatan utama:
${highRows.length ? highRows.map((row) => `${row.code} - ${row.name}: ${row.description}.`).join("\n") : "Tidak ada subtes yang menonjol sangat tinggi; profil lebih perlu dibaca dari pola keseimbangan antar aspek."}

Area pengembangan:
${lowRows.length ? lowRows.map((row) => `${row.code} - ${row.name}: ${row.description}.`).join("\n") : "Tidak ada area rendah yang menonjol; tetap perhatikan kecocokan dengan tuntutan jabatan spesifik."}

Implikasi kerja:
Profil IST membantu memetakan cara kandidat memahami informasi, menangkap pola, menyelesaikan masalah, mengolah angka, membayangkan bentuk/ruang, dan mengingat informasi. Untuk posisi yang menuntut analisis cepat, ketelitian numerik, abstraksi konsep, atau daya ingat kuat, perhatikan subtes terkait secara khusus, bukan hanya skor total.

Catatan psikolog:
IST adalah gambaran kemampuan pada saat tes dan perlu dipadukan dengan riwayat pendidikan, pengalaman kerja, kompleksitas jabatan, observasi perilaku saat tes, serta hasil asesmen lain. Skor rendah pada satu subtes tidak otomatis menggugurkan kandidat bila tuntutan posisi tidak dominan pada aspek tersebut.`;
};
