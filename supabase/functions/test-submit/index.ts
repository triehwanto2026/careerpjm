// Server-side scoring for psychological tests. Reads answer keys (is_correct / score_value)
// with the service role so they never leave the database; computes per-instrument results
// and persists test_results + test_answers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Candidate = {
  id?: string | null;
  name?: string;
  email?: string;
  position?: string;
  phone?: string;
  birth_date?: string;
  education?: string;
  gender?: string;
  photo_url?: string | null;
};

type SubmissionPayload = {
  candidate: Candidate;
  snap_url?: string | null;
  instruments: { id: string; answers: Record<string, string> }[];
};

const safeParseArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const compactJoin = (parts: Array<unknown>) =>
  parts.map((part) => String(part || "").trim()).filter(Boolean).join(" - ");

const getLatestEducationText = (profile: any, fallback = "") => {
  const history = safeParseArray(profile?.education_history);
  const latest = history.length > 0 ? history[history.length - 1] : null;
  if (latest) {
    const text = compactJoin([
      latest.level || latest.education_level || latest.degree,
      latest.major || latest.field_of_study || latest.education_major,
      latest.school || latest.institution || latest.education_institution,
      latest.end_year || latest.graduation_year || latest.year,
    ]);
    if (text) return text;
  }
  return compactJoin([profile?.education_level, profile?.education_major, profile?.education_institution]) || fallback;
};

const IST_SUBTEST_MAX: Record<string, number> = {
  SE: 20,
  WA: 20,
  AN: 20,
  GE: 32,
  RA: 20,
  ZR: 20,
  FA: 20,
  WU: 20,
  ME: 20,
};

const APTITUDE_AREAS: Record<string, { label: string; max: number }> = {
  Verbal: { label: "Verbal", max: 11 },
  Numerical: { label: "Numerik", max: 10 },
  Logic: { label: "Logika", max: 6 },
  Classification: { label: "Klasifikasi", max: 12 },
  Pattern: { label: "Pola", max: 3 },
  Abstract: { label: "Figural/Abstrak", max: 18 },
};

const classifyAptitudeIq = (iq: number) => {
  if (iq < 85) return "Kecerdasan di bawah rata-rata";
  if (iq < 100) return "Kecerdasan rata-rata";
  if (iq < 115) return "Kecerdasan di atas rata-rata";
  if (iq < 130) return "Kecerdasan tinggi";
  if (iq < 145) return "Kecerdasan superior";
  return "Sangat berbakat";
};

const getAptitudeLevel = (score: number) => {
  if (score >= 145) return { label: "Sangat berbakat", recommendation: "Sangat Disarankan" };
  if (score >= 130) return { label: "Kecerdasan superior", recommendation: "Sangat Disarankan" };
  if (score >= 115) return { label: "Kecerdasan tinggi", recommendation: "Disarankan" };
  if (score >= 100) return { label: "Kecerdasan di atas rata-rata", recommendation: "Disarankan" };
  if (score >= 85) return { label: "Kecerdasan rata-rata", recommendation: "Cukup Disarankan" };
  return { label: "Kecerdasan di bawah rata-rata", recommendation: "Perlu Pertimbangan" };
};

const buildAptitudeInterpretation = (cats: Record<string, number>, score: number, answered: number, total: number) => {
  const rows = Object.entries(APTITUDE_AREAS).map(([key, area]) => {
    const raw = Number(cats[key] || 0);
    const pct = Math.round((raw / area.max) * 100);
    const level = pct >= 80 ? "Sangat Baik" : pct >= 65 ? "Baik" : pct >= 50 ? "Cukup" : pct >= 35 ? "Rendah" : "Sangat Rendah";
    return { key, ...area, raw, pct, level };
  });
  const level = getAptitudeLevel(score);
  const strongest = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 2);
  const weakest = [...rows].sort((a, b) => a.pct - b.pct).slice(0, 2);
  const correct = Number(cats.correct_answers ?? cats["Aptitude Raw Score"] ?? Math.round((score / 100) * Math.max(total, 1)));
  const wrong = Math.max(0, answered - correct);

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return `Hasil Aptitude Test menunjukkan estimasi IQ ${score} (${correct} benar dari ${total} soal; ${percentage}%; ${wrong} salah dari ${answered} soal dijawab). Klasifikasi IQ: ${classifyAptitudeIq(score)}. Kategori umum: ${level.label}. Rekomendasi seleksi: ${level.recommendation}.

Kekuatan relatif kandidat tampak pada ${strongest.map((row) => `${row.label} ${row.raw}/${row.max} (${row.pct}%)`).join(" dan ")}.

Area yang perlu diperhatikan adalah ${weakest.map((row) => `${row.label} ${row.raw}/${row.max} (${row.pct}%)`).join(" dan ")}. Area ini sebaiknya divalidasi melalui wawancara berbasis kasus, riwayat pendidikan/kerja, dan contoh pekerjaan yang relevan.

Profil aspek: ${rows.map((row) => `${row.label}: ${row.raw}/${row.max} (${row.level})`).join("; ")}.

Catatan skoring: tes menggunakan correct-only scoring. Setiap jawaban benar bernilai 1, jawaban salah atau kosong bernilai 0. Raw score dikonversi menjadi estimasi IQ untuk laporan hasil. Interpretasi ini bukan keputusan tunggal; gunakan bersama hasil wawancara, observasi perilaku saat tes, pengalaman kerja, dan tuntutan jabatan.`;
};

