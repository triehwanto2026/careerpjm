import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Search, Pencil, X } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
});

interface InstrumentOption { id: string; name: string; }
interface CandidateOption {
  id: string; name: string; email: string; phone: string; position: string; photo_url: string | null;
}
interface CodeRow {
  id: string; code: string; password: string;
  candidate_name: string; candidate_email: string; position: string;
  is_used: boolean; expires_at: string | null; created_at: string;
  used_at?: string | null;
  assigned_tests: string[] | null;
}

interface FormState {
  id?: string;
  code?: string;
  password?: string;
  candidate_id: string; // empty string = manual
  name: string; email: string; position: string;
  expires_at: string;
  assigned_tests: string[];
  is_used?: boolean;
}

const emptyForm: FormState = { candidate_id: "", name: "", email: "", position: "", expires_at: "", assigned_tests: [] };

const ActivationCodes = () => {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [instruments, setInstruments] = useState<InstrumentOption[]>([]);
  const [candidatesList, setCandidatesList] = useState<CandidateOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTest, setFilterTest] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadAll = async () => {
    const [{ data: c }, { data: i }, { data: cand }] = await Promise.all([
      supabase.from("activation_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("test_instruments").select("id, name").eq("is_active", true).order("name"),
      supabase.from("candidates").select("id, name, email, phone, position, photo_url").order("name"),
    ]);
    setCodes((c as CodeRow[]) || []);
    setInstruments((i as InstrumentOption[]) || []);
    setCandidatesList((cand as CandidateOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = codes.filter(
    (c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.candidate_name.toLowerCase().includes(search.toLowerCase())
  ).filter((c) => {
    if (filterStatus !== "all") {
      if (filterStatus === "used" && !c.is_used) return false;
      if (filterStatus === "unused" && c.is_used) return false;
    }
    if (filterTest !== "all" && c.assigned_tests) {
      if (!c.assigned_tests.includes(filterTest)) return false;
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCodes = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterTest]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "PSY" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const openAdd = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: CodeRow) => {
    const matchedCand = candidatesList.find(x => x.email === c.candidate_email);
    setForm({
      id: c.id, 
      code: c.code,
      password: c.password,
      candidate_id: matchedCand?.id || "",
      name: c.candidate_name, email: c.candidate_email, position: c.position,
      expires_at: c.expires_at?.split("T")[0] || "",
      assigned_tests: c.assigned_tests || [],
      is_used: c.is_used,
    });
    setShowForm(true);
  };

  const onPickCandidate = (id: string) => {
    if (!id) { setForm(f => ({ ...f, candidate_id: "" })); return; }
    const c = candidatesList.find(x => x.id === id);
    if (!c) return;
    setForm(f => ({ ...f, candidate_id: id, name: c.name, email: c.email, position: c.position || f.position }));
  };

  const toggleTest = (id: string) => {
    setForm(f => ({ ...f, assigned_tests: f.assigned_tests.includes(id) ? f.assigned_tests.filter(t => t !== id) : [...f.assigned_tests, id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.position.trim()) {
      Swal.fire({ icon: "warning", title: "Lengkapi data", text: "Nama, email, dan posisi wajib diisi.", ...SWAL_THEME() }); return;
    }
    if (form.assigned_tests.length === 0) {
      Swal.fire({ icon: "warning", title: "Pilih tes", text: "Pilih minimal 1 alat tes.", ...SWAL_THEME() }); return;
    }
    setSaving(true);
    if (form.id) {
      const { error } = await supabase.from("activation_codes").update({
        candidate_name: form.name, candidate_email: form.email, position: form.position,
        expires_at: form.expires_at || null, assigned_tests: form.assigned_tests,
        is_used: form.is_used,
      } as any).eq("id", form.id);
      setSaving(false);
      if (error) { Swal.fire({ icon: "error", title: "Gagal", text: error.message, ...SWAL_THEME() }); return; }
      setShowForm(false); await loadAll();
      Swal.fire({ icon: "success", title: "Berhasil diperbarui", timer: 1400, showConfirmButton: false, ...SWAL_THEME() });
    } else {
      const newCode = generateCode();
      const newPassword = "pwd" + Math.random().toString(36).substring(2, 8);
      const { error } = await supabase.from("activation_codes").insert({
        code: newCode, password: newPassword,
        candidate_name: form.name, candidate_email: form.email, position: form.position,
        expires_at: form.expires_at || null, assigned_tests: form.assigned_tests,
      } as any);
      setSaving(false);
      if (error) { Swal.fire({ icon: "error", title: "Gagal", text: error.message, ...SWAL_THEME() }); return; }
      setShowForm(false); await loadAll();
      Swal.fire({
        icon: "success", title: "Kode Berhasil Dibuat",
        html: `<div style="font-size:14px;line-height:1.8"><p>Kode: <b style="color:hsl(174,72%,46%);font-family:monospace;letter-spacing:2px">${newCode}</b></p><p>Password: <b style="font-family:monospace">${newPassword}</b></p><p style="font-size:12px;color:#888;margin-top:8px">Berikan kode & password ini kepada kandidat.</p></div>`,
        ...SWAL_THEME(),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({ icon: "warning", title: "Hapus Kode?", text: "Kode aktivasi ini akan dihapus permanen.", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal", ...SWAL_THEME(), confirmButtonColor: "hsl(0, 72%, 51%)" });
    if (r.isConfirmed) { await supabase.from("activation_codes").delete().eq("id", id); await loadAll(); }
  };

  const copyCode = (code: string, password: string) => {
    navigator.clipboard.writeText(`Kode: ${code}\nPassword: ${password}`);
    Swal.fire({ icon: "success", title: "Disalin!", timer: 1000, showConfirmButton: false, ...SWAL_THEME() });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kode Aktivasi</h1>
            <p className="text-sm text-muted-foreground">Kelola kode akses untuk kandidat</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
            <Plus className="h-4 w-4" /> Tambah Kode
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Cari kode atau nama..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Status</option>
              <option value="unused">Aktif</option>
              <option value="used">Terpakai</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tes</label>
            <select value={filterTest} onChange={(e) => setFilterTest(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Tes</option>
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kode</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kandidat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Tes Ditugaskan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Berlaku</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : paginatedCodes.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{c.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{c.candidate_email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[220px]">
                    <div className="flex flex-wrap gap-1">
                      {(c.assigned_tests || []).map(tid => {
                        const name = instruments.find(t => t.id === tid)?.name || tid.substring(0, 8);
                        return <span key={tid} className="inline-block rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">{name}</span>;
                      })}
                      {(!c.assigned_tests || c.assigned_tests.length === 0) && <span className="text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
  {c.is_used && c.used_at ? (
    <div>
      <div className="text-destructive font-medium">Terpakai: {c.used_at.split("T")[0]}</div>
      <div className="text-[10px] text-muted-foreground">{c.used_at.split("T")[1]?.split(".")[0] || ""}</div>
    </div>
  ) : (
    c.expires_at?.split("T")[0] || "-"
  )}
</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_used ? "bg-muted text-muted-foreground" : "bg-emerald-400/10 text-emerald-400"}`}>
                      {c.is_used ? "Terpakai" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => copyCode(c.code, c.password)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Salin"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Hapus"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginatedCodes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} kode
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
              <h2 className="text-lg font-bold text-foreground">{form.id ? "Edit Kode Aktivasi" : "Tambah Kode Aktivasi"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {form.id && (
                <>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wider">Informasi Kode Aktivasi</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Kode Aktivasi</label>
                        <div className="flex items-center gap-2">
                          <input type="text" value={form.code} readOnly className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono text-primary" />
                          <button type="button" onClick={() => { form.code && navigator.clipboard.writeText(form.code); Swal.fire({ icon: "success", title: "Disalin!", timer: 1000, showConfirmButton: false, ...SWAL_THEME() }); }} className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Salin">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Password</label>
                        <div className="flex items-center gap-2">
                          <input type="text" value={form.password} readOnly className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono text-primary" />
                          <button type="button" onClick={() => { form.password && navigator.clipboard.writeText(form.password); Swal.fire({ icon: "success", title: "Disalin!", timer: 1000, showConfirmButton: false, ...SWAL_THEME() }); }} className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Salin">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {form.is_used && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!form.is_used}
                          onChange={(e) => setForm({ ...form, is_used: !e.target.checked })}
                          className="h-4 w-4 rounded border-border accent-amber-600"
                        />
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Aktifkan Kembali Kode Ini</span>
                      </label>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">Centang opsi ini untuk mengizinkan kode aktivasi digunakan kembali oleh kandidat yang sama.</p>
                    </div>
                  )}
                </>
              )}

              {!form.id && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider">Pilih dari Data Kandidat</label>
                  <select value={form.candidate_id} onChange={(e) => onPickCandidate(e.target.value)} className={input}>
                    <option value="">— Isi manual —</option>
                    {candidatesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email}){c.position ? ` · ${c.position}` : ""}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Memilih kandidat akan mengisi otomatis nama, email, dan posisi. Anda masih bisa mengubahnya.</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Kandidat *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Nama lengkap" /></Field>
                <Field label="Email *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="email@example.com" /></Field>
                <div className="sm:col-span-2"><Field label="Posisi Dilamar *"><input required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={input} placeholder="Software Engineer" /></Field></div>
                <Field label="Berlaku Hingga"><input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={input} /></Field>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilih Alat Tes ({form.assigned_tests.length} dipilih)</label>
                <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-64 overflow-y-auto space-y-1.5">
                  {instruments.length === 0 ? <p className="text-xs text-muted-foreground italic">Belum ada alat tes aktif.</p> :
                    instruments.map(t => {
                      const checked = form.assigned_tests.includes(t.id);
                      return (
                        <label key={t.id} className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${checked ? "bg-primary/10 border border-primary/30" : "border border-transparent hover:bg-muted"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleTest(t.id)}
                            className="h-4 w-4 rounded border-border accent-primary" />
                          <span className="text-sm text-foreground">{t.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Batal</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 glow-primary">
                {saving ? "Menyimpan..." : (form.id ? "Simpan" : "Buat Kode")}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

const input = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default ActivationCodes;
