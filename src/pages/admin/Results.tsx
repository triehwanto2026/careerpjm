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

  const load = async () => {
    const { data } = await supabase.from("test_results").select("*").order("completed_at", { ascending: false });
    setResults((data as ResultRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadAnswers = async (resultId: string) => {
    const { data } = await supabase.from("test_answers").select("*").eq("test_result_id", resultId).order("question_number");
    setAnswers((data as AnswerRow[]) || []);
  };

  const handleSelectResult = async (r: ResultRow) => {
    setSelectedResult(r);
    await loadAnswers(r.id);
  };

  const filtered = results.filter(
    (r) => r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase()) ||
      r.test_name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    if (!selectedResult) return;
    const r = selectedResult;
    const profile = r.candidate_profile as Record<string, string> | null;
    const cats = r.categories as Record<string, number>;
    const catEntries = Object.entries(cats);
    const maxVal = r.test_name === "PAPIKOSTIK" ? 9 : 100;
    const statusLabel = r.status === "passed" ? "LULUS" : r.status === "review" ? "REVIEW" : "TIDAK LULUS";
    const statusColor = r.status === "passed" ? "#059669" : r.status === "review" ? "#d97706" : "#dc2626";

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
      <div class="section-title">Ringkasan Hasil — ${r.test_name}</div>
      <div class="score-cards">
        <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
        <div class="score-card"><div class="label">Skor Akhir</div><div class="value">${r.score}<span style="font-size:14pt;color:#64748b;">%</span></div></div>
        <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profil Dimensi & Skor</div>
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
    </div>

    ${r.interpretation ? `
    <div class="section">
      <div class="section-title">Interpretasi Psikolog</div>
      <div class="interpretation">${r.interpretation}</div>
    </div>` : ""}

    <div class="section page-break">
      <div class="section-title">Lembar Jawaban Kandidat (${answers.length} Soal)</div>
      ${answers.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px 0;">Belum ada data jawaban tersimpan.</p>' : `
      <table class="answer-table">
        <thead><tr><th style="width:36px;">No</th><th>Pertanyaan</th><th style="width:160px;">Jawaban</th><th style="width:120px;">Kategori</th></tr></thead>
        <tbody>
          ${answers.map(a => `
            <tr>
              <td class="ans-num">${a.question_number}</td>
              <td>
                <div>${a.question_text}</div>
                ${a.question_text_en ? `<div class="ans-q-en">${a.question_text_en}</div>` : ""}
              </td>
              <td><span class="ans-pill ${a.is_correct === true ? 'ans-correct' : a.is_correct === false ? 'ans-wrong' : ''}">${a.selected_answer_label ? a.selected_answer_label + ". " : ""}${a.selected_answer}</span></td>
              <td class="ans-cat">${a.category || "-"}</td>
            </tr>`).join("")}
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
      const radarData = dims.map(d => ({ dim: d, value: Math.abs(Number(cats[d] || 0)) }));
      const jobMatch: Record<string, string> = {
        D: "Manager, Entrepreneur, Sales Director, Director, CEO",
        I: "Sales, Public Relations, Marketing, Trainer, Public Speaker",
        S: "Counselor, Teacher, Nurse, HR, Customer Service, Therapist",
        C: "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer",
      };
      const dominant = dims.reduce((a, b) => Number(cats[a] || 0) > Number(cats[b] || 0) ? a : b);
      const renderMini = (title: string, d: { name: string; value: number }[], color: string) => (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-foreground mb-2">{title}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(210,20%,70%)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {renderMini("Mask — Public Self (M)", mask, "#10b981")}
            {renderMini("Core — Private Self (L)", core, "#f59e0b")}
            {renderMini("Mirror — Perceived Self (Net)", mirror, "#ec4899")}
          </div>

          {/* Line chart trend across 3 graphs */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">Tren DISC: Mask vs Core vs Mirror</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
                <XAxis dataKey="dimensi" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "hsl(210,20%,75%)" }} />
                <Line type="monotone" dataKey="Mask" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Core" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Mirror" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Final Spider/Radar chart */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary mb-2">Profil Final DISC (Spider Chart)</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 14%, 25%)" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "hsl(210,20%,75%)", fontSize: 13, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }} />
                <Radar name="Intensitas" dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.35} strokeWidth={2.5} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-1">Dimensi Dominan: {dominant}</p>
            <p className="text-xs text-foreground/80"><span className="font-semibold">Pekerjaan yang sesuai:</span> {jobMatch[dominant]}</p>
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
    if (r.test_name === "Personality Plus") {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "hsl(210,20%,75%)" }} />
          </PieChart>
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

  // Detail view
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
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-2xl font-bold">{r.candidate_name.charAt(0)}</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{r.candidate_name}</h2>
                  <p className="text-sm text-muted-foreground">{r.position}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "passed" ? "bg-emerald-400/10 text-emerald-400" : r.status === "review" ? "bg-amber-400/10 text-amber-400" : "bg-destructive/10 text-destructive"
                  }`}>
                    {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                  </span>
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
              </div>
            </div>

            {/* Interpretation */}
            {r.interpretation && (
              <div className="glass rounded-xl p-5 glow-border mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.interpretation}</p>
              </div>
            )}

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
                            <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{a.selected_answer_label || a.selected_answer}</span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{a.category || "-"}</td>
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
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari nama, posisi, atau tes..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Memuat data...</p>
          ) : filtered.map((r) => (
            <div key={r.id} className="glass rounded-xl p-5 glow-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{r.candidate_name}</h3>
                  <p className="text-xs text-muted-foreground">{r.position}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === "passed" ? "bg-emerald-400/10 text-emerald-400" : r.status === "review" ? "bg-amber-400/10 text-amber-400" : "bg-destructive/10 text-destructive"
                }`}>
                  {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{r.test_name}</span>
                <span className="text-xs text-muted-foreground">{r.completed_at?.split("T")[0]}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Skor</span><span className="font-semibold text-foreground">{r.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-all ${r.score >= 75 ? "bg-emerald-400" : r.score >= 50 ? "bg-amber-400" : "bg-destructive"}`} style={{ width: `${r.score}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-border pt-3">
                <button onClick={() => handleSelectResult(r)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Lihat Detail & Grafik
                </button>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Results;
