import React from "react";
import { PrintResult, PrintAnswer } from "@/utils/printUtils";
import { buildCfitInterpretation, getCfitIqInfo, getCfitIqInfoFromResult, getCfitProfileRows, getCfitRawScore, isCfitName } from "@/lib/cfitScoring";
import { buildDiscInterpretation } from "@/lib/discScoring";
import { buildIstInterpretation, isIstName } from "@/lib/istScoring";
import { buildMbtiInterpretation, getMbtiRows, getMbtiType, isMbtiName } from "@/lib/mbtiScoring";
import { buildPapiInterpretation, getPapiRows, isPapiName } from "@/lib/papiScoring";
import { buildPersonalityPlusInterpretation as buildSharedPersonalityPlusInterpretation } from "@/lib/personalityPlusScoring";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const APTITUDE_AREAS = [
  { key: "Verbal", label: "Verbal", max: 11, note: "Analogi kata, relasi konsep, perbendaharaan kata, dan pemahaman hubungan bahasa." },
  { key: "Numerical", label: "Numerik", max: 10, note: "Berhitung praktis, deret angka, proporsi, dan pemecahan masalah kuantitatif." },
  { key: "Logic", label: "Logika", max: 6, note: "Penalaran deduktif, silogisme, dan konsistensi kesimpulan." },
  { key: "Classification", label: "Klasifikasi", max: 12, note: "Membedakan kategori, mencari item yang tidak sejenis, dan ketelitian konsep." },
  { key: "Pattern", label: "Pola", max: 3, note: "Pola simbol, susunan huruf/angka, dan aturan transformasi sederhana." },
  { key: "Abstract", label: "Figural/Abstrak", max: 18, note: "Penalaran gambar, analogi bentuk, rotasi/transformasi, dan persepsi visual." },
] as const;

type AptitudeAreaKey = typeof APTITUDE_AREAS[number]["key"];

const APTITUDE_CATEGORY_ALIASES: Record<string, string[]> = {
  Verbal: ["verbal ability", "verbal aptitude", "verbal_ability", "verbal aptitude", "kemampuan verbal"],
  Numerical: ["numerical ability", "numerical aptitude", "numerical_ability", "numerik", "kemampuan numerik"],
  Logic: ["logical reasoning", "logic", "logical_reasoning", "reasoning logic", "kemampuan logika"],
  Classification: ["classifications", "classification", "klasifikasi", "classification ability"],
  Pattern: ["pattern recognition", "pattern", "pola", "pattern_recognition"],
  Abstract: ["abstract reasoning", "figural", "abstract", "figural/abstrak", "kemampuan abstrak"],
};

const normalizeAptitudeCategoryKey = (value: string | null | undefined) =>
  String(value || "").trim().toLowerCase().replace(/[_\s\/\-]+/g, " ");

const resolveAptitudeCategoryKey = (value: string | null | undefined) => {
  const normalized = normalizeAptitudeCategoryKey(value);
  if (!normalized) return null;
  const exact = APTITUDE_AREAS.find((area) => normalizeAptitudeCategoryKey(area.key) === normalized);
  if (exact) return exact.key;
  const alias = Object.entries(APTITUDE_CATEGORY_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizeAptitudeCategoryKey(alias) === normalized),
  );
  if (alias) return alias[0];
  const fuzzy = APTITUDE_AREAS.find(
    (area) => normalized.includes(normalizeAptitudeCategoryKey(area.key)) || normalized.includes(normalizeAptitudeCategoryKey(area.label)),
  );
  return fuzzy?.key ?? null;
};

const getAptitudeAreaValue = (cats: Record<string, number>, area: (typeof APTITUDE_AREAS)[number]) => {
  const exact = Number(cats[area.key] ?? 0);
  if (exact !== 0) return exact;
  const entry = Object.entries(cats).find(([key]) => resolveAptitudeCategoryKey(key) === area.key);
  return Number(entry?.[1] ?? 0);
};

const getAptitudeRows = (cats: Record<string, number>) =>
  APTITUDE_AREAS.map((area) => {
    const raw = getAptitudeAreaValue(cats, area);
    const pct = Math.round((raw / area.max) * 100);
    const level = pct >= 80 ? "Sangat Baik" : pct >= 65 ? "Baik" : pct >= 50 ? "Cukup" : pct >= 35 ? "Rendah" : "Sangat Rendah";
    return { ...area, raw, pct, level };
  });

