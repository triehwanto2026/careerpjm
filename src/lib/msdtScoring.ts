export const MSDT_CODE_ORDER = ["P", "A", "S", "C", "D", "O", "T", "R"] as const;

export type MsdtCode = typeof MSDT_CODE_ORDER[number];

export const MSDT_CODES: Record<MsdtCode, { label: string; description: string; strength: string; suitable: string }> = {
  P: {
    label: "Persuader",
    description: "persuasif, komunikatif, mampu mempengaruhi orang lain",
    strength: "cocok untuk peran yang membutuhkan negosiasi atau relasi",
    suitable: "Sales, Marketing, Public Relations, Business Development, Account Management"
  },
  A: {
    label: "Appraiser",
    description: "objektif, evaluatif, mampu menilai situasi",
    strength: "cocok untuk pekerjaan analisis atau pengambilan keputusan berbasis data",
    suitable: "Analyst, Auditor, Quality Control, Research, Data Scientist, Consultant"
  },
  S: {
    label: "Specialist",
    description: "mendalami bidang tertentu, fokus pada keahlian teknis",
    strength: "cocok untuk posisi spesialis",
    suitable: "Technical Specialist, Subject Matter Expert, Engineer, Developer, Scientist"
  },
  C: {
    label: "Concluder",
    description: "tegas, cepat menyimpulkan, berorientasi pada keputusan",
    strength: "cocok untuk pekerjaan yang membutuhkan penyelesaian cepat",
    suitable: "Project Manager, Operations Manager, Crisis Manager, Decision Maker"
  },
  D: {
    label: "Developer",
    description: "mampu membimbing, mengembangkan orang lain",
    strength: "cocok untuk posisi leadership, supervisor, atau trainer",
    suitable: "Manager, Supervisor, Trainer, Coach, HR Manager, Team Lead"
  },
  O: {
    label: "Organizer",
    description: "terstruktur, sistematis, mampu mengatur pekerjaan",
    strength: "cocok untuk administrasi, operasional, atau koordinasi",
    suitable: "Administrator, Operations Coordinator, Project Coordinator, Office Manager"
  },
  T: {
    label: "Producer",
    description: "produktif, fokus pada hasil, target, dan output kerja",
    strength: "berorientasi pada hasil dan pencapaian target",
    suitable: "Production Manager, Sales Manager, Operations Lead, Performance Manager"
  },
  R: {
    label: "Controller",
    description: "mengontrol, memastikan aturan berjalan, teliti terhadap kepatuhan",
    strength: "cocok untuk audit, compliance, quality control, atau monitoring",
    suitable: "Compliance Officer, Auditor, Quality Assurance, Risk Manager, Controller"
  },
};

export const MSDT_STYLE_ORDER = ["Democratic", "Executive", "Autocratic", "Bureaucratic", "Developer", "Human Relations", "Compromiser", "Laissez Faire"] as const;
export type MsdtStyle = typeof MSDT_STYLE_ORDER[number];

export interface MsdtInterpretationRow {
  interpretation_key: string;
  category: string | null;
  min_value: number | null;
  max_value: number | null;
  interpretation_text: string;
  interpretation_text_en?: string | null;
}

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
  Democratic: { label: "Demokratis / Partisipatif", description: "melibatkan bawahan dan membangun keputusan melalui partisipasi", strength: "membangun komitmen dan kolaborasi", risk: "dapat lambat saat keputusan cepat diperlukan" },
  Executive: { label: "Eksekutif / Integratif", description: "menyeimbangkan target, ketegasan, dan perhatian terhadap orang", strength: "mengarah pada hasil sambil menjaga akuntabilitas", risk: "perlu menjaga agar tidak terlalu mengambil kendali akhir" },
  Autocratic: { label: "Otoriter / Direktif", description: "menekankan kontrol, instruksi jelas, tenggat, dan hasil", strength: "efektif pada kondisi mendesak atau tim baru", risk: "dapat menurunkan inisiatif bila terlalu dominan" },
  Bureaucratic: { label: "Birokratis / Berbasis Aturan", description: "menekankan prosedur, aturan, struktur, dan kepatuhan", strength: "menjaga konsistensi dan kontrol risiko", risk: "dapat terasa kaku bila perubahan cepat diperlukan" },
  Developer: { label: "Pengembang / Coaching", description: "berorientasi pada pembinaan dan pertumbuhan bawahan", strength: "membangun kapasitas tim jangka panjang", risk: "bantuan perlu dijaga agar tidak mengambil alih tanggung jawab" },
  "Human Relations": { label: "Relasi Manusia / Harmonis", description: "mengutamakan hubungan personal, penerimaan, dan suasana kerja nyaman", strength: "menciptakan iklim kerja hangat", risk: "dapat menghindari keputusan sulit" },
  Compromiser: { label: "Kompromis / Politis", description: "mencari jalan tengah dan menghindari resistensi", strength: "berguna meredakan konflik", risk: "arah keputusan bisa kurang tegas" },
  "Laissez Faire": { label: "Laissez Faire / Pasif", description: "cenderung melepas kontrol atau minim intervensi", strength: "memberi otonomi pada tim matang", risk: "berisiko menurunkan kontrol, disiplin, dan kualitas" },
};

