import { useEffect, useState, useRef } from "react";
import { Search, Eye, Download, Printer, FileText } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#2dd4bf", "#60a5fa", "#f59e0b", "#ef4444", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];

interface ResultRow {
  id: string; candidate_id: string | null; candidate_name: string; position: string; test_name: string;
  score: number; total_questions: number; answered_questions: number;
  categories: Record<string, number>; status: string; interpretation: string | null;
  candidate_profile: Record<string, string> | null; completed_at: string;
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
    if (!printRef.current || !selectedResult) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Hasil Tes - ${selectedResult.candidate_name}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1a1a1a; background: #fff; font-size: 13px; }
      .print-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
      .print-header h1 { font-size: 20px; } .print-header p { font-size: 12px; color: #666; margin-top: 4px; }
      .section { margin-bottom: 16px; } .section h2 { font-size: 15px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      .interpretation { padding: 12px; background: #f9f9f9; border-radius: 6px; line-height: 1.6; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; }
      @media print { body { padding: 16px; } }
    </style></head><body>${printContent}
    <div class="footer">Dicetak pada: ${new Date().toLocaleString("id-ID")} — Sistem Tes Psikologi Rekrutmen</div>
    </body></html>`);
    win.document.close();
    win.print();
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

    if (r.test_name === "DISC" || r.test_name === "Kraepelin") {
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