const getAptitudeLevel = (score: number) => {
  if (score >= 80) return { label: "Sangat Baik", recommendation: "Sangat Disarankan" };
  if (score >= 65) return { label: "Baik", recommendation: "Disarankan" };
  if (score >= 50) return { label: "Cukup", recommendation: "Cukup Disarankan" };
  if (score >= 35) return { label: "Rendah", recommendation: "Perlu Pertimbangan" };
  return { label: "Sangat Rendah", recommendation: "Tidak Disarankan" };
};

const isAptitudeName = (name?: string | null) => String(name || "").toUpperCase().includes("APTITUDE");

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatInterpretationHtml = (text: string) => {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let html = "";
  let listOpen = false;
  const closeList = () => {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  };

  lines.forEach((line) => {
    const isHeading = (/^[A-Z0-9\s]+$/.test(line) && line.length <= 44) || (/^[A-Za-zÀ-ÿ0-9\s/]+:$/.test(line) && line.length <= 56);
    if (isHeading) {
      closeList();
      html += `<h4 class="result-interpretation-heading">${escapeHtml(line.replace(/:$/, ""))}</h4>`;
    } else if (line.startsWith("- ")) {
      if (!listOpen) {
        html += `<ul class="result-interpretation-list">`;
        listOpen = true;
      }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
    } else {
      closeList();
      html += `<p class="result-interpretation-paragraph">${escapeHtml(line)}</p>`;
    }
  });
  closeList();
  return html;
};

const getAptitudeIqLabel = (iq: number) => {
  if (iq >= 145) return "Sangat berbakat";
  if (iq >= 130) return "Superior";
  if (iq >= 115) return "Tinggi";
  if (iq >= 100) return "Di atas rata-rata";
  if (iq >= 85) return "Rata-rata";
  if (iq >= 70) return "Di bawah rata-rata";
  return "Sangat rendah";
};

interface CandidateTestResultViewProps {
  result: PrintResult;
  answers: PrintAnswer[];
  profilePhoto?: string;
}

const normalizeOptionCode = (value?: string | null) => String(value || "").trim().replace(/\.$/, "").toUpperCase();

const getAnswerDisplayText = (answer: PrintAnswer) => {
  if (answer.selected_answer?.includes("PALING")) return answer.selected_answer;
  const label = normalizeOptionCode(answer.selected_answer_label);
  const text = String(answer.selected_answer || "").trim();
  if (!text) return label || "-";
  if (!label || normalizeOptionCode(text) === label) return text;
  return `${label}. ${text}`;
};

const getAnswerCategoryText = (answer: PrintAnswer, testName: string) => {
  if (testName.toUpperCase().includes("DISC") && answer.selected_answer?.includes("PALING") && answer.selected_answer_label) {
    return answer.selected_answer_label;
  }
  return answer.category || "-";
};

