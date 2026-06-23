import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, Eye, Download, Printer, FileText, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { buildCfitInterpretation, getCfitIqInfo, getCfitIqInfoFromResult, getCfitProfileRows, getCfitRawScore, isCfitName } from "@/lib/cfitScoring";
import { buildDiscInterpretation as buildSharedDiscInterpretation } from "@/lib/discScoring";
import { buildIstInterpretation as buildSharedIstInterpretation, getIstRows as getSharedIstRows, getIstSummary as getSharedIstSummary } from "@/lib/istScoring";
import { buildMbtiInterpretation as buildSharedMbtiInterpretation, getMbtiRows as getSharedMbtiRows, getMbtiType, isMbtiName } from "@/lib/mbtiScoring";
import { buildMsdtInterpretation, getMsdtInterpretationRows, getMsdtRows, isMsdtName, MsdtInterpretationRow } from "@/lib/msdtScoring";
import { buildPapiCategoriesFromAnswers, buildPapiInterpretation, getPapiRows, isPapiName, PAPI_SCALES, PAPI_WHEEL_ORDER } from "@/lib/papiScoring";
import { buildPersonalityPlusInterpretation as buildSharedPersonalityPlusInterpretation, getPersonalityPlusRows } from "@/lib/personalityPlusScoring";
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

const normalizeOptionCode = (value?: string | null) => String(value || "").trim().replace(/\.$/, "").toUpperCase();

const isOptionCodeOnly = (value?: string | null) => /^[A-Z]$/.test(normalizeOptionCode(value));

const getAnswerDisplayText = (answer: AnswerRow, showLabel = true) => {
  if (answer.selected_answer?.includes("PALING")) return answer.selected_answer;
  const label = normalizeOptionCode(answer.selected_answer_label);
  const text = String(answer.selected_answer || "").trim();
  if (!text) return label || "-";
  if (!showLabel || !label || normalizeOptionCode(text) === label) return text;
  return `${label}. ${text}`;
};

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
  { code: "SE", name: "Satzergänzung", max: 20, area: "Pengetahuan bahasa dan pemahaman konsep verbal" },
  { code: "WA", name: "Wortauswahl", max: 20, area: "Kemampuan abstraksi verbal dan asosiasi kata" },
  { code: "AN", name: "Analogien", max: 20, area: "Penalaran analogis dan hubungan logis" },
  { code: "GE", name: "Gemeinsamkeiten", max: 16, area: "Pembentukan konsep umum dan generalisasi" },
  { code: "RA", name: "Rechenaufgaben", max: 20, area: "Kemampuan berhitung dan pemecahan masalah numerik" },
  { code: "ZR", name: "Zahlenreihen", max: 20, area: "Penalaran induktif numerik dan pola deret" },
  { code: "FA", name: "Figurenauswahl", max: 20, area: "Kemampuan analisis bentuk dan konstruksi figural" },
  { code: "WU", name: "Würfelaufgaben", max: 20, area: "Daya bayang ruang dan rotasi mental" },
  { code: "ME", name: "Merkaufgaben", max: 20, area: "Daya ingat dan retensi informasi" },
] as const;

const isIstResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  r.test_name.toUpperCase().includes("IST") || Object.keys(r.categories || {}).some((key) => /^(SE|WA|AN|GE|RA|ZR|FA|WU|ME)(\s*-|$)/i.test(key));

const getIstSubtestScore = (cats: Record<string, number>, code: string) => {
  const match = Object.entries(cats).find(([key]) => key === code || key.startsWith(`${code} -`));
  return Number(match?.[1] || 0);
};

const getIstRows = (cats: Record<string, number>) => getSharedIstRows(cats);

const getIstSummary = (cats: Record<string, number>, fallbackScore: number) => {
  return getSharedIstSummary(cats, fallbackScore);
};

const buildIstInterpretation = (cats: Record<string, number>, fallbackScore: number) => {
  return buildSharedIstInterpretation(cats, fallbackScore);
};

const isMbtiResult = (r: Pick<ResultRow, "test_name" | "categories">) => {
  const keys = Object.keys(r.categories || {});
  return isMbtiName(r.test_name) || ["E", "I", "S", "N", "T", "F", "J", "P"].every((k) => keys.includes(k));
};

const getMbtiSummary = (cats: Record<string, number>) => {
  const rows = getSharedMbtiRows(cats).map((row) => ({ ...row, pct: row.strength }));
  return { type: getMbtiType(cats), rows };
};

const buildMbtiInterpretation = buildSharedMbtiInterpretation;

const PAPI_LABELS: Record<string, string> = Object.fromEntries(PAPI_SCALES.map((scale) => [scale.code, scale.label]));

const isPapiResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  isPapiName(r.test_name) || (
    !r.test_name.toUpperCase().includes("DISC")
    && !isMbtiResult(r)
    && Object.keys(r.categories || {}).filter((key) => PAPI_LABELS[key]).length >= 8
  );

const isMsdtResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  isMsdtName(r.test_name)
  || Object.keys(r.categories || {}).some((key) => getMsdtRows(r.categories || {}).some((row) => row.code === key));

const PAPI_WHEEL_TEXT: Record<string, string> = {
  N: "Tuntas Tugas",
  G: "Kerja Keras",
  A: "Prestasi",
  L: "Memimpin",
  P: "Kontrol",
  I: "Keputusan",
  T: "Tempo",
  V: "Vitalitas",
  S: "Sosial",
  B: "Kelompok",
  O: "Kedekatan",
  X: "Perhatian",
  C: "Teratur",
  D: "Terinci",
  R: "Teoritis",
  Z: "Perubahan",
  E: "Emosi",
  K: "Agresivitas",
  F: "Dukung Atasan",
  W: "Aturan",
};
const PAPI_WHEEL_GROUPS = [
  { label: "ARAH KERJA", start: 0, count: 3, color: "#ef1d1d" },
  { label: "KEPEMIMPINAN", start: 3, count: 3, color: "#d81bd4" },
  { label: "AKTIFITAS", start: 6, count: 2, color: "#0b31d9" },
  { label: "PERGAULAN", start: 8, count: 4, color: "#10afd2" },
  { label: "GAYA KERJA", start: 12, count: 3, color: "#13d88a" },
  { label: "SIFAT", start: 15, count: 3, color: "#e8d500" },
  { label: "KETAATAN", start: 18, count: 2, color: "#ee8b00" },
];

