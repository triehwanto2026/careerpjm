export const MSDT_STYLE_ORDER = [
  "Democratic",
  "Executive",
  "Autocratic",
  "Bureaucratic",
  "Developer",
  "Human Relations",
  "Compromiser",
  "Laissez Faire",
] as const;

export type MsdtStyle = typeof MSDT_STYLE_ORDER[number];

export const MSDT_STYLE_MAX: Record<MsdtStyle, number> = {
  Democratic: 10,
  Executive: 14,
  Autocratic: 17,
  Bureaucratic: 20,
  Developer: 14,
  "Human Relations": 18,
  Compromiser: 21,
  "Laissez Faire": 14,
};

export const MSDT_STYLES: Record<MsdtStyle, { label: string; description: string; strength: string; risk: string }> = {
  Democratic: {
    label: "Demokratis / Partisipatif",
    description: "melibatkan bawahan, membuka ruang diskusi, dan membangun keputusan melalui partisipasi",
    strength: "baik untuk membangun komitmen, rasa memiliki, dan kolaborasi tim",
    risk: "dapat lambat bila situasi membutuhkan keputusan cepat",
  },
  Executive: {
    label: "Eksekutif / Integratif",
    description: "menyeimbangkan pencapaian tugas, ketegasan keputusan, dan perhatian terhadap orang",
    strength: "kuat untuk mengarahkan tim pada target sambil menjaga akuntabilitas",
    risk: "perlu menjaga agar tidak terlalu banyak mengambil kendali akhir",
  },
  Autocratic: {
    label: "Otoriter / Direktif",
    description: "menekankan kontrol, instruksi jelas, tenggat, dan pencapaian hasil",
    strength: "efektif untuk kondisi mendesak, tim baru, atau pekerjaan yang membutuhkan kepastian arah",
    risk: "berpotensi menurunkan inisiatif dan keterbukaan bawahan bila terlalu dominan",
  },
  Bureaucratic: {
    label: "Birokratis / Berbasis Aturan",
    description: "menekankan prosedur, aturan, struktur, data formal, dan kepatuhan organisasi",
    strength: "membantu konsistensi, ketertiban, dan kontrol risiko operasional",
    risk: "dapat terasa kaku dan kurang adaptif bila perubahan cepat diperlukan",
  },
  Developer: {
    label: "Pengembang / Coaching",
    description: "berorientasi pada pembinaan, pengembangan kemampuan, bantuan, dan pertumbuhan bawahan",
    strength: "baik untuk membangun kapasitas tim dan loyalitas jangka panjang",
    risk: "perlu menjaga batas agar bantuan tidak berubah menjadi mengambil alih tanggung jawab",
  },
  "Human Relations": {
    label: "Relasi Manusia / Harmonis",
    description: "mengutamakan kenyamanan, hubungan personal, penerimaan, dan suasana kerja yang menyenangkan",
    strength: "menciptakan iklim kerja hangat dan mendukung komunikasi informal",
    risk: "dapat menghindari konfrontasi atau keputusan sulit bila harmoni terlalu diutamakan",
  },
  Compromiser: {
    label: "Kompromis / Politis",
    description: "mencari jalan tengah, menghindari resistensi, dan menyesuaikan posisi dengan penerimaan orang lain",
    strength: "berguna untuk meredakan konflik dan menjaga dukungan lintas pihak",
    risk: "arah keputusan bisa kurang tegas bila terlalu fokus pada penerimaan",
  },
  "Laissez Faire": {
    label: "Laissez Faire / Pasif",
    description: "cenderung melepas kontrol, membiarkan masalah berjalan sendiri, atau minim intervensi",
    strength: "memberi ruang otonomi pada anggota tim yang sangat matang",
    risk: "berisiko menurunkan kontrol, disiplin, dan kualitas bila tim masih membutuhkan arahan",
  },
};

export const isMsdtName = (name?: string | null) => {
  const upper = String(name || "").toUpperCase();
  return upper.includes("MSDT") || upper.includes("MANAGEMENT STYLE DIAGNOSTIC");
};

export const getMsdtRows = (categories: Record<string, unknown>) =>
  MSDT_STYLE_ORDER.map((style) => {
    const value = Math.max(0, Number(categories[style] || 0));
    const max = MSDT_STYLE_MAX[style] || 1;
    const pct = Math.round((value / max) * 100);
    const level = pct >= 70 ? "Dominan" : pct >= 50 ? "Menonjol" : pct >= 25 ? "Situasional" : "Rendah";
    return { style, value, pct, level, ...MSDT_STYLES[style] };
  });

export const buildMsdtInterpretation = (categories: Record<string, unknown>, answered = 64, total = 64) => {
  const rows = getMsdtRows(categories);
  const totalScore = rows.reduce((sum, row) => sum + row.value, 0);
  const ranked = [...rows].sort((a, b) => b.pct - a.pct || b.value - a.value || a.style.localeCompare(b.style));
  const dominant = ranked[0];
  const secondary = ranked[1];
  const warning = answered !== total || totalScore !== answered
    ? `PERINGATAN VALIDITAS\nProfil MSDT belum lengkap/konsisten. Jawaban tersimpan ${answered}/${total}, total skor kategori ${totalScore}. Interpretasi perlu diverifikasi sebelum dipakai.\n\n`
    : "";

  return `${warning}RINGKASAN PROFIL MSDT
Gaya paling dominan: ${dominant.label} (${dominant.value}/${MSDT_STYLE_MAX[dominant.style]}; ${dominant.pct}%; ${dominant.level}).
Gaya pendukung: ${secondary.label} (${secondary.value}/${MSDT_STYLE_MAX[secondary.style]}; ${secondary.pct}%; ${secondary.level}).

MAKNA UTAMA
Kandidat menunjukkan kecenderungan ${dominant.description}. Kekuatan utama gaya ini adalah ${dominant.strength}. Area yang perlu dijaga: ${dominant.risk}.

KOMBINASI GAYA
Kombinasi ${dominant.label} dengan ${secondary.label} menunjukkan pola kepemimpinan yang perlu dibaca bersama tuntutan jabatan, kematangan tim, tekanan target, serta budaya organisasi.

PROFIL PER GAYA
${rows.map((row) => `- ${row.label} (${row.value}/${MSDT_STYLE_MAX[row.style]}; ${row.pct}%; ${row.level}): ${row.description}. Kekuatan: ${row.strength}. Risiko: ${row.risk}.`).join("\n")}

CATATAN INTERPRETASI
MSDT menggambarkan preferensi gaya manajemen, bukan kemampuan mutlak. Hasil perlu dipadukan dengan wawancara, riwayat memimpin tim, observasi perilaku, referensi kerja, dan kebutuhan posisi.`;
};