export const isMsdtName = (name?: string | null) => {
  const upper = String(name || "").toUpperCase();
  return upper.includes("MSDT") || upper.includes("MANAGEMENT STYLE DIAGNOSTIC");
};

export const isMsdtStyleKey = (key?: string | null): key is MsdtStyle =>
  Boolean(key) && MSDT_STYLE_ORDER.includes(key as MsdtStyle);

export const getMsdtRows = (categories: Record<string, unknown>, totalAnswered = 64) => {
  const getStyleValue = (style: MsdtStyle) => Math.max(0, Math.min(MSDT_STYLE_MAX[style], Math.round(Number(categories[style] || 0))));

  return MSDT_STYLE_ORDER.map((style) => {
    const value = getStyleValue(style);
    const max = MSDT_STYLE_MAX[style];
    const pct = Math.round((value / Math.max(1, max)) * 100);
    const level = pct >= 70 ? "Dominan" : pct >= 50 ? "Menonjol" : pct >= 25 ? "Situasional" : "Rendah";
    return { code: style, style, value, pct, level, ...MSDT_STYLES[style] };
  });
};

export const getMsdtInterpretationRows = (
  rows: MsdtInterpretationRow[] = [],
  categories: Record<string, unknown>,
) => {
  const valueFor = (style: string) => Math.max(0, Math.round(Number(categories[style] || 0)));

  return rows.filter((row) => {
    if (!row.interpretation_text?.trim()) return false;
    if (isMsdtStyleKey(row.interpretation_key)) {
      const value = valueFor(row.interpretation_key);
      const min = row.min_value ?? Number.NEGATIVE_INFINITY;
      const max = row.max_value ?? Number.POSITIVE_INFINITY;
      return value >= min && value <= max;
    }
    return true;
  });
};

