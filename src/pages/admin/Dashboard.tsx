import { useEffect, useState } from "react";
import { KeyRound, Users, ClipboardList, BarChart3, TrendingUp, Clock, Briefcase } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({
    jobs: 0,
    jobsActive: 0,
    applications: 0,
    applicationsSubmitted: 0,
    applicationsScreening: 0,
    applicationsTest: 0,
    applicationsInterview: 0,
    applicationsOffered: 0,
    applicationsAccepted: 0,
    applicationsRejected: 0,
    candidates: 0,
    candidatesComplete: 0,
    instruments: 0,
    instrumentsActive: 0,
    results: 0,
    resultsPassed: 0,
    codes: 0,
    codesActive: 0,
  });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [jobsRes, appsRes, profilesRes, instrRes, resRes, codeRes] = await Promise.all([
        supabase.from("job_vacancies").select("id, status, title").order("created_at", { ascending: false }),
        supabase.from("job_applications").select("id, status, applied_at, user_id, vacancy_id").order("applied_at", { ascending: false }),
        supabase.from("candidate_profiles").select("user_id, full_name, email, is_complete, created_at").order("created_at", { ascending: false }),
        supabase.from("test_instruments").select("id, is_active"),
        supabase.from("test_results").select("id, candidate_name, test_name, score, status, completed_at").order("completed_at", { ascending: false }),
        supabase.from("activation_codes").select("id, is_used"),
      ]);

      const jobs = jobsRes.data || [];
      const apps = appsRes.data || [];
      const profiles = profilesRes.data || [];
      const instrs = instrRes.data || [];
      const ress = resRes.data || [];
      const codes = codeRes.data || [];

      const statusCounts = apps.reduce((acc: Record<string, number>, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const recentApplications = (apps || []).slice(0, 5).map((app: any) => ({
        ...app,
        vacancyTitle: jobs.find((job: any) => job.id === app.vacancy_id)?.title || "-",
        candidateName: profilesMap.get(app.user_id)?.full_name || app.user_id,
      }));

      setStats({
        jobs: jobs.length,
        jobsActive: jobs.filter((j: any) => j.status === "active").length,
        applications: apps.length,
        applicationsSubmitted: statusCounts.submitted || 0,
        applicationsScreening: statusCounts.screening || 0,
        applicationsTest: statusCounts.test || 0,
        applicationsInterview: statusCounts.interview || 0,
        applicationsOffered: statusCounts.offered || 0,
        applicationsAccepted: statusCounts.accepted || 0,
        applicationsRejected: statusCounts.rejected || 0,
        candidates: profiles.length,
        candidatesComplete: profiles.filter((p: any) => p.is_complete).length,
        instruments: instrs.length,
        instrumentsActive: instrs.filter((t: any) => t.is_active).length,
        results: ress.length,
        resultsPassed: ress.filter((r: any) => r.status === "passed").length,
        codes: codes.length,
        codesActive: codes.filter((c: any) => !c.is_used).length,
      });
      setRecentCandidates(profiles.slice(0, 5));
      setRecentApplications(recentApplications);
      setRecentResults(ress.slice(0, 5));
    };
    load();
  }, []);

  const statCards = [
    { label: "Lowongan", value: stats.jobs, sub: `${stats.jobsActive} aktif`, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Pelamar", value: stats.applications, sub: `${stats.applicationsSubmitted} masuk`, icon: ClipboardList, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { label: "Kandidat", value: stats.candidates, sub: `${stats.candidatesComplete} lengkap`, icon: Users, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Alat Tes", value: stats.instruments, sub: `${stats.instrumentsActive} aktif`, icon: ClipboardList, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Hasil Tes", value: stats.results, sub: `${stats.resultsPassed} lulus`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Kode Aktivasi", value: stats.codes, sub: `${stats.codesActive} tersedia`, icon: KeyRound, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan sistem tes psikologi rekrutmen</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                <div key={c.user_id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.full_name || "-"}</p>
                    <p className="text-xs text-muted-foreground">{c.email || new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_complete ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
                    {c.is_complete ? "Profil Lengkap" : "Profil Belum Lengkap"}
                  </span>
                </div>
              ))}
              {recentCandidates.length === 0 && (
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground text-center">Belum ada kandidat baru.</div>
              )}
            </div>
          </div>
          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-primary" /> Lamaran Terbaru
            </h3>
            <div className="mt-4 space-y-3">
              {recentApplications.map((a) => (
                <div key={a.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{a.vacancyTitle}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{a.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.applied_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground text-center">Belum ada lamaran terbaru.</div>
              )}
            </div>
          </div>
          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Status Rekrutmen
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Masuk", value: stats.applicationsSubmitted },
                { label: "Screening", value: stats.applicationsScreening },
                { label: "Tes", value: stats.applicationsTest },
                { label: "Wawancara", value: stats.applicationsInterview },
                { label: "Ditawarkan", value: stats.applicationsOffered },
                { label: "Diterima", value: stats.applicationsAccepted },
                { label: "Ditolak", value: stats.applicationsRejected },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
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
              {recentResults.length === 0 && (
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground text-center">Belum ada hasil tes terbaru.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
