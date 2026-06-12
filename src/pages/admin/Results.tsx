import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, Eye, Download, Printer, FileText } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { getCfitIqInfoFromResult, getCfitProfileRows, isCfitName } from "@/lib/cfitScoring";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";

const COLORS = ["#2dd4bf", "#60a5fa", "#f59e0b", "#ef4444", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];

interface ResultRow {
  id: string; candidate_id: string | null; candidate_name: string; position: string; test_name: string;
  score: number; total_questions: number; answered_questions: number;
  categories: Record<string, number>; status: string; interpretation: string | null;
  candidate_profile: Record<string, string> | null; completed_at: string;
  webcam_photo_url: string | null;
}

interface AnswerRow {
  id: string; question_number: number; question_text: string; question_text_en: string | null;
  selected_answer: string; selected_answer_label: string; correct_answer: string | null;
  is_correct: boolean | null; category: string | null;
}

const DISC_DIMS = ["D", "I", "S", "C"] as const;
type DiscDim = typeof DISC_DIMS[number];

const DISC_DIM_MAP: Record<DiscDim, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Steadiness",
  C: "Compliance",
};

const getDiscValue = (cats: Record<string, number>, dim: DiscDim, kind: "M" | "L" | "N") => {
  const fullName = DISC_DIM_MAP[dim];
  if (kind === "N") return Number(cats[dim] ?? cats[fullName] ?? 0);
  return cats[`${dim}_${kind}`] !== undefined
    ? Number(cats[`${dim}_${kind}`])
    : cats[`${fullName}_${kind}`] !== undefined
      ? Number(cats[`${fullName}_${kind}`])
      : null;
};

const buildDiscRows = (cats: Record<string, number>, totalQuestions = 24) => {
  const discLabels: Record<DiscDim, string> = {
    D: "Dominance — Pengarah, tegas, berorientasi hasil",
    I: "Influence — Persuasif, ekspresif, sosial",
    S: "Steadiness — Stabil, sabar, kooperatif",
    C: "Conscientiousness — Teliti, analitis, sistematis",
  };
  const discColors: Record<DiscDim, string> = { D: "#dc2626", I: "#f59e0b", S: "#059669", C: "#2563eb" };
  const threshold = Math.ceil(Math.max(totalQuestions, 1) * 0.25);
  const rows = DISC_DIMS.map((dim) => {
    const net = getDiscValue(cats, dim, "N");
    const m = getDiscValue(cats, dim, "M");
    const l = getDiscValue(cats, dim, "L");
    const level = net >= threshold ? "Tinggi" : net >= 1 ? "Sedang" : net <= -threshold ? "Rendah" : "Netral";
    return { dim, m, l, net, level, absNet: Math.abs(net), desc: discLabels[dim], color: discColors[dim] };
  });
  const ranked = [...rows].sort((a, b) => b.net - a.net);
  return rows.map((row) => ({ ...row, rank: ranked.findIndex((r) => r.dim === row.dim) + 1 }));
};

const IST_SUBTESTS = [
  { code: "SE", name: "Sentence Completion", max: 20, area: "Pengetahuan bahasa dan pemahaman konsep verbal" },
  { code: "WA", name: "Word Association", max: 20, area: "Kemampuan abstraksi verbal dan asosiasi kata" },
  { code: "AN", name: "Analogy", max: 20, area: "Penalaran analogis dan hubungan logis" },
  { code: "GE", name: "Generalization", max: 32, area: "Pembentukan konsep umum dan generalisasi" },
  { code: "RA", name: "Arithmetic", max: 20, area: "Kemampuan berhitung dan pemecahan masalah numerik" },
  { code: "ZR", name: "Number Series", max: 20, area: "Penalaran induktif numerik dan pola deret" },
  { code: "FA", name: "Figure Assembly", max: 20, area: "Kemampuan analisis bentuk dan konstruksi figural" },
  { code: "WU", name: "Cube Rotation", max: 20, area: "Daya bayang ruang dan rotasi mental" },
  { code: "ME", name: "Memory", max: 20, area: "Daya ingat dan retensi informasi" },
] as const;

const isIstResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  r.test_name.toUpperCase().includes("IST") || Object.keys(r.categories || {}).some((key) => /^SE\s*-|^WA\s*-|^AN\s*-|^GE\s*-/i.test(key));

const getIstSubtestScore = (cats: Record<string, number>, code: string) => {
  const match = Object.entries(cats).find(([key]) => key === code || key.startsWith(`${code} -`));
  return Number(match?.[1] || 0);
};

const getIstRows = (cats: Record<string, number>) =>
  IST_SUBTESTS.map((subtest) => {
    const raw = getIstSubtestScore(cats, subtest.code);
    const pct = Math.round((raw / subtest.max) * 100);
    const level = pct >= 80 ? "Sangat Tinggi" : pct >= 65 ? "Tinggi" : pct >= 45 ? "Sedang" : pct >= 30 ? "Rendah" : "Sangat Rendah";
    return { ...subtest, raw, pct, level };
  });

const getIstSummary = (cats: Record<string, number>, fallbackScore: number) => {
  const rows = getIstRows(cats);
  const raw = Number(cats["IST Raw Score"] ?? rows.reduce((sum, row) => sum + row.raw, 0));
  const max = Number(cats["IST Max Score"] ?? rows.reduce((sum, row) => sum + row.max, 0));
  const score = max > 0 ? Math.round((raw / max) * 100) : fallbackScore;
  const strongest = [...rows].sort((a, b) => b.pct - a.pct)[0];
  const weakest = [...rows].sort((a, b) => a.pct - b.pct)[0];
  return { rows, raw, max, score, strongest, weakest };
};

const buildIstInterpretation = (cats: Record<string, number>, fallbackScore: number) => {
  const summary = getIstSummary(cats, fallbackScore);
  const overall = summary.score >= 80 ? "sangat tinggi" : summary.score >= 65 ? "tinggi" : summary.score >= 45 ? "cukup/sedang" : summary.score >= 30 ? "rendah" : "sangat rendah";
  return `Skor total IST kandidat adalah ${summary.raw}/${summary.max} (${summary.score}%), berada pada kategori ${overall}. Kekuatan relatif terlihat pada subtes ${summary.strongest.code} - ${summary.strongest.name} (${summary.strongest.raw}/${summary.strongest.max}; ${summary.strongest.level}), sedangkan area yang perlu diperhatikan adalah ${summary.weakest.code} - ${summary.weakest.name} (${summary.weakest.raw}/${summary.weakest.max}; ${summary.weakest.level}).

Interpretasi per aspek menunjukkan gambaran struktur inteligensi: aspek verbal tercermin dari SE, WA, AN, dan GE; aspek numerik dari RA dan ZR; aspek figural-spasial dari FA dan WU; serta daya ingat dari ME. Gunakan hasil ini bersama wawancara, riwayat pendidikan, dan tuntutan jabatan sebelum mengambil keputusan akhir.`;
};

const isMbtiResult = (r: Pick<ResultRow, "test_name" | "categories">) => {
  const keys = Object.keys(r.categories || {});
  return r.test_name.toUpperCase().includes("MBTI") || ["E", "I", "S", "N", "T", "F", "J", "P"].every((k) => keys.includes(k));
};

const getMbtiSummary = (cats: Record<string, number>) => {
  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;
  const rows = pairs.map(([a, b]) => {
    const av = Number(cats[a] || 0);
    const bv = Number(cats[b] || 0);
    const dominant = av >= bv ? a : b;
    const total = av + bv || 1;
    return { pair: `${a}/${b}`, a, b, av, bv, dominant, pct: Math.round((Math.max(av, bv) / total) * 100) };
  });
  return { type: rows.map((row) => row.dominant).join(""), rows };
};

const buildMbtiInterpretation = (cats: Record<string, number>) => {
  const summary = getMbtiSummary(cats);
  const labels: Record<string, string> = {
    E: "lebih energik melalui interaksi sosial",
    I: "lebih nyaman memproses secara reflektif dan mandiri",
    S: "cenderung praktis, faktual, dan berorientasi detail nyata",
    N: "cenderung konseptual, imajinatif, dan melihat kemungkinan",
    T: "menimbang keputusan secara logis dan objektif",
    F: "menimbang keputusan dengan empati dan dampak personal",
    J: "menyukai struktur, rencana, dan kepastian",
    P: "lebih fleksibel, adaptif, dan terbuka pada perubahan",
  };
  return `Tipe MBTI kandidat adalah ${summary.type}. Profil ini menunjukkan kandidat ${summary.type.split("").map((x) => labels[x]).join(", ")}.

Distribusi pasangan dimensi: ${summary.rows.map((r) => `${r.pair}: ${r.a}=${r.av}, ${r.b}=${r.bv}`).join("; ")}. Gunakan tipe ini sebagai gambaran preferensi kerja, bukan label kemampuan mutlak.`;
};

const PAPI_LABELS: Record<string, string> = {
  A: "Need to Achieve", B: "Need to Belong to Groups", C: "Organized Type", D: "Leadership Role",
  E: "Emotional Resistance", F: "Need to Support Authority", G: "Hard Intense Worked", I: "Ease in Decision Making",
  K: "Need to be Forceful", L: "Leadership Role", N: "Need to Finish Task", O: "Need for Closeness and Affection",
  P: "Need to Control Others", R: "Theoretical Type", S: "Social Extension", T: "Pace",
  V: "Vigorous Type", W: "Need for Rules and Supervision", X: "Need to be Noticed", Z: "Need for Change",
};

const isPapiResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  r.test_name.toUpperCase().includes("PAPI") || (!isMbtiResult(r) && Object.keys(r.categories || {}).some((key) => PAPI_LABELS[key]));

const getPapiRows = (cats: Record<string, number>) =>
  Object.entries(PAPI_LABELS)
    .map(([code, label]) => {
      const value = Number(cats[code] || 0);
      const level = value >= 7 ? "Tinggi" : value >= 4 ? "Sedang" : "Rendah";
      return { code, label, value, level };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));

const buildPapiInterpretation = (cats: Record<string, number>) => {
  const rows = getPapiRows(cats);
  const top = rows.slice(0, 3);
  const low = rows.filter((row) => row.level === "Rendah").slice(0, 3);
  return `Profil PAPI Kostick menunjukkan skala paling menonjol pada ${top.map((row) => `${row.code} - ${row.label} (${row.value})`).join(", ") || "belum ada skala dominan"}.

Skala tinggi menggambarkan kebutuhan/peran kerja yang paling tampak pada kandidat. ${low.length ? `Skala yang relatif rendah: ${low.map((row) => `${row.code} - ${row.label} (${row.value})`).join(", ")}.` : ""} Interpretasi perlu dikaitkan dengan tuntutan jabatan, wawancara, dan observasi perilaku.`;
};

const isKraepelinResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  r.test_name.toUpperCase().includes("KRAEPELIN") || ["speed", "accuracy", "stability", "work_capacity"].some((key) => key in (r.categories || {}));