const renderPapiWheelSvg = (rows: ReturnType<typeof getPapiRows>) => {
  const rowByCode = new Map(rows.map((row) => [row.code, row]));
  const orderedRows = PAPI_WHEEL_ORDER.map((code) => rowByCode.get(code)).filter(Boolean) as ReturnType<typeof getPapiRows>;
  const size = 680;
  const center = size / 2;
  const plotRadius = 185;
  const codeInner = 210;
  const codeOuter = 252;
  const descOuter = 304;
  const groupInner = 304;
  const groupOuter = 334;
  const step = 360 / orderedRows.length;
  const startOffset = -90 - step / 2;
  const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pointFor = (index: number, value: number) => {
    const angleDeg = startOffset + index * step + step / 2;
    const angle = angleDeg * (Math.PI / 180);
    const chartMax = 8;
    const distance = (Math.max(0, Math.min(chartMax, value)) / chartMax) * plotRadius;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };
  const polar = (angleDeg: number, radius: number) => {
    const angle = angleDeg * (Math.PI / 180);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  };
  const arcPath = (startDeg: number, endDeg: number, inner: number, outer: number) => {
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const p1 = polar(startDeg, outer);
    const p2 = polar(endDeg, outer);
    const p3 = polar(endDeg, inner);
    const p4 = polar(startDeg, inner);
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${outer} ${outer} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A ${inner} ${inner} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`;
  };
  const readableRotate = (angle: number) => {
    const normalized = ((angle % 360) + 360) % 360;
    const rotation = angle + 90;
    return normalized > 90 && normalized < 270 ? rotation + 180 : rotation;
  };
  const wrapLabel = (text: string, maxChars = 9, maxLines = 2) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    words.forEach((word) => {
      const current = lines[lines.length - 1] || "";
      if (!current) {
        lines.push(word);
      } else if (`${current} ${word}`.length <= maxChars) {
        lines[lines.length - 1] = `${current} ${word}`;
      } else if (lines.length < maxLines) {
        lines.push(word);
      }
    });
    if (lines.length > maxLines) lines.length = maxLines;
    return lines;
  };
  const polygon = orderedRows.map((row, index) => pointFor(index, row.value)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const maxRows = [...orderedRows].sort((a, b) => b.value - a.value || a.code.localeCompare(b.code)).slice(0, 3);

  return `
    <div class="papi-wheel-card">
      <svg viewBox="0 0 ${size} ${size}" width="100%" role="img" aria-label="Grafik PAPI Kostick">
        ${PAPI_WHEEL_GROUPS.map((group) => {
          const start = startOffset + group.start * step;
          const end = startOffset + (group.start + group.count) * step;
          const labelAngle = (start + end) / 2;
          const labelPoint = polar(labelAngle, (groupInner + groupOuter) / 2);
          const rotate = readableRotate(labelAngle);
          return `
            <path d="${arcPath(start, end, groupInner, groupOuter)}" fill="${group.color}" stroke="#ffffff" stroke-width="2" />
            <text x="${labelPoint.x.toFixed(1)}" y="${labelPoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="800" fill="#ffffff" transform="rotate(${rotate.toFixed(1)} ${labelPoint.x.toFixed(1)} ${labelPoint.y.toFixed(1)})">${esc(group.label)}</text>
          `;
        }).join("")}
        ${orderedRows.map((row, index) => {
          const start = startOffset + index * step;
          const end = start + step;
          const mid = (start + end) / 2;
          const codePoint = polar(mid, (codeInner + codeOuter) / 2);
          const descPoint = polar(mid, (codeOuter + descOuter) / 2);
          const rotate = readableRotate(mid);
          const descLines = wrapLabel(PAPI_WHEEL_TEXT[row.code] || row.label);
          return `
            <path d="${arcPath(start, end, codeInner, codeOuter)}" fill="#36d91d" stroke="#ffffff" stroke-width="2" />
            <path d="${arcPath(start, end, codeOuter, descOuter)}" fill="#fbf3a1" stroke="#ffffff" stroke-width="1" />
            <text x="${codePoint.x.toFixed(1)}" y="${codePoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="26" font-weight="900" fill="#111827" transform="rotate(${rotate.toFixed(1)} ${codePoint.x.toFixed(1)} ${codePoint.y.toFixed(1)})">${row.code}</text>
            <text x="${descPoint.x.toFixed(1)}" y="${descPoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="8.5" font-weight="600" fill="#111827" transform="rotate(${rotate.toFixed(1)} ${descPoint.x.toFixed(1)} ${descPoint.y.toFixed(1)})">
              ${descLines.map((line, lineIndex) => `<tspan x="${descPoint.x.toFixed(1)}" dy="${lineIndex === 0 ? -(descLines.length - 1) * 4.5 : 9}">${esc(line)}</tspan>`).join("")}
            </text>
          `;
        }).join("")}
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((ring) => {
          const r = (ring / 9) * plotRadius;
          return `<circle cx="${center}" cy="${center}" r="${r.toFixed(1)}" fill="none" stroke="${ring % 3 === 0 ? "#d1d5db" : "#e5e7eb"}" stroke-width="${ring % 3 === 0 ? 1.25 : 0.8}" />`;
        }).join("")}
        ${orderedRows.map((row, index) => {
          const end = pointFor(index, 9);
          return `
            <line x1="${center}" y1="${center}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="#d1d5db" stroke-width="1" />
          `;
        }).join("")}
        ${[0, 3, 6, 9].map((tick) => {
          const p = pointFor(0, tick);
          return `<text x="${(p.x + 12).toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="start" dominant-baseline="middle" font-size="10" font-weight="700" fill="#64748b">${tick}</text>`;
        }).join("")}
        <polygon points="${polygon}" fill="#2563eb" fill-opacity="0.20" stroke="#1d4ed8" stroke-width="2.5" stroke-linejoin="round" />
        ${orderedRows.map((row, index) => {
          const p = pointFor(index, row.value);
          const label = pointFor(index, Math.min(9.75, row.value + 0.55));
          return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="2" />
            <text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="900" fill="#1d4ed8" stroke="#ffffff" stroke-width="2.5" paint-order="stroke">${row.value}</text>`;
        }).join("")}
        <circle cx="${center}" cy="${center}" r="3" fill="#111827" />
      </svg>
      <div class="papi-wheel-summary">
        <strong>Skala tertinggi:</strong> ${maxRows.map((row) => `${row.code} ${row.value}/${row.max}`).join(", ")}
      </div>
    </div>`;
};

const isKraepelinResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  r.test_name.toUpperCase().includes("KRAEPELIN") || ["speed", "accuracy", "stability", "work_capacity"].some((key) => key in (r.categories || {}));

const isPersonalityPlusResult = (r: Pick<ResultRow, "test_name" | "categories">) => {
  const upper = r.test_name.toUpperCase();
  const keys = Object.keys(r.categories || {}).map((key) => key.toUpperCase());
  return upper.includes("PERSONALITY") || upper.includes("TEMPERAMEN") || ["KOLERIS", "MELANKOLIS", "PLEGMATIS", "SANGUINIS"].some((key) => keys.includes(key));
};

const getResultConclusion = (r: ResultRow, answerRows: AnswerRow[] = []) => {
  const cats = isPapiResult(r) && answerRows.length > 0
    ? getEffectivePapiCategories(r, answerRows)
    : r.categories || {};
  const upper = r.test_name.toUpperCase();

  if (upper.includes("DISC")) {
    const ranked = buildDiscRows(cats, r.total_questions || 24).sort((a, b) => b.net - a.net);
    return ranked.slice(0, 2).map((row) => `${row.dim}(${row.net})`).join("/");
  }

  if (isPersonalityPlusResult(r)) {
    const codeMap: Record<string, string> = { Sanguinis: "S", Koleris: "K", Melankolis: "M", Plegmatis: "P" };
    const ranked = getPersonalityPlusRows(cats).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    return ranked.slice(0, 2).map((row) => `${codeMap[row.name] || row.name[0]}(${row.value})`).join("/");
  }

  if (isCfitName(r.test_name)) {
    const info = getCfitIqInfoFromResult(r);
    return `IQ ${info.iq} (${info.classification})`;
  }

  if (isMbtiResult(r)) {
    return `MBTI ${getMbtiSummary(cats).type}`;
  }

  if (isIstResult(r)) {
    const summary = getIstSummary(cats, r.score);
    return `IST ${summary.score}%`;
  }

  if (isPapiResult(r)) {
    const ranked = getPapiRows(cats).sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
    return ranked.slice(0, 2).map((row) => `${row.code}(${row.value})`).join("/");
  }

  if (isKraepelinResult(r)) {
    const rows = getKraepelinRows(cats);
    const accuracy = rows.find((row) => row.key === "accuracy")?.value ?? 0;
    const stability = rows.find((row) => row.key === "stability")?.value ?? 0;
    return `Akurasi ${accuracy}% / Stabil ${stability}%`;
  }

  if (isAptitudeResult(r)) {
    const info = getAptitudeScoreInfo(r);
    const level = getAptitudeLevel(info.iq);
    return `IQ ${info.iq} (${level.label})`;
  }

  return r.total_questions ? `${r.answered_questions}/${r.total_questions} soal` : `${r.score}%`;
};

const getResultStatusBadge = (r: ResultRow) => {
  const statusText = `${r.status || ""} ${r.interpretation || ""}`.toLowerCase();
  if (/(cheat|cheating|pelanggaran|violation|kamera)/i.test(statusText)) {
    return { label: "Cheat", className: "bg-destructive/10 text-destructive" };
  }
  if (r.total_questions > 0 && r.answered_questions < r.total_questions) {
    return { label: "Tidak Selesai", className: "bg-amber-400/10 text-amber-400" };
  }
  return { label: "Selesai", className: "bg-emerald-400/10 text-emerald-400" };
};

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatPapiInterpretationHtml = (text: string) => {
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
      html += `<h4 class="papi-interpretation-heading">${escapeHtml(line.replace(/:$/, ""))}</h4>`;
    } else if (line.startsWith("- ")) {
      if (!listOpen) {
        html += `<ul class="papi-interpretation-list">`;
        listOpen = true;
      }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
    } else {
      closeList();
      html += `<p class="papi-interpretation-paragraph">${escapeHtml(line)}</p>`;
    }
  });
  closeList();
  return html;
};

