import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Clock, Send, X, Calendar, DollarSign, Users, FileText, Search, CheckCircle2 } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";
import { ACTIVE_APPLICATION_STATUSES, isPastDeadline, syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

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
  show_salary?: boolean | null;
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
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

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
      const { data: apps } = await supabase
        .from("job_applications")
        .select("vacancy_id,status")
        .eq("user_id", session.user.id)
        .in("status", ACTIVE_APPLICATION_STATUSES);
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
    await supabase
      .from("job_applications")
      .update({ status: "expired", status_updated_at: new Date().toISOString(), admin_notes: "Lamaran lama ditutup otomatis karena kandidat apply ulang pada lowongan yang diaktifkan kembali." } as any)
      .eq("user_id", userId)
      .eq("vacancy_id", selected.id)
      .in("status", ACTIVE_APPLICATION_STATUSES);

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
  const hasVisibleSalary = (vacancy: Vacancy) => vacancy.show_salary !== false && Boolean(vacancy.min_salary || vacancy.max_salary);
  const departments = Array.from(new Set(vacancies.map((v) => v.department).filter(Boolean))).sort();
  const filteredVacancies = vacancies.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [v.title, v.department, v.location, v.description, v.skills_required].some((value) => String(value || "").toLowerCase().includes(q));
    const matchDepartment = departmentFilter === "all" || v.department === departmentFilter;
    return matchSearch && matchDepartment;
  });
  const groupedVacancies = filteredVacancies.reduce((acc: Record<string, Vacancy[]>, v) => {
    const key = v.department || "Lainnya";
    (acc[key] ||= []).push(v);
    return acc;
  }, {});

  return (
    <CandidateLayout>
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lowongan Tersedia</h1>
              <p className="mt-1 text-sm text-muted-foreground">{vacancies.length} lowongan aktif untuk kandidat.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari posisi, lokasi, skill..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
              </div>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="all">Semua Departemen</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>
          </div>
        </div>

        {vacancies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-40" />
            Belum ada lowongan tersedia saat ini.
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Tidak ada lowongan yang cocok dengan filter Anda.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedVacancies).map(([department, items]) => (
              <section key={department} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{department}</h2>
                    <p className="text-xs text-muted-foreground">{items.length} posisi aktif</p>
                  </div>
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((v) => (
                    <article key={v.id} className="rounded-lg border border-border/70 bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-semibold">{v.title}</h3>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            {v.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</span>}
                            {v.employment_type && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{v.employment_type.replace("_", " ")}</span>}
                          </div>
                        </div>
                        {applied.has(v.id) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-[11px] font-semibold text-green-600"><CheckCircle2 className="h-3 w-3" />Dilamar</span>}
                      </div>
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{v.description || "Klik detail untuk membaca informasi lowongan."}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <span className="text-xs font-semibold text-primary">{hasVisibleSalary(v) ? `${fmtRp(v.min_salary)}${v.max_salary ? ` - ${fmtRp(v.max_salary)}` : ""}` : "Gaji confidential"}</span>
                        <button onClick={() => setSelected(v)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110">
                          {applied.has(v.id) ? "Lihat Detail" : "Detail & Lamar"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
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
            {hasVisibleSalary(selected) && (
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
