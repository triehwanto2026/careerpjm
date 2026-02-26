import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialTestInstruments, type TestInstrument } from "@/data/adminStore";

const TestInstruments = () => {
  const [instruments, setInstruments] = useState<TestInstrument[]>(initialTestInstruments);

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: "Tambah Alat Tes",
      html: `
        <div style="text-align:left;font-size:14px;">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Nama (ID)</label>
          <input id="swal-name" class="swal2-input" placeholder="Nama tes" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Name (EN)</label>
          <input id="swal-nameEn" class="swal2-input" placeholder="Test name" style="margin:0 0 12px;width:100%">
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Deskripsi</label>
          <textarea id="swal-desc" class="swal2-textarea" placeholder="Deskripsi tes" style="margin:0 0 12px;width:100%"></textarea>
          <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Kategori</label>
          <input id="swal-cat" class="swal2-input" placeholder="Personality, Cognitive, etc" style="margin:0 0 12px;width:100%">
          <div style="display:flex;gap:12px">
            <div style="flex:1">
              <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Jumlah Soal</label>
              <input id="swal-count" type="number" class="swal2-input" value="10" style="margin:0;width:100%">
            </div>
            <div style="flex:1">
              <label style="display:block;margin-bottom:4px;color:hsl(210,20%,85%)">Durasi (menit)</label>
              <input id="swal-dur" type="number" class="swal2-input" value="30" style="margin:0;width:100%">
            </div>
          </div>
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
        const nameEn = (document.getElementById("swal-nameEn") as HTMLInputElement).value;
        const desc = (document.getElementById("swal-desc") as HTMLTextAreaElement).value;
        const cat = (document.getElementById("swal-cat") as HTMLInputElement).value;
        const count = parseInt((document.getElementById("swal-count") as HTMLInputElement).value);
        const dur = parseInt((document.getElementById("swal-dur") as HTMLInputElement).value);
        if (!name || !cat) { Swal.showValidationMessage("Nama dan kategori wajib diisi"); return; }
        return { name, nameEn, desc, cat, count, dur };
      },
    });

    if (value) {
      setInstruments((prev) => [
        {
          id: Math.random().toString(36).substring(2, 10),
          name: value.name,
          nameEn: value.nameEn || value.name,
          description: value.desc,
          category: value.cat,
          questionCount: value.count || 10,
          durationMinutes: value.dur || 30,
          isActive: true,
        },
        ...prev,
      ]);
    }
  };

  const toggleActive = (id: string) => {
    setInstruments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      icon: "warning",
      title: "Hapus Alat Tes?",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((r) => {
      if (r.isConfirmed) setInstruments((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alat Tes</h1>
            <p className="text-sm text-muted-foreground">Kelola instrumen tes psikologi</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Alat Tes
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instruments.map((t) => (
            <div key={t.id} className="glass rounded-xl p-5 glow-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.nameEn}</p>
                </div>
                <button onClick={() => toggleActive(t.id)} title={t.isActive ? "Nonaktifkan" : "Aktifkan"}>
                  {t.isActive ? (
                    <ToggleRight className="h-6 w-6 text-primary" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-1">{t.category}</span>
                <span>{t.questionCount} soal</span>
                <span>{t.durationMinutes} menit</span>
              </div>
              <div className="flex items-center gap-1 border-t border-border pt-3">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestInstruments;
