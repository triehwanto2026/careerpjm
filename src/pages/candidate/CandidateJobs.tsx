import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Clock, Send, X, Calendar, DollarSign, Users, FileText, Search, CheckCircle2, Check } from "lucide-react";
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

    const applicationPayload = {
      user_id: userId,
      vacancy_id: selected.id,
      cover_letter: coverLetter,
      status: "submitted",
      position_snapshot: selected.title,
      department_snapshot: selected.department,
      location_snapshot: selected.location,
      vacancy_status_snapshot: "active",
    };
    const insertApplication = async (payload: Record<string, any>) => {
      const { error: insertError } = await supabase.from("job_applications").insert(payload as any);
      return insertError;
    };

    const updateExistingApplication = async (payload: Record<string, any>) => {
      const updatePayload = {
        ...payload,
        applied_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_notes: null,
      };
      const { error: updateError } = await supabase
        .from("job_applications")
        .update(updatePayload as any)
        .eq("user_id", userId)
        .eq("vacancy_id", selected.id);
      return updateError;
    };

    const { user_id: _snapshotUserId, vacancy_id: _snapshotVacancyId, ...snapshotUpdatePayload } = applicationPayload;
    const basePayload = {
      user_id: userId,
      vacancy_id: selected.id,
      cover_letter: coverLetter,
      status: "submitted",
    };
    const { user_id: _baseUserId, vacancy_id: _baseVacancyId, ...baseUpdatePayload } = basePayload;

    const error = await insertApplication(applicationPayload);
    if (error) {
      const isMissingSnapshotColumn = /schema cache|column|position_snapshot|department_snapshot|location_snapshot|vacancy_status_snapshot/i.test(error.message || "");
      const isDuplicateApplication = /duplicate key|job_applications_user_id_vacancy_id_key|23505/i.test(error.message || "");

      if (isDuplicateApplication) {
        const updateError = await updateExistingApplication(snapshotUpdatePayload);
        if (!updateError) {
          Swal.fire({ icon: "success", title: "Lamaran diperbarui!", text: "Lamaran lama Anda untuk lowongan ini sudah diaktifkan kembali.", timer: 2200 });
          setSelected(null); setCoverLetter("");
          load();
          return;
        }

        const updateNeedsFallback = /schema cache|column|position_snapshot|department_snapshot|location_snapshot|vacancy_status_snapshot/i.test(updateError.message || "");
        const fallbackUpdateError = updateNeedsFallback ? await updateExistingApplication(baseUpdatePayload) : updateError;
        if (!fallbackUpdateError) {
          Swal.fire({ icon: "success", title: "Lamaran diperbarui!", text: "Lamaran lama Anda untuk lowongan ini sudah diaktifkan kembali.", timer: 2200 });
          setSelected(null); setCoverLetter("");
          load();
          return;
        }

        Swal.fire({ icon: "error", title: "Gagal melamar", text: fallbackUpdateError.message });
        return;
      }

      if (!isMissingSnapshotColumn) {
        Swal.fire({ icon: "error", title: "Gagal melamar", text: error.message });
        return;
      }

      const fallbackError = await insertApplication(basePayload);
      if (fallbackError) {
        const fallbackDuplicate = /duplicate key|job_applications_user_id_vacancy_id_key|23505/i.test(fallbackError.message || "");
        if (fallbackDuplicate) {
          const fallbackUpdateError = await updateExistingApplication(baseUpdatePayload);
          if (!fallbackUpdateError) {
            Swal.fire({ icon: "success", title: "Lamaran diperbarui!", text: "Lamaran lama Anda untuk lowongan ini sudah diaktifkan kembali.", timer: 2200 });
            setSelected(null); setCoverLetter("");
            load();
            return;
          }
        }
        Swal.fire({ icon: "error", title: "Gagal melamar", text: fallbackError.message });
        return;
      }
      console.warn("Kolom snapshot lamaran belum tersedia di database. Lamaran disimpan tanpa snapshot posisi.", error.message);
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
      <div className="mx-auto max-w-[96rem] space-y-5 p-4 md:p-6">
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
          <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b border-border shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-success/10 text-success">
                        Aktif
                      </span>
                      {hasVisibleSalary(selected) && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                          Gaji Terlihat
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{selected.title}</h2>
                    <p className="text-sm text-muted-foreground">{selected.department}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 hover:bg-muted rounded-lg transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Quick Info */}
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                  {selected.company_name && <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><Building2 className="h-3.5 w-3.5" />{selected.company_name}</span>}
                  {selected.location && <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><MapPin className="h-3.5 w-3.5" />{selected.location}</span>}
                  {selected.employment_type && <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><Clock className="h-3.5 w-3.5" />{selected.employment_type.replace("_", " ")}</span>}
                  {selected.experience_level && <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><Users className="h-3.5 w-3.5" />{selected.experience_level}</span>}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Salary Section */}
              {hasVisibleSalary(selected) && (
                <div className="rounded-xl border border-border bg-gradient-to-br from-success/5 to-background p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Rentang Gaji</h3>
                      <p className="text-xs text-muted-foreground">Per bulan</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-success">{fmtRp(selected.min_salary)}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-2xl font-bold text-success">{fmtRp(selected.max_salary)}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Deskripsi Pekerjaan</h3>
                  </div>
                  <div className="space-y-2">
                    {selected.description.split('\n').filter(Boolean).map((desc: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="leading-relaxed">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selected.requirements && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Persyaratan</h3>
                  </div>
                  <div className="space-y-2">
                    {selected.requirements.split('\n').filter(Boolean).map((req: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="leading-relaxed">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {selected.skills_required && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Keahlian yang Dibutuhkan</h3>
                  </div>
                  <div className="space-y-2">
                    {selected.skills_required.split('\n').filter(Boolean).map((skill: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="leading-relaxed">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selected.benefits && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <h3 className="font-semibold text-foreground">Benefit</h3>
                  </div>
                  <div className="space-y-2">
                    {selected.benefits.split('\n').filter(Boolean).map((benefit: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 mt-0.5">
                          <Check className="h-3 w-3 text-success" />
                        </div>
                        <span className="leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid md:grid-cols-3 gap-3">
                {selected.education_level && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Pendidikan Minimal</h4>
                    <p className="text-sm font-medium">{selected.education_level}</p>
                  </div>
                )}
                {selected.work_schedule && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Jam Kerja</h4>
                    <p className="text-sm font-medium">{selected.work_schedule}</p>
                  </div>
                )}
                {selected.closes_at && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Deadline Lamaran</h4>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selected.closes_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6 bg-background shrink-0 space-y-4">
              {!applied.has(selected.id) && (
                <>
                  {!profileComplete && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                      Profil Anda belum lengkap. Lengkapi minimal 50% profil di halaman Profil agar bisa melamar.
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Surat Pengantar (opsional)</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Ceritakan mengapa Anda cocok untuk posisi ini dan pengalaman relevan Anda..."
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSelected(null)} 
                  className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition min-w-[100px]"
                >
                  Tutup
                </button>
                {!applied.has(selected.id) && (
                  <button 
                    onClick={apply} 
                    disabled={!profileComplete}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition min-w-[140px] ${profileComplete ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
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