const getKraepelinRows = (cats: Record<string, number>) => [
  { key: "speed", label: "Kecepatan", value: Number(cats.speed || 0) },
  { key: "accuracy", label: "Ketelitian", value: Number(cats.accuracy || 0) },
  { key: "stability", label: "Stabilitas", value: Number(cats.stability || 0) },
  { key: "work_capacity", label: "Kapasitas Kerja", value: Number(cats.work_capacity || 0) },
];

const buildKraepelinInterpretation = (cats: Record<string, number>) => {
  const rows = getKraepelinRows(cats);
  const level = (v: number) => v >= 80 ? "sangat tinggi" : v >= 60 ? "tinggi" : v >= 40 ? "cukup" : v >= 20 ? "rendah" : "sangat rendah";
  return `Profil Kraepelin menunjukkan ${rows.map((row) => `${row.label.toLowerCase()} ${level(row.value)} (${row.value}%)`).join(", ")}.

Jawaban benar ${Number(cats.correct_answers || 0)} dan salah ${Number(cats.wrong_answers || 0)}. Hasil ini menggambarkan pola kerja hitung sederhana dalam tekanan waktu: kecepatan, ketelitian, konsistensi, dan kapasitas kerja perlu dibaca bersama kebutuhan jabatan.`;
};

const renderDiscPrintMiniChart = (
  title: string,
  data: { name: string; value: number }[],
  color: string,
  allowNegative = false,
) => {
  const width = 260;
  const height = 170;
  const left = 30;
  const right = 12;
  const top = 18;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = data.map((d) => d.value);
  const min = allowNegative ? Math.min(0, ...values) : 0;
  const max = Math.max(1, ...values);
  const range = Math.max(max - min, 1);
  const y = (value: number) => top + ((max - value) / range) * plotHeight;
  const points = data.map((d, i) => ({
    x: left + (data.length === 1 ? plotWidth / 2 : (i * plotWidth) / (data.length - 1)),
    y: y(d.value),
    ...d,
  }));
  const baseline = y(allowNegative ? 0 : min);
  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M ${points[0].x} ${baseline} L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${points[points.length - 1].x} ${baseline} Z`;
  const gridY = [0, 0.5, 1].map((ratio) => top + ratio * plotHeight);

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;padding:10px;">
      <p style="font-size:8.5pt;font-weight:700;color:#374151;margin-bottom:4px;text-align:center;">${title}</p>
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
        ${gridY.map((gy) => `<line x1="${left}" y1="${gy}" x2="${width - right}" y2="${gy}" stroke="#e2e8f0" stroke-width="1"/>`).join("")}
        ${allowNegative ? `<line x1="${left}" y1="${baseline}" x2="${width - right}" y2="${baseline}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,3"/>` : ""}
        <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" stroke="#94a3b8" stroke-width="1"/>
        <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="#94a3b8" stroke-width="1"/>
        <path d="${areaPath}" fill="${color}" opacity="0.16"/>
        <polyline points="${linePath}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        ${points.map((p) => `
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="8" font-weight="700" fill="#374151">${p.value > 0 ? '+' : ''}${p.value}</text>
          <text x="${p.x}" y="${height - 10}" text-anchor="middle" font-size="9" font-weight="700" fill="#64748b">${p.name}</text>
        `).join("")}
      </svg>
    </div>
  `;
};

