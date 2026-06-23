export const IST_SUBTESTS = [
  { code: "SE", name: "Satzergänzung", max: 20, area: "Pemahaman bahasa dan pengetahuan verbal", domain: "Verbal", insight: "kemampuan memahami makna kalimat, konsep bahasa, dan ketepatan berpikir verbal" },
  { code: "WA", name: "Wortauswahl", max: 20, area: "Asosiasi kata dan abstraksi verbal", domain: "Verbal", insight: "kemampuan menemukan hubungan makna antar kata dan membentuk asosiasi konsep" },
  { code: "AN", name: "Analogien", max: 20, area: "Penalaran analogis", domain: "Verbal", insight: "kemampuan melihat hubungan logis dan menerapkannya pada pola baru" },
  { code: "GE", name: "Gemeinsamkeiten", max: 16, area: "Pembentukan konsep umum", domain: "Verbal", insight: "kemampuan mengelompokkan informasi, membuat generalisasi, dan menangkap kategori konsep" },
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
  const score = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.pct, 0) / rows.length) : fallbackScore;
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
    const subtestPcts = codes.map((code) => {
      const subtest = IST_SUBTESTS.find((sub) => sub.code === code);
      const max = subtest?.max || 0;
      return max > 0 ? Math.round((getIstSubtestScore(categories, code) / max) * 100) : 0;
    });
    return {
      group,
      raw: rawGroup,
      max: maxGroup,
      pct: subtestPcts.length > 0 ? Math.round(subtestPcts.reduce((sum, pct) => sum + pct, 0) / subtestPcts.length) : 0,
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
  const highRows = [...summary.rows].sort((a, b) => b.pct - a.pct).slice(0, 3);
  const lowRows = [...summary.rows].sort((a, b) => a.pct - b.pct).slice(0, 3);

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

  // Detailed interpretation based on IST Total
  const getIstTotalDetail = (score: number) => {
    if (score >= 80) {
      return `Kemampuan intelektual sangat baik. Kandidat memiliki potensi tinggi untuk:
• Belajar cepat dan menyerap informasi baru dengan efisien
• Memecahkan masalah kompleks secara analitis dan sistematis
• Beradaptasi dengan perubahan dan tantangan baru
• Mengemban tanggung jawab yang menuntut pemikiran abstrak

Posisi yang sangat cocok: Manajer, Supervisor, Analyst, Specialist, Professional, atau peran yang membutuhkan pemecahan masalah tingkat lanjut.`;
    }
    if (score >= 60) {
      return `Kemampuan intelektual baik. Kandidat memiliki kemampuan untuk:
• Memahami instruksi dan menyelesaikan tugas dengan mandiri
• Menganalisis masalah pada tingkat moderat
• Belajar dengan kecepatan yang memadai
• Bekerja dengan arahan yang jelas dan terstruktur

Posisi yang cocok: Staff, Administrator, Technician, atau peran dengan tuntutan analisis dan pembelajaran moderat.`;
    }
    if (score >= 40) {
      return `Kemampuan intelektual cukup. Kandidat dapat:
• Menyelesaikan tugas rutin dengan arahan yang jelas
• Mengikuti SOP dan instruksi kerja yang terstruktur
• Bekerja dalam lingkungan yang stabil dan prediktif
• Membutuhkan waktu lebih lama untuk pembelajaran baru

Posisi yang cocok: Operator, Clerk, atau peran dengan tugas rutin dan prosedural yang jelas.`;
    }
    return `Kemampuan intelektual perlu perhatian khusus. Kandidat mungkin membutuhkan:
• Instruksi yang sangat jelas dan terstruktur
• Pelatihan intensif dan pendampingan
• Tugas yang tidak menuntut analisis kompleks
• Lingkungan kerja yang stabil dan mendukung

Perlu evaluasi menyeluruh sebelum penempatan pada posisi yang menuntut analisis, kecepatan belajar, atau pemecahan masalah.`;
  };

  // Detailed subtest interpretations
  const getSubtestInterpretation = (code: string, pct: number) => {
    const interpretations: Record<string, (p: number) => string> = {
      SE: (p) => p >= 80 ? "Memahami konteks kalimat dan inferensi makna dengan sangat baik. Komunikasi lisan dan tertulis efektif." : p >= 60 ? "Memahami makna kalimat dan konteks dengan baik. Komunikasi jelas dan efektif." : p >= 40 ? "Memahami kalimat sederhana dengan memadai. Komunikasi dasar fungsional." : "Kesulitan memahami konteks kalimat kompleks. Perlu instruksi yang eksplisit.",
      WA: (p) => p >= 80 ? "Kosakata luas dan presisi. Mampu memilih kata yang tepat untuk berbagai konteks." : p >= 60 ? "Kosakata baik dan memadai. Mampu berkomunikasi dengan efektif." : p >= 40 ? "Kosakata dasar memadai. Komunikasi fungsional untuk kebutuhan sehari-hari." : "Kosakata terbatas. Perlu dukungan dalam komunikasi formal.",
      AN: (p) => p >= 80 ? "Penalaran analogis sangat kuat. Mampu melihat pola dan hubungan kompleks." : p >= 60 ? "Penalaran analogis baik. Mampu menghubungkan konsep dan menerapkan pola." : p >= 40 ? "Penalaran analogis cukup. Mampu melihat hubungan sederhana." : "Kesulitan dalam penalaran analogis. Perlu contoh konkret.",
      GE: (p) => p >= 80 ? "Abstraksi konsep sangat baik. Mampu menggeneralisasi dan mengkategorisasi dengan presisi." : p >= 60 ? "Abstraksi konsep baik. Mampu membentuk konsep umum dari contoh spesifik." : p >= 40 ? "Abstraksi konsep cukup. Mampu mengelompokkan informasi dasar." : "Kesulitan dalam abstraksi konsep. Perlu pendekatan yang konkret.",
      RA: (p) => p >= 80 ? "Perhitungan sangat akurat dan cepat. Memahami masalah kuantitatif kompleks." : p >= 60 ? "Perhitungan akurat dan efisien. Memahami masalah numerik dengan baik." : p >= 40 ? "Perhitungan dasar memadai. Membutuhkan waktu untuk kalkulasi kompleks." : "Kesulitan dalam perhitungan. Perlu alat bantu dan waktu lebih.",
      ZR: (p) => p >= 80 ? "Pola angka sangat kuat. Mampu memprediksi dan menganalisis deret kompleks." : p >= 60 ? "Pola angka baik. Mampu mengenali dan meneruskan deret numerik." : p >= 40 ? "Pola angka cukup. Mampu melihat pola sederhana." : "Kesulitan mengenali pola angka. Perlu latihan berulang.",
      FA: (p) => p >= 80 ? "Analisis bentuk sangat tajam. Mampu membedakan detail visual yang halus." : p >= 60 ? "Analisis bentuk baik. Mampu mengenali pola visual dengan efektif." : p >= 40 ? "Analisis bentuk cukup. Mampu membedakan bentuk dasar." : "Kesulitan analisis visual. Perlu pendekatan yang lebih konkret.",
      WU: (p) => p >= 80 ? "Visualisasi spasial sangat kuat. Mampu memanipulasi objek mental secara presisi." : p >= 60 ? "Visualisasi spasial baik. Mampu membayangkan rotasi dan posisi objek." : p >= 40 ? "Visualisasi spasial cukup. Mampu membayangkan bentuk sederhana." : "Kesulitan visualisasi spasial. Perlu contoh fisik.",
      ME: (p) => p >= 80 ? "Daya ingat sangat kuat. Mampu mengingat detail dan instruksi dengan presisi." : p >= 60 ? "Daya ingat baik. Mampu mengingat informasi penting dengan efektif." : p >= 40 ? "Daya ingat cukup. Mampu mengingat informasi dasar." : "Daya ingat terbatas. Perlu catatan dan pengulangan.",
    };
    return interpretations[code]?.(pct) || "";
  };

  // Ability group detailed interpretations
  const getAbilityGroupDetail = (group: string, pct: number) => {
    const details: Record<string, string> = {
      Verbal: pct >= 80 ? "Kemampuan verbal sangat kuat. Kandidat dapat memproses informasi verbal dengan cepat, berkomunikasi dengan sangat efektif, dan memahami konsep abstrak melalui bahasa. Cocok untuk peran yang menuntut komunikasi tingkat tinggi, negosiasi, atau presentasi." : pct >= 60 ? "Kemampuan verbal baik. Kandidat dapat berkomunikasi dengan jelas dan memahami instruksi verbal dengan efektif. Cocok untuk peran yang membutuhkan komunikasi rutin dan pemahaman konsep." : pct >= 40 ? "Kemampuan verbal cukup. Kandidat dapat berkomunikasi untuk kebutuhan dasar. Perlu dukungan untuk tugas yang menuntut komunikasi kompleks." : "Kemampuan verbal terbatas. Perlu instruksi tertulis dan pendekatan yang lebih konkret.",
      Numerik: pct >= 80 ? "Kemampuan numerik sangat kuat. Kandidat dapat menganalisis data, melakukan perhitungan kompleks, dan memahami pola angka dengan presisi. Cocok untuk peran analitis, keuangan, atau data-driven." : pct >= 60 ? "Kemampuan numerik baik. Kandidat dapat bekerja dengan angka dan data dengan efektif. Cocok untuk peran yang membutuhkan perhitungan dan analisis dasar." : pct >= 40 ? "Kemampuan numerik cukup. Kandidat dapat melakukan perhitungan dasar. Perlu alat bantu untuk tugas numerik kompleks." : "Kemampuan numerik terbatas. Perlu menghindari tugas yang menuntut perhitungan intensif.",
      "Figural / Spasial": pct >= 80 ? "Kemampuan visual-spasial sangat kuat. Kandidat dapat memvisualisasikan, menganalisis pola visual, dan memanipulasi objek mental dengan presisi. Cocok untuk peran desain, engineering, atau teknis." : pct >= 60 ? "Kemampuan visual-spasial baik. Kandidat dapat memahami diagram, sketsa, dan representasi visual dengan efektif. Cocok untuk peran yang membutuhkan pemahaman visual." : pct >= 40 ? "Kemampuan visual-spasial cukup. Kandidat dapat memahami representasi visual sederhana. Perlu contoh konkret untuk tugas kompleks." : "Kemampuan visual-spasial terbatas. Perlu pendekatan yang sangat konkret dan berbasis contoh.",
      Memori: pct >= 80 ? "Daya ingat sangat kuat. Kandidat dapat mengingat informasi, detail, dan instruksi dengan presisi tinggi. Cocok untuk peran yang menuntut akurasi dan retensi informasi." : pct >= 60 ? "Daya ingat baik. Kandidat dapat mengingat informasi penting dengan efektif. Cocok untuk peran yang membutuhkan retensi informasi moderat." : pct >= 40 ? "Daya ingat cukup. Kandidat dapat mengingat informasi dasar. Perlu catatan dan pengulangan untuk informasi penting." : "Daya ingat terbatas. Perlu sistem dokumentasi dan pengingat yang kuat.",
    };
    return details[group] || "";
  };

  return `STATUS VALIDASI: VALID
Total skor seluruh subtes: ${summary.raw}/${summary.max}

═══════════════════════════════════════════════════════════════
RINGKASAN PROFIL KEMAMPUAN IST
═══════════════════════════════════════════════════════════════

Skor Kemampuan IST: ${istTotal}% (${istTotalLevel})

${getIstTotalDetail(istTotal)}

═══════════════════════════════════════════════════════════════
DETAIL PER SUBTES (9 SUBTES)
═══════════════════════════════════════════════════════════════

${summary.rows.map((row) => `${row.code} - ${row.name} (${row.area})
  Skor: ${row.raw}/${row.max} (${row.pct}%) - Level: ${row.level}
  Interpretasi: ${getSubtestInterpretation(row.code, row.pct)}`).join("\n\n")}

═══════════════════════════════════════════════════════════════
KELOMPOK KEMAMPUAN UTAMA
═══════════════════════════════════════════════════════════════

${abilityGroups.map((group) => `${group.name}: ${group.raw}/${group.max} (${group.pct}%) - ${group.level}
${getAbilityGroupDetail(group.name, group.pct)}`).join("\n\n")}

═══════════════════════════════════════════════════════════════
KEKUATAN UTAMA (TOP 3)
═══════════════════════════════════════════════════════════════

${highRows.map((row) => `• ${row.code} - ${row.name}: ${row.description}`).join("\n")}

Implikasi: Fokus pada pengembangan dan pemanfaatan kekuatan ini untuk optimalisasi performa.

═══════════════════════════════════════════════════════════════
AREA PENGEMBANGAN (BOTTOM 3)
═══════════════════════════════════════════════════════════════

${lowRows.map((row) => `• ${row.code} - ${row.name}: ${row.description}`).join("\n")}

Implikasi: Berikan dukungan tambahan, pelatihan, atau penyesuaian tugas untuk area ini.

════════════════════════════════════════════════════════════════
REKOMENDASI POSISI BERDASARKAN PROFIL
════════════════════════════════════════════════════════════════

${abilityGroups.filter(g => g.pct >= 60).length > 0 ? abilityGroups.filter(g => g.pct >= 60).map((group) => {
  const positions: Record<string, string[]> = {
    Verbal: ["HR Manager", "Legal Officer", "Corporate Trainer", "Customer Service Lead", "Sales Manager", "Marketing Communications", "Public Relations"],
    Numerik: ["Finance Manager", "Accounting Supervisor", "Internal Auditor", "Data Analyst", "Business Analyst", "Financial Planner", "Risk Analyst"],
    "Figural / Spasial": ["Engineering Manager", "Product Designer", "Technical Lead", "Production Supervisor", "Architect", "Quality Control Manager", "R&D Engineer"],
    Memori: ["Office Manager", "Administrative Supervisor", "Customer Service Supervisor", "Operations Coordinator", "Logistics Manager"]
  };
  const posList = positions[group.name] || [];
  return `• ${group.name} (${group.pct}%): ${posList.join(", ")}`;
}).join("\n") : "Tidak ada kelompok kemampuan yang menonjol (≥60%). Rekomendasi posisi memerlukan evaluasi lebih lanjut berdasarkan kecocokan dengan tuntutan jabatan spesifik."}

═══════════════════════════════════════════════════════════════
REKOMENDASI PENGEMBANGAN
═══════════════════════════════════════════════════════════════

${lowRows.length > 0 ? `Untuk area pengembangan (${lowRows.map(r => r.code).join(", ")}):
• Sediakan pelatihan khusus dan mentoring
• Berikan tugas dengan tingkat kesulitan bertahap
• Gunakan pendekatan pembelajaran yang sesuai dengan gaya belajar
• Evaluasi progres secara berkala` : "Profil seimbang. Lanjutkan dengan pengembangan menyeluruh."}

═══════════════════════════════════════════════════════════════
CATATAN PENTING BAGI REKRUTER
═══════════════════════════════════════════════════════════════

1. IST mengukur kemampuan intelektual, bukan kepribadian atau motivasi.
2. Skor rendah pada satu subtes tidak otomatis menggugurkan kandidat.
3. Sesuaikan penilaian dengan tuntutan spesifik posisi yang dilamar.
4. Padukan hasil dengan riwayat pendidikan, pengalaman kerja, dan asesmen lain.
5. Pertimbangkan faktor motivasi, sikap, dan budaya kerja dalam keputusan akhir.

═══════════════════════════════════════════════════════════════
CATATAN TEKNIS
═══════════════════════════════════════════════════════════════

Skor yang ditampilkan adalah "Skor Kemampuan IST" berdasarkan persentase.
Untuk konversi ke IQ, diperlukan tabel norma IST yang valid sesuai kelompok usia.
Tabel norma saat ini belum tersedia, sehingga skor ditampilkan dalam bentuk persentase.`;
};