const CFIT_IQ_TABLE: Record<number, { iq: number; classification: string }> = {
  49: { iq: 183, classification: "Genius" },
  48: { iq: 179, classification: "Genius" },
  47: { iq: 176, classification: "Genius" },
  46: { iq: 173, classification: "Genius" },
  45: { iq: 169, classification: "Very Superior" },
  44: { iq: 167, classification: "Very Superior" },
  43: { iq: 165, classification: "Very Superior" },
  42: { iq: 161, classification: "Very Superior" },
  41: { iq: 157, classification: "Very Superior" },
  40: { iq: 155, classification: "Very Superior" },
  39: { iq: 152, classification: "Very Superior" },
  38: { iq: 149, classification: "Very Superior" },
  37: { iq: 145, classification: "Very Superior" },
  36: { iq: 142, classification: "Very Superior" },
  35: { iq: 140, classification: "Very Superior" },
  34: { iq: 137, classification: "Superior" },
  33: { iq: 133, classification: "Superior" },
  32: { iq: 131, classification: "Superior" },
  31: { iq: 128, classification: "Superior" },
  30: { iq: 124, classification: "Superior" },
  29: { iq: 121, classification: "Superior" },
  28: { iq: 119, classification: "High Average" },
  27: { iq: 116, classification: "High Average" },
  26: { iq: 113, classification: "High Average" },
  25: { iq: 109, classification: "Average" },
  24: { iq: 106, classification: "Average" },
  23: { iq: 103, classification: "Average" },
  22: { iq: 100, classification: "Average" },
  21: { iq: 96, classification: "Average" },
  20: { iq: 94, classification: "Average" },
  19: { iq: 91, classification: "Average" },
  18: { iq: 88, classification: "Low Average" },
  17: { iq: 85, classification: "Low Average" },
  16: { iq: 81, classification: "Low Average" },
  15: { iq: 78, classification: "Borderline" },
  14: { iq: 75, classification: "Borderline" },
  13: { iq: 72, classification: "Borderline" },
  12: { iq: 70, classification: "Borderline" },
  11: { iq: 67, classification: "Mild" },
  10: { iq: 65, classification: "Mild" },
  9: { iq: 60, classification: "Mild" },
  8: { iq: 57, classification: "Mild" },
  7: { iq: 55, classification: "Mild" },
  6: { iq: 52, classification: "Mild" },
  5: { iq: 48, classification: "Moderate" },
  4: { iq: 47, classification: "Moderate" },
  3: { iq: 45, classification: "Moderate" },
  2: { iq: 43, classification: "Moderate" },
  1: { iq: 40, classification: "Moderate" },
  0: { iq: 38, classification: "Moderate" },
};

const getCfitIqInfo = (rawScore: number) => {
  const raw = Math.max(0, Math.min(49, Math.round(rawScore)));
  return CFIT_IQ_TABLE[raw] || CFIT_IQ_TABLE[0];
};

const MBTI_DIMS = ["E", "I", "S", "N", "T", "F", "J", "P"];
const normalizeMbtiDim = (value?: string | null) => {
  const key = String(value || "").trim().toUpperCase();
  if (MBTI_DIMS.includes(key)) return key;
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

const getMbtiType = (cats: Record<string, number>) =>
  [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]]
    .map(([a, b]) => Number(cats[a] || 0) >= Number(cats[b] || 0) ? a : b)
    .join("");

const buildMbtiInterpretation = (cats: Record<string, number>, answered: number, total: number, testName: string) => {
  const type = getMbtiType(cats);
  const labels: Record<string, string> = {
    E: "lebih energik melalui interaksi sosial",
    I: "lebih nyaman memproses secara reflektif dan mandiri",
    S: "praktis, faktual, dan berorientasi detail nyata",
    N: "konseptual, imajinatif, dan melihat kemungkinan",
    T: "menimbang keputusan secara logis dan objektif",
    F: "menimbang keputusan dengan empati dan dampak personal",
    J: "menyukai struktur, rencana, dan kepastian",
    P: "fleksibel, adaptif, dan terbuka pada perubahan",
  };
  const distribution = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]]
    .map(([a, b]) => `${a}/${b}: ${a}=${Number(cats[a] || 0)}, ${b}=${Number(cats[b] || 0)}`)
    .join("; ");
  return `Kandidat menjawab ${answered} dari ${total} soal pada tes ${testName}. Tipe MBTI kandidat adalah ${type}. Profil ini menunjukkan kandidat ${type.split("").map((key) => labels[key]).join(", ")}.

Distribusi pasangan dimensi: ${distribution}. Hasil MBTI dibaca sebagai preferensi gaya kerja dan komunikasi, bukan ukuran kemampuan mutlak.`;
};

const PAPI_LABELS: Record<string, string> = {
  A: "Need to Achieve",
  B: "Need to Belong to Groups",
  C: "Organized Type",
  D: "Interest in Working with Details",
  E: "Emotional Resistance",
  F: "Need to Support Authority",
  G: "Hard Intense Worked",
  I: "Ease in Decision Making",
  K: "Need to be Forceful",
  L: "Leadership Role",
  N: "Need to Finish Task",
  O: "Need for Closeness and Affection",
  P: "Need to Control Others",
  R: "Theoretical Type",
  S: "Social Extension",
  T: "Pace",
  V: "Vigorous Type",
  W: "Need for Rules and Supervision",
  X: "Need to be Noticed",
  Z: "Need for Change",
};