const getKraepelinRows = (cats: Record<string, number>) => [
  { key: "speed", label: "Kecepatan", value: Number(cats.speed || 0) },
  { key: "accuracy", label: "Ketelitian", value: Number(cats.accuracy || 0) },
  { key: "stability", label: "Stabilitas", value: Number(cats.stability || 0) },
  { key: "work_capacity", label: "Kapasitas Kerja", value: Number(cats.work_capacity || 0) },
];

const APTITUDE_AREAS = [
  { key: "Verbal", label: "Verbal", max: 11, note: "Analogi kata, relasi konsep, perbendaharaan kata, dan pemahaman hubungan bahasa." },
  { key: "Numerical", label: "Numerik", max: 10, note: "Berhitung praktis, deret angka, proporsi, dan pemecahan masalah kuantitatif." },
  { key: "Logic", label: "Logika", max: 6, note: "Penalaran deduktif, silogisme, dan konsistensi kesimpulan." },
  { key: "Classification", label: "Klasifikasi", max: 12, note: "Membedakan kategori, mencari item yang tidak sejenis, dan ketelitian konsep." },
  { key: "Pattern", label: "Pola", max: 3, note: "Pola simbol, susunan huruf/angka, dan aturan transformasi sederhana." },
  { key: "Abstract", label: "Figural/Abstrak", max: 18, note: "Penalaran gambar, analogi bentuk, rotasi/transformasi, dan persepsi visual." },
];

const APTITUDE_CATEGORY_ALIASES: Record<string, string[]> = {
  Verbal: ["verbal ability", "verbal aptitude", "verbal_ability", "verbal aptitude", "kemampuan verbal"],
  Numerical: ["numerical ability", "numerical aptitude", "numerical_ability", "numerik", "kemampuan numerik"],
  Logic: ["logical reasoning", "logika", "logical_reasoning", "reasoning logic", "kemampuan logika"],
  Classification: ["classifications", "classification", "klasifikasi", "classification ability"],
  Pattern: ["pattern recognition", "pattern", "pola", "pattern_recognition"],
  Abstract: ["abstract reasoning", "figural", "abstract", "figural/abstrak", "kemampuan abstrak"],
};

