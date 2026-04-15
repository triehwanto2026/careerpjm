import { useEffect, useState } from "react";
import { KeyRound, Users, ClipboardList, BarChart3, TrendingUp, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({ codes: 0, codesActive: 0, candidates: 0, candidatesDone: 0, instruments: 0, instrumentsActive: 0, results: 0, resultsPassed: 0 });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [codeRes, candRes, instrRes, resRes] = await Promise.all([
        supabase.from("activation_codes").select("id, is_used"),
        supabase.from("candidates").select("id, name, position, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("test_instruments").select("id, is_active"),
        supabase.from("test_results").select("id, candidate_name, position, test_name, score, status, completed_at").order("completed_at", { ascending: false }).limit(5),
      ]);
      const codes = codeRes.data || [];
      const cands = candRes.data || [];
      const instrs = instrRes.data || [];
      const ress = resRes.data || [];
      setStats({
        codes: codes.length, codesActive: codes.filter(c => !c.is_used).length,
        candidates: cands.length, candidatesDone: cands.filter(c => c.status === "completed").length,
        instruments: instrs.length, instrumentsActive: instrs.filter(t => t.is_active).length,
        results: ress.length, resultsPassed: ress.filter(r => r.status === "passed").length,
      });
      setRecentCandidates(cands);
      setRecentResults(ress);
    };
    load();
  }, []);

  const statCards = [
    { label: "Kode Aktivasi", value: stats.codes, sub: `${stats.codesActive} aktif`, icon: KeyRound, color: "text-primary", bg: "bg-primary/10" },
    { label: "Kandidat", value: stats.candidates, sub: `${stats.candidatesDone} selesai`, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Alat Tes", value: stats.instruments, sub: `${stats.instrumentsActive} aktif`, icon: ClipboardList, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Hasil Tes", value: stats.results, sub: `${stats.resultsPassed} lulus`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan sistem tes psikologi rekrutmen</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="glass rounded-xl p-5 glow-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> Kandidat Terbaru
            </h3>
            <div className="mt-4 space-y-3">
              {recentCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.position}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.status === "completed" ? "bg-emerald-400/10 text-emerald-400"
                    : c.status === "in_progress" ? "bg-amber-400/10 text-amber-400"
                    : c.status === "expired" ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {c.status === "completed" ? "Selesai" : c.status === "in_progress" ? "Berlangsung" : c.status === "expired" ? "Kadaluarsa" : "Menunggu"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Hasil Tes Terbaru
            </h3>
            <div className="mt-4 space-y-3">
              {recentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{r.test_name} — Skor: {r.score}%</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "passed" ? "bg-emerald-400/10 text-emerald-400"
                    : r.status === "review" ? "bg-amber-400/10 text-amber-400"
                    : "bg-destructive/10 text-destructive"
                  }`}>
                    {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
