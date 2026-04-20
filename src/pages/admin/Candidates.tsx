import { useEffect, useRef, useState } from "react";
import { Search, Eye, Trash2, Plus, Pencil, Upload, X } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { uploadCandidatePhoto } from "@/lib/photoUpload";

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
});

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Berlangsung", cls: "bg-amber-400/10 text-amber-400" },
  completed: { label: "Selesai", cls: "bg-emerald-400/10 text-emerald-400" },
  expired: { label: "Kadaluarsa", cls: "bg-destructive/10 text-destructive" },
};

interface CandidateRow {
  id: string; name: string; email: string; phone: string; position: string;
  status: string; birth_date: string | null; education: string | null; gender: string | null;
  photo_url: string | null; created_at: string;
}

interface FormState {
  id?: string;
  name: string; email: string; phone: string; position: string;
  birth_date: string; education: string; gender: string;
  photo_url: string | null;
}

const emptyForm: FormState = { name: "", email: "", phone: "", position: "", birth_date: "", education: "", gender: "Laki-laki", photo_url: null };

const Candidates = () => {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const load = async () => {
    const { data } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
    setCandidates((data as CandidateRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = candidates.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase())
  ).filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterGender !== "all" && c.gender !== filterGender) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterGender]);

  const openAdd = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: CandidateRow) => {
    setForm({
      id: c.id, name: c.name, email: c.email, phone: c.phone || "", position: c.position || "",
      birth_date: c.birth_date || "", education: c.education || "", gender: c.gender || "Laki-laki", photo_url: c.photo_url,
    });
    setShowForm(true);
  };

  const onPickFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File terlalu besar", text: "Maksimal 5 MB", ...SWAL_THEME() });
      return;
    }
    setUploading(true);
    const url = await uploadCandidatePhoto(file, "cand");
    setUploading(false);
    if (url) setForm(f => ({ ...f, photo_url: url }));
    else Swal.fire({ icon: "error", title: "Gagal upload foto", ...SWAL_THEME() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      Swal.fire({ icon: "warning", title: "Lengkapi data", text: "Nama dan email wajib diisi.", ...SWAL_THEME() });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      position: form.position.trim(), birth_date: form.birth_date || null,
      education: form.education.trim() || null, gender: form.gender, photo_url: form.photo_url,
    };
    const { error } = form.id
      ? await supabase.from("candidates").update(payload as any).eq("id", form.id)
      : await supabase.from("candidates").insert(payload as any);
    setSaving(false);
    if (error) { Swal.fire({ icon: "error", title: "Gagal menyimpan", text: error.message, ...SWAL_THEME() }); return; }
    setShowForm(false); setForm(emptyForm); await load();
    Swal.fire({ icon: "success", title: form.id ? "Berhasil diperbarui" : "Kandidat ditambahkan", timer: 1400, showConfirmButton: false, ...SWAL_THEME() });
  };

  const handleView = (c: CandidateRow) => {
    setSelectedCandidate(c);
    setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({ icon: "warning", title: "Hapus Kandidat?", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal", ...SWAL_THEME(), confirmButtonColor: "hsl(0, 72%, 51%)" });
    if (r.isConfirmed) { await supabase.from("candidates").delete().eq("id", id); await load(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kandidat</h1>
            <p className="text-sm text-muted-foreground">Kelola data peserta tes</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
            <Plus className="h-4 w-4" /> Tambah Kandidat
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Cari nama, email, posisi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="in_progress">Berlangsung</option>
              <option value="completed">Selesai</option>
              <option value="expired">Kadaluarsa</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Per Halaman</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kandidat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Telepon</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : paginatedCandidates.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">{c.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position || "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.phone || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[c.status]?.cls}`}>{statusMap[c.status]?.label || c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginatedCandidates.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} kandidat
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}
            className="glass relative w-full max-w-2xl rounded-2xl glow-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">{form.id ? "Edit Kandidat" : "Tambah Kandidat"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5">
                {form.photo_url ? (
                  <div className="relative">
                    <img src={form.photo_url} alt="Foto" className="h-28 w-28 rounded-full object-cover border-2 border-primary" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: null }))} className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-muted-foreground text-3xl font-bold">{form.name.charAt(0).toUpperCase() || "?"}</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Mengunggah..." : (form.photo_url ? "Ganti Foto" : "Upload Foto")}
                </button>
                <p className="text-[11px] text-muted-foreground">JPG/PNG, maks 5 MB. Foto digunakan di laporan tes.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Lengkap *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="John Doe" /></Field>
                <Field label="Email *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="email@example.com" /></Field>
                <Field label="Telepon"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} placeholder="08xxxxxxxxxx" /></Field>
                <Field label="Posisi Dilamar"><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={input} placeholder="Software Engineer" /></Field>
                <Field label="Tanggal Lahir"><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className={input} /></Field>
                <Field label="Jenis Kelamin">
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={input}>
                    <option>Laki-laki</option><option>Perempuan</option>
                  </select>
                </Field>
                <div className="sm:col-span-2"><Field label="Pendidikan"><input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={input} placeholder="S1 Teknik Informatika - Universitas Indonesia" /></Field></div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Batal</button>
              <button type="submit" disabled={saving || uploading} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 glow-primary">
                {saving ? "Menyimpan..." : (form.id ? "Simpan Perubahan" : "Tambahkan")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-2xl rounded-2xl glow-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Detail Kandidat</h2>
              <button type="button" onClick={() => setShowDetailModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
                {selectedCandidate.photo_url ? (
                  <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="h-32 w-32 rounded-full object-cover border-4 border-primary/30 shadow-lg" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary text-5xl font-bold border-4 border-primary/30 shadow-lg">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{selectedCandidate.name}</h3>
                  <p className="text-muted-foreground mb-3">{selectedCandidate.position || "Posisi tidak ditentukan"}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusMap[selectedCandidate.status]?.cls}`}>
                      {statusMap[selectedCandidate.status]?.label || selectedCandidate.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Email" value={selectedCandidate.email} icon="📧" />
                <InfoCard label="Telepon" value={selectedCandidate.phone || "-"} icon="📱" />
                <InfoCard label="Posisi Dilamar" value={selectedCandidate.position || "-"} icon="💼" />
                <InfoCard label="Gender" value={selectedCandidate.gender || "-"} icon="👤" />
                <InfoCard label="Tanggal Lahir" value={selectedCandidate.birth_date || "-"} icon="🎂" />
                <InfoCard label="Pendidikan" value={selectedCandidate.education || "-"} icon="🎓" />
                <InfoCard label="Status" value={statusMap[selectedCandidate.status]?.label || selectedCandidate.status} icon="📊" />
                <InfoCard label="Terdaftar Sejak" value={selectedCandidate.created_at?.split("T")[0] || "-"} icon="📅" />
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3">
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const input = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default Candidates;