const APTITUDE_CATEGORY_BY_QUESTION_NUMBER: Record<number, string> = {
  1: "Classification", 2: "Verbal", 3: "Abstract", 4: "Classification", 5: "Abstract",
  6: "Numerical", 7: "Verbal", 8: "Classification", 9: "Verbal", 10: "Abstract",
  11: "Verbal", 12: "Logic", 13: "Abstract", 14: "Verbal", 15: "Numerical",
  16: "Classification", 17: "Abstract", 18: "Logic", 19: "Classification", 20: "Pattern",
  21: "Verbal", 22: "Abstract", 23: "Verbal", 24: "Logic", 25: "Abstract",
  26: "Pattern", 27: "Abstract", 28: "Numerical", 29: "Classification", 30: "Abstract",
  31: "Classification", 32: "Numerical", 33: "Classification", 34: "Numerical", 35: "Abstract",
  36: "Logic", 37: "Classification", 38: "Verbal", 39: "Abstract", 40: "Numerical",
  41: "Abstract", 42: "Verbal", 43: "Abstract", 44: "Logic", 45: "Classification",
  46: "Abstract", 47: "Verbal", 48: "Numerical", 49: "Abstract", 50: "Verbal",
  51: "Abstract", 52: "Numerical", 53: "Verbal", 54: "Numerical", 55: "Classification",
  56: "Logic", 57: "Abstract", 58: "Classification", 59: "Abstract", 60: "Numerical",
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

const isAptitudeResult = (r: Pick<ResultRow, "test_name" | "categories">) =>
  (r.test_name.toUpperCase().includes("APTITUDE") && !isCfitName(r.test_name)) ||
  (!isCfitName(r.test_name) && Object.keys(r.categories || {}).some((key) => resolveAptitudeCategoryKey(key) !== null));

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

const getAptitudeRawValue = (categories: Record<string, number>, result: ResultRow) => {
  const explicitRaw = categories.correct_answers ?? categories["Aptitude Raw Score"] ?? categories.correct ?? categories.raw_score ?? categories["Correct Answers"] ?? null;
  if (explicitRaw !== null && explicitRaw !== undefined && !Number.isNaN(Number(explicitRaw))) {
    return Math.max(0, Math.round(Number(explicitRaw)));
  }
  const categorySum = APTITUDE_AREAS.reduce((sum, area) => sum + getAptitudeAreaValue(categories, area), 0);
  if (categorySum > 0) return categorySum;
  return Math.round((result.score / 100) * Math.max(1, result.total_questions || 0));
};

const getAptitudeScoreInfo = (result: ResultRow) => {
  const categories = result.categories || {};
  const raw = getAptitudeRawValue(categories, result);
  const total = Math.max(1, result.total_questions || 0);
  const cappedRaw = Math.min(raw, total);
  const scaledRaw = Math.min(49, Math.round((cappedRaw / total) * 49));
  const derived = getCfitIqInfo(scaledRaw);
  return {
    raw: cappedRaw,
    total,
    percentage: Math.round((cappedRaw / total) * 100),
    iq: Number(categories["Aptitude IQ"] || 0) || derived.iq,
    classification: classifyAptitudeIq(Number(categories["Aptitude IQ"] || 0) || derived.iq),
  };
};

const buildAptitudeInterpretation = (cats: Record<string, number>, score: number, answered: number, total: number) => {
  const rows = getAptitudeRows(cats);
  const info = getAptitudeScoreInfo({ categories: cats, score, total_questions: total } as ResultRow);
  const level = getAptitudeLevel(info.iq);
  const strongest = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 2);
  const weakest = [...rows].sort((a, b) => a.pct - b.pct).slice(0, 2);
  const correct = getAptitudeRawValue(cats, { categories: cats, score, total_questions: total } as ResultRow);
  const wrong = Math.max(0, answered - correct);

  return `RINGKASAN IQ
- Estimasi IQ: ${info.iq}
- Klasifikasi IQ: ${info.classification}
- Raw score: ${correct}/${total} benar (${info.percentage}%); ${wrong} salah dari ${answered} soal dijawab.
- Rekomendasi seleksi: ${level.recommendation}

ACUAN KATEGORI
- <85: Kecerdasan di bawah rata-rata
- 85-100: Kecerdasan rata-rata
- 100-115: Kecerdasan di atas rata-rata
- 115-130: Kecerdasan tinggi
- 130-145: Kecerdasan superior
- 145+: Sangat berbakat

KEKUATAN RELATIF
- ${strongest.map((row) => `${row.label}: ${row.raw}/${row.max} (${row.pct}%; ${row.level})`).join("\n- ")}

AREA PERHATIAN
- ${weakest.map((row) => `${row.label}: ${row.raw}/${row.max} (${row.pct}%; ${row.level})`).join("\n- ")}
- Area ini sebaiknya divalidasi melalui wawancara berbasis kasus, riwayat pendidikan/kerja, dan contoh pekerjaan yang relevan.

PROFIL ASPEK
${rows.map((row) => `- ${row.label}: ${row.raw}/${row.max} (${row.level})`).join("\n")}

CATATAN SKORING
- Tes menggunakan correct-only scoring: jawaban benar bernilai 1, jawaban salah atau kosong bernilai 0.
- Raw score dikonversi menjadi estimasi IQ untuk laporan hasil.
- Interpretasi ini bukan keputusan tunggal; gunakan bersama hasil wawancara, observasi perilaku saat tes, pengalaman kerja, dan tuntutan jabatan.`;
};

const buildAptitudeCategoriesFromAnswers = (answerRows: AnswerRow[], totalQuestions = 60) => {
  const cats: Record<string, number> = {};
  let correct = 0;
  let wrong = 0;
  answerRows.forEach((answer) => {
    if (answer.is_correct === true) {
      correct += 1;
      const key = resolveAptitudeCategoryKey(answer.category) || APTITUDE_CATEGORY_BY_QUESTION_NUMBER[answer.question_number] || "Abstract";
      cats[key] = (cats[key] || 0) + 1;
    } else if (answer.is_correct === false) {
      wrong += 1;
    }
  });
  cats.correct_answers = correct;
  cats.wrong_answers = wrong;
  cats.blank_answers = Math.max(0, totalQuestions - answerRows.length);
  cats.accuracy = answerRows.length ? Math.round((correct / answerRows.length) * 100) : 0;
  cats["Aptitude Raw Score"] = correct;
  cats["Aptitude Max Score"] = totalQuestions;
  cats["Aptitude Percentage"] = Math.round((correct / Math.max(totalQuestions, 1)) * 100);
  const iq = getCfitIqInfo(Math.min(49, Math.round((correct / Math.max(totalQuestions, 1)) * 49)));
  cats["Aptitude IQ"] = iq.iq;
  return cats;
};

const getEffectiveAptitudeCategories = (result: ResultRow, answerRows: AnswerRow[]) => {
  const stored = result.categories || {};
  const storedRaw = getAptitudeRawValue(stored, result);
  const storedAreaSum = APTITUDE_AREAS.reduce((sum, area) => sum + getAptitudeAreaValue(stored, area), 0);
  if (storedRaw > 0 && storedAreaSum > 0) return stored;
  const rebuilt = buildAptitudeCategoriesFromAnswers(answerRows, result.total_questions || 60);
  if (getAptitudeRawValue(rebuilt, result) === 0) return stored;
  return { ...stored, ...rebuilt };
};

const getEffectivePapiCategories = (result: ResultRow, answerRows: AnswerRow[]) => {
  if (!isPapiResult(result)) return result.categories as Record<string, number>;
  if (!answerRows.length) return result.categories as Record<string, number>;
  const rebuilt = buildPapiCategoriesFromAnswers(answerRows);
  // if the rebuilt result is empty, fallback to stored categories
  const total = Object.values(rebuilt).reduce((sum, value) => sum + value, 0);
  if (total === 0) return result.categories as Record<string, number>;
  return rebuilt;
};

