export const PERSONALITY_TEMPERAMENTS = ["Sanguinis", "Koleris", "Melankolis", "Plegmatis"] as const;
export type PersonalityTemperament = typeof PERSONALITY_TEMPERAMENTS[number];

const TEMPERAMENT_MAP: Record<string, PersonalityTemperament> = {
  S: "Sanguinis",
  SANGUINE: "Sanguinis",
  SANGUINIS: "Sanguinis",
  K: "Koleris",
  C: "Koleris",
  CHOLERIC: "Koleris",
  KOLERIS: "Koleris",
  M: "Melankolis",
  MELANCHOLY: "Melankolis",
  MELANCHOLIC: "Melankolis",
  MELANKOLIS: "Melankolis",
  P: "Plegmatis",
  PHLEGMATIC: "Plegmatis",
  PLEGMATIC: "Plegmatis",
  PLEGMATIS: "Plegmatis",
};

const TEMPERAMENT_PROFILE: Record<PersonalityTemperament, { strength: string; watch: string; work: string; communication: string; roles: string }> = {
  Sanguinis: {
    strength: "ekspresif, antusias, ramah, optimis, kreatif, cepat membangun relasi, dan mampu mencairkan suasana",
    watch: "mudah terdistraksi, kurang konsisten pada detail, impulsif, dan membutuhkan struktur agar ide dapat dituntaskan",
    work: "paling efektif dalam lingkungan sosial, dinamis, komunikatif, dan memberi ruang ekspresi",
    communication: "gunakan pendekatan hangat, apresiatif, interaktif, dan hubungkan tugas dengan orang atau dampak nyata",
    roles: "sales, marketing, public relations, trainer, customer engagement, event, community",
  },
  Koleris: {
    strength: "tegas, cepat mengambil keputusan, berorientasi hasil, mandiri, kompetitif, dan kuat memimpin tindakan",
    watch: "dapat tampak dominan, kurang sabar pada proses lambat, dan perlu menjaga empati saat mengarahkan orang",
    work: "paling efektif pada target jelas, tantangan tinggi, wewenang cukup, dan kebutuhan eksekusi cepat",
    communication: "gunakan komunikasi langsung, ringkas, berbasis hasil, serta beri opsi keputusan yang jelas",
    roles: "manager, supervisor, project lead, operations, entrepreneur, sales leader",
  },
  Melankolis: {
    strength: "analitis, teliti, terstruktur, berhati-hati, setia pada standar, dan kuat menjaga kualitas",
    watch: "dapat terlalu perfeksionis, sensitif terhadap kritik, lambat memulai bila data belum lengkap, dan mudah terbebani oleh standar tinggi",
    work: "paling efektif pada pekerjaan yang membutuhkan akurasi, perencanaan, dokumentasi, dan kontrol kualitas",
    communication: "berikan data, standar, alasan, tenggat jelas, dan kritik yang spesifik serta konstruktif",
    roles: "finance, audit, analyst, quality control, research, engineering, administration",
  },
  Plegmatis: {
    strength: "tenang, sabar, stabil, diplomatis, kooperatif, pendengar baik, dan mampu meredakan konflik",
    watch: "kurang inisiatif pada situasi ambigu, cenderung menghindari konflik, dan perlu dorongan untuk mengambil keputusan tegas",
    work: "paling efektif pada lingkungan suportif, stabil, harmonis, dengan prioritas dan ekspektasi jelas",
    communication: "gunakan komunikasi tenang, suportif, tidak menekan berlebihan, dan beri waktu untuk merespons",
    roles: "HR, customer service, administration, mediator, counselor, support, coordinator",
  },
};

export const normalizePersonalityPlus = (categories: Record<string, unknown>) => {
  const normalized: Record<PersonalityTemperament, number> = {
    Sanguinis: 0,
    Koleris: 0,
    Melankolis: 0,
    Plegmatis: 0,
  };
  Object.entries(categories || {}).forEach(([key, value]) => {
    const temperament = TEMPERAMENT_MAP[String(key).trim().toUpperCase()];
    if (temperament) {
      normalized[temperament] += Number(value) || 0;
    }
  });
  return normalized;
};

