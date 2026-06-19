export type PapiScale = {
  code: string;
  label: string;
  group: "Need" | "Role";
  description: string;
  high: string;
  low: string;
};

export const PAPI_SCALES: PapiScale[] = [
  { code: "A", label: "Need to Achieve", group: "Need", description: "dorongan mencapai target dan hasil kerja", high: "ambisi pencapaian kuat, berorientasi target", low: "lebih santai terhadap tuntutan prestasi" },
  { code: "B", label: "Need to Belong to Groups", group: "Need", description: "kebutuhan menjadi bagian kelompok", high: "nyaman bekerja dalam kelompok dan mencari rasa memiliki", low: "lebih mandiri dan tidak terlalu membutuhkan afiliasi kelompok" },
  { code: "C", label: "Organized Type", group: "Role", description: "keteraturan dan sistematika kerja", high: "terstruktur, rapi, menyukai prosedur", low: "lebih fleksibel dan kurang terpaku pada struktur" },
  { code: "D", label: "Leadership Role", group: "Role", description: "kecenderungan mengambil peran memimpin", high: "mudah mengambil peran pengarah", low: "lebih nyaman sebagai pelaksana/anggota tim" },
  { code: "E", label: "Emotional Resistance", group: "Role", description: "daya tahan emosi dalam tekanan", high: "relatif stabil saat menghadapi tekanan", low: "lebih mudah terdampak tekanan emosi" },
  { code: "F", label: "Need to Support Authority", group: "Need", description: "kebutuhan mendukung otoritas/atasan", high: "kooperatif terhadap arahan otoritas", low: "lebih kritis/mandiri terhadap figur otoritas" },
  { code: "G", label: "Hard Intense Worked", group: "Role", description: "intensitas dan energi kerja", high: "energi kerja tinggi dan gigih", low: "ritme kerja lebih moderat" },
  { code: "I", label: "Ease in Decision Making", group: "Role", description: "kemudahan mengambil keputusan", high: "cepat memutuskan dan praktis", low: "lebih berhati-hati atau membutuhkan data tambahan" },
  { code: "K", label: "Need to be Forceful", group: "Need", description: "dorongan bersikap tegas/kuat", high: "tegas, asertif, berani menekan pendapat", low: "lebih lunak dan menghindari konfrontasi" },
  { code: "L", label: "Leadership Role", group: "Role", description: "orientasi memimpin dan memengaruhi", high: "punya kecenderungan mengarahkan orang", low: "tidak terlalu mengejar peran pemimpin" },
  { code: "N", label: "Need to Finish Task", group: "Need", description: "kebutuhan menyelesaikan tugas", high: "kuat menuntaskan pekerjaan", low: "lebih mudah berpindah fokus bila prioritas berubah" },
  { code: "O", label: "Need for Closeness and Affection", group: "Need", description: "kebutuhan kedekatan interpersonal", high: "mencari relasi hangat dan dukungan personal", low: "lebih menjaga jarak emosional" },
  { code: "P", label: "Need to Control Others", group: "Need", description: "dorongan mengontrol/mengatur orang lain", high: "ingin memengaruhi dan mengendalikan proses", low: "lebih memberi ruang pada orang lain" },
  { code: "R", label: "Theoretical Type", group: "Role", description: "minat analitis/konseptual", high: "suka menganalisis dan memahami konsep", low: "lebih praktis daripada teoritis" },
  { code: "S", label: "Social Extension", group: "Role", description: "keluwesan sosial", high: "aktif bersosialisasi dan mudah membangun kontak", low: "lebih selektif dalam interaksi sosial" },
  { code: "T", label: "Pace", group: "Role", description: "tempo kerja", high: "ritme kerja cepat", low: "tempo lebih tenang dan hati-hati" },
  { code: "V", label: "Vigorous Type", group: "Role", description: "vitalitas dan daya dorong", high: "aktif, energik, kuat secara dorongan kerja", low: "energi tampak lebih rendah atau hemat tenaga" },
  { code: "W", label: "Need for Rules and Supervision", group: "Need", description: "kebutuhan aturan dan supervisi", high: "nyaman dengan aturan, arahan, dan supervisi jelas", low: "lebih mandiri dan tidak suka terlalu diawasi" },
  { code: "X", label: "Need to be Noticed", group: "Need", description: "kebutuhan diperhatikan/diakui", high: "membutuhkan pengakuan dan perhatian", low: "tidak terlalu mencari sorotan" },
  { code: "Z", label: "Need for Change", group: "Need", description: "kebutuhan variasi/perubahan", high: "suka variasi dan perubahan", low: "lebih nyaman dengan rutinitas stabil" },
];

export const isPapiName = (name?: string | null) => String(name || "").toUpperCase().includes("PAPI");

export const getPapiRows = (categories: Record<string, unknown>) =>
  PAPI_SCALES.map((scale) => {
    const value = Math.max(0, Math.min(9, Number(categories[scale.code] || 0)));
    const level = value >= 7 ? "Tinggi" : value >= 4 ? "Sedang" : "Rendah";
    return { ...scale, value, level };
  });

