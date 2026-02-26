import { useState } from "react";
import { Search, Eye, Trash2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialCandidates, type Candidate } from "@/data/adminStore";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Berlangsung", cls: "bg-amber-400/10 text-amber-400" },
  completed: { label: "Selesai", cls: "bg-emerald-400/10 text-emerald-400" },
  expired: { label: "Kadaluarsa", cls: "bg-destructive/10 text-destructive" },
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [search, setSearch] = useState("");

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase())
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
          <input id="swal-pos" class="swal2-input" placeholder="Posisi yang dilamar" style="margin:0;width:100%">
        </div>
      `,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(174, 72%, 46%)",
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value;
        const email = (document.getElementById("swal-email") as HTMLInputElement).value;
        const phone = (document.getElementById("swal-phone") as HTMLInputElement).value;
        const pos = (document.getElementById("swal-pos") as HTMLInputElement).value;
        if (!name || !email) { Swal.showValidationMessage("Nama dan email wajib diisi"); return; }
        return { name, email, phone, pos };
      },
    });

    if (value) {
      setCandidates((prev) => [
        {
          id: Math.random().toString(36).substring(2, 10),
          name: value.name,
          email: value.email,
          phone: value.phone || "",
          position: value.pos || "",
          activationCodeId: "",
          status: "pending",
          createdAt: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
    }
  };

  const handleView = (c: Candidate) => {
    Swal.fire({
      title: c.name,
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <p><b>Email:</b> ${c.email}</p>
          <p><b>Telepon:</b> ${c.phone || "-"}</p>
          <p><b>Posisi:</b> ${c.position}</p>
          <p><b>Status:</b> ${statusMap[c.status]?.label}</p>
          <p><b>Terdaftar:</b> ${c.createdAt}</p>
        </div>
      `,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(174, 72%, 46%)",
    });
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      icon: "warning",
      title: "Hapus Kandidat?",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((r) => {
      if (r.isConfirmed) setCandidates((prev) => prev.filter((c) => c.id !== id));
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kandidat</h1>
            <p className="text-sm text-muted-foreground">Kelola data peserta tes</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Kandidat
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, email, posisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
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
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[c.status]?.cls}`}>
                      {statusMap[c.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
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

export default Candidates;
