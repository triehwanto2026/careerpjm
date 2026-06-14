import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, XCircle, Briefcase, Calendar, User, FileCheck, DollarSign, AlertCircle, MapPin, TimerReset } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

interface AppRow {
  id: string;
  vacancy_id: string;
  status: string;
  applied_at: string;
  status_updated_at: string;
  cover_letter: string;
  admin_notes: string;
  interview_date?: string;
  interview_location?: string;
  interview_type?: string;
  offer_salary?: number;
  offer_start_date?: string;
  rejection_reason?: string;
  vacancy?: { title: string; department: string; location: string; status?: string; closes_at?: string | null };
}

const STATUS_FLOW = [
  { key: "submitted", label: "1. Lamaran Diterima", color: "blue", icon: CheckCircle2 },
  { key: "screening", label: "2. Screening CV", color: "cyan", icon: FileCheck },
  { key: "test", label: "3. Tes Psikologi", color: "violet", icon: ClipboardList },
  { key: "psychology_test", label: "3. Tes Psikologi", color: "violet", icon: ClipboardList },
  { key: "hr_interview", label: "4. Wawancara HR", color: "amber", icon: User },
  { key: "user_interview", label: "5. Wawancara User", color: "orange", icon: Briefcase },
  { key: "offered", label: "6. Penawaran", color: "green", icon: DollarSign },
  { key: "offer", label: "6. Penawaran", color: "green", icon: DollarSign },
  { key: "accepted", label: "7. Diterima", color: "green", icon: CheckCircle2 },
  { key: "hired", label: "7. Diterima", color: "green", icon: CheckCircle2 },
  { key: "rejected", label: "8. Ditolak", color: "red", icon: XCircle },
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

const colors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  psychology_test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  offer: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  hired: "bg-green-500/15 text-green-500 border-green-500/30",
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
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  offer: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  hired: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  withdrawn: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

export default function CandidateApplications() {
  const [apps, setApps] = useState<AppRow[]>([]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await syncExpiredRecruitment();
    const { data } = await supabase.from("job_applications").select("*").eq("user_id", session.user.id).order("applied_at", { ascending: false });
    const list = (data as any) || [];
    // Fetch vacancies
    const ids = Array.from(new Set(list.map((a: any) => a.vacancy_id))) as string[];
    if (ids.length > 0) {
      const { data: vac } = await supabase.from("job_vacancies").select("id,title,department,location,status,closes_at").in("id", ids);
      const map = new Map((vac || []).map((v: any) => [v.id, v]));
      list.forEach((a: any) => { a.vacancy = map.get(a.vacancy_id); });
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
  const getAgeDays = (s: string) => Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 86400000));
  const isPastTwoMonths = (a: AppRow) => getAgeDays(a.applied_at) >= 60;
  const isVacancyClosed = (a: AppRow) => a.vacancy?.status === "closed" || (!!a.vacancy?.closes_at && new Date(a.vacancy.closes_at).getTime() < Date.now());
  const shouldShowClosedNotice = (a: AppRow) => !terminalStatuses.has(a.status) && (isPastTwoMonths(a) || isVacancyClosed(a));
  const getStatusConfig = (status: string) => STATUS_FLOW.find((s) => s.key === status) || STATUS_FLOW.find((s) => s.key === "submitted")!;
  const getProgressIndex = (status: string) => {
    const index = PROGRESS_STEPS.findIndex((step) => step.aliases.includes(status));
    return index >= 0 ? index : 0;
  };

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
                  const progressIndex = getProgressIndex(a.status);
                  const currentStatus = getStatusConfig(a.status);
                  const statusClass = shouldShowClosedNotice(a) ? colors.closed_notice : colors[a.status] || colors.submitted;
                  const displayLabel = shouldShowClosedNotice(a) ? "Lowongan Ditutup / Diarsipkan" : currentStatus?.label || a.status;
                  const isTerminal = terminalStatuses.has(a.status);
                  const ageDays = getAgeDays(a.applied_at);

                  return (
                    <article key={a.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-foreground">{a.vacancy?.title || "Lowongan"}</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {a.vacancy?.department && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{a.vacancy.department}</span>}
                                {a.vacancy?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.vacancy.location}</span>}
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Dilamar {fmtDate(a.applied_at)}</span>
                                <span className="inline-flex items-center gap-1"><TimerReset className="h-3.5 w-3.5" />{ageDays} hari</span>
                              </div>
                            </div>
                            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                              {displayLabel}
                            </span>
                          </div>

                          {!isTerminal && (
                            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                              <div className="mb-2 flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground">Progress Lamaran</span>
                                <span className="text-muted-foreground">{PROGRESS_STEPS[Math.min(progressIndex, PROGRESS_STEPS.length - 1)]?.label}</span>
                              </div>
                              <div className="grid grid-cols-7 gap-1.5">
                                {PROGRESS_STEPS.map((step, i) => {
                                  const Icon = step.icon;
                                  const reached = i <= progressIndex;
                                  const current = i === progressIndex;
                                  return (
                                    <div key={step.key} className="min-w-0">
                                      <div className={`flex h-8 items-center justify-center rounded-md border text-xs transition ${reached ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground/50"} ${current ? "ring-1 ring-primary/40" : ""}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                      </div>
                                      <p className={`mt-1 truncate text-center text-[10px] ${reached ? "text-foreground" : "text-muted-foreground/50"}`}>{step.label}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {shouldShowClosedNotice(a) && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>
                                  Lamaran ini sudah melewati 2 bulan atau lowongan sudah tidak aktif. Jika belum ada pembaruan dari HR, proses rekrutmen dapat dianggap ditutup/diarsipkan.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Tanggal Apply</span>
                            <span className="font-medium">{fmtDate(a.applied_at)}</span>
                          </div>
                          {a.status_updated_at && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Update Terakhir</span>
                              <span className="font-medium">{fmtDate(a.status_updated_at)}</span>
                            </div>
                          )}
                          {a.vacancy?.closes_at && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Tutup Lowongan</span>
                              <span className="font-medium">{fmtDate(a.vacancy.closes_at)}</span>
                            </div>
                          )}
                          {a.interview_date && (
                            <div className="rounded-md bg-background p-2">
                              <div className="mb-1 flex items-center gap-1 font-semibold"><Calendar className="h-3.5 w-3.5 text-primary" />Jadwal Wawancara</div>
                              <p>{fmtDateTime(a.interview_date)}</p>
                              {a.interview_location && <p className="text-muted-foreground">{a.interview_location}</p>}
                              {a.interview_type && <p className="text-muted-foreground">Tipe: {a.interview_type}</p>}
                            </div>
                          )}
                          {a.offer_salary && (
                            <div className="rounded-md bg-background p-2">
                              <div className="mb-1 flex items-center gap-1 font-semibold"><DollarSign className="h-3.5 w-3.5 text-primary" />Penawaran</div>
                              <p>{fmtCurrency(a.offer_salary)}</p>
                              {a.offer_start_date && <p className="text-muted-foreground">Mulai: {fmtDate(a.offer_start_date)}</p>}
                            </div>
                          )}
                        </aside>
                      </div>

                      {(a.admin_notes || a.rejection_reason) && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          {a.admin_notes && (
                            <div className="mb-2 text-xs">
                              <span className="font-semibold text-foreground">Catatan Admin: </span>
                              <span className="text-muted-foreground">{a.admin_notes}</span>
                            </div>
                          )}
                          {a.rejection_reason && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                              <span className="font-semibold">Alasan Penolakan: </span>{a.rejection_reason}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