export const buildPapiInterpretation = (categories: Record<string, unknown>) => {
  const rows = getPapiRows(categories);
  const top = [...rows].sort((a, b) => b.value - a.value || a.code.localeCompare(b.code)).slice(0, 4);
  const highs = rows.filter((row) => row.value >= 7).sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const lows = rows.filter((row) => row.value <= 3).sort((a, b) => a.value - b.value || a.code.localeCompare(b.code)).slice(0, 5);
  const moderate = rows.filter((row) => row.value >= 4 && row.value <= 6).length;
  const needs = rows.filter((row) => row.group === "Need").reduce((sum, row) => sum + row.value, 0);
  const roles = rows.filter((row) => row.group === "Role").reduce((sum, row) => sum + row.value, 0);
  const needRows = rows.filter((row) => row.group === "Need").sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const roleRows = rows.filter((row) => row.group === "Role").sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const orientation = needs > roles ? "kebutuhan/motivasi internal lebih menonjol" : roles > needs ? "peran dan gaya kerja yang tampak lebih menonjol" : "kebutuhan internal dan peran kerja relatif seimbang";
  const workImplication = top.map((row) => {
    const tendency = row.value >= 7 ? row.high : row.value >= 4 ? `menunjukkan ${row.description} pada taraf cukup` : row.low;
    return `${row.code} - ${row.label}: ${tendency}`;
  }).join("; ");
  const explainRow = (row: ReturnType<typeof getPapiRows>[number]) => {
    const meaning = row.value >= 7
      ? `indikasi kuat: ${row.high}`
      : row.value >= 4
        ? `indikasi moderat: ${row.description} muncul secara situasional`
        : `indikasi rendah: ${row.low}`;
    const caution = row.value >= 7
      ? "Perlu dipastikan tetap adaptif, tidak berlebihan, dan sesuai tuntutan jabatan."
      : row.value >= 4
        ? "Perilaku biasanya fleksibel, dipengaruhi konteks, atasan, target, serta dinamika tim."
        : "Area ini bukan kelemahan mutlak; maknanya perlu dibaca sebagai preferensi yang relatif kurang dominan.";
    return `${row.code} - ${row.label} (${row.value}/9; ${row.level}): ${meaning}. ${caution}`;
  };

  return `RINGKASAN PROFIL
Skala paling menonjol: ${top.map((row) => `${row.code} - ${row.label} (${row.value}/9; ${row.level})`).join(", ")}.
Makna umum: ${workImplication}.

NEED VS ROLE
- Total Need: ${needs}
- Total Role: ${roles}
- Kesimpulan: ${orientation}.
- Catatan: Need menggambarkan dorongan/kebutuhan internal, sedangkan Role menggambarkan perilaku kerja yang lebih tampak dalam peran sehari-hari.

SKALA TINGGI
${highs.length ? highs.map((row) => `- ${row.code} - ${row.label} (${row.value}/9): ${row.high}`).join("\n") : "- Tidak ada skala yang sangat tinggi; profil relatif moderat dan perlu dilihat dari kombinasi keseluruhan skala."}

SKALA RENDAH
${lows.length ? lows.map((row) => `- ${row.code} - ${row.label} (${row.value}/9): ${row.low}`).join("\n") : "- Tidak ada skala rendah yang menonjol."}

INTERPRETASI RINCI PER DIMENSI
${rows.map((row) => `- ${explainRow(row)}`).join("\n")}

ANALISIS NEED
${needRows.map((row) => `- ${row.code} ${row.value}/9 - ${row.label}: ${row.value >= 7 ? row.high : row.value >= 4 ? "kebutuhan tampak cukup dan situasional" : row.low}`).join("\n")}

ANALISIS ROLE
${roleRows.map((row) => `- ${row.code} ${row.value}/9 - ${row.label}: ${row.value >= 7 ? row.high : row.value >= 4 ? "peran kerja tampak cukup dan situasional" : row.low}`).join("\n")}

IMPLIKASI KERJA
- Profil ini membantu membaca motivasi kerja, kebutuhan struktur, dorongan pencapaian, gaya relasi, ketegasan, kepemimpinan, tempo kerja, dan respons terhadap aturan/supervisi.
- ${moderate} skala berada pada area sedang, sehingga beberapa perilaku kemungkinan lebih situasional dan perlu divalidasi melalui wawancara.
- Untuk jabatan dengan target tinggi, perhatikan kombinasi A, G, N, dan T.
- Untuk jabatan koordinatif atau supervisori, perhatikan D, L, P, K, S, dan B.
- Untuk jabatan yang membutuhkan ketelitian, prosedur, dan kepatuhan, perhatikan C, W, F, serta E.

REKOMENDASI PENGGUNAAN
- Cocokkan profil PAPI dengan tuntutan jabatan: target, koordinasi, struktur kerja, relasi interpersonal, perubahan, dan kebutuhan supervisi.
- Skala tinggi dapat menjadi kekuatan bila sesuai konteks, namun dapat menjadi risiko bila tuntutan jabatan berlawanan.
- PAPI adalah inventory preferensi/gaya kerja, bukan tes benar-salah. Interpretasi perlu dipadukan dengan wawancara, observasi perilaku, tuntutan jabatan, dan data asesmen lain sebelum menjadi dasar keputusan seleksi.`;
};
