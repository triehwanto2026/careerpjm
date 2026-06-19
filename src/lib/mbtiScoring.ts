export const MBTI_DIMENSIONS = ["E", "I", "S", "N", "T", "F", "J", "P"] as const;
export type MbtiDimension = typeof MBTI_DIMENSIONS[number];

export const MBTI_PAIRS = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
] as const;

const MBTI_LABELS: Record<MbtiDimension, string> = {
  E: "Extraversion",
  I: "Introversion",
  S: "Sensing",
  N: "Intuition",
  T: "Thinking",
  F: "Feeling",
  J: "Judging",
  P: "Perceiving",
};

const MBTI_DESCRIPTIONS: Record<MbtiDimension, string> = {
  E: "lebih energik melalui interaksi, diskusi, dan lingkungan sosial",
  I: "lebih nyaman memproses informasi secara reflektif dan mandiri",
  S: "praktis, faktual, teliti, dan berorientasi pada detail nyata",
  N: "konseptual, imajinatif, dan cepat melihat pola atau kemungkinan",
  T: "mengambil keputusan dengan pertimbangan logis dan objektif",
  F: "mengambil keputusan dengan empati serta mempertimbangkan dampak personal",
  J: "menyukai struktur, rencana, target, dan kepastian kerja",
  P: "fleksibel, adaptif, dan terbuka pada perubahan atau opsi baru",
};

export const isMbtiName = (name?: string | null) => String(name || "").toUpperCase().includes("MBTI")
  || String(name || "").toUpperCase().includes("MYERS");

export const normalizeMbtiDimension = (value?: string | null): MbtiDimension | null => {
  const key = String(value || "").trim().toUpperCase();
  if ((MBTI_DIMENSIONS as readonly string[]).includes(key)) return key as MbtiDimension;
  if (key.includes("EXTRAVERSION") || key.includes("EXTROVERSION") || key === "EXTROVERT") return "E";
  if (key.includes("INTROVERSION") || key === "INTROVERT") return "I";
  if (key.includes("SENSING")) return "S";
  if (key.includes("INTUITION") || key.includes("INTUITIVE")) return "N";
  if (key.includes("THINKING")) return "T";
  if (key.includes("FEELING")) return "F";
  if (key.includes("JUDGING")) return "J";
  if (key.includes("PERCEIVING")) return "P";
  return null;
};

export const getMbtiRows = (categories: Record<string, number>) =>
  MBTI_PAIRS.map(([a, b]) => {
    const av = Number(categories[a] || 0);
    const bv = Number(categories[b] || 0);
    const dominant = av >= bv ? a : b;
    const total = av + bv;
    const strength = total > 0 ? Math.round((Math.max(av, bv) / total) * 100) : 0;
    return {
      pair: `${a}/${b}`,
      a,
      b,
      av,
      bv,
      dominant,
      strength,
      label: `${MBTI_LABELS[dominant]} (${dominant})`,
      description: MBTI_DESCRIPTIONS[dominant],
    };
  });

export const getMbtiType = (categories: Record<string, number>) =>
  getMbtiRows(categories).map((row) => row.dominant).join("");