const CandidateTestResultView: React.FC<CandidateTestResultViewProps> = ({ result, answers, profilePhoto }) => {
  const profile = result.candidate_profile || {};
  const cats = (result.categories || {}) as Record<string, number>;
  const catEntries = Object.entries(cats);
  const isDISC = result.test_name.toUpperCase().includes("DISC");
  const isPersonalityPlus = result.test_name === "Personality Plus" || result.test_name.includes("Personality Plus");
  const isKraepelin = result.test_name === "Kraepelin" || result.test_name.includes("Kraepelin");
  const isPapikostik = isPapiName(result.test_name);
  const isCFIT = isCfitName(result.test_name);
  const isIST = isIstName(result.test_name) || Object.keys(cats).some((key) => /^SE\s*-|^WA\s*-|^AN\s*-|^GE\s*-/i.test(key));
  const isMBTI = isMbtiName(result.test_name) || ["E", "I", "S", "N", "T", "F", "J", "P"].every((key) => key in cats);
  const hasAptitudeAreas = APTITUDE_AREAS.some((area) => area.key in cats);
  const isAptitude = (isAptitudeName(result.test_name) || hasAptitudeAreas) && !isCFIT && !isIST && !isMBTI && !isPapikostik && !isPersonalityPlus && !isDISC && !isKraepelin;

  const getAptitudeRawValue = () => {
    const explicitRaw = cats.correct_answers ?? cats["Aptitude Raw Score"] ?? cats.raw_score ?? cats.correct ?? cats["Correct Answers"] ?? null;
    if (explicitRaw !== null && explicitRaw !== undefined && !Number.isNaN(Number(explicitRaw))) {
      return Math.max(0, Math.round(Number(explicitRaw)));
    }
    const areaSum = APTITUDE_AREAS.reduce((sum, area) => sum + Number(cats[area.key] || 0), 0);
    if (areaSum > 0) return areaSum;
    return getCfitRawScore(result);
  };

  const getAptitudeInfo = () => {
    const total = Math.max(1, Number(result.total_questions) || 0);
    const raw = Math.min(total, getAptitudeRawValue());
    const scaledRaw = Math.min(49, Math.round((raw / total) * 49));
    const cfitInfo = getCfitIqInfo(scaledRaw);
    const percentage = Math.round((raw / total) * 100);
    return {
      ...cfitInfo,
      raw,
      total,
      percentage,
      classification: getAptitudeIqLabel(cfitInfo.iq),
    };
  };

  const aptitudeInfo = isAptitude ? getAptitudeInfo() : null;
  const aptitudeRows = isAptitude ? getAptitudeRows(cats) : [];
  const mbtiRows = isMBTI ? getMbtiRows(cats) : [];
  const mbtiType = isMBTI ? getMbtiType(cats) : "";
  const kraepelinRows = [
    { key: "speed", label: "Kecepatan", value: Number(cats.speed || 0) },
    { key: "accuracy", label: "Ketelitian", value: Number(cats.accuracy || 0) },
    { key: "stability", label: "Stabilitas", value: Number(cats.stability || 0) },
    { key: "work_capacity", label: "Kapasitas Kerja", value: Number(cats.work_capacity || 0) },
  ];

  const statusLabel = result.status === "review" ? "Perlu Review" : result.status === "failed" ? "Perlu Tinjauan" : "Selesai";
  const statusClass = result.status === "review" ? "bg-amber-100 text-amber-700" : result.status === "failed" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700";

  const formatDate = (value: string) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return value;
    }
  };

  const dimMap: Record<string, string> = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
  const useOldFormat = cats["D"] !== undefined || cats["I"] !== undefined || cats["S"] !== undefined || cats["C"] !== undefined;

  const getM = (d: string) => {
    if (useOldFormat) return Number(cats[`${d}_M`] || 0);
    return Number(cats[`${dimMap[d]}_M`] || 0);
  };
  const getL = (d: string) => {
    if (useOldFormat) return Number(cats[`${d}_L`] || 0);
    return Number(cats[`${dimMap[d]}_L`] || 0);
  };
  const getN = (d: string) => {
    if (useOldFormat) return Number(cats[d] || 0);
    return Number(cats[dimMap[d]] || 0);
  };

  const buildPersonalityPlusInterpretation = (categories: Record<string, number>, total: number) => {
    const ppMap: Record<string, string> = {
      K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
      S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
      M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
      P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
    };
    const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
    Object.entries(categories).forEach(([k, v]) => {
      const normalized = ppMap[k] || k;
      if (normalized in norm) norm[normalized] += Number(v) || 0;
    });
    const sorted = Object.entries(norm).sort((a, b) => b[1] - a[1]);
    const [dom, domVal] = sorted[0];
    const [sec, secVal] = sorted[1];
    const totalAnswers = Object.values(norm).reduce((sum, value) => sum + value, 0) || 1;
    const pct = (value: number) => Math.round((value / totalAnswers) * 100);

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

    const primary = desc[dom];
    const secondary = desc[sec];

    return `Berdasarkan hasil tes Personality Plus, kandidat menampilkan profil temperamen DOMINAN: ${dom} (${domVal} jawaban — ${pct(domVal)}%) dengan dukungan SEKUNDER: ${sec} (${secVal} jawaban — ${pct(secVal)}%). Distribusi jumlah jawaban — Sanguinis: ${norm.Sanguinis}, Koleris: ${norm.Koleris}, Melankolis: ${norm.Melankolis}, Plegmatis: ${norm.Plegmatis}.

KEKUATAN (${dom}): ${primary.kekuatan}
AREA PERHATIAN (${dom}): ${primary.kelemahan}

Kombinasi ${dom}-${sec}: kandidat memiliki karakter utama ${dom.toLowerCase()} yang dilengkapi nuansa ${sec.toLowerCase()} (${secondary.kekuatan.split('.')[0].toLowerCase()}). Kombinasi ini memperkaya profil dan memperluas zona efektivitas kerja.

REKOMENDASI POSISI: ${primary.kerja}

CATATAN PSIKOLOG: Profil ini valid untuk ${total} item respons. Disarankan didampingi wawancara mendalam (kompetensi & nilai) untuk validasi konteks pekerjaan. Skor tertinggi adalah karakter natural; tidak menutup kemungkinan kandidat menampilkan perilaku temperamen lain situasionalnya.`;
  };

  const renderChart = () => {
    const data = catEntries.map(([name, value]) => ({ name, value }));
    if (isDISC) {
      const dims = ["D", "I", "S", "C"] as const;
      const mask = dims.map((d) => ({ name: d, value: getM(d) }));
      const core = dims.map((d) => ({ name: d, value: getL(d) }));
      const mirror = dims.map((d) => ({ name: d, value: getN(d) }));
      const sortedCats = dims.map((d) => [d, getN(d)] as [string, number]).sort((a, b) => b[1] - a[1]);
      const dominant = sortedCats[0]?.[0] || "D";
      const secondary = sortedCats[1]?.[0] || "I";

      const renderMini = (title: string, chartData: { name: string; value: number }[], color: string, allowNegative = false) => {
        const values = chartData.map((item) => item.value);
        const min = allowNegative ? Math.min(0, ...values) : 0;
        const max = Math.max(1, ...values.map((v) => Math.abs(v)));
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">{title}</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
                <YAxis domain={[min, max]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#gradient-${color.replace("#", "")})`} dot={{ r: 5, fill: color, strokeWidth: 2 }} activeDot={{ r: 7, fill: color, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
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
            <div
              className="space-y-2 text-xs leading-relaxed text-muted-foreground [&_.result-interpretation-heading]:mt-3 [&_.result-interpretation-heading:first-child]:mt-0 [&_.result-interpretation-heading]:text-[11px] [&_.result-interpretation-heading]:font-bold [&_.result-interpretation-heading]:uppercase [&_.result-interpretation-heading]:tracking-wide [&_.result-interpretation-heading]:text-primary [&_.result-interpretation-list]:ml-5 [&_.result-interpretation-list]:list-disc [&_.result-interpretation-list_li]:my-1 [&_.result-interpretation-paragraph]:my-1"
              dangerouslySetInnerHTML={{ __html: formatInterpretationHtml(buildDiscInterpretation(cats, result.total_questions || 24)) }}
            />
          </div>
        </div>
      );
    }

    if (isKraepelin) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={kraepelinRows}>
            <PolarGrid stroke="hsl(220, 14%, 25%)" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
            <Radar name={result.test_name} dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (isAptitude && aptitudeInfo) {
      const aptitudeBreakdownData = aptitudeRows.map((row) => ({ name: row.label, value: row.pct, raw: row.raw, max: row.max, level: row.level }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={aptitudeBreakdownData} margin={{ left: 20, right: 30, top: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" angle={-18} textAnchor="end" height={62} tick={{ fill: "hsl(210,20%,75%)", fontSize: 11, fontWeight: 600 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}
              formatter={(value: any, _name: any, props: any) => [`${value}% (${props.payload.raw}/${props.payload.max})`, props.payload.level]}
            />
            <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (isPersonalityPlus) {
      const ppMap: Record<string, string> = {
        K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
        S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
        M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
        P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
      };
      const order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
      const valueByName: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
      data.forEach((item) => {
        const key = ppMap[item.name] || item.name;
        if (key in valueByName) valueByName[key] += item.value;
      });
      const mappedData = order.map((name) => ({ name, value: valueByName[name] || 0 }));
      const yMax = Math.max(10, result.total_questions || 40);
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mappedData} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }} />
            <YAxis domain={[0, yMax]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} label={{ value: 'Jumlah Jawaban', angle: -90, position: 'insideLeft', fill: 'hsl(210,20%,60%)', fontSize: 11 }} />
            <Tooltip formatter={(value: any) => [`${value} jawaban`, 'Skor']} contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ fill: '#2dd4bf', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} label={{ position: 'top', fill: '#2dd4bf', fontSize: 12, fontWeight: 700 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (isMBTI) {
      const data = mbtiRows.map((row) => ({ name: row.pair, value: row.strength, dominant: row.dominant }));
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(value: any, _name: any, props: any) => [`${value}%`, `Dominan ${props.payload.dominant}`]} contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="value" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (isPapikostik) {
      const papiData = getPapiRows(cats).map((row) => ({ name: row.code, label: row.label, value: row.value }));
      return (
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={papiData}>
            <PolarGrid stroke="hsl(220, 14%, 25%)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11, fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
            <Tooltip formatter={(v: any, _name: any, props: any) => [`${v}/9`, `${props.payload.name} - ${props.payload.label}`]} contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Radar name="Profil PAPI" dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.24} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (isCFIT) {
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
        0: { iq: 38, classification: "MODERATE MENTAL RETARDATION" },
      };
      const info = getCfitIqInfoFromResult(result);
      return (
        <div className="space-y-2 text-center">
          <div className="text-xs text-muted-foreground">IQ Score Estimasi</div>
          <div className="text-3xl font-bold text-foreground">{info.iq}</div>
          <div className="text-xs text-muted-foreground">Klasifikasi: {info.classification}</div>
          <div className="text-xs text-muted-foreground">Raw Score: {info.raw} / {info.max}</div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
          <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
          <Bar dataKey="value" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderDimensionTable = () => {
    if (isDISC) {
      const dims = ["D", "I", "S", "C"] as const;
      const totalQ = result.total_questions || 24;
      const levelLabel = (value: number) => value >= Math.ceil(totalQ * 0.25) ? "Tinggi" : value >= 1 ? "Sedang" : value <= -Math.ceil(totalQ * 0.25) ? "Rendah" : "Netral";
      const levelStyle = (level: string) => level === "Tinggi" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : level === "Rendah" ? "bg-red-500/20 text-red-400 border-red-500/40" : level === "Sedang" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-muted text-muted-foreground border-border";
      const sorted = [...dims].sort((a, b) => getN(b) - getN(a));
      const rank: Record<string, number> = {};
      sorted.forEach((dim, index) => { rank[dim] = index + 1; });
      const dimLabels: Record<string, string> = {
        D: "Dominance — Pengarah, tegas, berorientasi hasil",
        I: "Influence — Persuasif, ekspresif, sosial",
        S: "Steadiness — Stabil, sabar, kooperatif",
        C: "Conscientiousness — Teliti, analitis, sistematis",
      };
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
              {dims.map((dim) => {
                const m = getM(dim);
                const l = getL(dim);
                const n = getN(dim);
                const level = levelLabel(n);
                const width = Math.min(50, Math.abs(n) / Math.max(totalQ, 1) * 50);
                return (
                  <tr key={dim} className="border-b border-border/50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-foreground">{dim}</div>
                      <div className="text-[11px] text-muted-foreground">{dimLabels[dim]}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">{m === null ? "-" : m}</td>
                    <td className="py-2.5 px-3 text-center text-amber-400 font-semibold">{l === null ? "-" : l}</td>
                    <td className={`py-2.5 px-3 text-center font-bold ${n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{n > 0 ? `+${n}` : n}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${levelStyle(level)}`}>{level}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-foreground font-semibold">#{rank[dim]}</td>
                    <td className="py-2.5 px-3">
                      <div className="relative h-5 bg-muted/40 rounded">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                        {n >= 0 ? (
                          <div className="absolute left-1/2 top-0 bottom-0 bg-emerald-500/70 rounded-r" style={{ width: `${width}%` }} />
                        ) : (
                          <div className="absolute right-1/2 top-0 bottom-0 bg-red-500/70 rounded-l" style={{ width: `${width}%` }} />
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
    }

    if (isPersonalityPlus) {
      const ppMap: Record<string, string> = {
        K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
        S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
        M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
        P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
      };
      const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
      catEntries.forEach(([key, value]) => {
        const normalized = ppMap[key] || key;
        if (normalized in norm) norm[normalized] += Number(value) || 0;
      });
      const totalAnswers = Object.values(norm).reduce((sum, value) => sum + value, 0) || 1;
      const maxValue = Math.max(...Object.values(norm), 1);
      const order: Array<keyof typeof norm> = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Temperamen</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Jumlah Jawaban</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Proporsi</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
            </tr>
          </thead>
          <tbody>
            {order.map((name) => {
              const value = norm[name];
              const pctTotal = Math.round((value / totalAnswers) * 100);
              const pctRel = (value / maxValue) * 100;
              return (
                <tr key={name} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground font-medium">{name}</td>
                  <td className="py-2 px-3 text-foreground">{value} jawaban</td>
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
    }

    if (isAptitude && aptitudeInfo) {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kategori</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Nilai</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 px-3 text-foreground font-medium">Skor Aptitude</td>
              <td className="py-2 px-3 text-foreground">{aptitudeInfo.percentage}%</td>
              <td className="py-2 px-3 text-muted-foreground">{aptitudeInfo.classification}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 px-3 text-foreground font-medium">Jawaban Benar</td>
              <td className="py-2 px-3 text-foreground">{aptitudeInfo.raw}/{aptitudeInfo.total}</td>
              <td className="py-2 px-3 text-muted-foreground">Konversi ke IQ berdasarkan norma</td>
            </tr>
            <tr>
              <td className="py-2 px-3 text-foreground font-medium">IQ Estimasi</td>
              <td className="py-2 px-3 text-foreground">{aptitudeInfo.iq}</td>
              <td className="py-2 px-3 text-muted-foreground">{aptitudeInfo.classification}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (isMBTI) {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dimensi</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
            </tr>
          </thead>
          <tbody>
            {isKraepelin && kraepelinRows.map(row => (
              <tr key={row.key} className="border-b border-border/50">
                <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                <td className="py-2 px-3 text-foreground">{row.value}%</td>
                <td className="py-2 px-3 w-40">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${row.value >= 70 ? "bg-emerald-400" : row.value >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
            {isPapikostik && getPapiRows(cats).map(row => {
              const pct = (row.value / 9) * 100;
              return (
                <tr key={row.code} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground font-medium">{row.code} - {row.label}</td>
                  <td className="py-2 px-3 text-foreground">{row.value}/9</td>
                  <td className="py-2 px-3 w-40">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {catEntries.map(([dim, val]) => {
              if (isKraepelin) return null;
              if (isPapikostik) return null;
              if (isCFIT) return null;
              if (isMBTI) return null;
              const maxVal = isPapikostik ? 9 : 100;
              const pct = maxVal > 0 ? (Number(val) / maxVal) * 100 : 0;
              return (
                <tr key={dim} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground font-medium">{dim}</td>
                  <td className="py-2 px-3 text-foreground">{val}{isPapikostik ? "/9" : "%"}</td>
                  <td className="py-2 px-3 w-40">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {isCFIT && getCfitProfileRows(result).map(row => (
              <tr key={row.label} className="border-b border-border/50">
                <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                <td className="py-2 px-3 text-foreground">{row.value}</td>
                <td className="py-2 px-3 text-muted-foreground">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  const interpretationText = isPersonalityPlus
    ? buildSharedPersonalityPlusInterpretation(cats, result.total_questions || 40)
    : isDISC
      ? buildDiscInterpretation(cats, result.total_questions || 24)
    : isIST
      ? buildIstInterpretation(cats, result.score)
    : isCFIT
      ? buildCfitInterpretation(result)
    : isMBTI
      ? buildMbtiInterpretation(cats)
    : isPapikostik
      ? buildPapiInterpretation(cats)
    : result.interpretation;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 glow-border space-y-4 bg-white">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {profilePhoto || profile.photo_url ? (
            <img src={profilePhoto || profile.photo_url} alt={result.candidate_name} className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover border-2 border-primary/40" />
          ) : (
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-lg bg-primary/20 text-primary text-3xl font-bold border-2 border-primary/40">
              {result.candidate_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{result.candidate_name}</h2>
            <p className="text-sm text-muted-foreground">{result.position || "-"}</p>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>{statusLabel}</span>
          </div>
          <div className="ml-auto text-center">
            {result.webcam_photo_url ? (
              <img src={result.webcam_photo_url} alt="Screenshot saat tes" className="h-24 w-32 rounded-lg border border-border object-cover" />
            ) : (
              <div className="h-24 w-32 rounded-lg border border-dashed border-border bg-muted/30" aria-label="Screenshot saat tes kosong" />
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Screenshot saat tes</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-border pt-4">
          <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{profile.email || "-"}</span></div>
          <div><span className="text-muted-foreground">Telepon:</span> <span className="text-foreground">{profile.phone || "-"}</span></div>
          <div><span className="text-muted-foreground">Pendidikan:</span> <span className="text-foreground">{profile.education || profile.education_level || profile.education_institution || "-"}</span></div>
          <div><span className="text-muted-foreground">Tanggal Tes:</span> <span className="text-foreground">{formatDate(result.completed_at)}</span></div>
          <div><span className="text-muted-foreground">{isCFIT ? "IQ:" : isMBTI ? "Tipe:" : "Skor:"}</span> <span className="text-foreground">{isCFIT ? getCfitIqInfoFromResult(result).iq : isMBTI ? mbtiType : `${result.score}%`}</span></div>
          <div><span className="text-muted-foreground">Soal Dijawab:</span> <span className="text-foreground">{result.answered_questions} / {result.total_questions}</span></div>
          <div><span className="text-muted-foreground">Nama Tes:</span> <span className="text-foreground">{result.test_name}</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5 glow-border text-center">
          <p className="text-xs text-muted-foreground">Alat Tes</p>
          <p className="text-lg font-bold text-primary mt-1">{result.test_name}</p>
        </div>
        <div className="glass rounded-xl p-5 glow-border text-center">
          <p className="text-xs text-muted-foreground">{isAptitude ? "IQ Score" : isCFIT ? "IQ Score" : isMBTI ? "Tipe MBTI" : "Skor Akhir"}</p>
          <p className={`text-3xl font-bold text-foreground mt-1 ${isMBTI ? "tracking-widest" : ""}`}>{isAptitude ? aptitudeInfo?.iq : isCFIT ? getCfitIqInfoFromResult(result).iq : isMBTI ? mbtiType : `${result.score}%`}</p>
          {isAptitude && aptitudeInfo && (
            <p className="text-[11px] text-muted-foreground mt-2">
              {aptitudeInfo.classification} · {aptitudeInfo.raw}/{aptitudeInfo.total} benar ({aptitudeInfo.percentage}%)
            </p>
          )}
        </div>
        <div className="glass rounded-xl p-5 glow-border text-center">
          <p className="text-xs text-muted-foreground">Soal Dijawab</p>
          <p className="text-lg font-bold text-foreground mt-1">{result.answered_questions} / {result.total_questions}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-5 glow-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Grafik Hasil — {result.test_name}</h3>
        {renderChart()}
      </div>

      <div className="glass rounded-xl p-5 glow-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Detail Skor per Dimensi</h3>
        <div className="overflow-x-auto">{renderDimensionTable()}</div>
      </div>

      {interpretationText && (
        <div className="glass rounded-xl p-5 glow-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog{isPersonalityPlus ? ' — Profil 4 Temperamen' : isDISC ? ' — Profil DISC' : isIST ? ' — Profil IST' : isCFIT ? ' — Profil CFIT 3A' : isMBTI ? ' — Profil MBTI' : isPapikostik ? ' — Profil PAPI' : ''}</h3>
          {isDISC || isMBTI || isPersonalityPlus || isCFIT || isPapikostik ? (
            <div
              className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_.result-interpretation-heading]:mt-4 [&_.result-interpretation-heading:first-child]:mt-0 [&_.result-interpretation-heading]:text-xs [&_.result-interpretation-heading]:font-bold [&_.result-interpretation-heading]:uppercase [&_.result-interpretation-heading]:tracking-wide [&_.result-interpretation-heading]:text-primary [&_.result-interpretation-list]:ml-5 [&_.result-interpretation-list]:list-disc [&_.result-interpretation-list_li]:my-1 [&_.result-interpretation-paragraph]:my-1"
              dangerouslySetInnerHTML={{ __html: formatInterpretationHtml(interpretationText) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{interpretationText}</p>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-5 glow-border">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">Lembar Jawaban ({answers.length} soal)</h3>
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
                {answers.map((answer) => (
                  <tr key={answer.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground font-semibold">{answer.question_number}</td>
                    <td className="py-2 px-3 text-foreground break-words">{answer.question_text}</td>
                    <td className="py-2 px-3 text-foreground">{getAnswerDisplayText(answer)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{getAnswerCategoryText(answer, result.test_name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateTestResultView;
