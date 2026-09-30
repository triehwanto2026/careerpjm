import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, XCircle, Briefcase, Calendar, User, FileCheck, DollarSign, AlertCircle, MapPin, TimerReset, ChevronRight, X } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

interface AppRow {
  id: string;
  vacancy_id: string;
  status: string;
  applied_at: string;
  status_updated_at: string;
  status_history?: Record<string, string> | null;
  cover_letter: string;
  admin_notes: string;
  interview_date?: string;
  interview_location?: string;
  interview_type?: string;
  offer_salary?: number;
  offer_start_date?: string;
  rejection_reason?: string;
  vacancy?: { title?: string; position?: string; department?: string; location?: string; status?: string; closes_at?: string | null };
  position?: string;
  job_title?: string;
  vacancy_title?: string;
  position_snapshot?: string;
  department_snapshot?: string;
  location_snapshot?: string;
  vacancy_status_snapshot?: string;
}

const STATUS_FLOW = [
  { key: "submitted", label: "1. Administrasi", color: "blue", icon: CheckCircle2 },
  { key: "applied", label: "1. Administrasi", color: "blue", icon: CheckCircle2 },
  { key: "screening", label: "1. Administrasi", color: "cyan", icon: FileCheck },
  { key: "test", label: "2. Tes Psikologi", color: "violet", icon: ClipboardList },
  { key: "psychology_test", label: "2. Tes Psikologi", color: "violet", icon: ClipboardList },
  { key: "technical_test", label: "3. Tes Teknikal", color: "blue", icon: Briefcase },
  { key: "hr_interview", label: "4. Interview HR", color: "amber", icon: User },
  { key: "user_interview", label: "5. Interview User", color: "orange", icon: Briefcase },
  { key: "offered", label: "6. Offering", color: "green", icon: DollarSign },
  { key: "offer", label: "6. Offering", color: "green", icon: DollarSign },
  { key: "accepted", label: "7. Onboarding", color: "green", icon: CheckCircle2 },
  { key: "hired", label: "7. Onboarding", color: "green", icon: CheckCircle2 },
  { key: "onboarding", label: "7. Onboarding", color: "green", icon: CheckCircle2 },
  { key: "rejected", label: "Ditolak", color: "red", icon: XCircle },
  { key: "expired", label: "Kedaluwarsa", color: "gray", icon: AlertCircle },
];

const PROGRESS_STEPS = [
  { key: "submitted", aliases: ["submitted", "applied"], label: "Lamaran", icon: CheckCircle2 },
  { key: "screening", aliases: ["screening"], label: "Screening", icon: FileCheck },
  { key: "test", aliases: ["test", "psychology_test"], label: "Tes", icon: ClipboardList },
  { key: "hr_interview", aliases: ["hr_interview"], label: "HR", icon: User },
  { key: "user_interview", aliases: ["user_interview"], label: "User", icon: Briefcase },
  { key: "offered", aliases: ["offered", "offer"], label: "Offer", icon: DollarSign },
  { key: "accepted", aliases: ["accepted", "hired"], label: "Final", icon: CheckCircle2 },
];

const PROCESS_STAGES = [
  {
    key: "administration",
    aliases: ["submitted", "applied", "screening"],
    title: "Administrasi",
    shortLabel: "Administrasi",
    description: "Verifikasi profil, CV, dan kelengkapan dokumen kandidat.",
    icon: FileCheck,
  },
  {
    key: "psychology_test",
    aliases: ["test", "psychology_test"],
    title: "Tes Psikologi",
    shortLabel: "Psikologi",
    description: "Asesmen psikologi atau psikotes sesuai kebutuhan posisi.",
    icon: ClipboardList,
  },
  {
    key: "technical_test",
    aliases: ["technical_test", "technical", "skill_test", "user_test"],
    title: "Tes Teknikal",
    shortLabel: "Teknikal",
    description: "Tes kemampuan teknis, studi kasus, atau tugas kerja.",
    icon: Briefcase,
  },
  {
    key: "hr_interview",
    aliases: ["hr_interview"],
    title: "Interview HR",
    shortLabel: "HR",
    description: "Diskusi HR terkait profil, motivasi, ekspektasi, dan budaya kerja.",
    icon: User,
  },
  {
    key: "user_interview",
    aliases: ["user_interview", "interview"],
    title: "Interview User",
    shortLabel: "User",
    description: "Interview dengan user atau hiring manager untuk validasi kompetensi.",
    icon: Briefcase,
  },
  {
    key: "offering",
    aliases: ["offered", "offer"],
    title: "Offering",
    shortLabel: "Offering",
    description: "Pembahasan penawaran kerja, kompensasi, dan tanggal mulai.",
    icon: DollarSign,
  },
  {
    key: "onboarding",
    aliases: ["accepted", "hired", "onboarding"],
    title: "Onboarding",
    shortLabel: "Onboarding",
    description: "Finalisasi penerimaan dan persiapan bergabung.",
    icon: CheckCircle2,
  },
  {
    key: "rejected",
    aliases: ["rejected"],
    title: "Ditolak",
    shortLabel: "Ditolak",
    description: "Lamaran tidak melanjutkan ke tahap berikutnya.",
    icon: XCircle,
  },
];

