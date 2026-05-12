import { useEffect, useState } from "react";
import { Brain, Play, CheckCircle2, Clock, KeyRound } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Code {
  id: string;
  code: string;
  candidate_email: string;
  position: string;
  is_used: boolean;
  status: string;
  expires_at: string | null;
  test_completed_at: string | null;
  assigned_tests: string[] | null;
}

export default function CandidateTests() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<Code[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;
    const { data: c } = await supabase.from("activation_codes").select("*").eq("candidate_email", session.user.email).order("created_at", { ascending: false });
    setCodes((c as any) || []);
    
    // Get candidate profile to get candidate_id
    const { data: profile } = await supabase.from("candidate_profiles").select("*").eq("email", session.user.email).maybeSingle();
    const candidateId = profile?.id;
    
    // Filter test results by candidate_id if available
    let query = supabase.from("test_results").select("*").order("completed_at", { ascending: false });
    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    }
    const { data: r } = await query;
    setResults((r as any) || []);
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <CandidateLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Daftar paket tes yang ditugaskan untuk Anda.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-4 py-6">
          <div className="max-w-6xl mx-auto space-y-4">

        {codes.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>Belum ada paket tes yang ditugaskan untuk akun Anda.</p>
            <p className="text-xs mt-2">Admin akan menugaskan paket tes setelah lamaran Anda diproses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => {
              const done = c.test_completed_at || c.status === "completed";
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              const canStart = !done && !expired;
              return (
                <div
                  key={c.id}
                  className={`bg-card border border-border rounded-2xl p-5 ${canStart ? 'cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors' : ''}`}
                  onClick={() => canStart && navigate("/test", { state: { code: c.code } })}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-bold">{c.code}</span>
                        {done && <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 text-[10px] font-semibold">SELESAI</span>}
                        {!done && expired && <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-semibold">KEDALUWARSA</span>}
                        {!done && !expired && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-[10px] font-semibold">SIAP DIKERJAKAN</span>}
                      </div>
                      <div className="text-sm font-semibold">{c.position || "Tes Psikologi"}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Berlaku hingga: {fmtDate(c.expires_at)}</span>
                        {done && <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" />Selesai: {fmtDate(c.test_completed_at)}</span>}
                      </div>
                    </div>
                    {canStart && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/test", { state: { code: c.code } }); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110"
                      >
                        <Play className="h-4 w-4" /> Mulai Tes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Riwayat Hasil Tes Saya</h2>
            <p className="text-xs text-muted-foreground mb-3">Hasil detail dapat dilihat oleh admin/HR. Anda hanya melihat ringkasan.</p>
            <div className="space-y-2">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border text-sm">
                  <div>
                    <div className="font-semibold">{r.test_name}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(r.completed_at)}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">Telah dinilai</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    </CandidateLayout>
  );
}
