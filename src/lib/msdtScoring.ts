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

export const isMsdtName = (name?: string | null) => {
  const upper = String(name || "").toUpperCase();
  return upper.includes("MSDT") || upper.includes("MANAGEMENT STYLE DIAGNOSTIC");
};

export const getMsdtRows = (categories: Record<string, unknown>, totalAnswered = 64) => {
  const getCodeValue = (code: string) => Math.max(0, Number(categories[code] || 0));
  const totalScore = MSDT_CODE_ORDER.reduce((sum, code) => sum + getCodeValue(code), 0);
  const total = totalAnswered > 0 ? totalAnswered : totalScore || 1;
  
  return MSDT_CODE_ORDER.map((code) => {
    const value = getCodeValue(code);
    const pct = Math.round((value / total) * 100);
    const level = pct >= 76 ? "Sangat Tinggi" : pct >= 51 ? "Tinggi" : pct >= 26 ? "Cukup" : "Rendah";
    return { code, value, pct, level, ...MSDT_CODES[code] };
  });
};

export const getMsdtSummaryFactors = (categories: Record<string, unknown>) => {
  const getCodeValue = (code: string) => Math.max(0, Number(categories[code] || 0));
  
  const leadership = (getCodeValue("P") + getCodeValue("D")) / 2;
  const planningOrganizing = (getCodeValue("O") + getCodeValue("C")) / 2;
  const analytical = (getCodeValue("A") + getCodeValue("S")) / 2;
  const executionControl = (getCodeValue("T") + getCodeValue("R")) / 2;
  
  const getFactorLevel = (value: number) => {
    // Convert to percentage (assuming max possible is 64/2 = 32 for 2-code factors)
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

export const buildMsdtInterpretation = (categories: Record<string, unknown>, answered = 64, total = 64) => {
  const rows = getMsdtRows(categories, answered);
  const summaryFactors = getMsdtSummaryFactors(categories);
  const totalScore = rows.reduce((sum, row) => sum + row.value, 0);
  const ranked = [...rows].sort((a, b) => b.pct - a.pct || b.value - a.value || a.code.localeCompare(b.code));
  const dominant = ranked[0];
  const secondary = ranked[1];
  const tertiary = ranked[2];
  const warning = answered !== total || totalScore !== answered
    ? `PERINGATAN VALIDITAS\nProfil MSDT belum lengkap/konsisten. Jawaban tersimpan ${answered}/${total}, total skor kategori ${totalScore}. Interpretasi perlu diverifikasi sebelum dipakai.\n\n`
    : "";

  // Handle case where categories might be empty or invalid
  if (!dominant || !dominant.code) {
    return `PERINGATAN VALIDITAS\nProfil MSDT tidak dapat ditampilkan karena data kategori tidak lengkap atau tidak valid. Pastikan tes MSDT diselesaikan dengan benar (64 soal) dan scoring mapping sudah diatur dengan benar.\n\nCATATAN INTERPRETASI\nMSDT menggambarkan preferensi gaya manajemen, bukan kemampuan mutlak. Hasil perlu dipadukan dengan wawancara, riwayat memimpin tim, observasi perilaku, referensi kerja, dan kebutuhan posisi.`;
  }

  const codeInterpretation: Record<MsdtCode, string> = {
    P: "Peserta cenderung persuasif, komunikatif, mampu mempengaruhi orang lain, dan cocok untuk peran yang membutuhkan negosiasi atau relasi.",
    A: "Peserta cenderung objektif, evaluatif, mampu menilai situasi, dan cocok untuk pekerjaan analisis atau pengambilan keputusan berbasis data.",
    S: "Peserta cenderung mendalami bidang tertentu, fokus pada keahlian teknis, dan cocok untuk posisi spesialis.",
    C: "Peserta cenderung tegas, cepat menyimpulkan, berorientasi pada keputusan, dan cocok untuk pekerjaan yang membutuhkan penyelesaian cepat.",
    D: "Peserta cenderung mampu membimbing, mengembangkan orang lain, dan cocok untuk posisi leadership, supervisor, atau trainer.",
    O: "Peserta cenderung terstruktur, sistematis, mampu mengatur pekerjaan, dan cocok untuk administrasi, operasional, atau koordinasi.",
    T: "Peserta cenderung produktif, fokus pada hasil, target, dan output kerja.",
    R: "Peserta cenderung mengontrol, memastikan aturan berjalan, teliti terhadap kepatuhan, dan cocok untuk audit, compliance, quality control, atau monitoring.",
  };

  const factorTable = summaryFactors.map(f => 
    `${f.name}: ${f.value.toFixed(2)} (${f.level}) - Rumus: ${f.formula} - Kode: ${f.codes.join(", ")}`
  ).join("\n");

  const styleTable = rows.map((row, idx) => 
    `${idx + 1}. ${row.code} - ${row.label}: Skor ${row.value}, Persentase ${row.pct}%, Kategori ${row.level}, Ranking ${ranked.findIndex(r => r.code === row.code) + 1}`
  ).join("\n");

  return `${warning}IDENTITAS PESERTA
- Nama: [Dari data kandidat]
- Posisi yang dilamar: [Dari data kandidat]
- Tanggal tes: [Dari data kandidat]

RINGKASAN HASIL
- Gaya dominan pertama: ${dominant.label} (${dominant.code}) - Skor ${dominant.value}, Persentase ${dominant.pct}%, Kategori ${dominant.level}
- Gaya dominan kedua: ${secondary.label} (${secondary.code}) - Skor ${secondary.value}, Persentase ${secondary.pct}%, Kategori ${secondary.level}
- Gaya dominan ketiga: ${tertiary.label} (${tertiary.code}) - Skor ${tertiary.value}, Persentase ${tertiary.pct}%, Kategori ${tertiary.level}
- Kesimpulan umum: ${codeInterpretation[dominant.code]}

TABEL SKOR 8 GAYA MSDT
${styleTable}

4 FAKTOR RINGKASAN
${factorTable}

INTERPRETASI GAYA DOMINAN
${codeInterpretation[dominant.code]}
Kecocokan peran: ${dominant.suitable}

KESIMPULAN AKHIR
Berdasarkan gaya dominan ${dominant.label}, kandidat menunjukkan kecenderungan yang ${dominant.level} dalam aspek ini. 
Perlu dilakukan penilaian lebih lanjut untuk menentukan tingkat kecocokan dengan posisi yang dilamar (Sangat Sesuai / Sesuai / Dipertimbangkan / Tidak Disarankan).

CATATAN INTERPRETASI
MSDT bukan tes benar-salah. Skoring dilakukan dengan menghitung kecenderungan gaya manajemen berdasarkan kode jawaban yang paling banyak muncul. Interpretasi perlu dipadukan dengan wawancara, observasi perilaku, riwayat kerja, dan kebutuhan posisi sebelum menjadi dasar keputusan seleksi.`;
};