const colors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  psychology_test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  technical_test: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  offer: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  hired: "bg-green-500/15 text-green-500 border-green-500/30",
  onboarding: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  withdrawn: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  closed_notice: "bg-slate-500/15 text-slate-600 border-slate-300 dark:text-slate-300 dark:border-slate-600",
};

const activeColors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  psychology_test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  technical_test: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  offer: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  hired: "bg-green-500/15 text-green-500 border-green-500/30",
  onboarding: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  withdrawn: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

export default function CandidateApplications() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppRow | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await syncExpiredRecruitment();
    const { data } = await supabase
      .from("job_applications")
      .select("*, vacancy:job_vacancies(id,title,department,location,status,closes_at)")
      .eq("user_id", session.user.id)
      .order("applied_at", { ascending: false });
    const list = (data as any) || [];
    const ids = Array.from(new Set(list.map((a: any) => a.vacancy_id).filter(Boolean))) as string[];
    if (ids.length > 0) {
      const { data: vac } = await supabase.from("job_vacancies").select("id,title,department,location,status,closes_at").in("id", ids);
      const map = new Map((vac || []).map((v: any) => [v.id, v]));
      list.forEach((a: any) => { a.vacancy = a.vacancy || map.get(a.vacancy_id); });
    }
    setApps(list);
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const fmtDateTime = (s: string) => new Date(s).toLocaleString("id-ID", { 
    day: "numeric", 
    month: "long", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  const fmtCurrency = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const terminalStatuses = new Set(["accepted", "hired", "rejected", "withdrawn", "expired"]);
  const negativeTerminalStatuses = new Set(["rejected", "withdrawn", "expired"]);
  const getAgeDays = (s: string) => Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 86400000));
  const isPastTwoMonths = (a: AppRow) => getAgeDays(a.applied_at) >= 60;
  const isVacancyClosed = (a: AppRow) => a.vacancy?.status === "closed" || (!!a.vacancy?.closes_at && new Date(a.vacancy.closes_at).getTime() < Date.now());
  const shouldShowClosedNotice = (a: AppRow) => !terminalStatuses.has(a.status) && (isPastTwoMonths(a) || isVacancyClosed(a));
  const getStatusConfig = (status: string) => STATUS_FLOW.find((s) => s.key === status) || STATUS_FLOW.find((s) => s.key === "submitted")!;
  const getProgressIndex = (status: string) => {
    const index = PROGRESS_STEPS.findIndex((step) => step.aliases.includes(status));
    return index >= 0 ? index : 0;
  };
  const getProcessIndex = (status: string) => {
    const index = PROCESS_STAGES.findIndex((stage) => stage.aliases.includes(status));
    return index >= 0 ? index : 0;
  };
  const getStageDate = (a: AppRow, stageKey: string, stageIndex: number, currentIndex: number) => {
    const history = a.status_history && typeof a.status_history === "object" ? a.status_history : {};
    if (stageKey === "administration") return a.applied_at;
    const stage = PROCESS_STAGES[stageIndex];
    const recorded = stage?.aliases.map((alias) => history[alias]).find(Boolean);
    if (recorded) return recorded;
    if (stageIndex === currentIndex && a.status_updated_at) return a.status_updated_at;
    if (stageKey === "user_interview" && a.interview_date) return a.interview_date;
    if (stageKey === "offering" && a.offer_start_date) return a.offer_start_date;
    return "";
  };
  const buildProcessStages = (a: AppRow) => {
    const currentIndex = getProcessIndex(a.status);
    const stopped = negativeTerminalStatuses.has(a.status) || shouldShowClosedNotice(a);

    return PROCESS_STAGES.map((stage, index) => {
      const isCurrent = stage.aliases.includes(a.status) || (shouldShowClosedNotice(a) && index === currentIndex);
      const isDone = !stopped && index < currentIndex;
      const isPending = !isCurrent && !isDone;
      const date = getStageDate(a, stage.key, index, currentIndex);

      return {
        ...stage,
        state: isCurrent ? "current" : isDone ? "done" : isPending ? "pending" : "pending",
        date,
      };
    });
  };
  const getProcessSummary = (a: AppRow) => {
    if (a.status === "rejected") return "Proses berhenti pada tahap seleksi. Lihat catatan HR jika tersedia.";
    if (a.status === "expired" || shouldShowClosedNotice(a)) return "Lowongan sudah tidak aktif atau proses sudah diarsipkan.";
    if (a.status === "withdrawn") return "Lamaran ditarik dari proses rekrutmen.";
    const current = PROCESS_STAGES[getProcessIndex(a.status)];
    return current ? `Saat ini berada di tahap ${current.title}.` : "Lamaran sedang diproses oleh tim rekrutmen.";
  };
  const getAppliedPosition = (a: AppRow) => {
    const value = a.position_snapshot || a.vacancy?.title || a.vacancy?.position || a.position || a.job_title || a.vacancy_title;
    return value && String(value).trim() ? String(value) : "Posisi tidak ditemukan";
  };
  const getAppliedDepartment = (a: AppRow) => a.department_snapshot || a.vacancy?.department || "";
  const getAppliedLocation = (a: AppRow) => a.location_snapshot || a.vacancy?.location || "";

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-muted/20">
        <div className="border-b border-border bg-card px-4 py-4">
          <div className="mx-auto flex max-w-[96rem] flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lamaran Saya</h1>
              <p className="text-xs text-muted-foreground">{apps.length} lamaran tercatat</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Status diperbarui otomatis mengikuti proses rekrutmen
            </div>
          </div>
        </div>

        <div className="w-full px-4 py-5">
          <div className="mx-auto max-w-[96rem]">
            {apps.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">Belum ada lamaran</p>
                <p className="mt-1 text-xs">Lowongan yang Anda lamar akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {apps.map((a) => {
                  const currentStatus = getStatusConfig(a.status);
                  const statusClass = shouldShowClosedNotice(a) ? colors.closed_notice : colors[a.status] || colors.submitted;
                  const displayLabel = shouldShowClosedNotice(a) ? "Lowongan Ditutup / Diarsipkan" : currentStatus?.label || a.status;
                  const ageDays = getAgeDays(a.applied_at);
                  const currentProcessIndex = getProcessIndex(a.status);
                  const progressPercent = Math.round(((currentProcessIndex + 1) / PROCESS_STAGES.length) * 100);

                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedApp(a)}
                      className="group w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/20"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                              {displayLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">{Math.min(progressPercent, 100)}% proses</span>
                          </div>
                          <h3 className="text-base font-bold text-foreground md:text-lg">{getAppliedPosition(a)}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {getAppliedDepartment(a) && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{getAppliedDepartment(a)}</span>}
                            {getAppliedLocation(a) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{getAppliedLocation(a)}</span>}
                            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Apply {fmtDate(a.applied_at)}</span>
                            <span className="inline-flex items-center gap-1"><TimerReset className="h-3.5 w-3.5" />{ageDays} hari</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 lg:min-w-[260px]">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{PROCESS_STAGES[Math.min(currentProcessIndex, PROCESS_STAGES.length - 1)]?.shortLabel}</span>
                              <span>{a.status_updated_at ? fmtDate(a.status_updated_at) : "-"}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedApp && (() => {
          const a = selectedApp;
          const currentStatus = getStatusConfig(a.status);
          const statusClass = shouldShowClosedNotice(a) ? colors.closed_notice : colors[a.status] || colors.submitted;
          const displayLabel = shouldShowClosedNotice(a) ? "Lowongan Ditutup / Diarsipkan" : currentStatus?.label || a.status;
          const ageDays = getAgeDays(a.applied_at);
          const processStages = buildProcessStages(a);
          const currentProcessIndex = getProcessIndex(a.status);
          const progressPercent = Math.round(((currentProcessIndex + 1) / PROCESS_STAGES.length) * 100);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setSelectedApp(null)}>
              <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/20 p-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                        {displayLabel}
                      </span>
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">{Math.min(progressPercent, 100)}% proses</span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground md:text-xl">{getAppliedPosition(a)}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {getAppliedDepartment(a) && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{getAppliedDepartment(a)}</span>}
                      {getAppliedLocation(a) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{getAppliedLocation(a)}</span>}
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Dilamar {fmtDate(a.applied_at)}</span>
                      <span className="inline-flex items-center gap-1"><TimerReset className="h-3.5 w-3.5" />{ageDays} hari proses</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Tutup detail lamaran">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-foreground">{getProcessSummary(a)}</span>
                      <span className="text-muted-foreground">{PROCESS_STAGES[Math.min(currentProcessIndex, PROCESS_STAGES.length - 1)]?.shortLabel}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border bg-card p-4">
                        <h4 className="text-sm font-bold text-foreground">History Proses Rekrutmen</h4>
                        <p className="mb-4 text-xs text-muted-foreground">Tanggal detail tampil jika sudah dicatat oleh HR.</p>
                        <div className="space-y-3">
                          {processStages.map((stage, index) => {
                            const Icon = stage.icon;
                            const active = stage.state === "current";
                            const done = stage.state === "done";
                            const dateText = stage.date ? fmtDate(stage.date) : done ? "Tanggal belum tercatat" : "Menunggu proses";
                            return (
                              <div key={stage.key} className="grid gap-3 sm:grid-cols-[36px_minmax(0,1fr)_160px]">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                                  active ? "border-primary bg-primary/10 text-primary" : done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border bg-muted text-muted-foreground"
                                }`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 rounded-lg border border-border bg-muted/20 p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-foreground">{index + 1}. {stage.title}</p>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      active ? "bg-primary/10 text-primary" : done ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                                    }`}>
                                      {active ? "Sedang berjalan" : done ? "Selesai" : "Belum mulai"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
                                </div>
                                <div className="rounded-lg border border-border bg-card p-3 text-xs">
                                  <p className="text-muted-foreground">Tanggal</p>
                                  <p className="mt-1 font-semibold text-foreground">{dateText}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {shouldShowClosedNotice(a) && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>Lamaran ini sudah melewati 2 bulan atau lowongan sudah tidak aktif. Jika belum ada pembaruan dari HR, proses rekrutmen dapat dianggap ditutup/diarsipkan.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <aside className="space-y-3">
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <h4 className="mb-3 text-sm font-bold text-foreground">Ringkasan Lamaran</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status Saat Ini</span><span className="text-right font-semibold text-foreground">{displayLabel}</span></div>
                          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Tanggal Apply</span><span className="font-semibold text-foreground">{fmtDate(a.applied_at)}</span></div>
                          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Update Terakhir</span><span className="font-semibold text-foreground">{a.status_updated_at ? fmtDate(a.status_updated_at) : "-"}</span></div>
                          {a.vacancy?.closes_at && <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Tutup Lowongan</span><span className="font-semibold text-foreground">{fmtDate(a.vacancy.closes_at)}</span></div>}
                          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Durasi Proses</span><span className="font-semibold text-foreground">{ageDays} hari</span></div>
                        </div>
                      </div>

                      {a.interview_date && (
                        <div className="rounded-xl border border-border bg-card p-4 text-xs">
                          <div className="mb-2 flex items-center gap-2 font-bold text-foreground"><Calendar className="h-4 w-4 text-primary" />Jadwal Wawancara</div>
                          <p className="font-semibold">{fmtDateTime(a.interview_date)}</p>
                          {a.interview_location && <p className="mt-1 text-muted-foreground">{a.interview_location}</p>}
                          {a.interview_type && <p className="text-muted-foreground">Tipe: {a.interview_type}</p>}
                        </div>
                      )}

                      {a.offer_salary && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                          <div className="mb-2 flex items-center gap-2 font-bold"><DollarSign className="h-4 w-4" />Penawaran</div>
                          <p className="text-sm font-bold">{fmtCurrency(a.offer_salary)}</p>
                          {a.offer_start_date && <p className="mt-1">Mulai: {fmtDate(a.offer_start_date)}</p>}
                        </div>
                      )}

                      {(a.admin_notes || a.rejection_reason || a.cover_letter) && (
                        <div className="rounded-xl border border-border bg-card p-4 text-xs">
                          <h4 className="mb-3 text-sm font-bold text-foreground">Catatan</h4>
                          {a.admin_notes && <div className="mb-3"><p className="font-semibold text-foreground">Catatan Admin</p><p className="mt-1 leading-relaxed text-muted-foreground">{a.admin_notes}</p></div>}
                          {a.rejection_reason && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-red-700"><span className="font-semibold">Alasan Penolakan: </span>{a.rejection_reason}</div>}
                          {a.cover_letter && <div><p className="font-semibold text-foreground">Cover Letter</p><p className="mt-1 leading-relaxed text-muted-foreground">{a.cover_letter}</p></div>}
                        </div>
                      )}
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </CandidateLayout>
  );
}
