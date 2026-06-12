// Shared print utilities for Results page and RecruitmentProcess modal
import { buildCfitInterpretation, getCfitIqInfoFromResult, getCfitProfileRows, isCfitName } from "@/lib/cfitScoring";
import { buildDiscInterpretation } from "@/lib/discScoring";
import { buildIstInterpretation, isIstName } from "@/lib/istScoring";
import { buildMbtiInterpretation, getMbtiRows, getMbtiType, isMbtiName } from "@/lib/mbtiScoring";
import { buildPapiInterpretation, getPapiRows, isPapiName } from "@/lib/papiScoring";
import { buildPersonalityPlusInterpretation } from "@/lib/personalityPlusScoring";

export interface PrintResult {
  id: string;
  candidate_name: string;
  position?: string;
  test_name: string;
  score: number;
  total_questions: number;
  answered_questions: number;
  categories: Record<string, number>;
  status: string;
  interpretation?: string | null;
  completed_at: string;
  webcam_photo_url?: string | null;
  candidate_profile?: {
    photo_url?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface PrintAnswer {
  id: string;
  question_number: number;
  question_text: string;
  question_text_en?: string | null;
  selected_answer: string;
  selected_answer_label: string;
  correct_answer?: string | null;
  is_correct?: boolean | null;
  category?: string | null;
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
    return { dim, m, l, net, level, desc: discLabels[dim], color: discColors[dim] };
  });
  const ranked = [...rows].sort((a, b) => b.net - a.net);
  return rows.map((row) => ({ ...row, rank: ranked.findIndex((r) => r.dim === row.dim) + 1 }));
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

export const generatePrintHTML = (
  result: PrintResult,
  answers: PrintAnswer[] = [],
  profilePhoto?: string
): string => {
  const r = result;
  const profile = r.candidate_profile || {};
  const cats = (r.categories || {}) as Record<string, number>;
  const catEntries = Object.entries(cats);
  const statusLabel = r.status === "passed" ? "LULUS" : r.status === "review" ? "REVIEW" : "TIDAK LULUS";
  const statusColor = r.status === "passed" ? "#059669" : r.status === "review" ? "#d97706" : "#dc2626";
  const cfitInfo = isCfitName(r.test_name) ? getCfitIqInfoFromResult(r) : null;
  const cfitProfileRows = cfitInfo ? getCfitProfileRows(r) : [];
  const isMbti = isMbtiName(r.test_name) || ["E", "I", "S", "N", "T", "F", "J", "P"].every((key) => key in cats);
  const mbtiRows = isMbti ? getMbtiRows(cats) : [];
  const mbtiType = isMbti ? getMbtiType(cats) : "";
  const isKraepelin = r.test_name.toUpperCase().includes("KRAEPELIN") || ["speed", "accuracy", "stability", "work_capacity"].some((key) => key in cats);
  const isPapi = isPapiName(r.test_name) || (
    !r.test_name.toUpperCase().includes("DISC")
    && Object.keys(cats).filter((key) => getPapiRows(cats).some((row) => row.code === key)).length >= 8
  );
  const isPersonalityPlus = r.test_name.toUpperCase().includes("PERSONALITY PLUS") || r.test_name.toUpperCase().includes("TEMPERAMEN");
  const isIst = isIstName(r.test_name) || Object.keys(cats).some((key) => /^SE\s*-|^WA\s*-|^AN\s*-|^GE\s*-/i.test(key));
  const autoInterpretation = isPersonalityPlus
    ? buildPersonalityPlusInterpretation(cats, r.total_questions || 40)
    : isIst
      ? buildIstInterpretation(cats, r.score)
    : cfitInfo
      ? buildCfitInterpretation(r)
    : isPapi
      ? buildPapiInterpretation(cats)
    : r.interpretation || "";
  const kraepelinRows = [
    { label: "Kecepatan", value: `${Number(cats.speed || 0)}%`, note: "Tempo kerja hitung" },
    { label: "Ketelitian", value: `${Number(cats.accuracy || 0)}%`, note: "Akurasi jawaban" },
    { label: "Stabilitas", value: `${Number(cats.stability || 0)}%`, note: "Konsistensi antar kolom" },
    { label: "Kapasitas Kerja", value: `${Number(cats.work_capacity || 0)}%`, note: "Benar terhadap total target" },
  ];

  // Generate DISC charts and interpretation if test is DISC
  let discChartsHTML = "";
  let discInterpretation = "";
  if (r.test_name.toUpperCase().includes("DISC")) {
    const discDataWithRank = buildDiscRows(cats, r.total_questions || 24);
    const sortedCats = [...discDataWithRank].sort((a, b) => b.net - a.net);
    const topCategories = sortedCats.slice(0, 2).map(({ dim }) => dim);
    const dominant = topCategories[0];
    const secondary = topCategories[1];

    discInterpretation = `
      <div class="section">
        <div class="section-title">Interpretasi Psikolog - Analisa DISC</div>
        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 14px; border-radius: 0 8px 8px 0; font-size: 10pt; line-height: 1.7; color: #422006;">
          <div style="white-space:pre-line;">${buildDiscInterpretation(cats, r.total_questions || 24).replace(/</g, '&lt;')}</div>
        </div>
      </div>`;

    discChartsHTML = `
    <div class="section">
      <div class="section-title">Detail Skor per Dimensi</div>
      <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;">Dimensi</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">M</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">L</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Net</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Level</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Rank</th>
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
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;">#${d.rank}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
        ${renderDiscPrintMiniChart("Mask - Public Self (Most)", discDataWithRank.map((d) => ({ name: d.dim, value: d.m ?? 0 })), "#10b981")}
        ${renderDiscPrintMiniChart("Core - Private Self (Least)", discDataWithRank.map((d) => ({ name: d.dim, value: d.l ?? 0 })), "#f59e0b")}
        ${renderDiscPrintMiniChart("Mirror - Perceived Self (Net)", discDataWithRank.map((d) => ({ name: d.dim, value: d.net })), "#ec4899", true)}
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Hasil Tes — ${r.candidate_name}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm 14mm; }
    html, body { width: 100%; min-height: 100%; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 11pt; line-height: 1.5; margin: 0 auto; max-width: 816px; }
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
    table.dim-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    table.dim-table th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 9pt; text-transform: uppercase; }
    table.dim-table td { padding: 7px 10px; border: 1px solid #e2e8f0; }
    table.dim-table tr:nth-child(even) td { background: #fafafa; }
    .interpretation { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 10pt; line-height: 1.7; color: #422006; }
    table.answer-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    table.answer-table th { background: #0f172a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 8pt; }
    table.answer-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    table.answer-table tr:nth-child(even) td { background: #f8fafc; }
    .signature-area { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; page-break-inside: avoid; }
    .sig-box { text-align: center; font-size: 9pt; }
    .sig-box .role { color: #64748b; margin-bottom: 60px; }
    .sig-box .name { border-top: 1px solid #1f2937; padding-top: 4px; font-weight: 600; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8pt; color: #94a3b8; }
    .page-break { page-break-before: always; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
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
      ${profilePhoto || profile.photo_url ? `<img src="${profilePhoto || profile.photo_url}" alt="Foto Kandidat" style="width:110px;height:140px;object-fit:cover;border:2px solid #0f766e;border-radius:6px;background:#f1f5f9;" />` : `<div style="width:110px;height:140px;border:2px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8.5pt;text-align:center;padding:8px;">Foto tidak tersedia</div>`}
      <div style="flex:1;">
        <div class="profile-grid">
          <div class="profile-row"><span class="label">Nama Lengkap</span><span class="value">${r.candidate_name}</span></div>
          <div class="profile-row"><span class="label">Posisi Dilamar</span><span class="value">${r.position || "-"}</span></div>
          <div class="profile-row"><span class="label">Email</span><span class="value">${profile.email || "-"}</span></div>
          <div class="profile-row"><span class="label">No. Telepon</span><span class="value">${profile.phone || "-"}</span></div>
          <div class="profile-row"><span class="label">Tanggal Tes</span><span class="value">${new Date(r.completed_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</span></div>
          <div class="profile-row"><span class="label">Nama Tes</span><span class="value">${r.test_name}</span></div>
        </div>
      </div>
      ${r.webcam_photo_url ? `<div style="text-align:center;"><img src="${r.webcam_photo_url}" alt="Screenshot Foto Saat Tes" style="width:110px;height:90px;object-fit:cover;border:1px solid #94a3b8;border-radius:4px;" /><div style="font-size:8pt;color:#64748b;margin-top:4px;">Foto saat tes</div></div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ringkasan Hasil - ${r.test_name}</div>
    <div class="score-cards">
      <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
      <div class="score-card"><div class="label">${cfitInfo ? "IQ Score" : isMbti ? "Tipe MBTI" : "Skor Akhir"}</div><div class="value" style="${isMbti ? "letter-spacing:3px;" : ""}">${cfitInfo ? cfitInfo.iq : isMbti ? mbtiType : `${r.score}%`}</div></div>
      <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
    </div>
  </div>

  ${r.test_name.toUpperCase().includes("DISC") ? discChartsHTML : isMbti ? `
  <div class="section">
    <div class="section-title">Profil MBTI</div>
    <table class="dim-table">
      <thead>
        <tr>
          <th>Pasangan</th>
          <th>Skor</th>
          <th>Dominan</th>
          <th>Kekuatan</th>
        </tr>
      </thead>
      <tbody>
        ${mbtiRows.map((row) => `<tr>
          <td><strong>${row.pair}</strong></td>
          <td>${row.a}=${row.av} / ${row.b}=${row.bv}</td>
          <td><strong>${row.dominant}</strong> - ${row.label}</td>
          <td>${row.strength}%</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  ` : `
  <div class="section">
    <div class="section-title">Profil Dimensi & Skor</div>
    <table class="dim-table">
      <thead>
        <tr>
          <th style="width:35%">Dimensi / Aspek</th>
          <th style="width:15%">Nilai</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${(cfitInfo ? cfitProfileRows : isKraepelin ? kraepelinRows : isPapi ? getPapiRows(cats).map((row) => ({ label: `${row.code} - ${row.label}`, value: `${row.value}/9`, note: row.level })) : catEntries.map(([dim, val]) => ({ label: dim, value: String(val), note: val > 0 ? 'Positif' : 'Netral' }))).map((row) => `<tr>
          <td><strong>${row.label}</strong></td>
          <td>${row.value}</td>
          <td>${row.note}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  `}

  ${discInterpretation}

  ${isMbti ? `
  <div class="section">
    <div class="section-title">Interpretasi Psikolog - Profil MBTI</div>
    <div class="interpretation">${buildMbtiInterpretation(cats).replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>
  </div>
  ` : ''}

  ${autoInterpretation && !isMbti && !r.test_name.toUpperCase().includes("DISC") ? `
  <div class="section">
    <div class="section-title">Interpretasi Psikolog</div>
    <div class="interpretation">${autoInterpretation.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>
  </div>
  ` : ''}

  ${answers.length > 0 ? `
  <div class="section page-break">
    <div class="section-title">Lembar Jawaban Kandidat (${answers.length} Soal)</div>
    <table class="answer-table">
      <thead>
        <tr>
          <th style="width:36px;">No</th>
          <th>Pertanyaan</th>
          <th style="width:150px;">Jawaban</th>
          <th style="width:100px;">Kategori</th>
        </tr>
      </thead>
      <tbody>
        ${answers.map(a => `
        <tr>
          <td style="text-align:center; font-weight:700;">${a.question_number}</td>
          <td>${a.question_text}</td>
          <td>${a.selected_answer_label || a.selected_answer || "-"}</td>
          <td>${a.category || "-"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  ` : ''}

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
</body>
</html>`;

  return html;
};

export const printHTML = (html: string) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();

  const printWindow = () => {
    if (win.closed) return;
    try {
      win.focus();
      win.print();
    } catch (error) {
      console.error("Print failed:", error);
    }
  };

  const attemptPrint = () => {
    if (win.document.readyState === "complete" || win.document.readyState === "interactive") {
      printWindow();
    } else {
      win.addEventListener("load", printWindow, { once: true });
      setTimeout(printWindow, 800);
    }
  };

  attemptPrint();
};
