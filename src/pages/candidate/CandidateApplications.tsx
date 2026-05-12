import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, XCircle, Briefcase, Calendar, User, FileCheck, DollarSign, AlertCircle } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";

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
  vacancy?: { title: string; department: string; location: string };
}

const STATUS_FLOW = [
  { key: "submitted", label: "1. Lamaran Diterima", color: "blue", icon: CheckCircle2 },
  { key: "screening", label: "2. Screening CV", color: "cyan", icon: FileCheck },
  { key: "test", label: "3. Tes Psikologi", color: "violet", icon: ClipboardList },
  { key: "hr_interview", label: "4. Wawancara HR", color: "amber", icon: User },
  { key: "user_interview", label: "5. Wawancara User", color: "orange", icon: Briefcase },
  { key: "offered", label: "6. Penawaran", color: "green", icon: DollarSign },
  { key: "accepted", label: "7. Diterima", color: "green", icon: CheckCircle2 },
  { key: "rejected", label: "8. Ditolak", color: "red", icon: XCircle },
];

const colors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  withdrawn: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

const activeColors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  hr_interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  user_interview: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  offered: "bg-green-500/15 text-green-500 border-green-500/30",
  accepted: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  withdrawn: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

export default function CandidateApplications() {
  const [apps, setApps] = useState<AppRow[]>([]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("job_applications").select("*").eq("user_id", session.user.id).order("applied_at", { ascending: false });
    const list = (data as any) || [];
    // Fetch vacancies
    const ids = Array.from(new Set(list.map((a: any) => a.vacancy_id))) as string[];
    if (ids.length > 0) {
      const { data: vac } = await supabase.from("job_vacancies").select("id,title,department,location").in("id", ids);
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

  return (
    <CandidateLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">Lamaran Saya</h1>
            <p className="text-sm text-muted-foreground">{apps.length} lamaran tercatat.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-4 py-6">
          <div className="max-w-6xl mx-auto space-y-4">

        {apps.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-40" />
            Anda belum melamar lowongan apapun.
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((a) => {
              const step = STATUS_FLOW.findIndex((s) => s.key === a.status);
              const isRejected = a.status === "rejected" || a.status === "withdrawn";
              const currentStatus = STATUS_FLOW.find((s) => s.key === a.status);
              
              return (
                <div key={a.id} className="bg-card border border-border rounded-2xl p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {a.vacancy?.title || "—"}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{a.vacancy?.department}</span>
                        <span>•</span>
                        <span>{a.vacancy?.location}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Dilamar: {fmtDate(a.applied_at)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${colors[a.status]}`}>
                        {currentStatus?.label || a.status}
                      </span>
                      {a.status === "submitted" && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDateTime(a.applied_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Progress */}
                  {!isRejected && (
                    <div className="mb-6">
                      <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Progress Lamaran
                      </h4>
                      <div className="relative">
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted"></div>
                        <div className="relative flex items-center justify-between">
                          {STATUS_FLOW.map((s, i) => {
                            const reached = i <= step;
                            const isCurrent = i === step;
                            const Icon = s.icon;
                            
                            return (
                              <div key={s.key} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${reached ? `${activeColors[s.key]} bg-card` : "bg-muted border-muted"}`}>
                                  {reached ? <Icon className="h-5 w-5" /> : i + 1}
                                </div>
                                <div className={`text-xs font-medium text-center whitespace-nowrap max-w-20 ${reached ? "text-primary" : "text-muted-foreground/40"}`}>
                                  {s.label}
                                </div>
                                {isCurrent && (
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                )}
                                                                {reached && s.key === "hr_interview" && a.interview_date && (
                                  <div className="absolute top-12 text-xs text-muted-foreground whitespace-nowrap">
                                    {fmtDateTime(a.interview_date)}
                                    {a.interview_location && ` • ${a.interview_location}`}
                                  </div>
                                )}
                                {reached && s.key === "user_interview" && a.interview_date && (
                                  <div className="absolute top-12 text-xs text-muted-foreground whitespace-nowrap">
                                    {fmtDateTime(a.interview_date)}
                                    {a.interview_location && ` • ${a.interview_location}`}
                                  </div>
                                )}
                                {reached && s.key === "offered" && a.offer_salary && (
                                  <div className="absolute top-12 text-xs text-muted-foreground whitespace-nowrap">
                                    {fmtCurrency(a.offer_salary)}
                                    {a.offer_start_date && ` • Mulai: ${fmtDate(a.offer_start_date)}`}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {a.interview_date && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h5 className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          Jadwal Wawancara
                        </h5>
                        <p className="text-sm">{fmtDateTime(a.interview_date)}</p>
                        {a.interview_location && (
                          <p className="text-sm text-muted-foreground">📍 {a.interview_location}</p>
                        )}
                        {a.interview_type && (
                          <p className="text-sm text-muted-foreground">Tipe: {a.interview_type}</p>
                        )}
                      </div>
                    )}
                    
                    {a.offer_salary && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h5 className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Detail Penawaran
                        </h5>
                        <p className="text-sm">{fmtCurrency(a.offer_salary)}</p>
                        {a.offer_start_date && (
                          <p className="text-sm text-muted-foreground">Mulai: {fmtDate(a.offer_start_date)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {a.admin_notes && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-muted/200">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Catatan Admin
                      </h5>
                      <p className="text-sm">{a.admin_notes}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {a.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Alasan Penolakan
                      </h5>
                      <p className="text-sm text-red-700">{a.rejection_reason}</p>
                    </div>
                  )}
                </div>
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