export const buildMsdtInterpretation = (
  categories: Record<string, unknown>,
  answered = 64,
  total = 64,
  interpretationRows: MsdtInterpretationRow[] = [],
) => {
  const rows = getMsdtRows(categories, answered);
  const totalScore = rows.reduce((sum, row) => sum + row.value, 0);
  const ranked = [...rows].sort((a, b) => b.pct - a.pct || b.value - a.value || a.style.localeCompare(b.style));
  const dominant = ranked[0];
  const secondary = ranked[1];
  const warning = answered !== total || totalScore !== answered
    ? `PERINGATAN VALIDITAS\nProfil MSDT belum lengkap/konsisten. Jawaban ${answered}/${total}, total skor kategori ${totalScore}. Interpretasi perlu diverifikasi sebelum dipakai.\n\n`
    : "";

  if (!dominant || !dominant.style) {
    return `PERINGATAN VALIDITAS\nProfil MSDT tidak dapat ditampilkan karena data kategori tidak lengkap atau tidak valid. Pastikan tes MSDT diselesaikan dengan benar (64 soal) dan scoring mapping sudah diatur dengan benar.\n\nCATATAN INTERPRETASI\nMSDT menggambarkan preferensi gaya manajemen, bukan kemampuan mutlak. Hasil perlu dipadukan dengan wawancara, riwayat memimpin tim, observasi perilaku, referensi kerja, dan kebutuhan posisi.`;
  }

  const managerRows = getMsdtInterpretationRows(interpretationRows, categories);
  const styleText = managerRows
    .filter((row) => isMsdtStyleKey(row.interpretation_key))
    .map((row) => `- ${row.interpretation_key}${row.category ? ` (${row.category})` : ""}: ${row.interpretation_text || row.interpretation_text_en || ""}`);
  const generalText = managerRows
    .filter((row) => !isMsdtStyleKey(row.interpretation_key))
    .map((row) => `- ${row.interpretation_key}${row.category ? ` (${row.category})` : ""}: ${row.interpretation_text || row.interpretation_text_en || ""}`);

  const managerSection = [
    styleText.length > 0 ? `INTERPRETASI MSDT DARI MANAGER\n${styleText.join("\n")}` : "",
    generalText.length > 0 ? `INTERPRETASI UMUM\n${generalText.join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

  const baseInterpretation = `${warning}RINGKASAN PROFIL MSDT
Gaya paling dominan: ${dominant.label} (${dominant.value}/${MSDT_STYLE_MAX[dominant.style]}; ${dominant.pct}%; ${dominant.level}).
Gaya pendukung: ${secondary.label} (${secondary.value}/${MSDT_STYLE_MAX[secondary.style]}; ${secondary.pct}%; ${secondary.level}).

MAKNA UTAMA
Kandidat menunjukkan kecenderungan ${dominant.description}. Kekuatan utama gaya ini adalah ${dominant.strength}. Area yang perlu dijaga: ${dominant.risk}.

KOMBINASI GAYA
Kombinasi ${dominant.label} dengan ${secondary.label} menunjukkan pola kepemimpinan yang perlu dibaca bersama tuntutan jabatan, kematangan tim, tekanan target, serta budaya organisasi.

PROFIL PER GAYA
${rows.map((row) => `- ${row.label} (${row.value}/${MSDT_STYLE_MAX[row.style]}; ${row.pct}%; ${row.level}): ${row.description}. Kekuatan: ${row.strength}. Risiko: ${row.risk}.`).join("\n")}

CATATAN INTERPRETASI
MSDT menggambarkan preferensi gaya manajemen, bukan kemampuan mutlak. Hasil perlu dipadukan dengan wawancara, riwayat memimpin tim, observasi perilaku, riwayat kerja, referensi kerja, dan kebutuhan posisi.`;

  return managerSection ? `${baseInterpretation}

${managerSection}` : baseInterpretation;
};

export const getMsdtSummaryFactors = (categories: Record<string, unknown>) => {
  const getCodeValue = (code: string) => Math.max(0, Number(categories[code] || 0));
  
  const leadership = (getCodeValue("P") + getCodeValue("D")) / 2;
  const planningOrganizing = (getCodeValue("O") + getCodeValue("C")) / 2;
  const analytical = (getCodeValue("A") + getCodeValue("S")) / 2;
  const executionControl = (getCodeValue("T") + getCodeValue("R")) / 2;
  
  const getFactorLevel = (value: number) => {
    const pct = Math.round((value / 32) * 100);
    return pct >= 76 ? "Sangat Tinggi" : pct >= 51 ? "Tinggi" : pct >= 26 ? "Cukup" : "Rendah";
  };
  
  return [
    { name: "Leadership", value: leadership, level: getFactorLevel(leadership), formula: "(P + D) / 2", codes: ["P", "D"] },
    { name: "Planning & Organizing", value: planningOrganizing, level: getFactorLevel(planningOrganizing), formula: "(O + C) / 2", codes: ["O", "C"] },
    { name: "Analytical", value: analytical, level: getFactorLevel(analytical), formula: "(A + S) / 2", codes: ["A", "S"] },
    { name: "Execution & Control", value: executionControl, level: getFactorLevel(executionControl), formula: "(T + R) / 2", codes: ["T", "R"] },
  ];
};