const buildKraepelinInterpretation = (cats: Record<string, number>) => {
  const rows = getKraepelinRows(cats);
  const level = (v: number) => v >= 80 ? "sangat tinggi" : v >= 60 ? "tinggi" : v >= 40 ? "cukup" : v >= 20 ? "rendah" : "sangat rendah";
  return `Profil Kraepelin menunjukkan ${rows.map((row) => `${row.label.toLowerCase()} ${level(row.value)} (${row.value}%)`).join(", ")}.

Jawaban benar ${Number(cats.correct_answers || 0)} dan salah ${Number(cats.wrong_answers || 0)}. Kolom terselesaikan ${Number(cats.columns_completed || 0)}, rata-rata benar per kolom ${Number(cats.average_column || 0)}, dan puncak benar per kolom ${Number(cats.peak_column || 0)}.

Secara psikologis, hasil ini menggambarkan pola kerja hitung sederhana dalam tekanan waktu: tempo kerja, ketelitian, stabilitas/fluktuasi performa antar kolom, dan daya tahan kerja rutin. Interpretasi akhir perlu dibandingkan dengan tuntutan jabatan, terutama toleransi kesalahan, kebutuhan konsistensi, dan ritme kerja target.`;
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
  const [answersByResult, setAnswersByResult] = useState<Record<string, AnswerRow[]>>({});
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
    const rows = ((data as ResultRow[]) || []);
    const emails = Array.from(new Set(rows.map((row) => row.candidate_profile?.email).filter(Boolean)));
    let profileByEmail = new Map<string, any>();
    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from("candidate_profiles")
        .select("email, education_level, education_major, education_institution, education_history, photo_url")
        .in("email", emails);
      profileByEmail = new Map(((profiles as any[]) || []).map((profile) => [String(profile.email || "").toLowerCase(), profile]));
    }

    setResults(rows.map((row) => {
      const profile = row.candidate_profile || {};
      const email = String(profile.email || "").toLowerCase();
      const latestProfile = profileByEmail.get(email);
      const education = getLatestEducationText(latestProfile, profile.education || "");
      if (!education && !latestProfile?.photo_url) return row;
      return {
        ...row,
        candidate_profile: {
          ...profile,
          education: profile.education || education,
          photo_url: profile.photo_url || latestProfile?.photo_url || "",
        },
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadAnswersForResultIds = async (resultIds: string[]) => {
    if (resultIds.length === 0) return;
    const { data: answerData, error } = await supabase
      .from("test_answers")
      .select("*")
      .in("test_result_id", resultIds)
      .order("test_result_id", { ascending: true })
      .order("question_number", { ascending: true });
    if (error || !answerData) return;
    const grouped: Record<string, AnswerRow[]> = {};
    (answerData as AnswerRow[]).forEach((row) => {
      const resultId = String((row as any).test_result_id || "");
      if (!resultId) return;
      grouped[resultId] = grouped[resultId] || [];
      grouped[resultId].push(row);
    });
    await Promise.all(Object.entries(grouped).map(async ([resultId, rows]) => {
      const result = results.find((r) => r.id === resultId);
      if (!result) return;
      grouped[resultId] = await enrichAnswersWithOptionText(result, rows);
    }));
    setAnswersByResult((prev) => ({ ...prev, ...grouped }));
  };

  const enrichAnswersWithOptionText = async (result: ResultRow, rows: AnswerRow[]) => {
    const needsLookup = rows.some((row) => {
      if (row.selected_answer?.includes("PALING")) return false;
      return isOptionCodeOnly(row.selected_answer) || isOptionCodeOnly(row.selected_answer_label);
    });
    if (!needsLookup) return rows;

    const { data: instrument } = await supabase
      .from("test_instruments")
      .select("id")
      .eq("name", result.test_name)
      .maybeSingle();
    if (!instrument?.id) return rows;

    const questionNumbers = Array.from(new Set(rows.map((row) => row.question_number)));
    const { data: questions } = await supabase
      .from("test_questions")
      .select("question_number, test_question_options(option_label, option_text, category_target)")
      .eq("instrument_id", instrument.id)
      .in("question_number", questionNumbers);

    const optionByQuestionAndLabel = new Map<string, any>();
    ((questions as any[]) || []).forEach((question) => {
      (question.test_question_options || []).forEach((option: any) => {
        optionByQuestionAndLabel.set(`${question.question_number}:${normalizeOptionCode(option.option_label)}`, option);
      });
    });

    return rows.map((row) => {
      if (row.selected_answer?.includes("PALING")) return row;
      const lookupLabel = normalizeOptionCode(row.selected_answer_label) || normalizeOptionCode(row.selected_answer);
      const option = optionByQuestionAndLabel.get(`${row.question_number}:${lookupLabel}`);
      if (!option?.option_text) return row;

      return {
        ...row,
        selected_answer: option.option_text,
        selected_answer_label: option.option_label || row.selected_answer_label,
        category: option.category_target?.trim() || row.category,
      };
    });
  };

  const loadAnswers = async (result: ResultRow) => {
    const resultId = result.id;
    const { data } = await supabase.from("test_answers").select("*").eq("test_result_id", resultId).order("question_number");
    const rows = ((data as any) || []) as AnswerRow[];
    setAnswers(await enrichAnswersWithOptionText(result, rows));
  };

  const handleDeleteResult = async (r: ResultRow) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hapus Hasil Tes?",
      html: `
        <div style="text-align:left;line-height:1.6">
          <p>Hasil tes ini akan dihapus permanen dari halaman admin.</p>
          <p style="margin-top:8px"><b>Kandidat:</b> ${r.candidate_name}</p>
          <p><b>Tes:</b> ${r.test_name}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    });
    if (!confirm.isConfirmed) return;

    try {
      const { error: answersError } = await supabase.from("test_answers").delete().eq("test_result_id", r.id);
      if (answersError) throw answersError;

      const { error: resultError } = await supabase.from("test_results").delete().eq("id", r.id);
      if (resultError) throw resultError;

      if (selectedResult?.id === r.id) {
        setSelectedResult(null);
        setAnswers([]);
      }
      setResults((prev) => prev.filter((item) => item.id !== r.id));

      await Swal.fire({
        icon: "success",
        title: "Hasil Tes Dihapus",
        text: "Data hasil tes berhasil dihapus.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: error?.message || "Terjadi kesalahan saat menghapus hasil tes.",
      });
    }
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
    await loadAnswers(enrichedResult);
  };

  const filtered = results.filter(
    (r) => r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase()) ||
      r.test_name.toLowerCase().includes(search.toLowerCase())
  ).filter((r) => {
    if (filterStatus !== "all") {
      const status = getResultStatusBadge(r).label;
      if (filterStatus === "completed" && status !== "Selesai") return false;
      if (filterStatus === "incomplete" && status !== "Tidak Selesai") return false;
      if (filterStatus === "cheat" && status !== "Cheat") return false;
    }
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

  useEffect(() => {
    const visiblePapiResultIds = paginatedResults
      .filter((r) => isPapiResult(r))
      .map((r) => r.id)
      .filter((id) => !answersByResult[id]);
    if (visiblePapiResultIds.length > 0) {
      loadAnswersForResultIds(visiblePapiResultIds);
    }
  }, [paginatedResults, answersByResult]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterTest, filterDateFrom, filterDateTo]);

  const handlePrint = () => {
    if (!selectedResult) return;
    const r = selectedResult;
    const profile = r.candidate_profile as Record<string, string> | null;
    const cats = isPapiResult(r)
      ? getEffectivePapiCategories(r, answers)
      : isAptitudeResult(r)
        ? getEffectiveAptitudeCategories(r, answers)
        : r.categories as Record<string, number>;
    const scoreResult = isAptitudeResult(r) ? { ...r, categories: cats } : r;
    const catEntries = Object.entries(cats);
    const cfitProfileRows = isCfitName(r.test_name) ? getCfitProfileRows(r) : [];
    const maxVal = isPapiResult(r) ? 9 : isMsdtResult(r) ? 64 : 100;

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
      
      discInterpretation = `
        <div class="section">
          <div class="section-title">Interpretasi Psikolog - Analisa DISC</div>
          <div class="interpretation">${formatPapiInterpretationHtml(buildSharedDiscInterpretation(cats, r.total_questions || 24))}</div>
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
    let aptitudeProfileHTML = "";
    let msdtProfileHTML = "";
    let specialInterpretationHTML = "";
    if (isCfitName(r.test_name)) {
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil CFIT 3A</div><div class="interpretation">${formatPapiInterpretationHtml(buildCfitInterpretation(r))}</div></div>`;
    } else if (isMbtiResult(r)) {
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
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil MBTI</div><div class="interpretation">${formatPapiInterpretationHtml(buildMbtiInterpretation(cats))}</div></div>`;
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
        <div class="section papi-section">
          <div class="section-title">Profil Skala PAPI Kostick</div>
          <div class="papi-print-grid">
            <div>
              <p class="mini-title">Grafik PAPI Kostick</p>
              ${renderPapiWheelSvg(rows)}
            </div>
            <div>
              <p class="mini-title">Skor per Dimensi</p>
              <table class="dim-table papi-score-table">
                <thead><tr><th>Skala</th><th>Dimensi</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>
                <tbody>${rows.map(row => {
                  const pct = row.max > 0 ? (row.value / row.max) * 100 : 0;
                  return `<tr>
                    <td><strong>${row.code}</strong></td>
                    <td>${row.label}</td>
                    <td>${row.value}/${row.max}</td>
                    <td>${row.level}</td>
                    <td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(pct, 100)}%; background:${pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'};"></div></div></td>
                  </tr>`;
                }).join("")}</tbody>
              </table>
            </div>
          </div>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil PAPI</div><div class="interpretation">${formatPapiInterpretationHtml(buildPapiInterpretation(cats))}</div></div>`;
    } else if (isMsdtResult(r)) {
      const rows = getMsdtRows(cats);
      const top = [...rows].sort((a, b) => b.pct - a.pct || b.value - a.value || a.code.localeCompare(b.code))[0];
      msdtProfileHTML = `
        <div class="section">
          <div class="section-title">Profil MSDT - Gaya Manajemen</div>
          <div class="score-cards">
            <div class="score-card"><div class="label">Gaya Dominan</div><div class="value" style="font-size:14pt;margin-top:8px;">${top.label}</div></div>
            <div class="score-card"><div class="label">Skor Dominan</div><div class="value">${top.pct}<span style="font-size:14pt;color:#64748b;">%</span></div></div>
            <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
          </div>
          <table class="dim-table">
            <thead><tr><th>Gaya</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>
            <tbody>${rows.map(row => `<tr><td><strong>${row.label}</strong><br/><span style="color:#64748b;font-size:8pt;">${row.description}</span></td><td>${row.value} (${row.pct}%)</td><td>${row.level}</td><td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(row.pct, 100)}%; background:${row.pct >= 76 ? '#059669' : row.pct >= 51 ? '#2563eb' : row.pct >= 26 ? '#d97706' : '#94a3b8'};"></div></div></td></tr>`).join("")}</tbody>
          </table>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil MSDT</div><div class="interpretation">${formatPapiInterpretationHtml(buildMsdtInterpretation(cats, r.answered_questions, r.total_questions))}</div></div>`;
    } else if (isAptitudeResult(r)) {
      const rows = getAptitudeRows(cats);
      const info = getAptitudeScoreInfo(scoreResult);
      const level = getAptitudeLevel(info.iq);
      aptitudeProfileHTML = `
        <div class="section">
          <div class="section-title">Profil Aptitude</div>
          <div class="score-cards">
            <div class="score-card"><div class="label">Estimasi IQ</div><div class="value">${info.iq}</div><div class="sub">${info.classification}</div></div>
            <div class="score-card"><div class="label">Rekomendasi</div><div class="value" style="font-size:15pt;margin-top:8px;">${level.recommendation}</div></div>
            <div class="score-card"><div class="label">Benar</div><div class="value">${info.raw}<span style="font-size:14pt;color:#64748b;">/${info.total}</span></div><div class="sub">${info.percentage}%</div></div>
          </div>
          <table class="dim-table">
            <thead><tr><th>Aspek</th><th>Skor</th><th>Level</th><th>Keterangan</th><th>Indikator</th></tr></thead>
            <tbody>${rows.map(row => `<tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.raw}/${row.max} (${row.pct}%)</td>
              <td>${row.level}</td>
              <td>${row.note}</td>
              <td><div class="bar-container"><div class="bar-fill" style="width:${Math.min(row.pct, 100)}%; background:${row.pct >= 65 ? '#059669' : row.pct >= 50 ? '#d97706' : '#dc2626'};"></div></div></td>
            </tr>`).join("")}</tbody>
          </table>
        </div>`;
      specialInterpretationHTML = `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil Aptitude</div><div class="interpretation">${formatPapiInterpretationHtml(buildAptitudeInterpretation(cats, r.score, r.answered_questions, r.total_questions))}</div></div>`;
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
      .mini-title { font-size: 9pt; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
      .papi-section { page-break-inside: auto; margin-bottom: 12px; }
      .papi-print-grid { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 10px; align-items: start; }
      .papi-wheel-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #ffffff; max-width: 330px; margin: 0 auto; }
      .papi-wheel-card svg { display: block; max-height: 300px; }
      .papi-wheel-summary { margin-top: 3px; border-top: 1px dashed #cbd5e1; padding-top: 4px; font-size: 7.4pt; color: #475569; }
      table.papi-score-table { font-size: 7.5pt; }
      table.papi-score-table th { padding: 4px 5px; font-size: 6.9pt; }
      table.papi-score-table td { padding: 3px 5px; line-height: 1.25; }
      table.papi-score-table td:nth-child(1),
      table.papi-score-table td:nth-child(3),
      table.papi-score-table td:nth-child(4) { text-align: center; white-space: nowrap; }

      .interpretation { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 10pt; line-height: 1.7; color: #422006; }
      .papi-interpretation-heading { margin: 8px 0 3px; color: #0f766e; font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.35px; }
      .papi-interpretation-heading:first-child { margin-top: 0; }
      .papi-interpretation-paragraph { margin: 0 0 6px; }
      .papi-interpretation-list { margin: 0 0 6px 16px; padding: 0; }
      .papi-interpretation-list li { margin: 1px 0; }

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
            <div class="profile-row"><span class="label">Pendidikan</span><span class="value">${profile?.education || profile?.education_level || profile?.education_institution || "-"}</span></div>
            <div class="profile-row"><span class="label">Jenis Kelamin</span><span class="value">${profile?.gender || "-"}</span></div>
            <div class="profile-row"><span class="label">Tanggal Tes</span><span class="value">${new Date(r.completed_at).toLocaleDateString("id-ID", { dateStyle: "long" } as any)}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

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
    ${!isCfitName(r.test_name) && !isPapiResult(r) ? (() => {
      const isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
      const isIST = isIstResult(r);
      const isAptitude = isAptitudeResult(r);
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
      const aptitudeInfo = isAptitude ? getAptitudeScoreInfo(scoreResult) : null;
      return `
    <div class="section">
      <div class="section-title">Ringkasan Hasil - ${r.test_name}</div>
      <div class="score-cards">
        <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
        <div class="score-card"><div class="label">${isPP ? 'Hasil Dominan' : isIST ? 'Skor IST' : mbtiSummary ? 'Tipe MBTI' : isAptitude ? 'Skor Akhir IQ' : 'Skor Akhir'}</div>
        <div class="value" style="${isPP ? 'font-size:18pt;font-weight:800;color:#f472b6;' : mbtiSummary ? 'letter-spacing:3px;' : isAptitude ? 'font-size:24pt;color:#0f766e;' : ''}">${isPP ? dominantScore : isIST ? `${istSummary?.score}<span style="font-size:14pt;color:#64748b;">%</span><div style="font-size:9pt;color:#64748b;margin-top:4px;">Raw ${istSummary?.raw}/${istSummary?.max}</div>` : mbtiSummary ? mbtiSummary.type : isAptitude ? `${aptitudeInfo?.iq}<div style="font-size:9pt;color:#64748b;margin-top:4px;">${aptitudeInfo?.classification}</div>` : `${r.score}<span style="font-size:14pt;color:#64748b;">%</span>`}</div></div>
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
    ${aptitudeProfileHTML}
    ${msdtProfileHTML}

    <div class="section ${r.test_name.toUpperCase().includes("DISC") || isIstResult(r) || isMbtiResult(r) || isKraepelinResult(r) || isPapiResult(r) || isAptitudeResult(r) ? "hidden" : ""}">
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
                  <td>${val}${isPapiResult(r) ? "/9" : "%"}</td>
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
        return `<div class="section"><div class="section-title">Interpretasi Psikolog — Profil 4 Temperamen</div><div class="interpretation">${formatPapiInterpretationHtml(buildSharedPersonalityPlusInterpretation(cats, r.total_questions || 40))}</div></div>`;
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
            } else if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer?.includes("PALING") && a.selected_answer_label) {
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
              <td><span class="ans-pill ${a.is_correct === true ? 'ans-correct' : a.is_correct === false ? 'ans-wrong' : ''}">${getAnswerDisplayText(a, !r.test_name.toUpperCase().includes("DISC"))}</span></td>
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
      "Nama,Posisi,Tes,Kesimpulan,Dijawab,Total,Tanggal,Status",
      ...results.map((r) => {
        const status = getResultStatusBadge(r);
        return [
          r.candidate_name,
          r.position,
          r.test_name,
          getResultConclusion(r, answersByResult[r.id] || []),
          r.answered_questions,
          r.total_questions,
          r.completed_at,
          status.label,
        ].map(escapeCsv).join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hasil-tes-psikologi.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = (r: ResultRow) => {
    const cats = isPapiResult(r)
      ? getEffectivePapiCategories(r, answers)
      : isAptitudeResult(r)
        ? getEffectiveAptitudeCategories(r, answers)
        : r.categories as Record<string, number>;
    const sanitizedCats = Object.fromEntries(
      Object.entries(cats || {}).map(([name, value]) => [name, Number.isFinite(Number(value)) ? Number(value) : 0]),
    );
    const data = Object.entries(sanitizedCats)
      .filter(([, value]) => Number.isFinite(value))
      .map(([name, value]) => ({ name, value }));

    if (data.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Grafik tidak tersedia karena data hasil tes belum lengkap atau tidak valid.
        </div>
      );
    }

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
              className="space-y-2 text-xs leading-relaxed text-muted-foreground [&_.papi-interpretation-heading]:mt-3 [&_.papi-interpretation-heading:first-child]:mt-0 [&_.papi-interpretation-heading]:text-[11px] [&_.papi-interpretation-heading]:font-bold [&_.papi-interpretation-heading]:uppercase [&_.papi-interpretation-heading]:tracking-wide [&_.papi-interpretation-heading]:text-primary [&_.papi-interpretation-list]:ml-5 [&_.papi-interpretation-list]:list-disc [&_.papi-interpretation-list_li]:my-1 [&_.papi-interpretation-paragraph]:my-1"
              dangerouslySetInnerHTML={{ __html: formatPapiInterpretationHtml(buildSharedDiscInterpretation(cats, r.total_questions || 24)) }}
            />
          </div>
        </div>
      );
    }
    if (isIstResult(r)) {
      const summary = getIstSummary(cats, r.score);
      const chartData = summary.rows.map((row) => ({ name: row.code, value: row.pct, raw: row.raw, max: row.max, fullName: row.name }));
      const abilityData = summary.groups.map((group) => ({ name: group.group, value: group.pct, raw: group.raw, max: group.max }));
      const comparisonData = [
        { name: "Kekuatan Utama", value: summary.strongest.pct, label: `${summary.strongest.code} - ${summary.strongest.name}` },
        { name: "Area Pengembangan", value: summary.weakest.pct, label: `${summary.weakest.code} - ${summary.weakest.name}` },
        { name: "IST Total", value: summary.score, label: "Rata-rata 9 subtes" },
      ];
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
          {!summary.validity.valid && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Scoring IST invalid: {summary.validity.errors.join("; ")}
            </div>
          )}
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
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Radar 4 Kemampuan Utama</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={abilityData}>
                  <PolarGrid stroke="hsl(220, 14%, 25%)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
                  <Radar name="Kemampuan IST" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.24} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}
                    formatter={(v: any, _name: any, props: any) => [`${v}% (${props.payload.raw}/${props.payload.max})`, props.payload.name]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Kekuatan vs Area Pengembangan</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}
                    formatter={(v: any, _name: any, props: any) => [`${v}%`, props.payload.label]}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
      const rows = getPapiRows(cats);
      return (
        <div
          className="mx-auto max-w-[560px] [&_.papi-wheel-card]:border [&_.papi-wheel-card]:border-border [&_.papi-wheel-card]:rounded-xl [&_.papi-wheel-card]:bg-background [&_.papi-wheel-card]:p-2 [&_.papi-wheel-card_svg]:max-h-[460px] [&_.papi-wheel-summary]:mt-2 [&_.papi-wheel-summary]:border-t [&_.papi-wheel-summary]:border-border [&_.papi-wheel-summary]:pt-2 [&_.papi-wheel-summary]:text-xs [&_.papi-wheel-summary]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: renderPapiWheelSvg(rows) }}
        />
      );
    }
    if (isMsdtResult(r)) {
      const rows = getMsdtRows(cats);
      const chartRows = rows.map(({ style, ...rest }) => rest);
      return (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartRows} margin={{ left: 10, right: 20, top: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
              <XAxis dataKey="label" interval={0} angle={-25} textAnchor="end" height={80} tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} />
              <YAxis domain={[0, 100]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={(v: any, _name: any, props: any) => [`${v}% (${props.payload.value})`, "Skor"]} />
              <Bar dataKey="pct" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (isAptitudeResult(r)) {
      const effectiveCats = getEffectiveAptitudeCategories(r, answers);
      const aptitudeRowsData = getAptitudeRows(effectiveCats).map((row) => ({
        name: row.label,
        value: row.pct,
        raw: row.raw,
        max: row.max,
        level: row.level,
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={aptitudeRowsData} margin={{ left: 20, right: 30, top: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11, fontWeight: 600 }} angle={-18} textAnchor="end" height={62} />
            <YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}
              formatter={(v: any, _name: any, item: any) => [`${v}% (${item.payload.raw}/${item.payload.max})`, item.payload.level]}
            />
            <Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
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
    return buildSharedPersonalityPlusInterpretation(cats, total);
  };


  if (selectedResult) {
    const r = selectedResult;
    const cats = isPapiResult(r)
      ? getEffectivePapiCategories(r, answers)
      : isAptitudeResult(r)
        ? getEffectiveAptitudeCategories(r, answers)
        : r.categories as Record<string, number>;
    const scoreResult = isAptitudeResult(r) ? { ...r, categories: cats } : r;
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
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getResultStatusBadge(r).className}`}>
                    {getResultStatusBadge(r).label}
                  </span>
                </div>
                <div className="ml-auto text-center">
                  {r.webcam_photo_url ? (
                    <img src={r.webcam_photo_url} alt="Screenshot saat tes" className="h-24 w-32 rounded-lg border border-border object-cover" />
                  ) : (
                    <div className="h-24 w-32 rounded-lg border border-dashed border-border bg-muted/30" aria-label="Screenshot saat tes kosong" />
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Screenshot saat tes</p>
                </div>
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
                <p className="text-xs text-muted-foreground">{isCfitName(r.test_name) ? "IQ Score" : isIstResult(r) ? "Skor IST" : isMbtiResult(r) ? "Tipe MBTI" : isAptitudeResult(r) ? "IQ Aptitude" : "Skor"}</p>
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
                    : isAptitudeResult(r)
                      ? String(getAptitudeScoreInfo(scoreResult).iq)
                      : `${r.score}%`
                  }
                </p>
                {isAptitudeResult(r) && (() => {
                  const info = getAptitudeScoreInfo(scoreResult);
                  return (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {info.classification} · {info.raw}/{info.total} benar · {info.percentage}%
                    </p>
                  );
                })()}

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

            {isMsdtResult(r) && (() => {
              const rows = getMsdtRows(cats);
              return (
                <div className="glass rounded-xl p-5 glow-border mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Profil MSDT — Detail Gaya</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Gaya</th>
                          <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                          <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                          <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.style} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-semibold">
                              {row.label}
                              <div className="text-[11px] text-muted-foreground mt-1">{row.description}</div>
                            </td>
                            <td className="py-2 px-3 text-foreground">{row.value} ({row.pct}%)</td>
                            <td className="py-2 px-3 text-foreground">{row.level}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${row.pct >= 76 ? "bg-emerald-400" : row.pct >= 51 ? "bg-amber-400" : row.pct >= 26 ? "bg-sky-400" : "bg-slate-400"}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

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
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Skala</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Skor</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Level</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getPapiRows(cats).map((row) => {
                        const pct = (row.value / row.max) * 100;
                        return (
                          <tr key={row.code} className="border-b border-border/50">
                            <td className="py-1.5 px-2 text-foreground"><span className="font-bold">{row.code}</span><span className="text-muted-foreground"> - {row.label}</span></td>
                            <td className="py-1.5 px-2 text-foreground whitespace-nowrap">{row.value}/{row.max}</td>
                            <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">{row.level}</td>
                            <td className="py-1.5 px-2 w-32">
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
                : isAptitudeResult(r) ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Keterangan</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getAptitudeRows(cats).map((row) => (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.raw}/{row.max} <span className="text-muted-foreground">({row.pct}%)</span></td>
                          <td className="py-2 px-3 text-foreground">{row.level}</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.note}</td>
                          <td className="py-2 px-3 w-40">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${row.pct >= 65 ? "bg-emerald-400" : row.pct >= 50 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
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
                        const maxVal = isPapiResult(r) ? 9 : isMsdtResult(r) ? 64 : 100;
                        const pct = (val / maxVal) * 100;
                        const suffix = isPapiResult(r) ? "/9" : isMsdtResult(r) ? `/${maxVal}` : "%";
                        return (
                          <tr key={dim} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-medium">{dim}</td>
                            <td className="py-2 px-3 text-foreground">{val}{suffix}</td>
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
              const isDISC = r.test_name.toUpperCase().includes("DISC");
              const interpText = isPP
                ? buildPersonalityPlusInterpretation(cats, r.total_questions || 40)
                : isIST
                  ? buildIstInterpretation(cats, r.score)
                : isCfitName(r.test_name)
                  ? buildCfitInterpretation(r)
                : isMbtiResult(r)
                  ? buildMbtiInterpretation(cats)
                : isKraepelinResult(r)
                  ? buildKraepelinInterpretation(cats)
                : isPapiResult(r)
                  ? buildPapiInterpretation(cats)
                : isMsdtResult(r)
                  ? buildMsdtInterpretation(cats, r.answered_questions, r.total_questions)
                : isAptitudeResult(r)
                  ? buildAptitudeInterpretation(cats, scoreResult.score, r.answered_questions, r.total_questions)
                : r.interpretation;
              if (!interpText) return null;
              const useStructuredInterpretation = isPP || isDISC || isMbtiResult(r) || isCfitName(r.test_name) || isPapiResult(r) || isMsdtResult(r) || isAptitudeResult(r) || isIST;
              return (
                <div className="glass rounded-xl p-5 glow-border mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog{isPP ? ' — Profil 4 Temperamen' : isIST ? ' — Profil IST' : isCfitName(r.test_name) ? ' — Profil CFIT 3A' : isMbtiResult(r) ? ' — Profil MBTI' : isKraepelinResult(r) ? ' — Profil Kraepelin' : isPapiResult(r) ? ' — Profil PAPI' : isMsdtResult(r) ? ' — Profil MSDT' : isAptitudeResult(r) ? ' — Profil Aptitude' : ''}</h3>
                  {useStructuredInterpretation ? (
                    <div
                      className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_.papi-interpretation-heading]:mt-4 [&_.papi-interpretation-heading:first-child]:mt-0 [&_.papi-interpretation-heading]:text-xs [&_.papi-interpretation-heading]:font-bold [&_.papi-interpretation-heading]:uppercase [&_.papi-interpretation-heading]:tracking-wide [&_.papi-interpretation-heading]:text-primary [&_.papi-interpretation-list]:ml-5 [&_.papi-interpretation-list]:list-disc [&_.papi-interpretation-list_li]:my-1 [&_.papi-interpretation-paragraph]:my-1"
                      dangerouslySetInnerHTML={{ __html: formatPapiInterpretationHtml(interpText) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{interpText}</p>
                  )}
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
                            <span className={`inline-block rounded-md bg-primary/10 text-primary px-2 text-xs font-medium ${a.selected_answer?.includes('PALING') ? 'py-1 leading-relaxed whitespace-pre-wrap max-w-md' : 'py-0.5'}`}>
                              {getAnswerDisplayText(a, !r.test_name.toUpperCase().includes("DISC"))}
                            </span>
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
                              if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer?.includes("PALING") && a.selected_answer_label) {
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
              <option value="completed">Selesai</option>
              <option value="incomplete">Tidak Selesai</option>
              <option value="cheat">Cheat</option>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kesimpulan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Soal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : paginatedResults.map((r) => {
                const conclusion = getResultConclusion(r, answersByResult[r.id] || []);
                const status = getResultStatusBadge(r);
                return (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{r.candidate_name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{r.test_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex max-w-[220px] rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {conclusion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {r.answered_questions}/{r.total_questions}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {r.completed_at?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleSelectResult(r)} className="rounded-lg border border-sky-400/40 bg-sky-500/15 p-2.5 text-sky-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-500 hover:text-white hover:shadow-sky-500/20" title="Lihat Detail">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button onClick={() => { setSelectedResult(r); handlePrint(); }} className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 p-2.5 text-emerald-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/20" title="Cetak Laporan">
                        <Printer className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteResult(r)} className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-2.5 text-rose-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-500 hover:text-white hover:shadow-rose-500/20" title="Hapus Hasil Tes">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
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