const Results = () => {
  const location = useLocation();
  const initialSearch = (location.state as any)?.search || new URLSearchParams(location.search).get("q") || "";
  const [results, setResults] = useState<ResultRow[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedResult, setSelectedResult] = useState<ResultRow | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTest, setFilterTest] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const load = async () => {
    const { data } = await supabase.from("test_results").select("*").order("completed_at", { ascending: false });
    setResults((data as ResultRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadAnswers = async (resultId: string) => {
    const { data } = await supabase.from("test_answers").select("*").eq("test_result_id", resultId).order("question_number");
    setAnswers((data as any) as AnswerRow[]);
  };

  const handleSelectResult = async (r: ResultRow) => {
    let enrichedResult = r;
    const currentProfile = (r.candidate_profile || {}) as Record<string, any>;
    const email = currentProfile.email;
    if (email) {
      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("photo_url, phone, birth_date, education_level, education_institution, gender")
        .eq("email", email)
        .maybeSingle();
      if (candidateProfile) {
        enrichedResult = {
          ...r,
          candidate_profile: {
            ...currentProfile,
            phone: candidateProfile.phone || currentProfile.phone || "",
            birthDate: candidateProfile.birth_date || currentProfile.birthDate || "",
            education: candidateProfile.education_level || candidateProfile.education_institution || currentProfile.education || "",
            gender: candidateProfile.gender || currentProfile.gender || "",
            photo_url: candidateProfile.photo_url || currentProfile.photo_url || null,
          },
        };
      }
    }
    setSelectedResult(enrichedResult);
    await loadAnswers(r.id);
  };

  const filtered = results.filter(
    (r) => r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase()) ||
      r.test_name.toLowerCase().includes(search.toLowerCase())
  ).filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterTest !== "all" && r.test_name !== filterTest) return false;
    if (filterDateFrom && r.completed_at && r.completed_at < filterDateFrom) return false;
    if (filterDateTo && r.completed_at && r.completed_at > filterDateTo + "T23:59:59") return false;
    return true;
  });

  // Get unique test names for filter dropdown
  const uniqueTests = Array.from(new Set(results.map(r => r.test_name))).sort();

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedResults = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterTest, filterDateFrom, filterDateTo]);

  const handlePrint = () => {
    if (!selectedResult) return;
    const r = selectedResult;
    const profile = r.candidate_profile as Record<string, string> | null;
    const cats = r.categories as Record<string, number>;
    const catEntries = Object.entries(cats);
    const cfitProfileRows = isCfitName(r.test_name) ? getCfitProfileRows(r) : [];
    const maxVal = r.test_name === "PAPIKOSTIK" ? 9 : 100;
    const statusLabel = r.status === "passed" ? "LULUS" : r.status === "review" ? "REVIEW" : "TIDAK LULUS";
    const statusColor = r.status === "passed" ? "#059669" : r.status === "review" ? "#d97706" : "#dc2626";

    // Generate DISC charts and interpretation if test is DISC
    let discChartsHTML = "";
    let discInterpretation = "";
    if (r.test_name.toUpperCase().includes("DISC")) {
      const dims = DISC_DIMS;
      
      // Get top 2 dominant categories
      const discRows = buildDiscRows(cats, r.total_questions || 24);
      const sortedCats = [...discRows].sort((a, b) => b.net - a.net);
      const topCategories = sortedCats.slice(0, 2).map(({ dim }) => dim);
      const dominant = topCategories[0];
      const secondary = topCategories[1];
      
      // Generate interpretation based on DISC results
      const interpretations: Record<string, string> = {
        'D': `Dominance (D) yang tinggi menunjukkan kandidat memiliki kemampuan leadership yang kuat, berorientasi pada hasil, dan tegas dalam pengambilan keputusan. Cocok untuk peran manajerial, entrepreneur, atau posisi yang membutuhkan kemampuan mengarahkan dan memotivasi orang lain.`,
        'I': `Influence (I) yang tinggi menunjukkan kandidat memiliki kemampuan komunikasi dan interpersonal yang baik, persuasif, dan energik. Cocok untuk peran sales, marketing, public relations, atau posisi yang membutuhkan interaksi intensif dengan orang lain.`,
        'S': `Steadiness (S) yang tinggi menunjukkan kandidat memiliki sifat stabil, sabar, dan mendukung tim. Cocok untuk peran customer service, HR, counseling, atau posisi yang membutuhkan konsistensi dan kemampuan membangun hubungan jangka panjang.`,
        'C': `Conscientiousness (C) yang tinggi menunjukkan kandidat memiliki ketelitian tinggi, analitis, dan memprioritaskan kualitas. Cocok untuk peran analyst, quality control, engineering, atau posisi yang membutuhkan akurasi dan perhatian detail.`
      };
      
      const jobMatches: Record<string, string> = {
        'D': "Manager, Entrepreneur, Sales Director, Director, CEO, Project Leader",
        'I': "Sales, Public Relations, Marketing, Trainer, Public Speaker, Event Coordinator",
        'S': "Counselor, Teacher, Nurse, HR, Customer Service, Therapist, Administrator",
        'C': "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer, Auditor"
      };
      
      discInterpretation = `
        <div class="section">
          <div class="section-title">Interpretasi Psikolog - Analisa DISC</div>
          <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 14px; border-radius: 0 8px 8px 0; font-size: 10pt; line-height: 1.7; color: #422006;">
            <p style="font-weight: 700; margin-bottom: 8px;">Profil Dominan: ${dominant}${secondary ? ` & ${secondary}` : ''}</p>
            <p style="margin-bottom: 8px;">${interpretations[dominant] || ''}</p>
            ${secondary ? `<p style="margin-bottom: 8px;">Kombinasi dengan ${secondary} memberikan keseimbangan antara kekuatan ${dominant} dan stabilitas ${secondary}.</p>` : ''}
            <p style="margin-top: 12px; font-weight: 600;"><strong>Pekerjaan yang Sesuai:</strong> ${jobMatches[dominant] || 'Berbagai peran profesional'}</p>
            <p style="margin-top: 8px;"><strong>Rekomendasi:</strong> Kandidat menunjukkan potensi tinggi untuk peran yang sesuai dengan profil ${dominant}. Pertimbangkan untuk penempatan di posisi yang memanfaatkan kekuatan alami ini.</p>
          </div>
        </div>`;
      
      const discDataWithRank = discRows;
      
      discChartsHTML = `
    <div class="section">
      <div class="section-title">Detail Skor per Dimensi</div>
      <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;">Dimensi</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;" title="Most/Mask - Paling Sesuai">M</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;" title="Least/Core - Paling Tidak Sesuai">L</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;" title="Net = M - L (Mirror)">Net</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Level</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Rank</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600; width: 25%;">Visual</th>
          </tr>
        </thead>
        <tbody>
          ${discDataWithRank.map(d => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: ${d.color}; font-size: 12pt;">${d.dim}</div>
                <div style="font-size: 8pt; color: #64748b; line-height: 1.2;">${d.desc}</div>
              </td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${d.m ?? "-"}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${d.l ?? "-"}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ${d.net > 0 ? '#059669' : d.net < 0 ? '#dc2626' : '#64748b'};">${d.net > 0 ? '+' : ''}${d.net}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: 600; background: ${d.level === 'Tinggi' ? '#fef3c7' : d.level === 'Sedang' ? '#dbeafe' : d.level === 'Netral' ? '#f3f4f6' : '#fee2e2'}; color: ${d.level === 'Tinggi' ? '#d97706' : d.level === 'Sedang' ? '#2563eb' : d.level === 'Netral' ? '#6b7280' : '#dc2626'};">${d.level}</span>
              </td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ${d.rank === 1 ? '#dc2626' : d.rank === 2 ? '#d97706' : '#64748b'};">#${d.rank}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="flex: 1; background: #f1f5f9; height: 16px; border-radius: 3px; overflow: hidden; position: relative;">
                    <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #9ca3af;"></div>
                    ${d.net !== 0 ? `<div style="position: absolute; ${d.net > 0 ? 'left: 50%' : 'right: 50%'}; height: 100%; width: ${Math.min(Math.abs(d.net) * 4, 50)}%; background: ${d.net > 0 ? '#34d399' : '#f87171'}; border-radius: ${d.net > 0 ? '0 3px 3px 0' : '3px 0 0 3px'};"></div>` : ''}
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="font-size: 8pt; color: #64748b; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 4px;">
        <strong>M (Most):</strong> jumlah dipilih sebagai "Paling Sesuai" (Mask). 
        <strong>L (Least):</strong> jumlah dipilih sebagai "Paling Tidak Sesuai" (Core). 
        <strong>Net:</strong> M − L → kekuatan natural (Mirror). 
        <strong>Rank:</strong> urutan kekuatan dimensi (1 = paling dominan).
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
        ${renderDiscPrintMiniChart("Mask - Public Self (Most)", discDataWithRank.map((d) => ({ name: d.dim, value: d.m ?? 0 })), "#10b981")}
        ${renderDiscPrintMiniChart("Core - Private Self (Least)", discDataWithRank.map((d) => ({ name: d.dim, value: d.l ?? 0 })), "#f59e0b")}
        ${renderDiscPrintMiniChart("Mirror - Perceived Self (Net)", discDataWithRank.map((d) => ({ name: d.dim, value: d.net })), "#ec4899", true)}
      </div>
    </div>`;
    }

    let istProfileHTML = "";
    let istInterpretationHTML = "";
    if (isIstResult(r)) {
      const summary = getIstSummary(cats, r.score);
      istProfileHTML = `
        <div class="section">
          <div class="section-title">Profil Subtes IST</div>
          <table class="dim-table">
            <thead><tr><th>Subtes</th><th>Aspek</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>
            <tbody>
              ${summary.rows.map(row => `
                <tr>
                  <td><strong>${row.code} - ${row.name}</strong></td>
                  <td>${row.area}</td>
                  <td>${row.raw}/${row.max} (${row.pct}%)</td>
                  <td>${row.level}</td>
                  <td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(row.pct, 100)}%; background:${row.pct >= 65 ? '#059669' : row.pct >= 45 ? '#d97706' : '#dc2626'};"></div></div></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`;
      istInterpretationHTML = `
        <div class="section">
          <div class="section-title">Interpretasi Psikolog — Profil IST</div>
          <div class="interpretation" style="white-space:pre-line;">${buildIstInterpretation(cats, r.score).replace(/</g, '&lt;')}</div>
	        </div>`;
    }

    let mbtiProfileHTML = "";
    let papiProfileHTML = "";
    let kraepelinProfileHTML = "";
    let specialInterpretationHTML = "";
    if (isMbtiResult(r)) {
      const summary = getMbtiSummary(cats);
      mbtiProfileHTML = `
        <div class="section">
          <div class="section-title">Profil MBTI</div>
          <div class="score-cards">
            <div class="score-card"><div class="label">Tipe</div><div class="value" style="letter-spacing:3px;">${summary.type}</div></div>
            <div class="score-card"><div class="label">Dimensi Dominan</div><div class="value" style="font-size:13pt;margin-top:8px;">${summary.rows.map(row => row.dominant).join(" - ")}</div></div>
            <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
          </div>
          <table class="dim-table">
            <thead><tr><th>Pasangan</th><th>Skor</th><th>Dominan</th><th>Kekuatan</th></tr></thead>
            <tbody>${summary.rows.map(row => `<tr><td><strong>${row.pair}</strong></td><td>${row.a}=${row.av} / ${row.b}=${row.bv}</td><td>${row.dominant}</td><td>${row.pct}%</td></tr>`).join("")}</tbody>
          </table>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil MBTI</div><div class="interpretation" style="white-space:pre-line;">${buildMbtiInterpretation(cats).replace(/</g, '&lt;')}</div></div>`;
    } else if (isKraepelinResult(r)) {
      const rows = getKraepelinRows(cats);
      kraepelinProfileHTML = `
        <div class="section">
          <div class="section-title">Profil Kraepelin</div>
          <table class="dim-table">
            <thead><tr><th>Aspek</th><th>Skor</th><th>Indikator</th></tr></thead>
            <tbody>
              ${rows.map(row => `<tr><td><strong>${row.label}</strong></td><td>${row.value}%</td><td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(row.value, 100)}%; background:${row.value >= 70 ? '#059669' : row.value >= 40 ? '#d97706' : '#dc2626'};"></div></div></td></tr>`).join("")}
              <tr><td><strong>Benar / Salah</strong></td><td colspan="2">${Number(cats.correct_answers || 0)} / ${Number(cats.wrong_answers || 0)}</td></tr>
            </tbody>
          </table>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil Kraepelin</div><div class="interpretation" style="white-space:pre-line;">${buildKraepelinInterpretation(cats).replace(/</g, '&lt;')}</div></div>`;
    } else if (isPapiResult(r)) {
      const rows = getPapiRows(cats);
      papiProfileHTML = `
        <div class="section">
          <div class="section-title">Profil Skala PAPI Kostick</div>
          <table class="dim-table">
            <thead><tr><th>Skala</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>
            <tbody>${rows.map(row => {
              const pct = (row.value / 9) * 100;
              return `<tr><td><strong>${row.code} - ${row.label}</strong></td><td>${row.value}/9</td><td>${row.level}</td><td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(pct, 100)}%; background:${pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'};"></div></div></td></tr>`;
            }).join("")}</tbody>
          </table>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil PAPI</div><div class="interpretation" style="white-space:pre-line;">${buildPapiInterpretation(cats).replace(/</g, '&lt;')}</div></div>`;
    }

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Hasil Tes — ${r.candidate_name}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 11pt; line-height: 1.5; }

      .header { border-bottom: 3px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
      .header-left h1 { font-size: 18pt; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.3px; }
      .header-left p { font-size: 9pt; color: #64748b; }
      .header-right { text-align: right; }
      .header-right .doc-id { font-size: 8pt; color: #64748b; font-family: 'Courier New', monospace; }
      .header-right .doc-date { font-size: 9pt; color: #475569; margin-top: 2px; }

      .badge-status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 9pt; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; }

      .section { margin-bottom: 18px; page-break-inside: avoid; }
      .section-title { font-size: 11pt; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }

      .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
      .profile-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 10pt; }
      .profile-row .label { color: #64748b; min-width: 110px; font-weight: 500; }
      .profile-row .value { color: #0f172a; font-weight: 600; flex: 1; }

      .score-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 6px; }
      .score-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 12px; text-align: center; }
      .score-card .label { font-size: 8pt; color: #0f766e; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
      .score-card .value { font-size: 22pt; font-weight: 800; color: #0f172a; line-height: 1.1; margin-top: 4px; }
      .score-card .sub { font-size: 9pt; color: #64748b; }

      table.dim-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
      table.dim-table th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.3px; }
      table.dim-table td { padding: 7px 10px; border: 1px solid #e2e8f0; }
      table.dim-table tr:nth-child(even) td { background: #fafafa; }
      .bar-container { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 4px; background: #0f766e; }

      .interpretation { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 10pt; line-height: 1.7; color: #422006; }

      table.answer-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
      table.answer-table th { background: #0f172a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; }
      table.answer-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      table.answer-table tr:nth-child(even) td { background: #f8fafc; }
      .ans-num { font-weight: 700; color: #0f766e; width: 32px; text-align: center; }
      .ans-q-en { color: #94a3b8; font-style: italic; font-size: 8pt; margin-top: 2px; }
      .ans-pill { display: inline-block; background: #0f766e; color: #fff; padding: 2px 8px; border-radius: 3px; font-weight: 600; font-size: 8.5pt; }
      .ans-correct { background: #059669; }
      .ans-wrong { background: #dc2626; }
      .ans-cat { color: #64748b; font-size: 8.5pt; }

      .signature-area { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; page-break-inside: avoid; }
      .sig-box { text-align: center; font-size: 9pt; }
      .sig-box .role { color: #64748b; margin-bottom: 60px; }
      .sig-box .name { border-top: 1px solid #1f2937; padding-top: 4px; font-weight: 600; }

      .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8pt; color: #94a3b8; }

      .page-break { page-break-before: always; }
      .hidden { display: none; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style></head><body>

    <div class="header">
      <div class="header-left">
        <h1>Laporan Hasil Tes Psikologi</h1>
        <p>Sistem Asesmen Rekrutmen — Konfidensial</p>
      </div>
      <div class="header-right">
        <span class="badge-status">${statusLabel}</span>
        <div class="doc-id">REF: ${r.id.substring(0, 8).toUpperCase()}</div>
        <div class="doc-date">${new Date(r.completed_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profil Kandidat</div>
      <div style="display:flex; gap:18px; align-items:flex-start;">
        ${profile?.photo_url ? `<img src="${profile.photo_url}" alt="Foto Kandidat" style="width:110px;height:140px;object-fit:cover;border:2px solid #0f766e;border-radius:6px;background:#f1f5f9;" />` : `<div style="width:110px;height:140px;border:2px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8.5pt;text-align:center;padding:8px;">Foto tidak tersedia</div>`}
        <div style="flex:1;">
          <div class="profile-grid">
            <div class="profile-row"><span class="label">Nama Lengkap</span><span class="value">${r.candidate_name}</span></div>
            <div class="profile-row"><span class="label">Posisi Dilamar</span><span class="value">${r.position || "-"}</span></div>
            <div class="profile-row"><span class="label">Email</span><span class="value">${profile?.email || "-"}</span></div>
            <div class="profile-row"><span class="label">No. Telepon</span><span class="value">${profile?.phone || "-"}</span></div>
            <div class="profile-row"><span class="label">Tanggal Lahir</span><span class="value">${profile?.birthDate || "-"}</span></div>
            <div class="profile-row"><span class="label">Pendidikan</span><span class="value">${profile?.education || "-"}</span></div>
            <div class="profile-row"><span class="label">Jenis Kelamin</span><span class="value">${profile?.gender || "-"}</span></div>
            <div class="profile-row"><span class="label">Tanggal Tes</span><span class="value">${new Date(r.completed_at).toLocaleDateString("id-ID", { dateStyle: "long" } as any)}</span></div>
          </div>
        </div>
        ${r.webcam_photo_url ? `<div style="text-align:center;"><img src="${r.webcam_photo_url}" alt="Foto Verifikasi Tes" style="width:110px;height:90px;object-fit:cover;border:1px solid #94a3b8;border-radius:4px;" /><div style="font-size:8pt;color:#64748b;margin-top:4px;">Verifikasi saat tes</div></div>` : ""}
      </div>
    </div>

    ${(() => {
      // For CFIT, calculate IQ from correct answers
      let cfitIqHtml = '';
      if (isCfitName(r.test_name)) {
        const iqClassification: Record<number, { iq: number; classification: string }> = {
          49: { iq: 183, classification: "GENIUS" },
          48: { iq: 179, classification: "GENIUS" },
          47: { iq: 176, classification: "GENIUS" },
          46: { iq: 173, classification: "GENIUS" },
          45: { iq: 169, classification: "VERY SUPERIOR" },
          44: { iq: 167, classification: "VERY SUPERIOR" },
          43: { iq: 165, classification: "VERY SUPERIOR" },
          42: { iq: 161, classification: "VERY SUPERIOR" },
          41: { iq: 157, classification: "VERY SUPERIOR" },
          40: { iq: 155, classification: "VERY SUPERIOR" },
          39: { iq: 152, classification: "VERY SUPERIOR" },
          38: { iq: 149, classification: "VERY SUPERIOR" },
          37: { iq: 145, classification: "VERY SUPERIOR" },
          36: { iq: 142, classification: "VERY SUPERIOR" },
          35: { iq: 140, classification: "VERY SUPERIOR" },
          34: { iq: 137, classification: "SUPERIOR" },
          33: { iq: 133, classification: "SUPERIOR" },
          32: { iq: 131, classification: "SUPERIOR" },
          31: { iq: 128, classification: "SUPERIOR" },
          30: { iq: 124, classification: "SUPERIOR" },
          29: { iq: 121, classification: "SUPERIOR" },
          28: { iq: 119, classification: "HIGH AVERAGE" },
          27: { iq: 116, classification: "HIGH AVERAGE" },
          26: { iq: 113, classification: "HIGH AVERAGE" },
          25: { iq: 109, classification: "AVERAGE" },
          24: { iq: 106, classification: "AVERAGE" },
          23: { iq: 103, classification: "AVERAGE" },
          22: { iq: 100, classification: "AVERAGE" },
          21: { iq: 96, classification: "AVERAGE" },
          20: { iq: 94, classification: "AVERAGE" },
          19: { iq: 91, classification: "AVERAGE" },
          18: { iq: 88, classification: "LOW AVERAGE" },
          17: { iq: 85, classification: "LOW AVERAGE" },
          16: { iq: 81, classification: "LOW AVERAGE" },
          15: { iq: 78, classification: "BOEDERLINE MENTAL RETARDATION" },
          14: { iq: 75, classification: "BOEDERLINE MENTAL RETARDATION" },
          13: { iq: 72, classification: "BOEDERLINE MENTAL RETARDATION" },
          12: { iq: 70, classification: "BOEDERLINE MENTAL RETARDATION" },
          11: { iq: 67, classification: "MILD MENTAL RETARDATION" },
          10: { iq: 65, classification: "MILD MENTAL RETARDATION" },
          9: { iq: 60, classification: "MILD MENTAL RETARDATION" },
          8: { iq: 57, classification: "MILD MENTAL RETARDATION" },
          7: { iq: 55, classification: "MILD MENTAL RETARDATION" },
          6: { iq: 52, classification: "MILD MENTAL RETARDATION" },
          5: { iq: 48, classification: "MODERATE MENTAL RETARDATION" },
          4: { iq: 47, classification: "MODERATE MENTAL RETARDATION" },
          3: { iq: 45, classification: "MODERATE MENTAL RETARDATION" },
          2: { iq: 43, classification: "MODERATE MENTAL RETARDATION" },
          1: { iq: 40, classification: "MODERATE MENTAL RETARDATION" },
          0: { iq: 38, classification: "MODERATE MENTAL RETARDATION" }
        };
        const iqInfo = getCfitIqInfoFromResult(r);
        cfitIqHtml = `
          <div class="score-cards">
            <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
            <div class="score-card"><div class="label">IQ Score</div><div class="value">${iqInfo.iq}</div></div>
            <div class="score-card"><div class="label">Klasifikasi</div><div class="value" style="font-size:13pt;margin-top:8px;">${iqInfo.classification}</div></div>
          </div>
          <p style="text-align:center;font-size:9pt;color:#64748b;margin-top:8px;">Raw Score: ${iqInfo.raw} / ${iqInfo.max}</p>
        `;
      }
      return cfitIqHtml;
    })()}
    ${!isCfitName(r.test_name) ? (() => {
      const isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
      const isIST = isIstResult(r);
      let dominantScore = '';
      if (isPP) {
        const ppMap: Record<string, string> = {
          K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
          S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
          M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
          P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
        };
        const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
        Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
        const sorted = Object.entries(norm).sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0];
        const second = sorted[1];
        const diff = dominant[1] - second[1];
        if (diff >= 1 && diff <= 4) {
          dominantScore = `${dominant[0]} (${dominant[1]}) / ${second[0]} (${second[1]})`;
        } else {
          dominantScore = `${dominant[0]} (${dominant[1]})`;
        }
      }
      const istSummary = isIST ? getIstSummary(cats, r.score) : null;
      const mbtiSummary = isMbtiResult(r) ? getMbtiSummary(cats) : null;
      return `
    <div class="section">
      <div class="section-title">Ringkasan Hasil - ${r.test_name}</div>
      <div class="score-cards">
        <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
        <div class="score-card"><div class="label">${isPP ? 'Hasil Dominan' : isIST ? 'Skor IST' : mbtiSummary ? 'Tipe MBTI' : 'Skor Akhir'}</div>
        <div class="value" style="${isPP ? 'font-size:18pt;font-weight:800;color:#f472b6;' : mbtiSummary ? 'letter-spacing:3px;' : ''}">${isPP ? dominantScore : isIST ? `${istSummary?.score}<span style="font-size:14pt;color:#64748b;">%</span><div style="font-size:9pt;color:#64748b;margin-top:4px;">Raw ${istSummary?.raw}/${istSummary?.max}</div>` : mbtiSummary ? mbtiSummary.type : `${r.score}<span style="font-size:14pt;color:#64748b;">%</span>`}</div></div>
        <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
      </div>
    </div>
    `;
    })() : ''}

    ${discChartsHTML}

    ${istProfileHTML}
    ${mbtiProfileHTML}
    ${kraepelinProfileHTML}
    ${papiProfileHTML}

    <div class="section ${r.test_name.toUpperCase().includes("DISC") || isIstResult(r) || isMbtiResult(r) || isKraepelinResult(r) || isPapiResult(r) ? "hidden" : ""}">
      <div class="section-title">Profil Dimensi & Skor</div>
      ${r.test_name.toUpperCase().includes("DISC") ? 
        // For DISC, show horizontal bar chart with 0 in center, fixed order D, I, S, C
        (() => {
          const dims = DISC_DIMS;
          const discRows = buildDiscRows(cats, r.total_questions || 24);
          const sortedCats = [...discRows].sort((a, b) => b.net - a.net);
          const top2 = sortedCats.slice(0, 2);
          return `
            <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 10pt; font-weight: 700; color: #0f766e; margin-bottom: 8px;">Kategori Dominan DISC</p>
              <div style="display: flex; gap: 16px; justify-content: center;">
                ${top2.map(({ dim, net }, i) => `
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 24pt; font-weight: 800; color: #0f766e; margin-bottom: 4px;">${dim}</div>
                    <div style="font-size: 12pt; color: #475569;">Skor: ${net > 0 ? '+' : ''}${net}</div>
                    <div style="font-size: 10pt; color: #64748b; margin-top: 2px;">${i === 0 ? 'Dominan Utama' : 'Dominan Sekunder'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10pt; font-weight: 700; color: #374151; margin-bottom: 12px;">Detail Skor per Dimensi</p>
              ${dims.map(dim => {
                const val = getDiscValue(cats, dim, "N");
                const maxVal = Math.max(...discRows.map((row) => Math.abs(row.net)), 1);
                const barWidth = (Math.abs(val) / maxVal) * 40;
                const isPositive = val >= 0;
                return `
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="width: 32px; text-align: right; font-weight: 700; color: #374151; font-size: 10pt;">${dim}</span>
                    <div style="flex: 1; position: relative; height: 32px; display: flex; align-items: center;">
                      <!-- Zero line -->
                      <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: #9ca3af;"></div>
                      <!-- Negative bar (left side) -->
                      ${!isPositive ? `<div style="position: absolute; right: 50%; height: 24px; background: #f87171; border-radius: 4px 0 0 4px; width: ${barWidth}%; margin-right: -1px;"></div>` : ''}
                      <!-- Positive bar (right side) -->
                      ${isPositive ? `<div style="position: absolute; left: 50%; height: 24px; background: #34d399; border-radius: 0 4px 4px 0; width: ${barWidth}%; margin-left: 1px;"></div>` : ''}
                      <!-- Value label -->
                      <span style="position: absolute; font-size: 9pt; font-weight: 700; ${isPositive ? 'left: 50%; margin-left: 8px; color: #059669;' : 'right: 50%; margin-right: 8px; color: #dc2626;'}">${val}</span>
                    </div>
                  </div>
                `;
              }).join('')}
              <div style="display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 16px; font-size: 9pt; color: #6b7280;">
                <span style="display: flex; align-items: center; gap: 4px;"><div style="width: 12px; height: 12px; background: #f87171; border-radius: 2px;"></div> Negatif</span>
                <div style="width: 1px; height: 16px; background: #d1d5db;"></div>
                <span style="display: flex; align-items: center; gap: 4px;"><div style="width: 12px; height: 12px; background: #34d399; border-radius: 2px;"></div> Positif</span>
              </div>
            </div>
          `;
        })()
      : r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus") ? (() => {
        // Personality Plus format
        const ppMap: Record<string, string> = {
          K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
          S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
          M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
          P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
        };
        const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
        Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
        const total = Object.values(norm).reduce((a, b) => a + b, 0) || r.total_questions || 40;
        const order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
        const colors: Record<string, string> = { Sanguinis: '#f59e0b', Koleris: '#dc2626', Melankolis: '#2563eb', Plegmatis: '#059669' };
        
        // Calculate percentages for chart
        const chartData = order.map(t => ({ name: t, value: norm[t], pct: Math.round((norm[t] / total) * 100) }));
        const maxVal = Math.max(...chartData.map(d => d.value), 1);
        
        return `
        <!-- Compact Table + Chart Side by Side -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <!-- Tabel Kiri -->
          <div>
            <p style="font-size: 9pt; font-weight: 700; color: #374151; margin-bottom: 6px;">Detail Skor per Dimensi</p>
            <table style="width:100%; border-collapse: collapse; font-size: 8pt;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 4px 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;">Temperamen</th>
                  <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Jumlah</th>
                  <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">%</th>
                </tr>
              </thead>
              <tbody>
                ${chartData.map(d => `
                  <tr>
                    <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: 600; color: ${colors[d.name]}">${d.name}</td>
                    <td style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center;">${d.value}</td>
                    <td style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${d.pct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 8px; font-size: 8pt; color: #64748b; background: #f8fafc; padding: 6px; border-radius: 4px;">
              <strong>Dominan:</strong> ${chartData[0].name} (${chartData[0].pct}%)<br/>
              <strong>Sekunder:</strong> ${chartData[1].name} (${chartData[1].pct}%)
            </div>
          </div>
          
          <!-- Grafik Kanan -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #f8fafc;">
            <p style="font-size: 8pt; font-weight: 700; color: #374151; margin-bottom: 4px; text-align: center;">Grafik 4 Temperamen</p>
            <svg width="100%" height="140" viewBox="0 0 200 140">
              <!-- Y axis -->
              <line x1="25" y1="10" x2="25" y2="110" stroke="#374151" stroke-width="1"/>
              <line x1="25" y1="110" x2="190" y2="110" stroke="#374151" stroke-width="1"/>
              <!-- Y axis labels -->
              <text x="22" y="115" text-anchor="end" font-size="7" fill="#6b7280">0</text>
              <text x="22" y="85" text-anchor="end" font-size="7" fill="#6b7280">${Math.round(maxVal * 0.5)}</text>
              <text x="22" y="55" text-anchor="end" font-size="7" fill="#6b7280">${Math.round(maxVal * 0.75)}</text>
              <text x="22" y="15" text-anchor="end" font-size="7" fill="#6b7280">${maxVal}</text>
              <!-- Bars -->
              ${chartData.map((d, i) => {
                const barHeight = (d.value / maxVal) * 100;
                const x = 30 + (i * 40);
                return `
                  <rect x="${x}" y="${110 - barHeight}" width="32" height="${barHeight}" fill="${colors[d.name]}" rx="2" opacity="0.85"/>
                  <text x="${x + 16}" y="${105 - barHeight}" text-anchor="middle" font-size="8" font-weight="700" fill="#374151">${d.value}</text>
                  <text x="${x + 16}" y="${125}" text-anchor="middle" font-size="7" font-weight="600" fill="#374151">${d.name.substring(0, 3)}</text>
                `;
              }).join('')}
            </svg>
          </div>
        </div>
        `;
      })()
      : isCfitName(r.test_name) ? `
        <table class="dim-table">
          <thead><tr><th style="width:35%">Aspek</th><th style="width:20%">Nilai</th><th>Keterangan</th></tr></thead>
          <tbody>
            ${cfitProfileRows.map(row => `<tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.value}</td>
              <td>${row.note}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      `
      : `
        <table class="dim-table">
          <thead><tr><th style="width:35%">Dimensi / Aspek</th><th style="width:15%">Skor</th><th>Indikator Visual</th></tr></thead>
          <tbody>
            ${catEntries.map(([dim, val]) => {
              const pct = (val / maxVal) * 100;
              return `<tr>
                <td><strong>${dim}</strong></td>
                <td>${val}${r.test_name === "PAPIKOSTIK" ? "/9" : "%"}</td>
                <td><div class="bar-container"><div class="bar-fill" style="width:${pct}%; background:${pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'};"></div></div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      `}
    </div>

    ${discInterpretation}

    ${(() => {
      const isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
      const isDISC = r.test_name.toUpperCase().includes("DISC");
	      if (isDISC) return "";
	      if (isIstResult(r)) return istInterpretationHTML;
	      if (specialInterpretationHTML) return specialInterpretationHTML;
      // Full format interpretation for PP
      if (isPP) {
        const ppMap: Record<string, string> = {
          K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
          S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
          M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
          P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
        };
        const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
        Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
        const sorted = Object.entries(norm).sort((a, b) => b[1] - a[1]);
        const [dom, domVal] = sorted[0];
        const [sec, secVal] = sorted[1];
        const total = Object.values(norm).reduce((a, b) => a + b, 0) || 1;
        const domPct = Math.round((domVal / total) * 100);
        const secPct = Math.round((secVal / total) * 100);
        
        const strengths: Record<string, string> = {
          Sanguinis: 'Ekspresif, antusias, ramah, mudah bergaul, optimis, kreatif, dan mampu memotivasi orang lain. Cocok di lingkungan yang membutuhkan komunikasi intensif.',
          Koleris: 'Tegas, berorientasi pada hasil, pemimpin alami, mandiri, cepat mengambil keputusan, dan tidak takut tantangan.',
          Melankolis: 'Analitis, teliti, perfeksionis, terstruktur, dan berorientasi pada kualitas.',
          Plegmatis: 'Tenang, sabar, konsisten, pendukung tim, dan mampu menjaga stabilitas.'
        };
        
        const weaknesses: Record<string, string> = {
          Sanguinis: 'Cenderung impulsif, kurang disiplin pada detail, mudah teralihkan, dan kadang sulit menyelesaikan tugas yang berulang/monoton.',
          Koleris: 'Cenderung dominan, kurang sabar, bisa terkesan keras kepala, dan kadang mengabaikan perasaan orang lain.',
          Melankolis: 'Cenderung perfeksionis, moody, sulit move on dari kesalahan, dan bisa terlalu kritis.',
          Plegmatis: 'Cenderung lambat dalam mengambil inisiatif, sulit menolak, dan bisa terlalu menghindari konflik.'
        };
        
        const recommendations: Record<string, string> = {
          Sanguinis: 'Marketing, Public Relations, Sales, Trainer, Customer Engagement, Event Organizer',
          Koleris: 'Manager, Entrepreneur, Sales Director, Project Leader, Business Development',
          Melankolis: 'Analyst, Quality Control, Researcher, Programmer, Accountant',
          Plegmatis: 'Customer Service, HR, Administrator, Counselor, Therapist'
        };
        
        const secDesc: Record<string, string> = {
          Koleris: 'tegas, berorientasi pada hasil, pemimpin alami, mandiri, cepat mengambil keputusan, dan tidak takut tantangan',
          Sanguinis: 'ekspresif, antusias, ramah, dan mampu memotivasi orang lain',
          Melankolis: 'analitis, teliti, dan berorientasi pada kualitas',
          Plegmatis: 'tenang, sabar, dan pendukung tim'
        };
        
        return `
    <div class="section">
      <div class="section-title">Interpretasi Psikolog — Profil 4 Temperamen</div>
      <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 12px; border-radius: 0 8px 8px 0; font-size: 9.5pt; line-height: 1.6; color: #422006;">
        <p style="margin-bottom: 10px;">Berdasarkan hasil tes Personality Plus, kandidat menampilkan profil temperamen <strong>DOMINAN: ${dom}</strong> (${domVal} jawaban — ${domPct}%) dengan dukungan <strong>SEKUNDER: ${sec}</strong> (${secVal} jawaban — ${secPct}%). Distribusi jumlah jawaban — Sanguinis: ${norm.Sanguinis}, Koleris: ${norm.Koleris}, Melankolis: ${norm.Melankolis}, Plegmatis: ${norm.Plegmatis}.</p>
        
        <p style="margin-bottom: 6px; font-weight: 700; color: #0f766e;">KEKUATAN (${dom}):</p>
        <p style="margin-bottom: 10px; padding-left: 12px;">${strengths[dom]}</p>
        
        <p style="margin-bottom: 6px; font-weight: 700; color: #dc2626;">AREA PERHATIAN (${dom}):</p>
        <p style="margin-bottom: 10px; padding-left: 12px;">${weaknesses[dom]}</p>
        
        <p style="margin-bottom: 10px;"><strong>Kombinasi ${dom}-${sec}:</strong> kandidat memiliki karakter utama ${dom.toLowerCase()} yang dilengkapi nuansa ${sec.toLowerCase()} (${secDesc[sec]}). Kombinasi ini memperkaya profil dan memperluas zona efektivitas kerja.</p>
        
        <p style="margin-bottom: 10px;"><strong>REKOMENDASI POSISI:</strong> ${recommendations[dom]}.</p>
        
        <p style="font-size: 8.5pt; color: #64748b; border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 10px;"><strong>CATATAN PSIKOLOG:</strong> Profil ini valid untuk ${total} item respons. Disarankan didampingi wawancara mendalam (kompetensi & nilai) untuk validasi konteks pekerjaan. Skor tertinggi adalah karakter natural; tidak menutup kemungkinan kandidat menampilkan perilaku temperamen lain situasionalnya.</p>
      </div>
    </div>`;
      }
      // For other tests
      if (!r.interpretation) return "";
      return `
    <div class="section">
      <div class="section-title">Interpretasi Psikolog</div>
      <div class="interpretation" style="white-space:pre-line;">${r.interpretation.replace(/</g, '&lt;')}</div>
    </div>`;
    })()}

    <div class="section page-break">
      <div class="section-title">Lembar Jawaban Kandidat (${answers.length} Soal)</div>
      ${answers.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px 0;">Belum ada data jawaban tersimpan.</p>' : `
      <table class="answer-table">
        <thead><tr><th style="width:36px;">No</th><th>Pertanyaan</th><th style="width:180px;">Jawaban</th><th style="width:120px;">Kategori</th></tr></thead>
        <tbody>
          ${answers.map(a => {
            const ppMap: Record<string, string> = { K:'Koleris',C:'Koleris',Choleric:'Koleris',Koleris:'Koleris',S:'Sanguinis',Sanguine:'Sanguinis',Sanguinis:'Sanguinis',M:'Melankolis',Melancholy:'Melankolis',Melancholic:'Melankolis',Melankolis:'Melankolis',P:'Plegmatis',Phlegmatic:'Plegmatis',Plegmatis:'Plegmatis',Plegmatic:'Plegmatis' };
            let categoryDisplay = a.category || "-";
            if ((r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) && a.category) {
              categoryDisplay = ppMap[a.category] || a.category;
            } else if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer_label) {
              categoryDisplay = a.selected_answer_label;
            } else if (isPapiResult(r) && a.category) {
              categoryDisplay = PAPI_LABELS[a.category] ? `${a.category} - ${PAPI_LABELS[a.category]}` : a.category;
            }
            return `
            <tr>
              <td class="ans-num">${a.question_number}</td>
              <td>
                <div>${a.question_text}</div>
                ${a.question_text_en ? `<div class="ans-q-en">${a.question_text_en}</div>` : ""}
              </td>
              <td><span class="ans-pill ${a.is_correct === true ? 'ans-correct' : a.is_correct === false ? 'ans-wrong' : ''}">${a.selected_answer && a.selected_answer.includes('PALING') ? a.selected_answer : (a.selected_answer_label && !r.test_name.toUpperCase().includes("DISC") ? a.selected_answer_label + '. ' : '') + (a.selected_answer || '')}</span></td>
              <td class="ans-cat">${categoryDisplay}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`}
    </div>

    <div class="signature-area">
      <div class="sig-box">
        <div class="role">Kandidat</div>
        <div class="name">${r.candidate_name}</div>
      </div>
      <div class="sig-box">
        <div class="role">Psikolog Penilai</div>
        <div class="name">________________________</div>
      </div>
    </div>

    <div class="footer">
      Dokumen ini dihasilkan secara otomatis oleh PsyTest Recruitment Platform — Bersifat Konfidensial.<br/>
      Dicetak pada: ${new Date().toLocaleString("id-ID")}
    </div>

    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleExport = () => {
    const csv = [
      "Nama,Posisi,Tes,Skor,Dijawab,Total,Tanggal,Status",
      ...results.map(r => `${r.candidate_name},${r.position},${r.test_name},${r.score},${r.answered_questions},${r.total_questions},${r.completed_at},${r.status}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hasil-tes-psikologi.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = (r: ResultRow) => {
    const cats = r.categories as Record<string, number>;
    const data = Object.entries(cats).map(([name, value]) => ({ name, value }));

    // DISC: render Mask/Core/Mirror as bar charts + final Line chart trend + Radar (Spider)
    if (r.test_name.toUpperCase().includes("DISC")) {
      const dims = ["D", "I", "S", "C"] as const;
      const dimMap: Record<string, string> = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
      const reverseDimMap: Record<string, string> = { Dominance: "D", Influence: "I", Steadiness: "S", Compliance: "C" };
      
      // Check if using old format (D, I, S, C) or new format (full names)
      const useOldFormat = cats["D"] !== undefined || cats["I"] !== undefined || cats["S"] !== undefined || cats["C"] !== undefined;
      
      // Helper to get M value
      const getM = (d: string) => {
        if (useOldFormat) {
          return cats[`${d}_M`] !== undefined ? Number(cats[`${d}_M`]) : 0;
        } else {
          const fullName = dimMap[d];
          return cats[`${fullName}_M`] !== undefined ? Number(cats[`${fullName}_M`]) : 0;
        }
      };
      // Helper to get L value  
      const getL = (d: string) => {
        if (useOldFormat) {
          return cats[`${d}_L`] !== undefined ? Number(cats[`${d}_L`]) : 0;
        } else {
          const fullName = dimMap[d];
          return cats[`${fullName}_L`] !== undefined ? Number(cats[`${fullName}_L`]) : 0;
        }
      };
      // Helper to get Net value
      const getN = (d: string) => {
        if (useOldFormat) {
          return Number(cats[d] || 0);
        } else {
          const fullName = dimMap[d];
          return Number(cats[fullName] || 0);
        }
      };
      
      const M = getM;
      const L = getL;
      const N = getN;
      
      const mask = dims.map(d => ({ name: d, value: M(d) }));
      const core = dims.map(d => ({ name: d, value: L(d) }));
      const mirror = dims.map(d => ({ name: d, value: N(d) }));
      const jobMatch: Record<string, string> = {
        D: "Manager, Entrepreneur, Sales Director, Director, CEO",
        I: "Sales, Public Relations, Marketing, Trainer, Public Speaker",
        S: "Counselor, Teacher, Nurse, HR, Customer Service, Therapist",
        C: "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer",
      };
      const renderMini = (title: string, d: { name: string; value: number }[], color: string, allowNeg = false) => {
        const vals = d.map(x => x.value);
        const yMin = allowNeg ? Math.min(0, ...vals) : 0;
        const yMax = Math.max(1, ...vals.map(Math.abs));
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">{title}</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={d}>
                <defs>
                  <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
                <YAxis domain={[yMin, yMax]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={3}
                  fill={`url(#gradient-${color.replace('#', '')})`}
                  dot={{ r: 5, fill: color, strokeWidth: 2 }} 
                  activeDot={{ r: 7, fill: color, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      };

      const sortedCats = dims.map(d => [d, getN(d)] as [string, number]).sort((a, b) => b[1] - a[1]);
      const dominant = sortedCats[0][0];
      const secondary = sortedCats[1][0];

      const interpretations: Record<string, string> = {
        'D': `Dominance (D) yang tinggi menunjukkan kandidat memiliki kemampuan leadership yang kuat, berorientasi pada hasil, dan tegas dalam pengambilan keputusan. Cocok untuk peran manajerial, entrepreneur, atau posisi yang membutuhkan kemampuan mengarahkan dan memotivasi orang lain.`,
        'I': `Influence (I) yang tinggi menunjukkan kandidat memiliki kemampuan komunikasi dan interpersonal yang baik, persuasif, dan energik. Cocok untuk peran sales, marketing, public relations, atau posisi yang membutuhkan interaksi intensif dengan orang lain.`,
        'S': `Steadiness (S) yang tinggi menunjukkan kandidat memiliki sifat stabil, sabar, dan mendukung tim. Cocok untuk peran customer service, HR, counseling, atau posisi yang membutuhkan konsistensi dan kemampuan membangun hubungan jangka panjang.`,
        'C': `Conscientiousness (C) yang tinggi menunjukkan kandidat memiliki ketelitian tinggi, analitis, dan memprioritaskan kualitas. Cocok untuk peran analyst, quality control, engineering, atau posisi yang membutuhkan akurasi dan perhatian detail.`
      };

      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Kategori Dominan DISC</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-primary">{dominant}</span>
              <span className="text-2xl text-muted-foreground/50">&</span>
              <span className="text-2xl font-semibold text-primary/80">{secondary}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dominant === 'D' && 'Dominance - Pemimpin yang tegas dan berorientasi hasil'}
              {dominant === 'I' && 'Influence - Komunikator yang persuasif dan energik'}
              {dominant === 'S' && 'Steadiness - Pendukung yang stabil dan sabar'}
              {dominant === 'C' && 'Conscientiousness - Analitis yang teliti dan akurat'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {renderMini("Mask — Public Self (Most)", mask, "#10b981")}
            {renderMini("Core — Private Self (Least)", core, "#f59e0b")}
            {renderMini("Mirror — Perceived Self (Net = M − L)", mirror, "#ec4899", true)}
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-3">Interpretasi Profil DISC</p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Profil Dominan: {dominant} & {secondary}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{interpretations[dominant] || ''}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kombinasi dengan {secondary} memberikan keseimbangan antara kekuatan {dominant} dan karakter {secondary}.
              </p>
              <div>
                <p className="text-xs font-medium text-foreground">Pekerjaan yang Sesuai:</p>
                <p className="text-xs text-muted-foreground">{jobMatch[dominant]}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (isIstResult(r)) {
      const summary = getIstSummary(cats, r.score);
      const chartData = summary.rows.map((row) => ({ name: row.code, value: row.pct, raw: row.raw, max: row.max, fullName: row.name }));
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
            <div className="grid gap-3 sm:grid-cols-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Skor Mentah</p>
                <p className="text-2xl font-bold text-foreground">{summary.raw}/{summary.max}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Skor Akhir</p>
                <p className="text-2xl font-bold text-primary">{summary.score}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kekuatan Relatif</p>
                <p className="text-lg font-semibold text-foreground">{summary.strongest.code}</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}
                formatter={(v: any, _name: any, props: any) => [`${v}% (${props.payload.raw}/${props.payload.max})`, props.payload.fullName]}
              />
              <Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (isMbtiResult(r)) {
      const summary = getMbtiSummary(cats);
      const chartData = summary.rows.flatMap((row) => [
        { name: row.a, value: row.av, pair: row.pair },
        { name: row.b, value: row.bv, pair: row.pair },
      ]);
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tipe MBTI</p>
            <p className="text-4xl font-extrabold text-primary tracking-widest">{summary.type}</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (isKraepelinResult(r)) {
      const kraepelinData = getKraepelinRows(cats);
      return (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={kraepelinData}>
            <PolarGrid stroke="hsl(220, 14%, 25%)" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
            <Radar name={r.test_name} dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    if (r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) {
      // Map semua varian (kode 1-huruf, EN, ID) ke nama temperamen Indonesia
      const ppMap: Record<string, string> = {
        K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
        S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
        M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
        P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
      };
      const order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
      const valueByName: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
      data.forEach(d => { const k = ppMap[d.name] || d.name; if (k in valueByName) valueByName[k] += d.value; });
      const mappedData = order.map(n => ({ name: n, value: valueByName[n] || 0 }));
      // Skala Y maksimum = total soal (max teoritis jika kandidat memilih dimensi sama setiap soal)
      const yMax = Math.max(10, r.total_questions || 40);
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mappedData} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }} />
            <YAxis domain={[0, yMax]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} label={{ value: 'Jumlah Jawaban', angle: -90, position: 'insideLeft', fill: 'hsl(210,20%,60%)', fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [`${v} jawaban`, 'Skor']} contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ fill: '#2dd4bf', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} label={{ position: 'top', fill: '#2dd4bf', fontSize: 12, fontWeight: 700 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (isPapiResult(r)) {
      const papiData = getPapiRows(cats).map((row) => ({ name: `${row.code} - ${row.label}`, value: row.value }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={papiData} layout="vertical" margin={{ left: 150 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis type="number" domain={[0, 9]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} width={145} />
            <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="value" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    // CFIT 3A - Culture Fair Intelligence Test
    if (isCfitName(r.test_name)) {
      const iqInfo = getCfitIqInfoFromResult(r);
      const rawScore = iqInfo.raw;
      const segmentMax: Record<string, number> = { Series: 13, Classifications: 14, Matrices: 13, Conditions: 10 };
      const normalizeSegment = (category?: string | null) => {
        const text = String(category || "").toUpperCase();
        if (text.includes("SERIES") || text === "S1") return "Series";
        if (text.includes("CLASSIFICATION") || text === "S2") return "Classifications";
        if (text.includes("MATRICES") || text === "S3") return "Matrices";
        if (text.includes("CONDITION") || text === "S4") return "Conditions";
        return "";
      };
      const segmentCounts = answers.reduce<Record<string, number>>((acc, answer) => {
        if (answer.is_correct !== true) return acc;
        const segment = normalizeSegment(answer.category);
        if (!segment) return acc;
        acc[segment] = (acc[segment] || 0) + 1;
        return acc;
      }, {});
      const segmentData = Object.keys(segmentMax).map((name) => ({
        name,
        value: segmentCounts[name] || 0,
        max: segmentMax[name],
      }));
      const hasSegmentAnswers = answers.some((answer) => answer.is_correct !== null && normalizeSegment(answer.category));

      return (
        <div className="space-y-4">
          {/* IQ Score Display */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Hasil IQ dan Klasifikasi</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-5xl font-bold text-primary">{iqInfo.iq}</p>
                <p className="text-xs text-muted-foreground mt-1">IQ Score</p>
              </div>
              <div className="w-px h-16 bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-primary">{iqInfo.classification}</p>
                <p className="text-xs text-muted-foreground mt-1">Klasifikasi</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Raw Score: {rawScore} / {iqInfo.max}</p>
          </div>

          {hasSegmentAnswers && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-3">Benar per Segmen CFIT</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={segmentData} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} />
                  <YAxis domain={[0, 14]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={(v: any, _name: any, item: any) => [`${v}/${item.payload.max}`, "Benar"]} />
                  <Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} label={({ x, y, width, value, index }: any) => {
                    const max = segmentData[index]?.max || 0;
                    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#2dd4bf" fontSize={11} fontWeight={700}>{value}/{max}</text>;
                  }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
          <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
          <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // === Interpretasi otomatis Personality Plus (4 Temperamen) ===
  const buildPersonalityPlusInterpretation = (cats: Record<string, number>, total: number) => {
    const ppMap: Record<string, string> = {
      K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
      S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
      M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
      P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
    };
    const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
    Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
    const sorted = Object.entries(norm).sort((a, b) => b[1] - a[1]);
    const [dom, domVal] = sorted[0];
    const [sec, secVal] = sorted[1];
    const sumAll = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    const pct = (v: number) => Math.round((v / sumAll) * 100);

    const desc: Record<string, { kekuatan: string; kelemahan: string; kerja: string }> = {
      Sanguinis: {
        kekuatan: "Ekspresif, antusias, ramah, mudah bergaul, optimis, kreatif, dan mampu memotivasi orang lain. Cocok di lingkungan yang membutuhkan komunikasi intensif.",
        kelemahan: "Cenderung impulsif, kurang disiplin pada detail, mudah teralihkan, dan kadang sulit menyelesaikan tugas yang berulang/monoton.",
        kerja: "Marketing, Public Relations, Sales, Trainer, Customer Engagement, Event Organizer.",
      },
      Koleris: {
        kekuatan: "Tegas, berorientasi pada hasil, pemimpin alami, mandiri, cepat mengambil keputusan, dan tidak takut tantangan.",
        kelemahan: "Cenderung dominan, kurang sabar terhadap detail emosional rekan kerja, dan dapat dipersepsikan keras kepala.",
        kerja: "Manajer Operasional, Project Lead, Supervisor Lapangan, Entrepreneur, Pemimpin Tim.",
      },
      Melankolis: {
        kekuatan: "Analitis, perfeksionis, terstruktur, teliti, setia, dan memiliki standar mutu yang tinggi terhadap pekerjaan.",
        kelemahan: "Cenderung pesimistis, perfeksionisme berlebihan dapat memperlambat eksekusi, sensitif terhadap kritik.",
        kerja: "Akuntan, Auditor, Quality Control, Riset & Pengembangan, Analis Data, Engineer.",
      },
      Plegmatis: {
        kekuatan: "Tenang, sabar, diplomatis, pendengar yang baik, mampu menjadi penengah dalam konflik, dan stabil di bawah tekanan.",
        kelemahan: "Kurang inisiatif, sulit mengambil keputusan tegas, cenderung menghindari konfrontasi dan perubahan mendadak.",
        kerja: "HR, Mediator, Administrasi, Customer Service, Konselor, Asisten Eksekutif.",
      },
    };

    const d = desc[dom];
    const s = desc[sec];
    return `Berdasarkan hasil tes Personality Plus, kandidat menampilkan profil temperamen DOMINAN: ${dom} (${domVal} jawaban — ${pct(domVal)}%) dengan dukungan SEKUNDER: ${sec} (${secVal} jawaban — ${pct(secVal)}%). Distribusi jumlah jawaban — Sanguinis: ${norm.Sanguinis}, Koleris: ${norm.Koleris}, Melankolis: ${norm.Melankolis}, Plegmatis: ${norm.Plegmatis}.

KEKUATAN (${dom}): ${d.kekuatan}
AREA PERHATIAN (${dom}): ${d.kelemahan}

Kombinasi ${dom}-${sec}: kandidat memiliki karakter utama ${dom.toLowerCase()} yang dilengkapi nuansa ${sec.toLowerCase()} (${s.kekuatan.split('.')[0].toLowerCase()}). Kombinasi ini memperkaya profil dan memperluas zona efektivitas kerja.

REKOMENDASI POSISI: ${d.kerja}

CATATAN PSIKOLOG: Profil ini valid untuk ${total} item respons. Disarankan didampingi wawancara mendalam (kompetensi & nilai) untuk validasi konteks pekerjaan. Skor tertinggi adalah karakter natural; tidak menutup kemungkinan kandidat menampilkan perilaku temperamen lain situasionalnya.`;
  };


  if (selectedResult) {
    const r = selectedResult;
    const cats = r.categories as Record<string, number>;
    const catEntries = Object.entries(cats);
    const cfitProfileRows = isCfitName(r.test_name) ? getCfitProfileRows(r) : [];
    const profile = r.candidate_profile as Record<string, string> | null;

    return (
      <AdminLayout>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => { setSelectedResult(null); setAnswers([]); }} className="text-sm text-primary hover:underline">← Kembali ke Daftar Hasil</button>
            <div className="flex flex-wrap gap-2">
              <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                <Printer className="h-4 w-4" /> Cetak Laporan Lengkap
              </button>
            </div>
          </div>

          <div ref={printRef} className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            {/* Profile card */}
            <div className="glass rounded-xl p-6 glow-border space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt={r.candidate_name} className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover border-2 border-primary/40" />
                ) : (
                  <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-lg bg-primary/20 text-primary text-3xl font-bold border-2 border-primary/40">{r.candidate_name.charAt(0)}</div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{r.candidate_name}</h2>
                  <p className="text-sm text-muted-foreground">{r.position}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "passed" ? "bg-emerald-400/10 text-emerald-400" : r.status === "review" ? "bg-amber-400/10 text-amber-400" : "bg-destructive/10 text-destructive"
                  }`}>
                    {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                  </span>
                </div>
                {r.webcam_photo_url && (
                  <div className="text-center">
                    <img src={r.webcam_photo_url} alt="Verifikasi" className="h-20 w-24 rounded border border-border object-cover" />
                    <p className="text-[10px] text-muted-foreground mt-1">Verifikasi saat tes</p>
                  </div>
                )}
              </div>
              {profile && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-border pt-4">
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{profile.email}</span></div>
                  <div><span className="text-muted-foreground">Telepon:</span> <span className="text-foreground">{profile.phone}</span></div>
                  <div><span className="text-muted-foreground">Tgl Lahir:</span> <span className="text-foreground">{profile.birthDate}</span></div>
                  <div><span className="text-muted-foreground">Pendidikan:</span> <span className="text-foreground">{profile.education}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{profile.gender}</span></div>
                  <div><span className="text-muted-foreground">Tes Selesai:</span> <span className="text-foreground">{r.completed_at?.split("T")[0]}</span></div>
                </div>
              )}
            </div>

            {/* Score cards */}
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">Alat Tes</p>
                <p className="text-lg font-bold text-primary mt-1">{r.test_name}</p>
              </div>
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">{isCfitName(r.test_name) ? "IQ Score" : isIstResult(r) ? "Skor IST" : isMbtiResult(r) ? "Tipe MBTI" : "Skor"}</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isCfitName(r.test_name) 
                    ? (() => {
                        const iqClassification: Record<number, { iq: number; classification: string }> = {
                          49: { iq: 183, classification: "GENIUS" },
                          48: { iq: 179, classification: "GENIUS" },
                          47: { iq: 176, classification: "GENIUS" },
                          46: { iq: 173, classification: "GENIUS" },
                          45: { iq: 169, classification: "VERY SUPERIOR" },
                          44: { iq: 167, classification: "VERY SUPERIOR" },
                          43: { iq: 165, classification: "VERY SUPERIOR" },
                          42: { iq: 161, classification: "VERY SUPERIOR" },
                          41: { iq: 157, classification: "VERY SUPERIOR" },
                          40: { iq: 155, classification: "VERY SUPERIOR" },
                          39: { iq: 152, classification: "VERY SUPERIOR" },
                          38: { iq: 149, classification: "VERY SUPERIOR" },
                          37: { iq: 145, classification: "VERY SUPERIOR" },
                          36: { iq: 142, classification: "VERY SUPERIOR" },
                          35: { iq: 140, classification: "VERY SUPERIOR" },
                          34: { iq: 137, classification: "SUPERIOR" },
                          33: { iq: 133, classification: "SUPERIOR" },
                          32: { iq: 131, classification: "SUPERIOR" },
                          31: { iq: 128, classification: "SUPERIOR" },
                          30: { iq: 124, classification: "SUPERIOR" },
                          29: { iq: 121, classification: "SUPERIOR" },
                          28: { iq: 119, classification: "HIGH AVERAGE" },
                          27: { iq: 116, classification: "HIGH AVERAGE" },
                          26: { iq: 113, classification: "HIGH AVERAGE" },
                          25: { iq: 109, classification: "AVERAGE" },
                          24: { iq: 106, classification: "AVERAGE" },
                          23: { iq: 103, classification: "AVERAGE" },
                          22: { iq: 100, classification: "AVERAGE" },
                          21: { iq: 96, classification: "AVERAGE" },
                          20: { iq: 94, classification: "AVERAGE" },
                          19: { iq: 91, classification: "AVERAGE" },
                          18: { iq: 88, classification: "LOW AVERAGE" },
                          17: { iq: 85, classification: "LOW AVERAGE" },
                          16: { iq: 81, classification: "LOW AVERAGE" },
                          15: { iq: 78, classification: "BOEDERLINE MENTAL RETARDATION" },
                          14: { iq: 75, classification: "BOEDERLINE MENTAL RETARDATION" },
                          13: { iq: 72, classification: "BOEDERLINE MENTAL RETARDATION" },
                          12: { iq: 70, classification: "BOEDERLINE MENTAL RETARDATION" },
                          11: { iq: 67, classification: "MILD MENTAL RETARDATION" },
                          10: { iq: 65, classification: "MILD MENTAL RETARDATION" },
                          9: { iq: 60, classification: "MILD MENTAL RETARDATION" },
                          8: { iq: 57, classification: "MILD MENTAL RETARDATION" },
                          7: { iq: 55, classification: "MILD MENTAL RETARDATION" },
                          6: { iq: 52, classification: "MILD MENTAL RETARDATION" },
                          5: { iq: 48, classification: "MODERATE MENTAL RETARDATION" },
                          4: { iq: 47, classification: "MODERATE MENTAL RETARDATION" },
                          3: { iq: 45, classification: "MODERATE MENTAL RETARDATION" },
                          2: { iq: 43, classification: "MODERATE MENTAL RETARDATION" },
                          1: { iq: 40, classification: "MODERATE MENTAL RETARDATION" },
                          0: { iq: 38, classification: "MODERATE MENTAL RETARDATION" }
                        };
                        return getCfitIqInfoFromResult(r).iq;
                      })()
                    : (r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus"))
                      ? (() => {
                          const ppMap: Record<string, string> = {
                            K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                            S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                            M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                            P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                          };
                          const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                          Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
                          const sorted = Object.entries(norm).sort((a, b) => b[1] - a[1]);
                          const dominant = sorted[0];
                          const second = sorted[1];
                          const diff = dominant[1] - second[1];
                          if (diff >= 1 && diff <= 4) {
                            return <span className="text-4xl font-extrabold text-pink-400">{dominant[0]} ({dominant[1]}) / {second[0]} ({second[1]})</span>;
                          } else {
                            return <span className="text-4xl font-extrabold text-pink-400">{dominant[0]} ({dominant[1]})</span>;
                          }
                        })()
                    : isIstResult(r)
                      ? `${getIstSummary(cats, r.score).score}%`
                    : isMbtiResult(r)
                      ? <span className="text-4xl font-extrabold tracking-widest text-primary">{getMbtiSummary(cats).type}</span>
                      : `${r.score}%`
                  }
                </p>
                {isIstResult(r) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Raw {getIstSummary(cats, r.score).raw}/{getIstSummary(cats, r.score).max}
                  </p>
                )}
              </div>
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">Soal Dijawab</p>
                <p className="text-lg font-bold text-foreground mt-1">{r.answered_questions} / {r.total_questions}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Grafik Hasil — {r.test_name}</h3>
              {renderChart(r)}
            </div>

            {/* Score table */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Detail Skor per Dimensi</h3>
              <div className="overflow-x-auto">
                {r.test_name.toUpperCase().includes("DISC") ? (() => {
                  const dims = ["D", "I", "S", "C"] as const;
                  const dimMap: Record<string, string> = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
                  const dimLabels: Record<string, string> = {
                    D: "Dominance — Pengarah, tegas, berorientasi hasil",
                    I: "Influence — Persuasif, ekspresif, sosial",
                    S: "Steadiness — Stabil, sabar, kooperatif",
                    C: "Conscientiousness — Teliti, analitis, sistematis",
                  };
                  // Check if using old format (D, I, S, C) or new format (full names)
                  const useOldFormat = cats["D"] !== undefined || cats["I"] !== undefined || cats["S"] !== undefined || cats["C"] !== undefined;
                  
                  const M = (d: string) => {
                    if (useOldFormat) {
                      return cats[`${d}_M`] !== undefined ? Number(cats[`${d}_M`]) : null;
                    } else {
                      const fullName = dimMap[d];
                      return cats[`${fullName}_M`] !== undefined ? Number(cats[`${fullName}_M`]) : null;
                    }
                  };
                  const L = (d: string) => {
                    if (useOldFormat) {
                      return cats[`${d}_L`] !== undefined ? Number(cats[`${d}_L`]) : null;
                    } else {
                      const fullName = dimMap[d];
                      return cats[`${fullName}_L`] !== undefined ? Number(cats[`${fullName}_L`]) : null;
                    }
                  };
                  const N = (d: string) => {
                    if (useOldFormat) {
                      return Number(cats[d] || 0);
                    } else {
                      const fullName = dimMap[d];
                      return Number(cats[fullName] || 0);
                    }
                  };
                  const totalQ = r.total_questions || 24;
                  const sorted = [...dims].sort((a, b) => N(b) - N(a));
                  const rank: Record<string, number> = {};
                  sorted.forEach((d, i) => { rank[d] = i + 1; });
                  const level = (n: number) => n >= Math.ceil(totalQ * 0.25) ? "Tinggi" : n >= 1 ? "Sedang" : n <= -Math.ceil(totalQ * 0.25) ? "Rendah" : "Netral";
                  const levelColor = (lv: string) => lv === "Tinggi" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : lv === "Rendah" ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : lv === "Sedang" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-muted text-muted-foreground border-border";
                  return (
                    <div className="space-y-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dimensi</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Most-like (Mask)">M</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Least-like (Core)">L</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Net = M − L (Mirror)">Net</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Level</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Rank</th>
                            <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground w-[35%]">Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dims.map(d => {
                            const m = M(d); const l = L(d); const n = N(d);
                            const lv = level(n);
                            const w = Math.min(50, Math.abs(n) / Math.max(totalQ, 1) * 50);
                            return (
                              <tr key={d} className="border-b border-border/50">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-foreground">{d}</div>
                                  <div className="text-[11px] text-muted-foreground">{dimLabels[d]}</div>
                                </td>
                                <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">{m === null ? "-" : m}</td>
                                <td className="py-2.5 px-3 text-center text-amber-400 font-semibold">{l === null ? "-" : l}</td>
                                <td className={`py-2.5 px-3 text-center font-bold ${n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{n > 0 ? `+${n}` : n}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${levelColor(lv)}`}>{lv}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-foreground font-semibold">#{rank[d]}</td>
                                <td className="py-2.5 px-3">
                                  <div className="relative h-5 bg-muted/40 rounded">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                                    {n >= 0 ? (
                                      <div className="absolute left-1/2 top-0 bottom-0 bg-emerald-500/70 rounded-r" style={{ width: `${w}%` }} />
                                    ) : (
                                      <div className="absolute right-1/2 top-0 bottom-0 bg-red-500/70 rounded-l" style={{ width: `${w}%` }} />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                        <p><span className="font-semibold text-foreground">M (Most):</span> jumlah dipilih sebagai "Paling Sesuai" (Mask).</p>
                        <p><span className="font-semibold text-foreground">L (Least):</span> jumlah dipilih sebagai "Paling Tidak Sesuai" (Core).</p>
                        <p><span className="font-semibold text-foreground">Net:</span> M − L → kekuatan natural (Mirror).</p>
                        <p><span className="font-semibold text-foreground">Rank:</span> urutan kekuatan dimensi (1 = paling dominan).</p>
                      </div>
                    </div>
                  );
                })()
                : isIstResult(r) ? (() => {
                  const summary = getIstSummary(cats, r.score);
                  return (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Subtes</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr></thead>
                      <tbody>
                        {summary.rows.map((row) => (
                          <tr key={row.code} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-semibold">{row.code} - {row.name}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.area}</td>
                            <td className="py-2 px-3 text-foreground">{row.raw}/{row.max} <span className="text-muted-foreground">({row.pct}%)</span></td>
                            <td className="py-2 px-3 text-foreground">{row.level}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${row.pct >= 65 ? "bg-emerald-400" : row.pct >= 45 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
                : isMbtiResult(r) ? (() => {
                  const summary = getMbtiSummary(cats);
                  return (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Pasangan</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dominan</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kekuatan</th>
                      </tr></thead>
                      <tbody>
                        {summary.rows.map((row) => (
                          <tr key={row.pair} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-semibold">{row.pair}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.a}={row.av} / {row.b}={row.bv}</td>
                            <td className="py-2 px-3 text-primary font-bold">{row.dominant}</td>
                            <td className="py-2 px-3 text-foreground">{row.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
                : isKraepelinResult(r) ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getKraepelinRows(cats).map((row) => (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.value}%</td>
                          <td className="py-2 px-3 w-40">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${row.value >= 70 ? "bg-emerald-400" : row.value >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-3 text-muted-foreground">Benar / Salah</td>
                        <td className="py-2 px-3 text-foreground" colSpan={2}>{Number(cats.correct_answers || 0)} / {Number(cats.wrong_answers || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                )
                : isPapiResult(r) ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skala</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getPapiRows(cats).map((row) => {
                        const pct = (row.value / 9) * 100;
                        return (
                          <tr key={row.code} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-medium">{row.code} - {row.label}</td>
                            <td className="py-2 px-3 text-foreground">{row.value}/9</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.level}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
                : (r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) ? (() => {
                  const ppMap: Record<string, string> = {
                    K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                    S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                    M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                    P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                  };
                  const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                  Object.entries(cats).forEach(([k, v]) => { const n = ppMap[k] || k; if (n in norm) norm[n] += Number(v) || 0; });
                  const totalAns = Object.values(norm).reduce((a, b) => a + b, 0) || 1;
                  const maxVal = Math.max(...Object.values(norm), 1);
                  return (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Temperamen</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Jumlah Jawaban</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Proporsi</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr></thead>
                      <tbody>
                        {(['Sanguinis','Koleris','Melankolis','Plegmatis'] as const).map(t => {
                          const v = norm[t]; const pctRel = (v / maxVal) * 100; const pctTotal = Math.round((v / totalAns) * 100);
                          return (
                            <tr key={t} className="border-b border-border/50">
                              <td className="py-2 px-3 text-foreground font-medium">{t}</td>
                              <td className="py-2 px-3 text-foreground">{v} jawaban</td>
                              <td className="py-2 px-3 text-muted-foreground">{pctTotal}%</td>
                              <td className="py-2 px-3 w-40">
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${pctRel}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })() : (
                  // Other tests: Vertical bar chart
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dimensi</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isCfitName(r.test_name) ? cfitProfileRows.map(row => (
                        <tr key={row.label} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.value}</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.note}</td>
                        </tr>
                      )) : catEntries.map(([dim, val]) => {
                        const maxVal = r.test_name === "PAPIKOSTIK" ? 9 : 100;
                        const pct = (val / maxVal) * 100;
                        return (
                          <tr key={dim} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-medium">{dim}</td>
                            <td className="py-2 px-3 text-foreground">{val}{r.test_name === "PAPIKOSTIK" ? "/9" : "%"}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Interpretation — pakai narasi otomatis untuk Personality Plus */}
            {(() => {
              const isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
              const isIST = isIstResult(r);
              const interpText = isPP
                ? buildPersonalityPlusInterpretation(cats, r.total_questions || 40)
                : isIST
                  ? buildIstInterpretation(cats, r.score)
                : isMbtiResult(r)
                  ? buildMbtiInterpretation(cats)
                : isKraepelinResult(r)
                  ? buildKraepelinInterpretation(cats)
                : isPapiResult(r)
                  ? buildPapiInterpretation(cats)
                : r.interpretation;
              if (!interpText) return null;
              return (
                <div className="glass rounded-xl p-5 glow-border mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog{isPP ? ' — Profil 4 Temperamen' : isIST ? ' — Profil IST' : isMbtiResult(r) ? ' — Profil MBTI' : isKraepelinResult(r) ? ' — Profil Kraepelin' : isPapiResult(r) ? ' — Profil PAPI' : ''}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{interpText}</p>
                </div>
              );
            })()}

            {/* Answers section */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <FileText className="h-4 w-4 text-primary" />
                Lembar Jawaban ({answers.length} soal)
              </h3>
              {answers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data jawaban tersimpan untuk tes ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground w-12">No</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Soal</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Jawaban</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {answers.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-foreground font-medium">{a.question_number}</td>
                          <td className="py-2.5 px-3">
                            <p className="text-foreground text-xs leading-relaxed">{a.question_text}</p>
                            {a.question_text_en && <p className="text-muted-foreground text-xs italic mt-0.5">{a.question_text_en}</p>}
                          </td>
                          <td className="py-2.5 px-3">
                            {a.selected_answer && a.selected_answer.includes('PALING') ? (
                              <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium leading-relaxed whitespace-pre-wrap max-w-md">{a.selected_answer}</span>
                            ) : (
                              <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                                {a.selected_answer_label ? `${a.selected_answer_label}. ` : ''}{a.selected_answer}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {(() => {
                              const ppMap: Record<string, string> = {
                                K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                                S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                                M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                                P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                              };
                              if ((r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) && a.category) {
                                return ppMap[a.category] || a.category;
                              }
                              if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer_label) {
                                return a.selected_answer_label;
                              }
                              if (isPapiResult(r) && a.category) {
                                return PAPI_LABELS[a.category] ? `${a.category} - ${PAPI_LABELS[a.category]}` : a.category;
                              }
                              return a.category || "-";
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Hasil Tes</h1>
            <p className="text-sm text-muted-foreground">Lihat dan kelola hasil tes kandidat</p>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Cari nama, posisi, atau tes..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Status</option>
              <option value="passed">Lulus</option>
              <option value="review">Review</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tes</label>
            <select value={filterTest} onChange={(e) => setFilterTest(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Tes</option>
              {uniqueTests.map(test => (
                <option key={test} value={test}>{test}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Dari Tanggal</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sampai Tanggal</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Per Halaman</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Printer className="h-4 w-4" /> Cetak Tabel
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama Kandidat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tes</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Skor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Soal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : paginatedResults.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{r.candidate_name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{r.test_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{r.score}%</span>
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full transition-all ${r.score >= 75 ? "bg-emerald-400" : r.score >= 50 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${r.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {r.answered_questions}/{r.total_questions}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {r.completed_at?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "passed" ? "bg-emerald-400/10 text-emerald-400" : r.status === "review" ? "bg-amber-400/10 text-amber-400" : "bg-destructive/10 text-destructive"
                    }`}>
                      {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleSelectResult(r)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Lihat Detail">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedResult(r); handlePrint(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Cetak Laporan">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginatedResults.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} hasil
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Results;