export const getPersonalityPlusRows = (categories: Record<string, unknown>) => {
  const normalized = normalizePersonalityPlus(categories);
  const total = Object.values(normalized).reduce((sum, value) => sum + value, 0) || 1;
  return PERSONALITY_TEMPERAMENTS.map((name) => {
    const value = normalized[name];
    const pct = Math.round((value / total) * 100);
    const level = pct >= 40 ? "Dominan" : pct >= 25 ? "Kuat" : pct >= 15 ? "Sedang" : "Rendah";
    return { name, value, pct, level, ...TEMPERAMENT_PROFILE[name] };
  });
};

export const buildPersonalityPlusInterpretation = (categories: Record<string, unknown>, totalItems = 40) => {
  const rows = getPersonalityPlusRows(categories);
  const sorted = [...rows].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const primary = sorted[0];
  const secondary = sorted[1];
  const diff = primary.value - secondary.value;
  const isBlend = diff <= Math.max(2, Math.round(totalItems * 0.1));
  const distribution = rows.map((row) => `${row.name}: ${row.value} (${row.pct}%, ${row.level})`).join("; ");

  return `═══════════════════════════════════════════════════════════════
PROFIL PERSONALITY PLUS - ANALISIS 4 TEMPERAMEN
═══════════════════════════════════════════════════════════════

TEMPERAMEN DOMINAN
Profil Personality Plus kandidat menunjukkan temperamen dominan ${primary.name} (${primary.value} jawaban; ${primary.pct}%)${secondary ? ` dengan kecenderungan sekunder ${secondary.name} (${secondary.value} jawaban; ${secondary.pct}%)` : ""}.

RINGKASAN PROFIL
${isBlend ? `Skor ${primary.name} dan ${secondary.name} relatif berdekatan, sehingga kandidat lebih tepat dibaca sebagai kombinasi ${primary.name}-${secondary.name}.` : `${primary.name} tampak sebagai karakter paling menonjol dalam pola respons kandidat.`}

KEKUATAN UTAMA
• Kandidat cenderung ${primary.strength}
• Temperamen ini memberikan fondasi kuat untuk peran yang membutuhkan karakteristik ${primary.name}
• Kekuatan ini dapat dimaksimalkan dalam lingkungan yang mendukung gaya kerja natural kandidat

KOMBINASI TEMPERAMEN
• Kecenderungan sekunder ${secondary.name} memberi warna tambahan: kandidat juga menunjukkan sisi ${secondary.strength}
• Kombinasi ini membantu membaca cara kandidat bekerja dalam situasi berbeda
• Profil hybrid memberikan fleksibilitas dan adaptabilitas dalam berbagai konteks kerja

AREA PERHATIAN
• ${primary.watch}
• Area ini bukan kelemahan tetap, tetapi indikator yang perlu dikelola terutama saat tekanan kerja meningkat
• Perlu strategi manajemen diri dan dukungan lingkungan untuk mengoptimalkan potensi

GAYA KERJA OPTIMAL
Kandidat biasanya ${primary.work}. Lingkungan kerja yang sesuai akan meningkatkan performa dan kepuasan kerja.

GAYA KOMUNIKASI EFEKTIF
Pendekatan komunikasi yang disarankan: ${primary.communication}. Komunikasi yang sesuai akan meningkatkan kolaborasi dan hubungan kerja.

REKOMENDASI POSISI
Peran yang relatif selaras: ${primary.roles}
Tetap validasi dengan pengalaman, motivasi kerja, kompetensi teknis, dan tuntutan jabatan spesifik.

DISTRIBUSI SKOR
${distribution}

═══════════════════════════════════════════════════════════════
CATATAN PENTING BAGI REKRUTER
═══════════════════════════════════════════════════════════════

1. Personality Plus membaca kecenderungan temperamen natural, bukan kemampuan mutlak dan bukan diagnosis.
2. Tidak ada temperamen yang lebih baik dari yang lain - setiap temperamen memiliki kekuatan dan konteks yang cocok.
3. Interpretasi perlu dipadukan dengan wawancara, observasi perilaku, riwayat kerja, dan hasil asesmen lain.
4. Sesuaikan penilaian dengan tuntutan spesifik posisi dan budaya organisasi.
5. Pertimbangkan faktor motivasi, nilai-nilai personal, dan lingkungan kerja dalam keputusan akhir.`;
};
