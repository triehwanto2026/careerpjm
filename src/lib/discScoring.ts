export const DISC_DIMS = ["D", "I", "S", "C"] as const;
export type DiscDim = typeof DISC_DIMS[number];

export const DISC_LABELS: Record<DiscDim, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Steadiness",
  C: "Conscientiousness",
};

const DISC_FULL_KEY: Record<DiscDim, string[]> = {
  D: ["D", "Dominance"],
  I: ["I", "Influence"],
  S: ["S", "Steadiness"],
  C: ["C", "Compliance", "Conscientiousness"],
};

export const getDiscValue = (categories: Record<string, unknown>, dim: DiscDim, kind: "M" | "L" | "N" = "N") => {
  const keys = DISC_FULL_KEY[dim];
  if (kind === "N") {
    const direct = keys.map((key) => categories[key] ?? categories[`${key}_N`]).find((value) => value !== undefined);
    if (direct !== undefined) return Number(direct || 0);
    const most = Number(keys.map((key) => categories[`${key}_M`]).find((value) => value !== undefined) || 0);
    const least = Number(keys.map((key) => categories[`${key}_L`]).find((value) => value !== undefined) || 0);
    return most - least;
  }
  return Number(keys.map((key) => categories[`${key}_${kind}`]).find((value) => value !== undefined) || 0);
};

export const getDiscRows = (categories: Record<string, unknown>, totalQuestions = 24) => {
  const threshold = Math.ceil(Math.max(totalQuestions, 1) * 0.25);
  const rows = DISC_DIMS.map((dim) => {
    const m = getDiscValue(categories, dim, "M");
    const l = getDiscValue(categories, dim, "L");
    const net = getDiscValue(categories, dim, "N");
    const level = net >= threshold ? "Tinggi" : net >= 1 ? "Sedang" : net <= -threshold ? "Rendah" : "Netral";
    return { dim, label: DISC_LABELS[dim], m, l, net, level };
  });
  const ranked = [...rows].sort((a, b) => b.net - a.net);
  return rows.map((row) => ({ ...row, rank: ranked.findIndex((item) => item.dim === row.dim) + 1 }));
};

const DISC_PROFILE: Record<DiscDim, { strength: string; watch: string; work: string; communication: string; roles: string }> = {
  D: {
    strength: "tegas, kompetitif, cepat mengambil keputusan, berani menghadapi tantangan, dan kuat mendorong pencapaian target",
    watch: "dapat tampak terlalu dominan, kurang sabar pada proses yang lambat, dan perlu menjaga cara memberi tekanan agar tetap konstruktif",
    work: "efektif pada target jelas, wewenang cukup, masalah menantang, dan ruang mengambil keputusan",
    communication: "gunakan komunikasi langsung, ringkas, berbasis hasil, dengan pilihan tindakan yang jelas",
    roles: "manager, project leader, sales leader, business development, operations lead, entrepreneur",
  },
  I: {
    strength: "komunikatif, persuasif, optimis, mudah membangun relasi, dan mampu menggerakkan suasana tim",
    watch: "dapat kurang fokus pada detail, mudah terdistraksi, dan perlu sistem follow-up agar komitmen kerja tetap tuntas",
    work: "efektif pada pekerjaan yang membutuhkan networking, presentasi, persuasi, kolaborasi, dan energi sosial",
    communication: "gunakan pendekatan hangat, apresiatif, interaktif, dan hubungkan tugas dengan dampak pada orang",
    roles: "sales, marketing, public relations, trainer, customer engagement, partnership, event",
  },
  S: {
    strength: "stabil, sabar, kooperatif, konsisten, pendengar baik, dan menjaga harmoni kerja",
    watch: "dapat menghindari konflik, lambat merespons perubahan mendadak, dan perlu dorongan untuk menyampaikan keberatan secara terbuka",
    work: "efektif pada lingkungan suportif, stabil, memiliki ritme kerja jelas, dan membutuhkan konsistensi layanan",
    communication: "sampaikan perubahan secara bertahap, beri kepastian, dan gunakan komunikasi yang tenang serta suportif",
    roles: "Counselor, Teacher, Nurse, HR, Customer Service, Therapist, Administrator, Account Support, Service Operations",
  },
  C: {
    strength: "analitis, teliti, sistematis, patuh standar, objektif, dan kuat menjaga kualitas pekerjaan",
    watch: "dapat terlalu perfeksionis, lambat mengambil keputusan bila data belum lengkap, dan perlu menjaga fleksibilitas",
    work: "efektif pada pekerjaan berbasis data, prosedur, akurasi, risiko, audit, dan kontrol mutu",
    communication: "berikan data, kriteria, standar, risiko, dan ruang untuk mengecek detail sebelum keputusan",
    roles: "analyst, finance, audit, quality control, engineering, compliance, data, programmer",
  },
};

export const buildDiscInterpretation = (categories: Record<string, unknown>, totalQuestions = 24) => {
  const rows = getDiscRows(categories, totalQuestions);
  const sorted = [...rows].sort((a, b) => b.net - a.net);
  const primary = sorted[0];
  const secondary = sorted[1];
  const profile = DISC_PROFILE[primary.dim];
  const secondaryProfile = DISC_PROFILE[secondary.dim];
  const distribution = rows.map((row) => `${row.dim}: M=${row.m}, L=${row.l}, Net=${row.net} (${row.level}, rank #${row.rank})`).join("; ");

  return `PROFIL DOMINAN
- Kombinasi utama: ${primary.dim}${secondary ? ` & ${secondary.dim}` : ""}
- Dimensi primer: ${primary.label} (${primary.dim})
- Dimensi sekunder: ${secondary.label} (${secondary.dim})

RINGKASAN PSIKOLOGIS
- ${primary.label} (${primary.dim}) yang tinggi menunjukkan kandidat cenderung ${profile.strength}.
- Profil ini cocok untuk peran yang membutuhkan pola kerja sesuai karakter ${primary.dim}, dengan tetap mempertimbangkan tuntutan jabatan dan konteks tim.

KEKUATAN UTAMA
- Dimensi ${primary.dim} menjadi pola paling menonjol berdasarkan skor Mirror/Net.
- Kandidat berpotensi menunjukkan kekuatan utama berupa ${profile.strength}.

KOMBINASI PROFIL
- Dimensi sekunder ${secondary.dim} (${secondary.label}) memberi warna tambahan: kandidat juga menunjukkan kecenderungan ${secondaryProfile.strength}.
- Kombinasi ini perlu dibaca bersama, karena perilaku kerja kandidat tidak hanya dipengaruhi satu dimensi dominan.

AREA PERHATIAN
- ${profile.watch}.
- Pada situasi tekanan, pola ini perlu dikelola agar tetap produktif dan tidak menghambat kolaborasi.

GAYA KERJA
- Kandidat biasanya paling efektif bila ${profile.work}.

GAYA KOMUNIKASI
- Pendekatan komunikasi yang disarankan: ${profile.communication}.

KECOCOKAN PERAN
- ${profile.roles}.
- Tetap sesuaikan dengan pengalaman, kompetensi teknis, budaya tim, dan tuntutan jabatan.

DISTRIBUSI SKOR DISC
- ${distribution}.

CATATAN PSIKOLOG
- DISC menggambarkan kecenderungan perilaku kerja dan gaya komunikasi, bukan ukuran kecerdasan atau kompetensi mutlak.
- Gunakan hasil ini bersama wawancara berbasis kompetensi, riwayat kerja, observasi, dan hasil tes lain.`;
};