const PAPI_MAX_SCORES: Record<string, number> = {
  N: 9, E: 9, F: 9, W: 9,
  G: 9, A: 9, L: 9, P: 9, I: 9, T: 9, V: 9, X: 9, S: 9, B: 9,
  O: 9, R: 9, D: 9, C: 9, Z: 9, K: 9,
};

const buildPapiInterpretation = (cats: Record<string, number>, answeredCount: number, totalQuestions: number) => {
  const papiCodes = Object.keys(PAPI_MAX_SCORES).sort();
  const validatedCats: Record<string, number> = {};
  let totalScore = 0;
  const errors: string[] = [];

  // Validate each dimension against its maximum
  papiCodes.forEach((code) => {
    const raw = Math.round(Number(cats[code] || 0));
    const max = PAPI_MAX_SCORES[code] || 9;
    if (raw > max) {
      errors.push(`${code}: ${raw}/${max} MELEBIHI MAKSIMUM`);
      validatedCats[code] = raw; // Keep raw for reporting
    } else {
      validatedCats[code] = raw;
    }
    totalScore += raw;
  });

  // Check total vs answered count
  if (totalScore !== answeredCount && answeredCount > 0) {
    errors.push(`Total skor ${totalScore} ≠ jawaban terisi ${answeredCount}`);
  }

  // Check for complete 90-question test
  if (answeredCount === 90 && totalScore !== 90) {
    errors.push(`PAPI 90 soal: total skor harus = 90, tapi ${totalScore}`);
  }

  // Build rows for display
  const rows = papiCodes
    .map((code) => ({
      code,
      label: PAPI_LABELS[code] || "Unknown",
      value: validatedCats[code],
      max: PAPI_MAX_SCORES[code],
    }))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));

  const top = rows.slice(0, 4);
  const low = rows.filter((row) => row.value <= 2).slice(0, 4);

  // If errors, show validation warning
  if (errors.length > 0) {
    return `STATUS VALIDASI: INVALID ⚠️\n\nInterpretasi PAPI tidak ditampilkan karena scoring belum valid.\n\nError Detail:\n${errors.map((e) => `• ${e}`).join("\n")}\n\nPeriksa:\n• Mapping kategori_target soal di database\n• Jawaban peserta (cek duplikasi atau multiple attempts)\n• Total jawaban vs total skor\n\nProfil skor mentah:\n${rows.map((r) => `${r.code}: ${r.value}/${r.max}`).join(", ")}`;
  }

  return `Kandidat menjawab ${answeredCount} dari ${totalQuestions} soal PAPI Kostick. 

PROFIL DOMINAN
${top.map((row) => `• ${row.code} - ${row.label}: ${row.value}/${row.max}`).join("\n")}

${low.length ? `PROFIL RENDAH\n${low.map((row) => `• ${row.code} - ${row.label}: ${row.value}/${row.max}`).join("\n")}\n\n` : ""}INTERPRETASI
PAPI Kostick membaca 20 skala dimensi yang merepresentasikan kebutuhan (needs) dan peran kerja (roles) dalam konteks pekerjaan. Profil ini membantu memahami motivasi kerja, preferensi gaya kerja, dan dinamika interpersonal kandidat.

Catatan psikolog: Interpretasi PAPI perlu dipadukan dengan wawancara mendalam, tuntutan jabatan, riwayat kerja, observasi perilaku saat tes, dan feedback tim sebelum menjadi dasar keputusan seleksi atau pengembangan.`;
};

const MSDT_STYLES: Record<string, { label: string; description: string; strength: string; risk: string }> = {
  Democratic: { label: "Demokratis / Partisipatif", description: "melibatkan bawahan dan membangun keputusan melalui partisipasi", strength: "membangun komitmen dan kolaborasi", risk: "dapat lambat saat keputusan cepat diperlukan" },
  Executive: { label: "Eksekutif / Integratif", description: "menyeimbangkan target, ketegasan, dan perhatian terhadap orang", strength: "mengarah pada hasil sambil menjaga akuntabilitas", risk: "perlu menjaga agar tidak terlalu mengambil kendali akhir" },
  Autocratic: { label: "Otoriter / Direktif", description: "menekankan kontrol, instruksi jelas, tenggat, dan hasil", strength: "efektif pada kondisi mendesak atau tim baru", risk: "dapat menurunkan inisiatif bila terlalu dominan" },
  Bureaucratic: { label: "Birokratis / Berbasis Aturan", description: "menekankan prosedur, aturan, struktur, dan kepatuhan", strength: "menjaga konsistensi dan kontrol risiko", risk: "dapat terasa kaku bila perubahan cepat diperlukan" },
  Developer: { label: "Pengembang / Coaching", description: "berorientasi pada pembinaan dan pertumbuhan bawahan", strength: "membangun kapasitas tim jangka panjang", risk: "bantuan perlu dijaga agar tidak mengambil alih tanggung jawab" },
  "Human Relations": { label: "Relasi Manusia / Harmonis", description: "mengutamakan hubungan personal, penerimaan, dan suasana kerja nyaman", strength: "menciptakan iklim kerja hangat", risk: "dapat menghindari keputusan sulit" },
  Compromiser: { label: "Kompromis / Politis", description: "mencari jalan tengah dan menghindari resistensi", strength: "berguna meredakan konflik", risk: "arah keputusan bisa kurang tegas" },
  "Laissez Faire": { label: "Laissez Faire / Pasif", description: "cenderung melepas kontrol atau minim intervensi", strength: "memberi otonomi pada tim matang", risk: "berisiko menurunkan kontrol, disiplin, dan kualitas" },
};

