import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, Clock, XCircle, Briefcase } from "lucide-react";
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
  vacancy?: { title: string; department: string; location: string };
}

const STATUS_FLOW = [
  { key: "submitted", label: "Lamaran Diterima", color: "blue" },
  { key: "screening", label: "Screening CV", color: "cyan" },
  { key: "test", label: "Tes Psikologi", color: "violet" },
  { key: "interview", label: "Wawancara", color: "amber" },
  { key: "offered", label: "Penawaran", color: "green" },
  { key: "accepted", label: "Diterima", color: "green" },
];

const colors: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  test: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  interview: "bg-amber-500/15 text-amber-500 border-amber-500/30",
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
    const ids = [...new Set(list.map((a: any) => a.vacancy_id))];
    if (ids.length > 0) {
      const { data: vac } = await supabase.from("job_vacancies").select("id,title,department,location").in("id", ids);
      const map = new Map((vac || []).map((v: any) => [v.id, v]));
      list.forEach((a: any) => { a.vacancy = map.get(a.vacancy_id); });
    }
    setApps(list);
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <CandidateLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Lamaran Saya</h1>
          <p className="text-sm text-muted-foreground">{apps.length} lamaran tercatat.</p>
        </div>

        {apps.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-40" />
            Anda belum melamar lowongan apapun.
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => {
              const step = STATUS_FLOW.findIndex((s) => s.key === a.status);
              const isRejected = a.status === "rejected" || a.status === "withdrawn";
              return (
                <div key={a.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />{a.vacancy?.title || "—"}</h3>
                      <div className="text-xs text-muted-foreground">{a.vacancy?.department} • {a.vacancy?.location}</div>
                      <div className="text-xs text-muted-foreground mt-1">Dilamar: {fmtDate(a.applied_at)}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${colors[a.status]}`}>
                      {a.status === "rejected" ? "Tidak Lolos" : a.status === "withdrawn" ? "Dibatalkan" : STATUS_FLOW.find((s) => s.key === a.status)?.label || a.status}
                    </span>
                  </div>

                  {!isRejected && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {STATUS_FLOW.map((s, i) => {
                        const reached = i <= step;
                        return (
                          <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
                            <div className={`flex flex-col items-center gap-1 ${reached ? "text-primary" : "text-muted-foreground/40"}`}>
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${reached ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                {reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                              </div>
                              <div className="text-[10px] font-medium whitespace-nowrap">{s.label}</div>
                            </div>
                            {i < STATUS_FLOW.length - 1 && <div className={`h-0.5 w-8 ${i < step ? "bg-primary" : "bg-muted"}`} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {a.admin_notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs">
                      <span className="font-semibold">Catatan: </span>{a.admin_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