export const MBTI_TYPE_PROFILES: Record<string, {
  name: string;
  summary: string;
  strengths: string;
  watchouts: string;
  workStyle: string;
  communication: string;
  suitableRoles: string;
}> = {
  ISTJ: {
    name: "Inspector / Logistician",
    summary: "Terstruktur, bertanggung jawab, realistis, dan kuat dalam menjaga prosedur serta ketepatan pelaksanaan.",
    strengths: "Teliti, konsisten, disiplin, dapat dipercaya, kuat dalam dokumentasi, kontrol kualitas, dan penyelesaian tugas sampai tuntas.",
    watchouts: "Dapat terlihat kaku terhadap perubahan mendadak, kurang nyaman dengan ambiguitas, dan perlu ruang untuk memahami alasan perubahan sebelum menyesuaikan diri.",
    workStyle: "Efektif pada lingkungan dengan target jelas, aturan kerja tegas, data konkret, dan ekspektasi yang terukur.",
    communication: "Sebaiknya diberi informasi faktual, ringkas, urut, beserta tenggat dan standar keberhasilan yang jelas.",
    suitableRoles: "Administrasi, finance, audit, compliance, quality control, operasional, inventory, legal support, project control.",
  },
  ISFJ: {
    name: "Protector / Defender",
    summary: "Suportif, teliti, stabil, dan berorientasi pelayanan dengan perhatian kuat pada kebutuhan orang lain.",
    strengths: "Sabar, loyal, rapi, bertanggung jawab, menjaga harmoni, dan mampu memastikan detail pekerjaan tidak terlewat.",
    watchouts: "Cenderung menghindari konflik, sulit menolak permintaan, dan dapat menanggung beban berlebih bila batas kerja tidak jelas.",
    workStyle: "Efektif dalam lingkungan yang stabil, kooperatif, dan menghargai kontribusi praktis serta pelayanan.",
    communication: "Lebih nyaman dengan arahan sopan, jelas, personal, dan diberi waktu untuk menyampaikan kekhawatiran.",
    suitableRoles: "HR administration, customer service, healthcare support, sekretaris, pendidikan, payroll, employee relations.",
  },
  INFJ: {
    name: "Counselor / Advocate",
    summary: "Visioner, reflektif, empatik, dan kuat membaca makna, kebutuhan manusia, serta arah jangka panjang.",
    strengths: "Mampu memahami motif orang, menyusun gagasan mendalam, menjaga integritas nilai, dan menghubungkan strategi dengan dampak manusia.",
    watchouts: "Dapat terlalu idealis, sensitif terhadap konflik nilai, dan membutuhkan waktu sendiri untuk memulihkan energi.",
    workStyle: "Efektif pada pekerjaan bermakna, strategis, dan memberi ruang untuk analisis mendalam serta kontribusi personal.",
    communication: "Butuh komunikasi yang menghargai konteks, tujuan, nilai, dan dampak keputusan pada orang lain.",
    suitableRoles: "HR development, counseling, organizational development, research, strategy, content, employer branding, coaching.",
  },
  INTJ: {
    name: "Strategist / Architect",
    summary: "Analitis, mandiri, konseptual, dan kuat membangun sistem atau strategi jangka panjang.",
    strengths: "Mampu melihat pola kompleks, menyusun rencana, berpikir kritis, fokus pada efektivitas, dan cepat mengidentifikasi kelemahan sistem.",
    watchouts: "Dapat tampak terlalu kritis, kurang sabar pada proses yang tidak efisien, dan perlu menjaga sensitivitas interpersonal.",
    workStyle: "Efektif dalam peran yang memberi otonomi, tantangan intelektual, dan ruang merancang solusi sistemik.",
    communication: "Lebih menerima komunikasi logis, berbasis data, langsung pada inti masalah, dan terbuka pada argumentasi rasional.",
    suitableRoles: "Strategy, business analyst, product planning, data, engineering, systems design, management consultant, R&D.",
  },
  ISTP: {
    name: "Craftsperson / Virtuoso",
    summary: "Praktis, observatif, tenang, dan cepat memahami cara kerja sesuatu melalui eksperimen langsung.",
    strengths: "Adaptif, solutif, efisien, kuat dalam troubleshooting, mampu bekerja tenang pada situasi teknis atau darurat.",
    watchouts: "Dapat kurang menyukai rutinitas administratif, sulit mengekspresikan pertimbangan emosional, dan cepat bosan pada aturan berlebih.",
    workStyle: "Efektif dalam pekerjaan hands-on, problem solving cepat, teknis, dan memberi kebebasan memilih cara kerja.",
    communication: "Butuh instruksi singkat, konkret, fokus pada masalah, dan ruang untuk mencoba solusi praktis.",
    suitableRoles: "Teknisi, engineering, IT support, operations troubleshooting, maintenance, field work, security operations.",
  },
  ISFP: {
    name: "Artist / Adventurer",
    summary: "Fleksibel, peka, praktis, dan berorientasi pengalaman nyata serta nilai personal.",
    strengths: "Empatik, adaptif, memperhatikan detail estetis/manusiawi, tidak mudah menghakimi, dan baik dalam dukungan praktis.",
    watchouts: "Dapat menghindari tekanan atau konflik langsung, kurang nyaman dengan struktur yang terlalu kaku, dan perlu apresiasi personal.",
    workStyle: "Efektif pada lingkungan yang memberi kebebasan, suasana suportif, serta pekerjaan dengan hasil nyata.",
    communication: "Lebih responsif pada komunikasi hangat, tidak memaksa, konkret, dan menghargai pilihan personal.",
    suitableRoles: "Creative support, design, customer care, hospitality, healthcare support, social service, content production.",
  },
  INFP: {
    name: "Mediator / Idealist",
    summary: "Reflektif, idealis, empatik, dan kuat dalam memahami nilai, makna, serta potensi manusia.",
    strengths: "Kreatif, mendalam, suportif, kuat menulis/menyusun ide, mampu melihat perspektif personal dan menjaga autentisitas.",
    watchouts: "Dapat terlalu sensitif terhadap kritik, kurang nyaman pada konflik keras, dan membutuhkan prioritas jelas agar ide tidak melebar.",
    workStyle: "Efektif dalam pekerjaan bermakna, kreatif, human-centered, dan memberi ruang ekspresi serta refleksi.",
    communication: "Butuh komunikasi yang menghargai nilai, tujuan, dan alasan di balik keputusan; kritik sebaiknya disampaikan konstruktif.",
    suitableRoles: "Content, copywriting, counseling, HR development, community, creative, research kualitatif, learning development.",
  },
  INTP: {
    name: "Thinker / Logician",
    summary: "Analitis, konseptual, independen, dan kuat dalam membedah ide, model, atau sistem secara logis.",
    strengths: "Objektif, inovatif, cepat menemukan inkonsistensi, kuat dalam pemecahan masalah abstrak, dan senang belajar mandiri.",
    watchouts: "Dapat menunda eksekusi karena terus menganalisis, kurang tertarik pada detail administratif, dan perlu menjaga komunikasi praktis.",
    workStyle: "Efektif pada pekerjaan yang menuntut eksplorasi ide, riset, desain sistem, dan kebebasan intelektual.",
    communication: "Lebih cocok dengan diskusi logis, terbuka, tidak terlalu emosional, dan memberi ruang untuk mempertanyakan asumsi.",
    suitableRoles: "Research, data science, software, system analyst, product logic, academic, technical strategy, innovation.",
  },
  ESTP: {
    name: "Doer / Entrepreneur",
    summary: "Energik, taktis, cepat bertindak, dan nyaman menghadapi situasi dinamis secara langsung.",
    strengths: "Pragmatis, persuasif, berani mengambil peluang, responsif, kuat dalam negosiasi dan penyelesaian masalah lapangan.",
    watchouts: "Dapat kurang sabar pada perencanaan panjang, mengambil risiko terlalu cepat, dan perlu menjaga konsistensi follow-up.",
    workStyle: "Efektif pada lingkungan cepat, kompetitif, target nyata, dan banyak interaksi langsung.",
    communication: "Lebih cocok dengan instruksi langsung, singkat, berbasis hasil, dan diberi ruang bergerak cepat.",
    suitableRoles: "Sales, business development, operations field, crisis handling, event, negotiation, account executive.",
  },
  ESFP: {
    name: "Performer / Entertainer",
    summary: "Ramah, ekspresif, adaptif, dan kuat membangun energi sosial serta pengalaman positif.",
    strengths: "Komunikatif, spontan, mudah membangun relasi, tanggap pada suasana, dan baik dalam pelayanan atau engagement.",
    watchouts: "Dapat kurang menyukai pekerjaan monoton/detail panjang, mudah terdistraksi, dan perlu struktur agar target tetap tercapai.",
    workStyle: "Efektif pada pekerjaan interaktif, praktis, berorientasi orang, dan memberi variasi aktivitas.",
    communication: "Butuh komunikasi hangat, konkret, cepat, dan lebih hidup bila ada contoh nyata atau interaksi langsung.",
    suitableRoles: "Customer relations, sales, hospitality, event, training delivery, public relations, front office, community.",
  },
  ENFP: {
    name: "Campaigner / Inspirer",
    summary: "Antusias, kreatif, people-oriented, dan kuat melihat peluang serta menggerakkan orang melalui ide.",
    strengths: "Inspiratif, fleksibel, cepat membuat koneksi, kuat dalam brainstorming, networking, dan memahami motivasi orang.",
    watchouts: "Dapat kesulitan menjaga fokus pada detail rutin, terlalu banyak ide sekaligus, dan perlu sistem follow-through.",
    workStyle: "Efektif pada lingkungan terbuka, kolaboratif, kreatif, dan memberi ruang eksplorasi.",
    communication: "Responsif pada diskusi visioner, apresiasi, kebebasan ide, dan tujuan yang terasa bermakna.",
    suitableRoles: "Marketing, employer branding, HR development, creative strategy, community, partnership, innovation, training.",
  },
  ENTP: {
    name: "Debater / Visionary",
    summary: "Cepat berpikir, eksploratif, argumentatif secara ide, dan kuat melihat kemungkinan baru.",
    strengths: "Inovatif, strategis, adaptif, cepat membaca peluang, mampu menantang asumsi, dan mencari cara lebih efektif.",
    watchouts: "Dapat tampak konfrontatif, bosan pada rutinitas, kurang menuntaskan detail, dan perlu prioritas eksekusi yang tegas.",
    workStyle: "Efektif pada peran yang menuntut ide baru, negosiasi, strategi, pemecahan masalah, dan perubahan.",
    communication: "Cocok dengan diskusi terbuka, logis, cepat, dan memberi ruang debat konstruktif.",
    suitableRoles: "Business development, product strategy, consulting, entrepreneurship, marketing strategy, innovation, negotiation.",
  },
  ESTJ: {
    name: "Supervisor / Executive",
    summary: "Tegas, terorganisir, realistis, dan kuat mengarahkan orang serta proses menuju target.",
    strengths: "Leadership operasional, disiplin, berorientasi hasil, jelas dalam ekspektasi, dan kuat dalam kontrol progres.",
    watchouts: "Dapat terlihat dominan, kurang fleksibel terhadap pendekatan alternatif, dan perlu menjaga empati saat memberi koreksi.",
    workStyle: "Efektif pada struktur yang jelas, target tinggi, pembagian tanggung jawab, dan akuntabilitas kuat.",
    communication: "Butuh komunikasi langsung, data/status jelas, keputusan cepat, dan komitmen tindakan.",
    suitableRoles: "Operations manager, supervisor, project manager, sales manager, administration head, logistics, compliance lead.",
  },
  ESFJ: {
    name: "Provider / Consul",
    summary: "Kooperatif, suportif, terorganisir, dan kuat menjaga relasi serta kebutuhan kelompok.",
    strengths: "Ramah, bertanggung jawab, peka terhadap kebutuhan orang, kuat dalam koordinasi, pelayanan, dan menjaga keteraturan sosial.",
    watchouts: "Dapat terlalu membutuhkan penerimaan sosial, menghindari konflik, dan perlu menjaga objektivitas saat keputusan tidak populer.",
    workStyle: "Efektif pada lingkungan kolaboratif, jelas, stabil, dan menghargai kontribusi interpersonal.",
    communication: "Lebih nyaman dengan komunikasi hangat, jelas, menghargai usaha, dan memperhatikan dampak pada tim.",
    suitableRoles: "HR, customer success, administration, coordinator, education, healthcare service, employee relations, hospitality.",
  },
  ENFJ: {
    name: "Teacher / Protagonist",
    summary: "Karismatik, empatik, terarah, dan kuat mengembangkan orang serta menyatukan kelompok pada tujuan bersama.",
    strengths: "Mampu memotivasi, membaca dinamika tim, membangun komitmen, memfasilitasi komunikasi, dan mengarahkan perubahan manusiawi.",
    watchouts: "Dapat terlalu mengambil tanggung jawab emosional tim, sulit mengatakan tidak, dan perlu menjaga batas objektivitas.",
    workStyle: "Efektif pada peran people leadership, coaching, komunikasi, dan transformasi organisasi.",
    communication: "Responsif pada tujuan bersama, dampak manusia, apresiasi, dan dialog dua arah.",
    suitableRoles: "HR manager, learning development, trainer, public relations, organizational development, team lead, partnership.",
  },
  ENTJ: {
    name: "Commander / Fieldmarshal",
    summary: "Strategis, tegas, visioner, dan kuat mengorganisasi sumber daya untuk mencapai target besar.",
    strengths: "Leadership kuat, berpikir sistemik, berani mengambil keputusan, fokus pada hasil, dan mampu membangun arah jangka panjang.",
    watchouts: "Dapat terlalu menekan, kurang sabar pada proses emosional, dan perlu mendengar perspektif tim sebelum eksekusi besar.",
    workStyle: "Efektif pada tantangan besar, wewenang jelas, target ambisius, dan ruang membuat perubahan sistemik.",
    communication: "Butuh komunikasi langsung, logis, berbasis strategi, opsi keputusan, dan ukuran keberhasilan.",
    suitableRoles: "General manager, business head, strategy lead, entrepreneur, project director, operations director, management consultant.",
  },
};

