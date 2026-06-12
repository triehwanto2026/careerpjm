import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Clock, Send, X, Calendar, DollarSign, Users, FileText } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";
import { isPastDeadline, syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

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
  company_name?: string;
  experience_level?: string;
  education_level?: string;
  skills_required?: string;
  benefits?: string;
  work_schedule?: string;
}

export default function CandidateJobs() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [userId, setUserId] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUserId(session.user.id);
    await syncExpiredRecruitment();
    const { data } = await supabase
      .from("job_vacancies")
      .select("*")
      .eq("status", "active")
      .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false });
    setVacancies((data as any) || []);
    if (session) {
      const { data: apps } = await supabase.from("job_applications").select("vacancy_id").eq("user_id", session.user.id);
      setApplied(new Set((apps || []).map((a: any) => a.vacancy_id)));
      const { data: profileData } = await supabase.from("candidate_profiles").select("is_complete").eq("user_id", session.user.id).maybeSingle();
      setProfileComplete(Boolean(profileData?.is_complete));
    }
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    if (!selected) return;
    if (isPastDeadline(selected.closes_at)) {
      await syncExpiredRecruitment();
      Swal.fire({ icon: "warning", title: "Lowongan Kedaluwarsa", text: "Deadline lowongan ini sudah berakhir." });
      setSelected(null);
      load();
      return;
    }
    if (!profileComplete) {
      Swal.fire({
        icon: "warning",
        title: "Profil Belum Lengkap",
        text: "Lengkapi minimal 50% profil Anda di halaman Profil sebelum mengajukan lamaran.",
      });
      return;
    }
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
                    <button 
                      onClick={() => setSelected(v)} 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80"
                    >
                      <Briefcase className="h-4 w-4" /> Detail
                    </button>
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

      {/* Modal Detail Lowongan */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selected.title}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {selected.company_name && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{selected.company_name}</span>}
                  {selected.department && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{selected.department}</span>}
                  {selected.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selected.location}</span>}
                  {selected.employment_type && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{selected.employment_type.replace("_", " ")}</span>}
                  {selected.experience_level && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{selected.experience_level}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-muted rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Salary Info */}
            {(selected.min_salary || selected.max_salary) && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <DollarSign className="h-5 w-5" />
                  {fmtRp(selected.min_salary)}{selected.max_salary ? ` - ${fmtRp(selected.max_salary)}` : ""}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-6">
                {selected.description && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Deskripsi Pekerjaan</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.description}</p>
                  </div>
                )}

                {selected.responsibilities && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Tanggung Jawab</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.responsibilities}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {selected.requirements && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Persyaratan</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.requirements}</p>
                  </div>
                )}

                {selected.skills_required && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Keahlian yang Dibutuhkan</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.skills_required}</p>
                  </div>
                )}

                {selected.benefits && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Benefit</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selected.benefits}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-3 gap-4 mb-6 bg-muted/30 rounded-xl p-4">
              {selected.education_level && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Pendidikan Minimal</h4>
                  <p className="text-sm font-medium">{selected.education_level}</p>
                </div>
              )}
              {selected.work_schedule && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Jam Kerja</h4>
                  <p className="text-sm font-medium">{selected.work_schedule}</p>
                </div>
              )}
              {selected.closes_at && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Deadline Lamaran</h4>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selected.closes_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Application Form */}
            {!applied.has(selected.id) && (
              <div className="border-t border-border pt-6">
                <h3 className="text-base font-semibold mb-4">Lamar Posisi Ini</h3>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Surat Pengantar (opsional)</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Ceritakan mengapa Anda cocok untuk posisi ini dan pengalaman relevan Anda..."
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              {!profileComplete && !applied.has(selected.id) && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  Profil Anda belum lengkap. Lengkapi minimal 50% profil di halaman Profil agar bisa melamar.
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSelected(null)} 
                  className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
                >
                  Tutup
                </button>
                {!applied.has(selected.id) && (
                  <button 
                    onClick={apply} 
                    disabled={!profileComplete}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition ${profileComplete ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  >
                    <Send className="h-4 w-4" /> Kirim Lamaran
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CandidateLayout>
  );
}
