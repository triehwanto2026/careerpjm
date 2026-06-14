import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  KeyRound,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const statusLabel: Record<string, string> = {
  submitted: "Masuk",
  screening: "Screening",
  test: "Tes",
  interview: "Wawancara",
  offered: "Penawaran",
  accepted: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Ditutup",
};

const statusTone: Record<string, string> = {
  submitted: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  screening: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  test: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  interview: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  offered: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  withdrawn: "bg-muted text-muted-foreground",
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysUntil = (value?: string | null) => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState({
    jobs: 0,
    jobsActive: 0,
    jobsClosed: 0,
    jobsDraft: 0,
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
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const [jobsRes, appsRes, profilesRes, instrRes, resRes, codeRes] = await Promise.all([
        supabase
          .from("job_vacancies")
          .select("id, status, title, department, location, employment_type, closes_at, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("id, status, applied_at, user_id, vacancy_id")
          .order("applied_at", { ascending: false }),
        supabase
          .from("candidate_profiles")
          .select("user_id, full_name, email, is_complete, created_at, expected_salary")
          .order("created_at", { ascending: false }),
        supabase.from("test_instruments").select("id, is_active"),
        supabase
          .from("test_results")
          .select("id, candidate_name, test_name, score, status, completed_at")
          .order("completed_at", { ascending: false }),
        supabase.from("activation_codes").select("id, is_used, expires_at"),
      ]);

      const firstError = [jobsRes, appsRes, profilesRes, instrRes, resRes, codeRes].find((res) => res.error)?.error;
      if (firstError) {
        setErrorMessage(firstError.message || "Dashboard gagal memuat data.");
        setIsLoading(false);
        return;
      }

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
      const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]));
      const mappedApplications = (apps || []).slice(0, 6).map((app: any) => ({
        ...app,
        vacancyTitle: jobMap.get(app.vacancy_id)?.title || "-",
        candidateName: profilesMap.get(app.user_id)?.full_name || app.user_id || "-",
        expectedSalary: profilesMap.get(app.user_id)?.expected_salary || null,
      }));

      setStats({
        jobs: jobs.length,
        jobsActive: jobs.filter((j: any) => j.status === "active").length,
        jobsClosed: jobs.filter((j: any) => j.status === "closed").length,
        jobsDraft: jobs.filter((j: any) => j.status === "draft").length,
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

      setActiveJobs(
        jobs
          .filter((job: any) => job.status === "active")
          .sort((a: any, b: any) => {
            const aDays = getDaysUntil(a.closes_at);
            const bDays = getDaysUntil(b.closes_at);
            return (aDays ?? 9999) - (bDays ?? 9999);
          })
          .slice(0, 5)
      );
      setRecentCandidates(profiles.slice(0, 5));
      setRecentApplications(mappedApplications);
      setRecentResults(ress.slice(0, 5));
      setIsLoading(false);
    };

    load();
  }, []);

  const completionRate = stats.candidates ? Math.round((stats.candidatesComplete / stats.candidates) * 100) : 0;
  const passRate = stats.results ? Math.round((stats.resultsPassed / stats.results) * 100) : 0;
  const pendingRecruitment =
    stats.applicationsSubmitted +
    stats.applicationsScreening +
    stats.applicationsTest +
    stats.applicationsInterview +
    stats.applicationsOffered;

  const pipeline = useMemo(
    () => [
      { key: "submitted", label: "Masuk", value: stats.applicationsSubmitted },
      { key: "screening", label: "Screening", value: stats.applicationsScreening },
      { key: "test", label: "Tes", value: stats.applicationsTest },
      { key: "interview", label: "Wawancara", value: stats.applicationsInterview },
      { key: "offered", label: "Penawaran", value: stats.applicationsOffered },
      { key: "accepted", label: "Diterima", value: stats.applicationsAccepted },
    ],
    [stats]
  );

  const kpis = [
    {
      label: "Lowongan Aktif",
      value: stats.jobsActive,
      sub: `${stats.jobsClosed} ditutup, ${stats.jobsDraft} draft`,
      icon: Briefcase,
      href: "/admin/hr-jobs",
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Lamaran Masuk",
      value: stats.applications,
      sub: `${pendingRecruitment} masih perlu diproses`,
      icon: ClipboardList,
      href: "/admin/recruitment-process",
      tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Profil Kandidat",
      value: `${completionRate}%`,
      sub: `${stats.candidatesComplete} dari ${stats.candidates} lengkap`,
      icon: Users,
      href: "/admin/candidates",
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Hasil Tes Lulus",
      value: `${passRate}%`,
      sub: `${stats.resultsPassed} dari ${stats.results} hasil tes`,
      icon: BarChart3,
      href: "/admin/results",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  const actionItems = [
    {
      title: "Screening menunggu keputusan",
      value: stats.applicationsSubmitted + stats.applicationsScreening,
      detail: "Review data pelamar baru dan kandidat di tahap screening.",
      href: "/admin/recruitment-process",
      icon: FileText,
    },
    {
      title: "Tahap tes dan wawancara",
      value: stats.applicationsTest + stats.applicationsInterview,
      detail: "Pantau kandidat yang sedang tes atau menunggu jadwal wawancara.",
      href: "/admin/recruitment-process",
      icon: Target,
    },
    {
      title: "Kode aktivasi tersedia",
      value: stats.codesActive,
      detail: "Pastikan kode tes masih cukup untuk kebutuhan rekrutmen.",
      href: "/admin/activation-codes",
      icon: KeyRound,
    },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[96rem] space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Activity className="h-3.5 w-3.5" />
                Ringkasan Operasional HR
              </div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard Admin</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Pantau lowongan aktif, alur pelamar, kesiapan profil kandidat, dan hasil tes psikologi dalam satu tampilan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Lowongan</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats.jobs}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Pelamar</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats.applications}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Kandidat</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats.candidates}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tes Aktif</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats.instrumentsActive}</p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold leading-none text-foreground">{item.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                  Buka modul <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pipeline Rekrutmen</h2>
                <p className="text-sm text-muted-foreground">Distribusi pelamar berdasarkan tahapan proses.</p>
              </div>
              <Link to="/admin/recruitment-process" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Kelola proses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {pipeline.map((item) => {
                const percent = stats.applications ? Math.max(5, Math.round((item.value / stats.applications) * 100)) : 0;
                return (
                  <div key={item.key} className="rounded-lg border border-border bg-background/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone[item.key]}`}>
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Perlu Ditindaklanjuti</h2>
            <div className="mt-4 space-y-3">
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} to={item.href} className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-3 transition hover:border-primary/40">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{item.value}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Lowongan Aktif</h2>
                <p className="text-sm text-muted-foreground">Prioritas berdasarkan deadline terdekat.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-muted/40" />)
              ) : activeJobs.length > 0 ? (
                activeJobs.map((job) => {
                  const days = getDaysUntil(job.closes_at);
                  const urgency =
                    days === null
                      ? "Tidak ada deadline"
                      : days < 0
                        ? "Melewati deadline"
                        : days === 0
                          ? "Deadline hari ini"
                          : `${days} hari lagi`;

                  return (
                    <Link key={job.id} to="/admin/hr-jobs" className="block rounded-lg border border-border bg-background/70 p-3 transition hover:border-primary/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{job.department || "-"} • {job.location || "-"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Aktif
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{job.employment_type || "-"}</span>
                        <span className={days !== null && days <= 7 ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
                          {urgency}
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Belum ada lowongan aktif.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Lamaran Terbaru</h2>
                <p className="text-sm text-muted-foreground">Aktivitas masuk terbaru dari portal kandidat.</p>
              </div>
              <Link to="/admin/applicants" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Lihat pelamar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.6fr] gap-3 bg-muted/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>Pelamar</span>
                <span>Lowongan</span>
                <span>Status</span>
                <span>Tanggal</span>
              </div>
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse border-t border-border bg-muted/30" />)
              ) : recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <div key={app.id} className="grid grid-cols-1 gap-2 border-t border-border px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_0.7fr_0.6fr] md:items-center md:gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{app.candidateName}</p>
                      {app.expectedSalary && <p className="text-xs text-muted-foreground">Ekspektasi: {app.expectedSalary}</p>}
                    </div>
                    <p className="truncate text-muted-foreground">{app.vacancyTitle}</p>
                    <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[app.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabel[app.status] || app.status || "-"}
                    </span>
                    <p className="text-xs text-muted-foreground">{formatDate(app.applied_at)}</p>
                  </div>
                ))
              ) : (
                <div className="border-t border-border p-5 text-center text-sm text-muted-foreground">Belum ada lamaran terbaru.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Kandidat Baru</h2>
                <p className="text-sm text-muted-foreground">Profil terbaru yang masuk ke sistem.</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-muted/40" />)
              ) : recentCandidates.length > 0 ? (
                recentCandidates.map((candidate) => (
                  <div key={candidate.user_id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/70 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{candidate.full_name || "-"}</p>
                      <p className="truncate text-xs text-muted-foreground">{candidate.email || formatDate(candidate.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${candidate.is_complete ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      {candidate.is_complete ? "Lengkap" : "Belum lengkap"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Belum ada kandidat baru.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Hasil Tes Terbaru</h2>
                <p className="text-sm text-muted-foreground">Ringkasan hasil tes psikologi yang sudah selesai.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-muted/40" />)
              ) : recentResults.length > 0 ? (
                recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/70 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{result.candidate_name || "-"}</p>
                      <p className="truncate text-xs text-muted-foreground">{result.test_name || "-"} • Skor {result.score ?? 0}%</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      result.status === "passed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : result.status === "review"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {result.status === "passed" ? "Lulus" : result.status === "review" ? "Review" : "Tidak lulus"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Belum ada hasil tes terbaru.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Buat atau kelola lowongan", href: "/admin/hr-jobs", icon: Briefcase },
            { label: "Atur kode aktivasi tes", href: "/admin/activation-codes", icon: KeyRound },
            { label: "Lihat hasil tes kandidat", href: "/admin/results", icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40">
                <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </section>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
