import { useEffect, useState } from "react";
import { Search, Eye, Trash2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const SWAL_THEME = {
  background: "hsl(220, 18%, 10%)",
  color: "hsl(210, 20%, 92%)",
  confirmButtonColor: "hsl(174, 72%, 46%)",
};

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Berlangsung", cls: "bg-amber-400/10 text-amber-400" },
  completed: { label: "Selesai", cls: "bg-emerald-400/10 text-emerald-400" },
  expired: { label: "Kadaluarsa", cls: "bg-destructive/10 text-destructive" },
};

interface CandidateRow {
  id: string; name: string; email: string; phone: string; position: string;
  status: string; birth_date: string | null; education: string | null; gender: string | null; created_at: string;
}

const Candidates = () => {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = candidates.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: "Tambah Kandidat",
      html: `
        <div style="text-align:left;font-size:14px;">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Nama</label>
          <input id="swal-name" class="swal2-input" placeholder="Nama lengkap" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Email</label>
          <input id="swal-email" class="swal2-input" placeholder="email@example.com" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Telepon</label>
          <input id="swal-phone" class="swal2-input" placeholder="08xxxxxxxxxx" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Posisi</label>
          <input id="swal-pos" class="swal2-input" placeholder="Posisi yang dilamar" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Tanggal Lahir</label>
          <input id="swal-birth" type="date" class="swal2-input" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Pendidikan</label>
          <input id="swal-edu" class="swal2-input" placeholder="S1 Teknik Informatika" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Gender</label>
          <select id="swal-gender" class="swal2-select" style="margin:0;width:100%">
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
      `,
      ...SWAL_THEME,
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
        const email = (document.getElementById("swal-email") as HTMLInputElement).value.trim();
        const phone = (document.getElementById("swal-phone") as HTMLInputElement).value.trim();
        const position = (document.getElementById("swal-pos") as HTMLInputElement).value.trim();
        const birth_date = (document.getElementById("swal-birth") as HTMLInputElement).value;
        const education = (document.getElementById("swal-edu") as HTMLInputElement).value.trim();
        const gender = (document.getElementById("swal-gender") as HTMLSelectElement).value;
        if (!name || !email) { Swal.showValidationMessage("Nama dan email wajib diisi"); return; }
        return { name, email, phone, position, birth_date: birth_date || null, education: education || null, gender };
      },
    });
    if (value) {
      await supabase.from("candidates").insert(value);
      await load();
    }
  };

  const handleView = (c: CandidateRow) => {
    Swal.fire({
      title: c.name,
      html: `<div style="text-align:left;font-size:14px;line-height:1.8">
        <p><b>Email:</b> ${c.email}</p><p><b>Telepon:</b> ${c.phone || "-"}</p>
        <p><b>Posisi:</b> ${c.position}</p><p><b>Tgl Lahir:</b> ${c.birth_date || "-"}</p>
        <p><b>Pendidikan:</b> ${c.education || "-"}</p><p><b>Gender:</b> ${c.gender || "-"}</p>
        <p><b>Status:</b> ${statusMap[c.status]?.label}</p><p><b>Terdaftar:</b> ${c.created_at?.split("T")[0]}</p></div>`,
      ...SWAL_THEME,
    });
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({ icon: "warning", title: "Hapus Kandidat?", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal", ...SWAL_THEME, confirmButtonColor: "hsl(0, 72%, 51%)" });
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
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
            <Plus className="h-4 w-4" /> Tambah Kandidat
          </button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari nama, email, posisi..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Telepon</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[c.status]?.cls}`}>{statusMap[c.status]?.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Candidates;
