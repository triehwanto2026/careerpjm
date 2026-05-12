import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Clock, Send } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface Vacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  responsibilities: string;
  min_salary: number | null;
  max_salary: number | null;
  closes_at: string | null;
  created_at: string;
}

export default function CandidateJobs() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [userId, setUserId] = useState("");

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUserId(session.user.id);
    const { data } = await supabase.from("job_vacancies").select("*").eq("status", "active").order("created_at", { ascending: false });
    setVacancies((data as any) || []);
    if (session) {
      const { data: apps } = await supabase.from("job_applications").select("vacancy_id").eq("user_id", session.user.id);
      setApplied(new Set((apps || []).map((a: any) => a.vacancy_id)));
    }
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    if (!selected) return;
    const { error } = await supabase.from("job_applications").insert({
      user_id: userId, vacancy_id: selected.id, cover_letter: coverLetter, status: "submitted",
    });
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal melamar", text: error.message });
      return;
    }
    Swal.fire({ icon: "success", title: "Lamaran terkirim!", text: "Lihat di menu Lamaran Saya.", timer: 2000 });
    setSelected(null); setCoverLetter("");
    load();
  };

  const fmtRp = (n: number | null) => n ? `Rp ${n.toLocaleString("id-ID")}` : "";

  return (
    <CandidateLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Lowongan Tersedia</h1>
          <p className="text-sm text-muted-foreground">{vacancies.length} lowongan aktif.</p>
        </div>

        {vacancies.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-40" />
            Belum ada lowongan tersedia saat ini.
          </div>
        ) : (
          <div className="grid gap-4">
            {vacancies.map((v) => (
              <div key={v.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{v.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      {v.department && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{v.department}</span>}
                      {v.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</span>}
                      {v.employment_type && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.employment_type.replace("_", " ")}</span>}
                    </div>
                    {(v.min_salary || v.max_salary) && (
                      <div className="text-sm text-primary font-semibold mt-2">{fmtRp(v.min_salary)}{v.max_salary ? ` - ${fmtRp(v.max_salary)}` : ""}</div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{v.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {applied.has(v.id) ? (
                      <span className="px-3 py-1.5 rounded-full bg-green-500/15 text-green-500 text-xs font-semibold">✓ Sudah Dilamar</span>
                    ) : (
                      <button onClick={() => setSelected(v)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                        <Send className="h-4 w-4" /> Lamar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal lamar */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">{selected.title}</h2>
            <div className="text-xs text-muted-foreground mb-4">{selected.department} • {selected.location}</div>

            {selected.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">Deskripsi</h3>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{selected.description}</p>
              </div>
            )}
            {selected.responsibilities && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">Tanggung Jawab</h3>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{selected.responsibilities}</p>
              </div>
            )}
            {selected.requirements && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">Persyaratan</h3>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{selected.requirements}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-semibold mb-1 block">Surat Pengantar (opsional)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ceritakan mengapa Anda cocok untuk posisi ini..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Batal</button>
              <button onClick={apply} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                <Send className="h-4 w-4" /> Kirim Lamaran
              </button>
            </div>
          </div>
        </div>
      )}
    </CandidateLayout>
  );
}
