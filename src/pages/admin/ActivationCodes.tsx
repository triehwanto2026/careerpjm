import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Search, Pencil } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
});

interface InstrumentOption {
  id: string;
  name: string;
}

interface CodeRow {
  id: string;
  code: string;
  password: string;
  candidate_name: string;
  candidate_email: string;
  position: string;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
  assigned_tests: string[] | null;
}

const ActivationCodes = () => {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [instruments, setInstruments] = useState<InstrumentOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCodes = async () => {
    const { data } = await supabase.from("activation_codes").select("*").order("created_at", { ascending: false });
    setCodes((data as CodeRow[]) || []);
    setLoading(false);
  };

  const loadInstruments = async () => {
    const { data } = await supabase.from("test_instruments").select("id, name").eq("is_active", true);
    setInstruments(data || []);
  };

  useEffect(() => { loadCodes(); loadInstruments(); }, []);

  const filtered = codes.filter(
    (c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.candidate_name.toLowerCase().includes(search.toLowerCase())
  );

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "PSY" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const buildTestCheckboxes = (selected: string[] = []) => {
    return instruments.map(t =>
      `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:hsl(var(--foreground))">
        <input type="checkbox" class="swal-test-cb" value="${t.id}" ${selected.includes(t.id) ? "checked" : ""} style="accent-color:hsl(174,72%,46%);width:16px;height:16px;">
        ${t.name}
      </label>`
    ).join("");
  };

  const getSelectedTests = () => {
    return Array.from(document.querySelectorAll<HTMLInputElement>('.swal-test-cb:checked')).map(cb => cb.value);
  };

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: "Tambah Kode Aktivasi",
      html: `
        <div style="text-align:left;font-size:14px;max-height:65vh;overflow-y:auto;">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Nama Kandidat</label>
          <input id="swal-name" class="swal2-input" placeholder="Nama lengkap" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Email</label>
          <input id="swal-email" class="swal2-input" placeholder="email@example.com" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Posisi</label>
          <input id="swal-position" class="swal2-input" placeholder="Posisi yang dilamar" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Berlaku Hingga</label>
          <input id="swal-expires" type="date" class="swal2-input" style="margin:0 0 16px;width:100%">
          <label style="display:block;margin-bottom:6px;color:hsl(var(--muted-foreground));font-weight:600">Pilih Tes yang Dikerjakan</label>
          <div style="border:1px solid hsl(var(--border));border-radius:8px;padding:10px;max-height:200px;overflow-y:auto;">
            ${buildTestCheckboxes()}
          </div>
        </div>
      `,
      ...SWAL_THEME(),
      confirmButtonText: "Buat Kode",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 520,
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
        const email = (document.getElementById("swal-email") as HTMLInputElement).value.trim();
        const position = (document.getElementById("swal-position") as HTMLInputElement).value.trim();
        const expires = (document.getElementById("swal-expires") as HTMLInputElement).value;
        const tests = getSelectedTests();
        if (!name || !email || !position) { Swal.showValidationMessage("Nama, email, dan posisi wajib diisi"); return; }
        if (tests.length === 0) { Swal.showValidationMessage("Pilih minimal 1 tes"); return; }
        return { name, email, position, expires, tests };
      },
    });

    if (value) {
      const newCode = generateCode();
      const newPassword = "pwd" + Math.random().toString(36).substring(2, 8);
      const { error } = await supabase.from("activation_codes").insert({
        code: newCode,
        password: newPassword,
        candidate_name: value.name,
        candidate_email: value.email,
        position: value.position,
        expires_at: value.expires || null,
        assigned_tests: value.tests,
      } as any);
      if (error) { Swal.fire({ icon: "error", title: "Gagal", text: error.message, ...SWAL_THEME() }); return; }
      await loadCodes();
      Swal.fire({
        icon: "success", title: "Kode Berhasil Dibuat",
        html: `<p style="font-size:14px">Kode: <b>${newCode}</b><br/>Password: <b>${newPassword}</b></p>`,
        ...SWAL_THEME(),
      });
    }
  };

  const handleEdit = async (c: CodeRow) => {
    const { value } = await Swal.fire({
      title: "Edit Kode Aktivasi",
      html: `
        <div style="text-align:left;font-size:14px;max-height:65vh;overflow-y:auto;">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Nama Kandidat</label>
          <input id="swal-name" class="swal2-input" value="${c.candidate_name}" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Email</label>
          <input id="swal-email" class="swal2-input" value="${c.candidate_email}" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Posisi</label>
          <input id="swal-position" class="swal2-input" value="${c.position}" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(var(--muted-foreground));font-weight:600">Berlaku Hingga</label>
          <input id="swal-expires" type="date" class="swal2-input" value="${c.expires_at?.split('T')[0] || ''}" style="margin:0 0 16px;width:100%">
          <label style="display:block;margin-bottom:6px;color:hsl(var(--muted-foreground));font-weight:600">Pilih Tes yang Dikerjakan</label>
          <div style="border:1px solid hsl(var(--border));border-radius:8px;padding:10px;max-height:200px;overflow-y:auto;">
            ${buildTestCheckboxes(c.assigned_tests || [])}
          </div>
        </div>
      `,
      ...SWAL_THEME(),
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 520,
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
        const email = (document.getElementById("swal-email") as HTMLInputElement).value.trim();
        const position = (document.getElementById("swal-position") as HTMLInputElement).value.trim();
        const expires = (document.getElementById("swal-expires") as HTMLInputElement).value;
        const tests = getSelectedTests();
        if (!name || !email || !position) { Swal.showValidationMessage("Semua field wajib diisi"); return; }
        return { name, email, position, expires, tests };
      },
    });

    if (value) {
      await supabase.from("activation_codes").update({
        candidate_name: value.name,
        candidate_email: value.email,
        position: value.position,
        expires_at: value.expires || null,
        assigned_tests: value.tests,
      } as any).eq("id", c.id);
      await loadCodes();
    }
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      icon: "warning", title: "Hapus Kode?", text: "Kode aktivasi ini akan dihapus permanen.",
      showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
      ...SWAL_THEME(), confirmButtonColor: "hsl(0, 72%, 51%)",
    });
    if (r.isConfirmed) {
      await supabase.from("activation_codes").delete().eq("id", id);
      await loadCodes();
    }
  };

  const copyCode = (code: string, password: string) => {
    navigator.clipboard.writeText(`Kode: ${code}\nPassword: ${password}`);
    Swal.fire({ icon: "success", title: "Disalin!", timer: 1000, showConfirmButton: false, ...SWAL_THEME() });
  };

  const getTestNames = (testIds: string[] | null) => {
    if (!testIds || testIds.length === 0) return "-";
    return testIds.map(id => instruments.find(t => t.id === id)?.name || id).join(", ");
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kode Aktivasi</h1>
            <p className="text-sm text-muted-foreground">Kelola kode akses untuk kandidat</p>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
            <Plus className="h-4 w-4" /> Tambah Kode
          </button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari kode atau nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
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
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{c.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{c.candidate_email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {(c.assigned_tests || []).map(tid => {
                        const name = instruments.find(t => t.id === tid)?.name || tid.substring(0, 8);
                        return <span key={tid} className="inline-block rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">{name}</span>;
                      })}
                      {(!c.assigned_tests || c.assigned_tests.length === 0) && <span className="text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.expires_at?.split("T")[0] || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_used ? "bg-muted text-muted-foreground" : "bg-emerald-400/10 text-emerald-400"}`}>
                      {c.is_used ? "Terpakai" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => copyCode(c.code, c.password)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Salin">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivationCodes;