const MSDT_STYLE_ORDER = ["Democratic", "Executive", "Autocratic", "Bureaucratic", "Developer", "Human Relations", "Compromiser", "Laissez Faire"];
const MSDT_STYLE_MAX: Record<string, number> = { Democratic: 10, Executive: 14, Autocratic: 17, Bureaucratic: 20, Developer: 14, "Human Relations": 18, Compromiser: 21, "Laissez Faire": 14 };

const getMsdtRows = (categories: Record<string, number>) =>
  MSDT_STYLE_ORDER.map((style) => {
    const value = Math.max(0, Math.min(MSDT_STYLE_MAX[style], Math.round(Number(categories[style] || 0))));
    const pct = Math.round((value / Math.max(1, MSDT_STYLE_MAX[style] || 1)) * 100);
    const level = pct >= 70 ? "Dominan" : pct >= 50 ? "Menonjol" : pct >= 25 ? "Situasional" : "Rendah";
    return { style, value, pct, level, ...MSDT_STYLES[style] };
  });

const buildMsdtInterpretation = (cats: Record<string, number>, answeredCount: number, totalQuestions: number) => {
  const rows = getMsdtRows(cats);
  const totalScore = rows.reduce((sum, row) => sum + row.value, 0);
  const ranked = [...rows].sort((a, b) => b.pct - a.pct || b.value - a.value || a.style.localeCompare(b.style));
  const dominant = ranked[0];
  const secondary = ranked[1];
  const warning = answeredCount !== totalQuestions || totalScore !== answeredCount
    ? `PERINGATAN VALIDITAS\nProfil MSDT belum lengkap/konsisten. Jawaban ${answeredCount}/${totalQuestions}, total skor kategori ${totalScore}. Interpretasi perlu diverifikasi sebelum dipakai.\n\n`
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate JWT and get caller email
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userData.user?.email) return json({ error: "Unauthorized" }, 401);
    const callerEmail = userData.user.email.toLowerCase();

    const payload = (await req.json()) as SubmissionPayload;
    if (!payload?.candidate || !Array.isArray(payload.instruments)) {
      return json({ error: "Invalid payload" }, 400);
    }

    const candidateEmail = (payload.candidate.email || "").toLowerCase();
    if (candidateEmail !== callerEmail) {
      return json({ error: "Candidate mismatch" }, 403);
    }

    // Resolve candidate id
    let candidateId = payload.candidate.id || null;
    if (!candidateId) {
      const { data: existing } = await admin.from("candidates").select("id").eq("email", candidateEmail).maybeSingle();
      candidateId = existing?.id ?? null;
    }
    if (candidateId) {
      await admin.from("candidates").update({ status: "completed" }).eq("id", candidateId);
    }

    const { data: candidateProfile } = await admin
      .from("candidate_profiles")
      .select("phone, birth_date, education_level, education_major, education_institution, education_history, gender, photo_url")
      .eq("email", candidateEmail)
      .maybeSingle();
    const candidateEducation = getLatestEducationText(candidateProfile, payload.candidate.education || "");

    const instIds = payload.instruments.map((i) => i.id);
    if (instIds.length === 0) return json({ ok: true, results: [] });

    const { data: insts, error: instErr } = await admin
      .from("test_instruments")
      .select("id, name, name_en, duration_minutes, scoring_method")
      .in("id", instIds);
    if (instErr) return json({ error: instErr.message }, 500);

    const { data: qs, error: qErr } = await admin
      .from("test_questions")
      .select("*")
      .in("instrument_id", instIds)
      .order("question_number");
    if (qErr) return json({ error: qErr.message }, 500);

    const qIds = (qs || []).map((q: any) => q.id);
    const { data: opts, error: oErr } = qIds.length
      ? await admin.from("test_question_options").select("*").in("question_id", qIds).order("display_order")
      : { data: [], error: null as any };
    if (oErr) return json({ error: oErr.message }, 500);

    const optsByQ: Record<string, any[]> = {};
    (opts || []).forEach((o: any) => ((optsByQ[o.question_id] ||= []).push(o)));
    const qsByInst: Record<string, any[]> = {};
    (qs || []).forEach((q: any) => ((qsByInst[q.instrument_id] ||= []).push({ ...q, options: optsByQ[q.id] || [] })));

    const mapDisc = (t?: string | null) => {
      const x = (t || "").toUpperCase().trim();
      if (x === "D" || x === "DOMINANCE") return "D";
      if (x === "I" || x === "INFLUENCE") return "I";
      if (x === "S" || x === "STEADINESS") return "S";
      if (x === "C" || x === "COMPLIANCE") return "C";
      return x;
    };

    const results: any[] = [];

    for (const ip of payload.instruments) {
      const inst = (insts || []).find((i: any) => i.id === ip.id);
      if (!inst) continue;
      const questions = qsByInst[ip.id] || [];
      const isIst = String(inst.name || "").toUpperCase().includes("IST")
        || questions.some((q: any) => q.question_number === 61 && String(q.question_text || "").toLowerCase().includes("mawar"));
      const upperName = String(inst.name || "").toUpperCase();
      const scoringMethod = String(inst.scoring_method || "").toLowerCase();
      const isCfit = upperName.includes("CFIT") || upperName.includes("CULTURE FAIR");
      const isMbti = upperName.includes("MBTI") || scoringMethod === "typological";
      const isPapi = upperName.includes("PAPI") || scoringMethod === "papi_scales"
        || questions.some((q: any) => q.scoring_rule === "papikostik_dimension");
      const isMsdt = upperName.includes("MSDT") || upperName.includes("MANAGEMENT STYLE DIAGNOSTIC") || scoringMethod === "msdt_style";
      const isKraepelin = upperName.includes("KRAEPELIN") || scoringMethod === "speed_accuracy"
        || questions.some((q: any) => q.question_type === "numeric" || q.scoring_rule === "speed_accuracy");
      const isAptitude = upperName.includes("APTITUDE") || (
        scoringMethod === "correct_only"
        && questions.length === 60
        && questions.some((q: any) => Object.keys(APTITUDE_AREAS).includes(String(q.category || "")))
      );
      const answers = ip.answers || {};
      const cats: Record<string, number> = {};
      let correctCount = 0;
      let totalScore = 0;
      let answeredCount = 0;
      let maxPossibleScore = 0;
      const kraepelinSegmentCorrect: number[] = [];
      const kraepelinSegmentAnswered: number[] = [];

      questions.forEach((q: any) => {
        const optionMax = Math.max(0, ...(q.options || []).map((o: any) => Number(o.score_value || 0)));
        if (isIst && q.subtest_code && IST_SUBTEST_MAX[q.subtest_code]) {
          maxPossibleScore += optionMax || (q.subtest_code === "GE" ? 2 : 1);
        } else {
          maxPossibleScore += optionMax || (q.options?.some((o: any) => o.is_correct) ? 1 : 0);
        }
      });

      const categoryKey = (q: any) => {
        if (isIst && q.subtest_code) return `${q.subtest_code} - ${q.category || "IST"}`;
        return q.category?.trim() || "Umum";
      };

      const getKraepelinCorrectAnswer = (q: any) => {
        const marker = String(q.question_text_en || "").match(/CORRECT_ANSWER\s*:\s*(\d+)/i);
        if (marker) return marker[1];
        const sum = String(q.question_text || "").match(/(\d+)\s*\+\s*(\d+)/);
        if (!sum) return null;
        return String((Number(sum[1]) + Number(sum[2])) % 10);
      };

      const safeQuestionTextEn = (q: any) =>
        String(q.question_text_en || "").toUpperCase().startsWith("CORRECT_ANSWER:") ? null : q.question_text_en;

      for (const q of questions) {
        const optId = answers[q.id];
        if (!optId) continue;
        answeredCount++;
        if (q.question_type === "numeric" || isKraepelin) {
          const selected = String(optId).replace(/\D/g, "");
          const correctAnswer = getKraepelinCorrectAnswer(q);
          const isCorrect = correctAnswer !== null && selected === correctAnswer;
          if (isCorrect) correctCount++;
          const parsedSubtest = Number(String(q.subtest_code || "").replace(/\D/g, ""));
          const fallbackSegmentSize = Math.max(1, Math.ceil(questions.length / 20));
          const segment = Math.max(0, (Number(q.group_number || parsedSubtest || Math.floor((Number(q.question_number || 1) - 1) / fallbackSegmentSize) + 1) - 1));
          kraepelinSegmentAnswered[segment] = (kraepelinSegmentAnswered[segment] || 0) + 1;
          kraepelinSegmentCorrect[segment] = (kraepelinSegmentCorrect[segment] || 0) + (isCorrect ? 1 : 0);
          continue;
        }
        if (q.question_type === "disc_pair" && String(optId).includes("|")) {
          const parts: Record<string, string> = { M: "", L: "" };
          String(optId).split("|").forEach((p) => {
            const [k, v] = p.split(":");
            if (k && v) parts[k] = v;
          });
          const mOpt = q.options.find((o: any) => o.id === parts.M);
          const lOpt = q.options.find((o: any) => o.id === parts.L);
          if (mOpt?.category_target) {
            const d = mapDisc(mOpt.category_target);
            cats[d] = (cats[d] || 0) + 1;
            cats[`${d}_M`] = (cats[`${d}_M`] || 0) + 1;
          }
          if (lOpt?.category_target) {
            const d = mapDisc(lOpt.category_target);
            cats[d] = (cats[d] || 0) - 1;
            cats[`${d}_L`] = (cats[`${d}_L`] || 0) + 1;
          }
          continue;
        }
        if (q.question_type === "multi_choice" && String(optId).includes("+")) {
          const ids = String(optId).split("+").filter(Boolean);
          const picked = q.options.filter((o: any) => ids.includes(o.id));
          const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every((id) => correctIds.includes(id));
          if (allCorrect) correctCount++;
          if (isCfit) {
            const dim = categoryKey(q);
            const scoreValue = allCorrect ? 1 : 0;
            totalScore += scoreValue;
            cats[dim] = (cats[dim] || 0) + scoreValue;
            continue;
          }
          picked.forEach((opt: any) => {
            totalScore += Number(opt.score_value || 0);
            const dim = opt.category_target?.trim() || categoryKey(q);
            cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        if (!opt) continue;
        const mbtiDim = isMbti ? normalizeMbtiDim(opt.category_target || opt.option_label || opt.option_text) : null;
        const optScore = (isPapi && opt.category_target) || mbtiDim ? 1 : Number(opt.score_value || 0);
        totalScore += optScore;
        if (opt.is_correct) correctCount++;
        const dim = mbtiDim || opt.category_target?.trim() || categoryKey(q);
        cats[dim] = (cats[dim] || 0) + optScore;
      }

      const hasCorrectScoring = questions.some(
        (q: any) => q.scoring_rule === "correct_only" || q.options.some((o: any) => o.is_correct),
      );
      let kraepelinMetrics: Record<string, number> | null = null;
      if (isKraepelin) {
        const speed = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
        const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
        const workCapacity = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
        const activeSegments = kraepelinSegmentAnswered
          .map((answered, i) => ({ answered: answered || 0, correct: kraepelinSegmentCorrect[i] || 0 }))
          .filter((s) => s.answered > 0);
        const avg = activeSegments.length > 0
          ? activeSegments.reduce((sum, s) => sum + s.correct, 0) / activeSegments.length
          : 0;
        const variance = activeSegments.length > 0
          ? activeSegments.reduce((sum, s) => sum + Math.pow(s.correct - avg, 2), 0) / activeSegments.length
          : 0;
        const sd = Math.sqrt(variance);
        const stability = avg > 0 ? Math.max(0, Math.min(100, Math.round(100 - (sd / avg) * 100))) : 0;
        kraepelinMetrics = {
          speed,
          accuracy,
          stability,
          work_capacity: workCapacity,
          correct_answers: correctCount,
          wrong_answers: Math.max(0, answeredCount - correctCount),
          columns_completed: activeSegments.length,
          peak_column: activeSegments.reduce((max, s) => Math.max(max, s.correct), 0),
          average_column: Math.round(avg),
        };
        Object.assign(cats, kraepelinMetrics);
      }
      if (isAptitude) {
        cats.correct_answers = correctCount;
        cats.wrong_answers = Math.max(0, answeredCount - correctCount);
        cats.blank_answers = Math.max(0, questions.length - answeredCount);
        cats.accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
      }
      const aptitudePercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const aptitudeIqInfo = isAptitude
        ? (() => {
            const info = getCfitIqInfo(Math.min(49, Math.round((correctCount / Math.max(questions.length, 1)) * 49)));
            return { ...info, classification: classifyAptitudeIq(info.iq) };
          })()
        : null;
      const score = isKraepelin && kraepelinMetrics
        ? Math.round((kraepelinMetrics.accuracy + kraepelinMetrics.work_capacity) / 2)
        : isAptitude && aptitudeIqInfo
          ? aptitudeIqInfo.iq
        : isIst && maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 100)
          : isMbti
            ? Math.round((answeredCount / Math.max(questions.length, 1)) * 100)
          : hasCorrectScoring && questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
      const status = isAptitude
        ? score >= 115 ? "passed" : score >= 85 ? "review" : "failed"
        : score >= 70 ? "passed" : score >= 50 ? "review" : "failed";

      const normalizedCats: Record<string, number> = {};
            // Normalize category keys for aptitude tests so stored keys match frontend expectations
            const normalizeKey = (value: string | null | undefined) => String(value || "").trim().toLowerCase().replace(/[_\s\/\-]+/g, " ");
            const APTITUDE_CATEGORY_ALIASES: Record<string, string[]> = {
              Verbal: ["verbal ability", "verbal aptitude", "verbal_ability", "kemampuan verbal", "verbal"],
              Numerical: ["numerical ability", "numerical aptitude", "numerical_ability", "numerik", "kemampuan numerik", "numerical"],
              Logic: ["logical reasoning", "logic", "logical_reasoning", "reasoning logic", "kemampuan logika", "logic"],
              Classification: ["classifications", "classification", "klasifikasi", "classification ability", "classification"],
              Pattern: ["pattern recognition", "pattern", "pola", "pattern_recognition", "pattern"],
              Abstract: ["abstract reasoning", "figural", "abstract", "figural/abstrak", "kemampuan abstrak", "abstract"],
            };

            const resolveAptitudeCategoryKey = (value: string | null | undefined) => {
              const normalized = normalizeKey(value);
              if (!normalized) return null;
              const exact = Object.keys(APTITUDE_AREAS).find((k) => normalizeKey(k) === normalized);
              if (exact) return exact;
              const alias = Object.entries(APTITUDE_CATEGORY_ALIASES).find(([, aliases]) =>
                aliases.some((a) => normalizeKey(a) === normalized),
              );
              if (alias) return alias[0];
              const fuzzy = Object.keys(APTITUDE_AREAS).find((k) => normalized.includes(normalizeKey(k)));
              return fuzzy ?? null;
            };

            if (isAptitude) {
              const mapped: Record<string, number> = {};
              Object.entries(cats).forEach(([k, v]) => {
                const resolved = resolveAptitudeCategoryKey(k);
                if (resolved) mapped[resolved] = (mapped[resolved] || 0) + Math.round(v);
                else mapped[k] = (mapped[k] || 0) + Math.round(v);
              });
              // Ensure all aptitude area keys exist and are numeric
              Object.keys(APTITUDE_AREAS).forEach((ak) => (normalizedCats[ak] = mapped[ak] || 0));
              // copy over standard metadata fields if present
              ["correct_answers", "wrong_answers", "blank_answers", "accuracy"].forEach((k) => {
                if (cats[k] !== undefined) normalizedCats[k] = Math.round(cats[k]);
              });
            } else {
              Object.entries(cats).forEach(([k, v]) => (normalizedCats[k] = Math.round(v)));
            }
            if (isPapi) {
              const papiCodes = Object.keys(PAPI_MAX_SCORES);
              const invalidKeys = Object.keys(normalizedCats).filter((key) => !papiCodes.includes(key));
              if (invalidKeys.length > 0) {
                throw new Error(`Mapping PAPI invalid pada skala: ${invalidKeys.join(", ")}`);
              }

              // Normalize PAPI counts to integers, but preserve raw totals for validation.
              papiCodes.forEach((code) => {
                normalizedCats[code] = Math.max(0, Math.round(Number(normalizedCats[code] || 0)));
              });

              // Ensure all PAPI dimensions are present (fill missing with 0)
              papiCodes.forEach((code) => {
                if (normalizedCats[code] === undefined) normalizedCats[code] = 0;
              });

              const papiTotal = papiCodes.reduce((sum, code) => sum + normalizedCats[code], 0);
              if (answeredCount > 0 && papiTotal !== answeredCount) {
                console.warn(`PAPI score mismatch: total=${papiTotal}, answered=${answeredCount}`);
              }
            }
            if (isMsdt) {
              if (questions.length !== 64 || answeredCount !== 64) {
                throw new Error(`Profil MSDT tidak lengkap: ${answeredCount} dari ${questions.length} soal. Scoring memerlukan tepat 64 jawaban.`);
              }
              const invalidKeys = Object.keys(normalizedCats).filter((key) => !MSDT_STYLE_ORDER.includes(key));
              if (invalidKeys.length > 0) {
                throw new Error(`Mapping MSDT invalid pada kategori: ${invalidKeys.join(", ")}`);
              }
              MSDT_STYLE_ORDER.forEach((style) => {
                normalizedCats[style] = Math.max(0, Math.round(Number(normalizedCats[style] || 0)));
              });
              const msdtTotal = MSDT_STYLE_ORDER.reduce((sum, style) => sum + normalizedCats[style], 0);
              if (msdtTotal !== 64) {
                throw new Error(`Total scoring MSDT ${msdtTotal}, seharusnya 64. Periksa category_target bank soal.`);
              }
            }
      const cfitIqInfo = isCfit ? getCfitIqInfo(correctCount) : null;

      const { data: resultData, error: insErr } = await admin
        .from("test_results")
        .insert({
          candidate_id: candidateId,
          candidate_name: payload.candidate.name || "Unknown",
          position: payload.candidate.position || "",
          test_name: inst.name,
          score,
          total_questions: questions.length,
          answered_questions: answeredCount,
          categories: isIst
            ? { ...normalizedCats, "IST Raw Score": Math.round(totalScore), "IST Max Score": Math.round(maxPossibleScore) }
            : isCfit && cfitIqInfo
              ? { ...normalizedCats, "CFIT Raw Score": correctCount, "CFIT Max Score": questions.length, "CFIT IQ": cfitIqInfo.iq }
            : isAptitude
              ? {
                  ...normalizedCats,
                  "Aptitude Raw Score": correctCount,
                  "Aptitude Max Score": questions.length,
                  "Aptitude Percentage": aptitudePercentage,
                  "Aptitude IQ": aptitudeIqInfo?.iq || score,
                  "Aptitude IQ Classification": aptitudeIqInfo?.classification || "",
                }
            : normalizedCats,
          status,
          interpretation: isIst
            ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Skor mentah ${Math.round(totalScore)} dari maksimum ${Math.round(maxPossibleScore)}; skor akhir ${score}%.

Insight umum: hasil IST menggambarkan struktur kemampuan intelektual kandidat pada aspek verbal, konseptual, numerik, figural-spasial, dan memori. Distribusi subtes perlu dibaca untuk melihat kekuatan relatif dan area yang memerlukan dukungan, bukan hanya skor total.

Profil subtes: ${Object.entries(normalizedCats).filter(([key]) => /^[A-Z]{2}\s*-/.test(key)).map(([key, value]) => `${key}=${value}`).join("; ")}.

Catatan psikolog: interpretasi IST perlu dipadukan dengan wawancara, riwayat pendidikan/kerja, observasi perilaku saat tes, dan tuntutan jabatan. Skor rendah pada satu subtes tidak otomatis menggugurkan kandidat bila aspek tersebut tidak dominan pada posisi yang dilamar.`
            : isCfit && cfitIqInfo
              ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Raw score ${correctCount} dari ${questions.length}; estimasi IQ ${cfitIqInfo.iq} dengan klasifikasi ${cfitIqInfo.classification}.

Insight umum: CFIT 3A membaca kemampuan penalaran nonverbal, pengenalan pola, klasifikasi visual, relasi figural, dan pemecahan masalah abstrak yang relatif minim pengaruh bahasa. Hasil ini membantu memperkirakan kecepatan kandidat memahami struktur baru dan menyelesaikan masalah berbasis pola.

Profil segmen: ${Object.entries(normalizedCats).filter(([key]) => ["Series", "Classifications", "Matrices", "Conditions", "S1 - Series", "S2 - Classifications", "S3 - Matrices", "S4 - Conditions"].includes(key)).map(([key, value]) => `${key}=${value}`).join("; ")}.

Catatan psikolog: CFIT tidak berdiri sendiri sebagai keputusan akhir seleksi. Hasil perlu dipadukan dengan wawancara, observasi perilaku, riwayat pendidikan/kerja, serta tuntutan jabatan.`
            : isKraepelin && kraepelinMetrics
              ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Benar ${correctCount}, salah ${Math.max(0, answeredCount - correctCount)}. Kecepatan ${kraepelinMetrics.speed}%, ketelitian ${kraepelinMetrics.accuracy}%, stabilitas ${kraepelinMetrics.stability}%, dan kapasitas kerja ${kraepelinMetrics.work_capacity}%.`
            : isMbti
              ? buildMbtiInterpretation(normalizedCats, answeredCount, questions.length, inst.name)
            : isPapi
              ? buildPapiInterpretation(normalizedCats, answeredCount, questions.length)
            : isMsdt
              ? buildMsdtInterpretation(normalizedCats, answeredCount, questions.length)
            : isAptitude
              ? buildAptitudeInterpretation(normalizedCats, score, answeredCount, questions.length)
            : `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Skor akhir ${score}%. ${hasCorrectScoring ? `${correctCount} jawaban benar.` : "Diukur berdasar profil dimensi."}`,
          candidate_profile: payload.candidate
            ? {
                email: candidateEmail,
                phone: candidateProfile?.phone || payload.candidate.phone || "",
                birthDate: candidateProfile?.birth_date || payload.candidate.birth_date || "",
                education: candidateEducation,
                gender: candidateProfile?.gender || payload.candidate.gender || "",
                photo_url: candidateProfile?.photo_url || payload.candidate.photo_url || null,
              }
            : null,
          webcam_photo_url: payload.snap_url || null,
          speed_score: isKraepelin && kraepelinMetrics ? kraepelinMetrics.speed : null,
          accuracy_score: isKraepelin && kraepelinMetrics ? kraepelinMetrics.accuracy : null,
          stability_score: isKraepelin && kraepelinMetrics ? kraepelinMetrics.stability : null,
          work_capacity: isKraepelin && kraepelinMetrics ? kraepelinMetrics.work_capacity : null,
        })
        .select("id")
        .single();
      if (insErr || !resultData) {
        return json({ error: insErr?.message || `Failed to insert result for ${inst.name}` }, 500);
      }

      const answerRows: any[] = [];
      for (const q of questions) {
        const optId = answers[q.id];
        if (!optId) continue;
        if (q.question_type === "disc_pair" && String(optId).includes("|")) {
          const parts: Record<string, string> = { M: "", L: "" };
          String(optId).split("|").forEach((p) => {
            const [k, v] = p.split(":");
            if (k && v) parts[k] = v;
          });
          const mOpt = q.options.find((o: any) => o.id === parts.M);
          const lOpt = q.options.find((o: any) => o.id === parts.L);
          const mText = mOpt ? `${mOpt.option_label}. ${mOpt.option_text}` : "-";
          const lText = lOpt ? `${lOpt.option_label}. ${lOpt.option_text}` : "-";
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: `PALING (M): ${mText}  ·  TIDAK (L): ${lText}`,
            selected_answer_label: `M:${mOpt?.category_target || "?"} / L:${lOpt?.category_target || "?"}`,
            category: q.category,
            is_correct: null,
            correct_answer: null,
          });
          continue;
        }
        if (q.question_type === "multi_choice" && String(optId).includes("+")) {
          const ids = String(optId).split("+").filter(Boolean);
          const picked = q.options.filter((o: any) => ids.includes(o.id));
          const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every((id) => correctIds.includes(id));
          const correctOpts = q.options.filter((o: any) => o.is_correct);
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: picked.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + "),
            selected_answer_label: picked.map((o: any) => o.option_label).join("+"),
            category: q.category,
            is_correct: allCorrect,
            correct_answer: correctOpts.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + ") || null,
          });
          continue;
        }
        if (q.question_type === "numeric" || isKraepelin) {
          const selected = String(optId).replace(/\D/g, "");
          const correctAnswer = getKraepelinCorrectAnswer(q);
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: selected,
            selected_answer_label: "",
            category: q.category || "Kraepelin",
            is_correct: correctAnswer === null ? null : selected === correctAnswer,
            correct_answer: correctAnswer,
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        answerRows.push({
          test_result_id: resultData.id,
          question_number: q.question_number,
          question_text: q.question_text,
          question_text_en: safeQuestionTextEn(q),
          selected_answer: opt?.option_text || optId || "",
          selected_answer_label: opt?.option_label || "",
          category: opt?.category_target?.trim() || categoryKey(q) || null,
          is_correct: opt?.is_correct ?? null,
          correct_answer: q.options.find((o: any) => o.is_correct)?.option_text || null,
        });
      }
      if (answerRows.length > 0) {
        const { error: answerErr } = await admin.from("test_answers").insert(answerRows);
        if (answerErr) {
          await admin.from("test_results").delete().eq("id", resultData.id);
          return json({ error: answerErr.message || `Failed to insert answers for ${inst.name}` }, 500);
        }
      }
      results.push({
        instrument_id: ip.id,
        instrument_name: inst.name,
        test_result_id: resultData.id,
        score,
        status,
        kraepelin_metrics: kraepelinMetrics ? kraepelinMetrics : undefined,
      });
    }

    if (payload.instruments.length > 0 && results.length !== payload.instruments.length) {
      return json({ error: "Not all assigned test results were saved." }, 500);
    }

    return json({ ok: true, results });
  } catch (e) {
    console.error("test-submit error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
