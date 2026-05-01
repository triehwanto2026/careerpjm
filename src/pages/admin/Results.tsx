import { useEffect, useState, useRef } from "react";
import { Search, Eye, Download, Printer, FileText } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
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

const Results = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [search, setSearch] = useState("");
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
    setSelectedResult(r);
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
    const maxVal = r.test_name === "PAPIKOSTIK" ? 9 : 100;
    const statusLabel = r.status === "passed" ? "LULUS" : r.status === "review" ? "REVIEW" : "TIDAK LULUS";
    const statusColor = r.status === "passed" ? "#059669" : r.status === "review" ? "#d97706" : "#dc2626";

    // Generate DISC charts and interpretation if test is DISC
    let discChartsHTML = "";
    let discInterpretation = "";
    if (r.test_name.toUpperCase().includes("DISC")) {
      const dims = ["D", "I", "S", "C"];
      const mask = dims.map(d => ({ name: d, value: Math.max(0, Number(cats[d] || 0)) }));
      const core = dims.map(d => ({ name: d, value: Math.max(0, -Number(cats[d] || 0)) }));
      const mirror = dims.map(d => ({ name: d, value: Number(cats[d] || 0) }));
      const radarData = dims.map(d => ({ dim: d, value: Number(cats[d] || 0) }));
      
      // Get top 2 dominant categories
      const sortedCats = catEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const topCategories = sortedCats.slice(0, 2).map(([cat]) => cat);
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
      
      discChartsHTML = `
    <div class="section">
      <div class="section-title">Grafik Profil DISC</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
          <p style="font-size: 9pt; font-weight: 700; color: #059669; margin-bottom: 8px;">Mask - Public Self</p>
          <svg width="100%" height="200" viewBox="0 0 200 200" style="margin-bottom: 8px;">
            <!-- Grid lines for better visibility -->
            <line x1="20" y1="30" x2="180" y2="30" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="60" x2="180" y2="60" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="90" x2="180" y2="90" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="120" x2="180" y2="120" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#e5e7eb" stroke-width="1"/>
            <!-- Zero line for positive/negative values -->
            <line x1="20" y1="90" x2="180" y2="90" stroke="#9ca3af" stroke-width="2" stroke-dasharray="5,5"/>
            <!-- X and Y axis -->
            <line x1="20" y1="30" x2="20" y2="150" stroke="#374151" stroke-width="2"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#374151" stroke-width="2"/>
            ${(() => {
              const points = mask.map((d, i) => {
                const x = 20 + (i * 50);
                const maxVal = Math.max(...mask.map(m => Math.abs(m.value)), 1);
                const normalizedValue = (d.value / maxVal) * 50;
                const y = 90 - normalizedValue;
                return { x, y, value: d.value, name: d.name };
              });
              // Create curved path using bezier curves
              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                const cp1y = p0.y;
                const cp2x = p0.x + (p1.x - p0.x) / 2;
                const cp2y = p1.y;
                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
              }
              return `
                <path d="${pathD}" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
                ${points.map((p, i) => `
                  <circle cx="${p.x}" cy="${p.y}" r="5" fill="#059669" stroke="#fff" stroke-width="1"/>
                  <text x="${p.x}" y="170" text-anchor="middle" font-size="12" font-weight="700" fill="#374151">${p.name}</text>
                  <text x="${15}" y="${p.y + 4}" text-anchor="end" font-size="9" fill="#6b7280">${p.value}</text>
                `).join('')}
              `;
            })()}
          </svg>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
          <p style="font-size: 9pt; font-weight: 700; color: #d97706; margin-bottom: 8px;">Core - Private Self</p>
          <svg width="100%" height="200" viewBox="0 0 200 200" style="margin-bottom: 8px;">
            <!-- Grid lines -->
            <line x1="20" y1="30" x2="180" y2="30" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="60" x2="180" y2="60" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="90" x2="180" y2="90" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="120" x2="180" y2="120" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#e5e7eb" stroke-width="1"/>
            <!-- Zero line for positive/negative values -->
            <line x1="20" y1="90" x2="180" y2="90" stroke="#9ca3af" stroke-width="2" stroke-dasharray="5,5"/>
            <!-- X and Y axis -->
            <line x1="20" y1="30" x2="20" y2="150" stroke="#374151" stroke-width="2"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#374151" stroke-width="2"/>
            ${(() => {
              const points = core.map((d, i) => {
                const x = 20 + (i * 50);
                const maxVal = Math.max(...core.map(m => Math.abs(m.value)), 1);
                const normalizedValue = (d.value / maxVal) * 50;
                const y = 90 - normalizedValue;
                return { x, y, value: d.value, name: d.name };
              });
              // Create curved path using bezier curves
              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                const cp1y = p0.y;
                const cp2x = p0.x + (p1.x - p0.x) / 2;
                const cp2y = p1.y;
                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
              }
              return `
                <path d="${pathD}" stroke="#d97706" stroke-width="3" fill="none" stroke-linecap="round"/>
                ${points.map((p, i) => `
                  <circle cx="${p.x}" cy="${p.y}" r="5" fill="#d97706" stroke="#fff" stroke-width="1"/>
                  <text x="${p.x}" y="170" text-anchor="middle" font-size="12" font-weight="700" fill="#374151">${p.name}</text>
                  <text x="${15}" y="${p.y + 4}" text-anchor="end" font-size="9" fill="#6b7280">${p.value}</text>
                `).join('')}
              `;
            })()}
          </svg>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
          <p style="font-size: 9pt; font-weight: 700; color: #ec4899; margin-bottom: 8px;">Mirror - Perceived Self</p>
          <svg width="100%" height="200" viewBox="0 0 200 200" style="margin-bottom: 8px;">
            <!-- Grid lines -->
            <line x1="20" y1="30" x2="180" y2="30" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="60" x2="180" y2="60" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="90" x2="180" y2="90" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="120" x2="180" y2="120" stroke="#e5e7eb" stroke-width="1"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#e5e7eb" stroke-width="1"/>
            <!-- Zero line for positive/negative values -->
            <line x1="20" y1="90" x2="180" y2="90" stroke="#9ca3af" stroke-width="2" stroke-dasharray="5,5"/>
            <!-- X and Y axis -->
            <line x1="20" y1="30" x2="20" y2="150" stroke="#374151" stroke-width="2"/>
            <line x1="20" y1="150" x2="180" y2="150" stroke="#374151" stroke-width="2"/>
            ${(() => {
              const points = mirror.map((d, i) => {
                const x = 20 + (i * 50);
                const maxVal = Math.max(...mirror.map(m => Math.abs(m.value)), 1);
                const normalizedValue = (d.value / maxVal) * 50;
                const y = 90 - normalizedValue;
                return { x, y, value: d.value, name: d.name };
              });
              // Create curved path using bezier curves
              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                const cp1y = p0.y;
                const cp2x = p0.x + (p1.x - p0.x) / 2;
                const cp2y = p1.y;
                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
              }
              return `
                <path d="${pathD}" stroke="#ec4899" stroke-width="3" fill="none" stroke-linecap="round"/>
                ${points.map((p, i) => `
                  <circle cx="${p.x}" cy="${p.y}" r="5" fill="#ec4899" stroke="#fff" stroke-width="1"/>
                  <text x="${p.x}" y="170" text-anchor="middle" font-size="12" font-weight="700" fill="#374151">${p.name}</text>
                  <text x="${15}" y="${p.y + 4}" text-anchor="end" font-size="9" fill="#6b7280">${p.value}</text>
                `).join('')}
              `;
            })()}
          </svg>
        </div>
      </div>
    </div>`;
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

    <div class="section">
      <div class="section-title">Ringkasan Hasil - ${r.test_name}</div>
      <div class="score-cards">
        <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
        <div class="score-card"><div class="label">Skor Akhir</div><div class="value">${r.score}<span style="font-size:14pt;color:#64748b;">%</span></div></div>
        <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
      </div>
    </div>

    ${discChartsHTML}

    <div class="section">
      <div class="section-title">Profil Dimensi & Skor</div>
      ${r.test_name.toUpperCase().includes("DISC") ? 
        // For DISC, show horizontal bar chart with 0 in center, fixed order D, I, S, C
        (() => {
          const dims = ["D", "I", "S", "C"];
          const sortedCats = catEntries.sort((a, b) => b[1] - a[1]);
          const top2 = sortedCats.slice(0, 2);
          return `
            <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 10pt; font-weight: 700; color: #0f766e; margin-bottom: 8px;">Kategori Dominan DISC</p>
              <div style="display: flex; gap: 16px; justify-content: center;">
                ${top2.map(([cat, val], i) => `
                  <div style="text-align: center; flex: 1;">
                    <div style="font-size: 24pt; font-weight: 800; color: #0f766e; margin-bottom: 4px;">${cat}</div>
                    <div style="font-size: 12pt; color: #475569;">Skor: ${val}</div>
                    <div style="font-size: 10pt; color: #64748b; margin-top: 2px;">${i === 0 ? 'Dominan Utama' : 'Dominan Sekunder'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10pt; font-weight: 700; color: #374151; margin-bottom: 12px;">Detail Skor per Dimensi</p>
              ${dims.map(dim => {
                const val = Number(cats[dim] || 0);
                const maxVal = Math.max(...Object.values(cats).map(Math.abs), 1);
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
      const text = isPP ? buildPersonalityPlusInterpretation(cats, r.total_questions || 40) : r.interpretation;
      if (isDISC || !text) return "";
      return `
    <div class="section">
      <div class="section-title">Interpretasi Psikolog${isPP ? ' — Profil 4 Temperamen' : ''}</div>
      <div class="interpretation" style="white-space:pre-line;">${text.replace(/</g, '&lt;')}</div>
    </div>`;
    })()}

    <div class="section">
      <div class="section-title">Lembar Jawaban Kandidat (${answers.length} Soal)</div>
      ${answers.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px 0;">Belum ada data jawaban tersimpan.</p>' : `
      <table class="answer-table">
        <thead><tr><th style="width:36px;">No</th><th>Pertanyaan</th><th style="width:180px;">Jawaban</th><th style="width:120px;">Kategori</th></tr></thead>
        <tbody>
          ${answers.map(a => {
            // Extract DISC categories from answer if it's a DISC test
            let categoryDisplay = a.category || "-";
            if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer_label) {
              // For DISC, show the actual category from the answer (like D-C, I-S, etc.)
              categoryDisplay = a.selected_answer_label;
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
      const dims = ["D", "I", "S", "C"];
      const mask = dims.map(d => ({ name: d, value: Math.max(0, Number(cats[d] || 0)) }));
      const core = dims.map(d => ({ name: d, value: Math.max(0, -Number(cats[d] || 0)) }));
      const mirror = dims.map(d => ({ name: d, value: Number(cats[d] || 0) }));
      const lineData = dims.map(d => ({
        dimensi: d,
        Mask: Math.max(0, Number(cats[d] || 0)),
        Core: Math.max(0, -Number(cats[d] || 0)),
        Mirror: Number(cats[d] || 0),
      }));
      const radarData = dims.map(d => ({ dim: d, value: Number(cats[d] || 0) }));
      const jobMatch: Record<string, string> = {
        D: "Manager, Entrepreneur, Sales Director, Director, CEO",
        I: "Sales, Public Relations, Marketing, Trainer, Public Speaker",
        S: "Counselor, Teacher, Nurse, HR, Customer Service, Therapist",
        C: "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer",
      };
      const oldDominant = dims.reduce((a, b) => Number(cats[a] || 0) > Number(cats[b] || 0) ? a : b);
      const renderMini = (title: string, d: { name: string; value: number }[], color: string) => (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-foreground mb-2">{title}</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={d}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(210,20%,70%)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
      
      // Get top 2 dominant categories for interpretation (use actual values, not absolute)
      const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
      const topCategories = sortedCats.slice(0, 2).map(([cat]) => cat);
      const dominant = topCategories[0];
      const secondary = topCategories[1];
      
      // Generate interpretation text
      const interpretations: Record<string, string> = {
        'D': `Dominance (D) yang tinggi menunjukkan kandidat memiliki kemampuan leadership yang kuat, berorientasi pada hasil, dan tegas dalam pengambilan keputusan. Cocok untuk peran manajerial, entrepreneur, atau posisi yang membutuhkan kemampuan mengarahkan dan memotivasi orang lain.`,
        'I': `Influence (I) yang tinggi menunjukkan kandidat memiliki kemampuan komunikasi dan interpersonal yang baik, persuasif, dan energik. Cocok untuk peran sales, marketing, public relations, atau posisi yang membutuhkan interaksi intensif dengan orang lain.`,
        'S': `Steadiness (S) yang tinggi menunjukkan kandidat memiliki sifat stabil, sabar, dan mendukung tim. Cocok untuk peran customer service, HR, counseling, atau posisi yang membutuhkan konsistensi dan kemampuan membangun hubungan jangka panjang.`,
        'C': `Conscientiousness (C) yang tinggi menunjukkan kandidat memiliki ketelitian tinggi, analitis, dan memprioritaskan kualitas. Cocok untuk peran analyst, quality control, engineering, atau posisi yang membutuhkan akurasi dan perhatian detail.`
      };
      
      return (
        <div className="space-y-4">
          {/* Kategori Dominan - Tampil di atas grafik */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Kategori Dominan DISC</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-primary">{dominant}</span>
              {secondary && (
                <>
                  <span className="text-2xl text-muted-foreground/50">&</span>
                  <span className="text-2xl font-semibold text-primary/80">{secondary}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dominant === 'D' && 'Dominance - Pemimpin yang tegas dan berorientasi hasil'}
              {dominant === 'I' && 'Influence - Komunikator yang persuasif dan energik'}
              {dominant === 'S' && 'Steadiness - Pendukung yang stabil dan sabar'}
              {dominant === 'C' && 'Conscientiousness - Analitis yang teliti dan akurat'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {renderMini("Mask - Public Self (M)", mask, "#10b981")}
            {renderMini("Core - Private Self (L)", core, "#f59e0b")}
            {renderMini("Mirror - Perceived Self (Net)", mirror, "#ec4899")}
          </div>

          {/* Interpretasi Lengkap DISC */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-3">Interpretasi Profil DISC</p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Profil Dominan: {dominant}{secondary ? ` & ${secondary}` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed">{interpretations[dominant] || ''}</p>
                {secondary && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    Kombinasi dengan {secondary} memberikan keseimbangan antara kekuatan {dominant} dan stabilitas {secondary}.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Pekerjaan yang Sesuai:</p>
                <p className="text-xs text-muted-foreground">{jobMatch[dominant]}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Rekomendasi:</p>
                <p className="text-xs text-muted-foreground">
                  Kandidat menunjukkan potensi tinggi untuk peran yang sesuai dengan profil {dominant}. 
                  Pertimbangkan untuk penempatan di posisi yang memanfaatkan kekuatan alami ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (r.test_name === "Kraepelin" || r.test_name.includes("Kraepelin")) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(220, 14%, 25%)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
            <Radar name={r.test_name} dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    if (r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) {
      // Map kode → nama temperamen lengkap
      const categoryNames: Record<string, string> = { 'K': 'Koleris', 'S': 'Sanguinis', 'M': 'Melankolis', 'P': 'Plegmatis' };
      const order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
      const valueByName: Record<string, number> = {};
      data.forEach(d => { valueByName[categoryNames[d.name] || d.name] = d.value; });
      const mappedData = order.map(n => ({ name: n, value: valueByName[n] || 0 }));
      // Skala Y maksimum = total soal / 4 (asumsi terdistribusi merata di 4 temperamen)
      const yMax = Math.max(10, Math.ceil((r.total_questions || 40) / 4));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mappedData} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }} />
            <YAxis domain={[0, yMax]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} label={{ value: 'Skor', angle: -90, position: 'insideLeft', fill: 'hsl(210,20%,60%)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ fill: '#2dd4bf', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (r.test_name === "PAPIKOSTIK") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
            <XAxis type="number" domain={[0, 9]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} width={95} />
            <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="value" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
    const names: Record<string, string> = { K: 'Koleris', S: 'Sanguinis', M: 'Melankolis', P: 'Plegmatis' };
    const norm: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
    Object.entries(cats).forEach(([k, v]) => { const n = names[k] || k; if (n in norm) norm[n] = v; });
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
    return `Berdasarkan hasil tes Personality Plus, kandidat menampilkan profil temperamen DOMINAN: ${dom} (${pct(domVal)}%) dengan dukungan SEKUNDER: ${sec} (${pct(secVal)}%). Distribusi keseluruhan — Sanguinis: ${pct(norm.Sanguinis)}%, Koleris: ${pct(norm.Koleris)}%, Melankolis: ${pct(norm.Melankolis)}%, Plegmatis: ${pct(norm.Plegmatis)}%.

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
    const profile = r.candidate_profile as Record<string, string> | null;

    return (
      <AdminLayout>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => { setSelectedResult(null); setAnswers([]); }} className="text-sm text-primary hover:underline">← Kembali ke Daftar Hasil</button>
            <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
              <Printer className="h-4 w-4" /> Cetak Laporan
            </button>
          </div>

          <div ref={printRef}>
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
                <p className="text-xs text-muted-foreground">Skor</p>
                <p className="text-3xl font-bold text-foreground mt-1">{r.score}<span className="text-lg text-muted-foreground">%</span></p>
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
                {r.test_name.toUpperCase().includes("DISC") ? (
                  // DISC: Horizontal bar chart with 0 in center, fixed order D, I, S, C
                  <div className="space-y-3">
                    {["D", "I", "S", "C"].map(dim => {
                      const value = Number(cats[dim] || 0);
                      const maxVal = Math.max(...Object.values(cats).map(Math.abs), 1);
                      const barWidth = (Math.abs(value) / maxVal) * 40;
                      const isPositive = value >= 0;
                      return (
                        <div key={dim} className="flex items-center gap-3">
                          <span className="w-8 text-right font-medium text-foreground">{dim}</span>
                          <div className="flex-1 relative h-8 flex items-center">
                            {/* Zero line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400"></div>
                            {/* Negative bar (left side) */}
                            {!isPositive && (
                              <div 
                                className="absolute right-1/2 h-6 bg-red-400 rounded-l"
                                style={{ width: `${barWidth}%`, marginRight: '-1px' }}
                              />
                            )}
                            {/* Positive bar (right side) */}
                            {isPositive && (
                              <div 
                                className="absolute left-1/2 h-6 bg-emerald-400 rounded-r"
                                style={{ width: `${barWidth}%`, marginLeft: '1px' }}
                              />
                            )}
                            {/* Value label */}
                            <span className={`absolute text-xs font-semibold ${
                              isPositive ? 'left-1/2 ml-2 text-emerald-600' : 'right-1/2 mr-2 text-red-600'
                            }`}>
                              {value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded"></div> Negatif</span>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-400 rounded"></div> Positif</span>
                    </div>
                  </div>
                ) : (
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
                      {catEntries.map(([dim, val]) => {
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
              const interpText = isPP
                ? buildPersonalityPlusInterpretation(cats, r.total_questions || 40)
                : r.interpretation;
              if (!interpText) return null;
              return (
                <div className="glass rounded-xl p-5 glow-border mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog{isPP ? ' — Profil 4 Temperamen' : ''}</h3>
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
                              const categoryMap: Record<string, string> = {
                                'K': 'Koleris',
                                'S': 'Sanguinis',
                                'M': 'Melankolis',
                                'P': 'Plegmatis'
                              };
                              if (r.test_name === "Personality Plus" && a.category) {
                                return categoryMap[a.category] || a.category;
                              }
                              if (r.test_name.toUpperCase().includes("DISC") && a.selected_answer_label) {
                                return a.selected_answer_label;
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
