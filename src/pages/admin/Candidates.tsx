import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Eye, Trash2, Plus, Pencil, Upload, X, Users, UserPlus, MailCheck, CheckCircle, XCircle } from "lucide-react";
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active view from URL path
  const getActiveView = () => {
    if (location.pathname.includes('/candidates/new')) return 'new';
    if (location.pathname.includes('/candidates/verify')) return 'verify';
    return 'list';
  };
  
  const [activeView, setActiveView] = useState<string>(getActiveView());
  
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Email verification states
  const [unverifiedCandidates, setUnverifiedCandidates] = useState<any[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateDocs, setCandidateDocs] = useState<any[]>([]);
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"profile" | "documents" | "tests">("profile");

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

  useEffect(() => { 
    load(); 
    if (activeView === 'verify') {
      loadUnverifiedCandidates();
    }
  }, [activeView]);
  
  const loadUnverifiedCandidates = async () => {
    setLoadingUnverified(true);
    // Fetch candidates with email_confirmed = false or null
    const { data } = await supabase
      .from('candidate_profiles')
      .select('*, user:user_id(email, email_confirmed_at)')
      .is('user.email_confirmed_at', null)
      .order('created_at', { ascending: false });
    setUnverifiedCandidates(data || []);
    setLoadingUnverified(false);
  };
  
  const handleVerifyEmail = async (userId: string) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Verifikasi Email?',
      text: 'Tandai email kandidat sebagai terverifikasi?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Verifikasi',
      cancelButtonText: 'Batal',
      ...SWAL_THEME()
    });
    
    if (result.isConfirmed) {
      // Update user to confirm email
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true
      });
      
      if (error) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.message, ...SWAL_THEME() });
      } else {
        Swal.fire({ icon: 'success', title: 'Terverifikasi!', timer: 1500, showConfirmButton: false, ...SWAL_THEME() });
        loadUnverifiedCandidates();
      }
    }
  };

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

  const handleView = async (c: CandidateRow) => {
    setSelectedCandidate(c);
    setShowDetailModal(true);
    setDetailLoading(true);
    setActiveDetailTab("profile");
    
    // Fetch detailed profile
    const { data: profileData } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("email", c.email)
      .maybeSingle();
    setCandidateProfile(profileData);
    
    // Fetch candidate documents
    const { data: docsData } = await supabase
      .from("candidate_documents")
      .select("*")
      .eq("user_id", profileData?.user_id || "")
      .order("created_at", { ascending: false });
    setCandidateDocs(docsData || []);
    
    // Fetch test results
    const { data: resultsData } = await supabase
      .from("test_results")
      .select("*, test:test_instruments(name, category)")
      .eq("candidate_id", c.id)
      .order("created_at", { ascending: false });
    setCandidateResults(resultsData || []);
    
    setDetailLoading(false);
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({ icon: "warning", title: "Hapus Kandidat?", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal", ...SWAL_THEME(), confirmButtonColor: "hsl(0, 72%, 51%)" });
    if (r.isConfirmed) { await supabase.from("candidates").delete().eq("id", id); await load(); }
  };

  const TabButton = ({ view, label, icon: Icon, path }: { view: string; label: string; icon: any; path: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeView === view
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header with Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Manajemen Kandidat</h1>
              <p className="text-sm text-muted-foreground">Kelola data peserta tes dan verifikasi email</p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <TabButton view="list" label="Daftar Kandidat" icon={Users} path="/admin/candidates" />
            <TabButton view="new" label="Tambah Kandidat" icon={UserPlus} path="/admin/candidates/new" />
            <TabButton view="verify" label="Verifikasi Email" icon={MailCheck} path="/admin/candidates/verify" />
          </div>
        </div>
        
        {/* VIEW: List Candidates */}
        {activeView === 'list' && (
          <div className="space-y-4">
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
        )}
        
        {/* VIEW: Add New Candidate */}
        {activeView === 'new' && (
          <div className="glass rounded-2xl p-6 glow-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Tambah Kandidat Baru</h2>
            <p className="text-sm text-muted-foreground mb-6">Buat akun kandidat baru dengan verifikasi email otomatis.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Lengkap</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Nama sesuai KTP" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">No. Telepon</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Posisi Dilamar</label>
                  <input type="text" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Posisi yang dilamar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Lahir</label>
                  <input type="date" value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  <Plus className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Kandidat'}
                </button>
                <button type="button" onClick={() => navigate('/admin/candidates')} className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* VIEW: Email Verification */}
        {activeView === 'verify' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 glow-border">
              <h2 className="text-lg font-bold text-foreground mb-2">Verifikasi Email Kandidat</h2>
              <p className="text-sm text-muted-foreground">Kelola status verifikasi email kandidat yang belum mengkonfirmasi akun mereka.</p>
            </div>
            
            {loadingUnverified ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : unverifiedCandidates.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                <MailCheck className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p>Semua kandidat sudah terverifikasi!</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden glow-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tanggal Daftar</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {unverifiedCandidates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{c.full_name || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.user?.email || c.email || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleVerifyEmail(c.user_id)} 
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle className="h-3.5 w-3.5" /> Verifikasi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal - kept for inline editing */}
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
                {selectedCandidate.photo_url || candidateProfile?.photo_url ? (
                  <img src={selectedCandidate.photo_url || candidateProfile?.photo_url} alt={selectedCandidate.name} className="h-32 w-32 rounded-full object-cover border-4 border-primary/30 shadow-lg" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary text-5xl font-bold border-4 border-primary/30 shadow-lg">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{selectedCandidate.name}</h3>
                  <p className="text-muted-foreground mb-3">{selectedCandidate.position || candidateProfile?.current_position || "Posisi tidak ditentukan"}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusMap[selectedCandidate.status]?.cls}`}>
                      {statusMap[selectedCandidate.status]?.label || selectedCandidate.status}
                    </span>
                    {candidateProfile?.is_complete && (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-emerald-400/10 text-emerald-400">
                        Profil Lengkap
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setActiveDetailTab("profile")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "profile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profil Lengkap
                </button>
                <button
                  onClick={() => setActiveDetailTab("documents")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "documents" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dokumen ({candidateDocs.length})
                </button>
                <button
                  onClick={() => setActiveDetailTab("tests")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "tests" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hasil Tes ({candidateResults.length})
                </button>
              </div>

              {/* Tab Content */}
              {detailLoading ? (
                <div className="py-8 text-center text-muted-foreground">Memuat data...</div>
              ) : (
                <>
                  {activeDetailTab === "profile" && (
                    <div className="space-y-4">
                      {!candidateProfile ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Kandidat belum melengkapi profil detail
                        </div>
                      ) : (
                        <>
                          {/* Data Pribadi */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">📋 Data Pribadi</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="NIK" value={candidateProfile.nik || "-"} />
                              <InfoRow label="NPWP" value={candidateProfile.npwp || "-"} />
                              <InfoRow label="Email" value={candidateProfile.email || selectedCandidate.email} />
                              <InfoRow label="Telepon" value={candidateProfile.phone || selectedCandidate.phone || "-"} />
                              <InfoRow label="Tempat Lahir" value={candidateProfile.birth_place || "-"} />
                              <InfoRow label="Tanggal Lahir" value={candidateProfile.birth_date || selectedCandidate.birth_date || "-"} />
                              <InfoRow label="Golongan Darah" value={candidateProfile.blood_type || "-"} />
                              <InfoRow label="Jenis Kelamin" value={candidateProfile.gender || selectedCandidate.gender || "-"} />
                              <InfoRow label="Status Pernikahan" value={candidateProfile.marital_status || "-"} />
                              <InfoRow label="Agama" value={candidateProfile.religion || "-"} />
                              <InfoRow label="Kewarganegaraan" value={candidateProfile.nationality || "-"} />
                            </div>
                          </div>

                          {/* Alamat */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">🏠 Alamat</h4>
                            <div className="grid gap-3 text-sm">
                              <InfoRow label="Alamat Lengkap" value={candidateProfile.address || "-"} full />
                              <div className="grid sm:grid-cols-3 gap-3">
                                <InfoRow label="Kota" value={candidateProfile.city || "-"} />
                                <InfoRow label="Provinsi" value={candidateProfile.province || "-"} />
                                <InfoRow label="Kode Pos" value={candidateProfile.postal_code || "-"} />
                              </div>
                            </div>
                          </div>

                          {/* Data Fisik */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">💪 Data Fisik</h4>
                            <div className="grid gap-3 sm:grid-cols-4 text-sm">
                              <InfoRow label="Tinggi" value={candidateProfile.height_cm ? `${candidateProfile.height_cm} cm` : "-"} />
                              <InfoRow label="Berat" value={candidateProfile.weight_kg ? `${candidateProfile.weight_kg} kg` : "-"} />
                              <InfoRow label="Ukuran Baju" value={candidateProfile.shirt_size || "-"} />
                              <InfoRow label="Ukuran Celana" value={candidateProfile.pants_size || "-"} />
                              <InfoRow label="Ukuran Sepatu" value={candidateProfile.shoe_size || "-"} />
                              <InfoRow label="Riwayat Penyakit" value={candidateProfile.medical_history || "-"} full />
                            </div>
                          </div>

                          {/* Pendidikan */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">🎓 Pendidikan</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Jenjang" value={candidateProfile.education_level || "-"} />
                              <InfoRow label="Jurusan" value={candidateProfile.education_major || "-"} />
                              <InfoRow label="Institusi" value={candidateProfile.education_institution || "-"} />
                              <InfoRow label="Tahun Lulus" value={candidateProfile.education_year || "-"} />
                              <InfoRow label="IPK" value={candidateProfile.gpa || "-"} />
                            </div>
                          </div>

                          {/* Data Keluarga */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">👨‍👩‍👧‍👦 Data Keluarga</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Nama Ayah" value={candidateProfile.father_name || "-"} />
                              <InfoRow label="Nama Ibu" value={candidateProfile.mother_name || "-"} />
                              <InfoRow label="Nama Suami/Istri" value={candidateProfile.spouse_name || "-"} />
                              <InfoRow label="Jumlah Anak" value={candidateProfile.number_of_children || "0"} />
                            </div>
                          </div>

                          {/* Kontak Darurat */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">🚨 Kontak Darurat</h4>
                            <div className="grid gap-3 sm:grid-cols-3 text-sm">
                              <InfoRow label="Nama Kontak" value={candidateProfile.emergency_contact_name || "-"} />
                              <InfoRow label="Hubungan" value={candidateProfile.emergency_contact_relation || "-"} />
                              <InfoRow label="No. Telepon" value={candidateProfile.emergency_contact_phone || "-"} />
                            </div>
                          </div>

                          {/* Informasi Lainnya */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">ℹ️ Informasi Lainnya</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Hobi" value={candidateProfile.hobbies || "-"} />
                              <InfoRow label="SIM" value={candidateProfile.vehicle_license || "-"} />
                              <InfoRow label="Memiliki Kendaraan" value={candidateProfile.has_vehicle ? "Ya" : "Tidak"} />
                              <InfoRow label="Sumber Info Lowongan" value={candidateProfile.source_info || "-"} />
                              <InfoRow label="Bersedia Relokasi" value={candidateProfile.willing_relocate ? "Ya" : "Tidak"} />
                              <InfoRow label="Bersedia Lembur" value={candidateProfile.willing_overtime ? "Ya" : "Tidak"} />
                              <InfoRow label="Bersedia Shift" value={candidateProfile.willing_shift ? "Ya" : "Tidak"} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "documents" && (
                    <div className="space-y-3">
                      {candidateDocs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Belum ada dokumen yang diupload
                        </div>
                      ) : (
                        candidateDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              �
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                            </div>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:brightness-110"
                            >
                              Lihat
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeDetailTab === "tests" && (
                    <div className="space-y-3">
                      {candidateResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Belum ada hasil tes
                        </div>
                      ) : (
                        candidateResults.map((result) => (
                          <div key={result.id} className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-foreground">{(result.test as any)?.name || "Tes"}</h4>
                              <span className="text-xs text-muted-foreground">{result.created_at?.split("T")[0]}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{(result.test as any)?.category || "-"}</p>
                            {result.score !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Score:</span>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-semibold">
                                  {result.score}
                                </span>
                              </div>
                            )}
                            {result.interpretation && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">Interpretasi:</span> {result.interpretation}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
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

const InfoRow = ({ label, value, full }: { label: string; value: string; full?: boolean }) => (
  <div className={`${full ? 'sm:col-span-2' : ''} flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3`}>
    <span className="text-xs text-muted-foreground sm:w-32 shrink-0">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
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
