import { useState } from "react";
import { Plus, Trash2, Copy, Search } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialActivationCodes, type ActivationCode } from "@/data/adminStore";

const ActivationCodes = () => {
  const [codes, setCodes] = useState<ActivationCode[]>(initialActivationCodes);
  const [search, setSearch] = useState("");

  const filtered = codes.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.candidateName.toLowerCase().includes(search.toLowerCase())
  );

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "PSY" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Tambah Kode Aktivasi",
      html: `
        <div style="text-align:left;font-size:14px;">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Nama Kandidat</label>
          <input id="swal-name" class="swal2-input" placeholder="Nama lengkap" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Email</label>
          <input id="swal-email" class="swal2-input" placeholder="email@example.com" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Posisi</label>
          <input id="swal-position" class="swal2-input" placeholder="Posisi yang dilamar" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Berlaku Hingga</label>
          <input id="swal-expires" type="date" class="swal2-input" style="margin:0;width:100%">
        </div>
      `,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(174, 72%, 46%)",
      confirmButtonText: "Buat Kode",
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value;
        const email = (document.getElementById("swal-email") as HTMLInputElement).value;
        const position = (document.getElementById("swal-position") as HTMLInputElement).value;
        const expires = (document.getElementById("swal-expires") as HTMLInputElement).value;
        if (!name || !email || !position) {
          Swal.showValidationMessage("Semua field wajib diisi");
          return;
        }
        return { name, email, position, expires };
      },
    });

    if (formValues) {
      const newCode = generateCode();
      const newPassword = "pwd" + Math.random().toString(36).substring(2, 8);
      const entry: ActivationCode = {
        id: Math.random().toString(36).substring(2, 10),
        code: newCode,
        password: newPassword,
        candidateName: formValues.name,
        candidateEmail: formValues.email,
        position: formValues.position,
        isUsed: false,
        createdAt: new Date().toISOString().split("T")[0],
        expiresAt: formValues.expires || "2025-12-31",
      };
      setCodes((prev) => [entry, ...prev]);

      Swal.fire({
        icon: "success",
        title: "Kode Berhasil Dibuat",
        html: `<p style="font-size:14px">Kode: <b>${newCode}</b><br/>Password: <b>${newPassword}</b></p>`,
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
      });
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      icon: "warning",
      title: "Hapus Kode?",
      text: "Kode aktivasi ini akan dihapus permanen.",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((r) => {
      if (r.isConfirmed) setCodes((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const copyCode = (code: string, password: string) => {
    navigator.clipboard.writeText(`Kode: ${code}\nPassword: ${password}`);
    Swal.fire({
      icon: "success",
      title: "Disalin!",
      timer: 1000,
      showConfirmButton: false,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kode Aktivasi</h1>
            <p className="text-sm text-muted-foreground">Kelola kode akses untuk kandidat</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Kode
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kode atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kode</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kandidat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Berlaku</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{c.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{c.candidateEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.expiresAt}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.isUsed
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-400/10 text-emerald-400"
                      }`}
                    >
                      {c.isUsed ? "Terpakai" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => copyCode(c.code, c.password)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Salin"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivationCodes;