export const buildMbtiInterpretation = (categories: Record<string, number>) => {
  const rows = getMbtiRows(categories);
  const type = rows.map((row) => row.dominant).join("");
  const typeProfile = MBTI_TYPE_PROFILES[type];
  const profile = rows.map((row) => row.description).join(", ");
  const distribution = rows.map((row) => `${row.pair}: ${row.a}=${row.av}, ${row.b}=${row.bv} (${row.dominant} ${row.strength}%)`).join("; ");
  const balanceNotes = rows
    .filter((row) => row.strength > 0 && row.strength < 60)
    .map((row) => row.pair)
    .join(", ");

  return `PROFIL UTAMA
- Tipe MBTI: ${type}${typeProfile ? ` - ${typeProfile.name}` : ""}
- Gambaran preferensi: kandidat ${profile}.

RINGKASAN TIPE
- ${typeProfile?.summary || "Profil tipe menunjukkan kombinasi preferensi kepribadian kandidat pada empat pasangan dimensi MBTI."}

KEKUATAN UTAMA
- ${typeProfile?.strengths || "Kekuatan utama perlu dibaca dari dimensi dominan dan konteks pekerjaan."}

AREA PERHATIAN
- ${typeProfile?.watchouts || "Area perhatian perlu divalidasi melalui wawancara dan observasi perilaku kerja."}

GAYA KERJA
- ${typeProfile?.workStyle || "Gaya kerja dipengaruhi oleh preferensi energi, cara mengolah informasi, pengambilan keputusan, dan struktur kerja."}

GAYA KOMUNIKASI
- ${typeProfile?.communication || "Komunikasi paling efektif mengikuti preferensi dominan kandidat dan kebutuhan situasi kerja."}

KECOCOKAN PERAN
- ${typeProfile?.suitableRoles || "Gunakan hasil ini untuk mendukung pemetaan peran, bukan sebagai satu-satunya dasar keputusan."}

DISTRIBUSI PASANGAN DIMENSI
- ${distribution}.
${balanceNotes ? `- Pasangan ${balanceNotes} relatif seimbang, sehingga perilaku kandidat pada dimensi tersebut dapat lebih situasional dan perlu divalidasi melalui wawancara.` : ""}

CATATAN PSIKOLOG
- Hasil MBTI dibaca sebagai preferensi gaya kerja, komunikasi, pengambilan keputusan, dan kebutuhan lingkungan kerja.
- MBTI bukan ukuran kemampuan mutlak, bukan diagnosis klinis, dan bukan penentu tunggal kelayakan kandidat.
- Interpretasi akhir tetap perlu dipadukan dengan wawancara, observasi perilaku, riwayat kerja, serta tuntutan jabatan.`;
};
