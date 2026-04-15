import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, MoreVertical } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialTestInstruments, type TestInstrument } from "@/data/adminStore";

const SWAL_THEME = {
  background: "hsl(220, 18%, 10%)",
  color: "hsl(210, 20%, 92%)",
  confirmButtonColor: "hsl(174, 72%, 46%)",
};

const categories = ["Personality", "Cognitive", "Work Personality", "Work Aptitude"];
const scoringMethods = [
  "Ipsative (forced-choice)",
  "Norm-referenced (IQ scale)",
  "Typological (16 types)",
  "Forced-choice (20 scales, 0-9)",
  "Performance curve analysis",
  "Percentage per temperament",
  "Likert Scale",
  "Other",
];

const buildFormHtml = (t?: TestInstrument) => `
  <div style="text-align:left;font-size:13px;max-height:65vh;overflow-y:auto;padding-right:8px;">
    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Nama Alat Tes (ID)</label>
    <input id="swal-name" class="swal2-input" value="${t?.name || ""}" placeholder="Contoh: Tes DISC" style="margin:0 0 10px;width:100%">

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Name (EN)</label>
    <input id="swal-nameEn" class="swal2-input" value="${t?.nameEn || ""}" placeholder="e.g. DISC Assessment" style="margin:0 0 10px;width:100%">

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Deskripsi</label>
    <textarea id="swal-desc" class="swal2-textarea" placeholder="Deskripsi lengkap alat tes..." style="margin:0 0 10px;width:100%;min-height:60px">${t?.description || ""}</textarea>

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Kategori</label>
    <select id="swal-cat" class="swal2-select" style="margin:0 0 10px;width:100%">
      ${categories.map((c) => `<option value="${c}" ${t?.category === c ? "selected" : ""}>${c}</option>`).join("")}
    </select>

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Metode Scoring</label>
    <select id="swal-scoring" class="swal2-select" style="margin:0 0 10px;width:100%">
      ${scoringMethods.map((s) => `<option value="${s}" ${t?.scoringMethod === s ? "selected" : ""}>${s}</option>`).join("")}
    </select>

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Target Audiens</label>
    <input id="swal-target" class="swal2-input" value="${t?.targetAudience || ""}" placeholder="Dewasa (18+ tahun)" style="margin:0 0 10px;width:100%">

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Referensi / Norma</label>
    <input id="swal-norm" class="swal2-input" value="${t?.normReference || ""}" placeholder="Nama teori / penemu" style="margin:0 0 10px;width:100%">

    <div style="display:flex;gap:12px">
      <div style="flex:1">
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Jumlah Soal</label>
        <input id="swal-count" type="number" class="swal2-input" value="${t?.questionCount || 10}" style="margin:0;width:100%">
      </div>
      <div style="flex:1">
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Durasi (menit)</label>
        <input id="swal-dur" type="number" class="swal2-input" value="${t?.durationMinutes || 30}" style="margin:0;width:100%">
      </div>
    </div>
  </div>
`;

const extractFormValues = () => {
  const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
  const nameEn = (document.getElementById("swal-nameEn") as HTMLInputElement).value.trim();
  const desc = (document.getElementById("swal-desc") as HTMLTextAreaElement).value.trim();
  const cat = (document.getElementById("swal-cat") as HTMLSelectElement).value;
  const scoring = (document.getElementById("swal-scoring") as HTMLSelectElement).value;
  const target = (document.getElementById("swal-target") as HTMLInputElement).value.trim();
  const norm = (document.getElementById("swal-norm") as HTMLInputElement).value.trim();
  const count = parseInt((document.getElementById("swal-count") as HTMLInputElement).value);
  const dur = parseInt((document.getElementById("swal-dur") as HTMLInputElement).value);
  if (!name) { Swal.showValidationMessage("Nama alat tes wajib diisi"); return; }
  if (!cat) { Swal.showValidationMessage("Kategori wajib diisi"); return; }
  return { name, nameEn, desc, cat, scoring, target, norm, count, dur };
};

const TestInstruments = () => {
  const [instruments, setInstruments] = useState<TestInstrument[]>(initialTestInstruments);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: "Tambah Alat Tes",
      html: buildFormHtml(),
      ...SWAL_THEME,
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 560,
      preConfirm: extractFormValues,
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
          scoringMethod: value.scoring,
          targetAudience: value.target,
          normReference: value.norm,
        },
        ...prev,
      ]);
    }
  };

  const handleEdit = async (t: TestInstrument) => {
    setOpenMenu(null);
    const { value } = await Swal.fire({
      title: "Edit Alat Tes",
      html: buildFormHtml(t),
      ...SWAL_THEME,
      confirmButtonText: "Simpan Perubahan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 560,
      preConfirm: extractFormValues,
    });

    if (value) {
      setInstruments((prev) =>
        prev.map((inst) =>
          inst.id === t.id
            ? {
                ...inst,
                name: value.name,
                nameEn: value.nameEn || value.name,
                description: value.desc,
                category: value.cat,
                questionCount: value.count || inst.questionCount,
                durationMinutes: value.dur || inst.durationMinutes,
                scoringMethod: value.scoring,
                targetAudience: value.target,
                normReference: value.norm,
              }
            : inst
        )
      );
    }
  };

  const handleDetail = (t: TestInstrument) => {
    setOpenMenu(null);
    Swal.fire({
      title: t.name,
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.9">
          <p><b>Nama (EN):</b> ${t.nameEn}</p>
          <p><b>Kategori:</b> ${t.category}</p>
          <p><b>Deskripsi:</b></p>
          <p style="color:hsl(210,20%,70%)">${t.description}</p>
          <hr style="border-color:hsl(220,14%,20%);margin:8px 0">
          <p><b>Metode Scoring:</b> ${t.scoringMethod}</p>
          <p><b>Target Audiens:</b> ${t.targetAudience}</p>
          <p><b>Referensi Norma:</b> ${t.normReference}</p>
          <hr style="border-color:hsl(220,14%,20%);margin:8px 0">
          <p><b>Jumlah Soal:</b> ${t.questionCount}</p>
          <p><b>Durasi:</b> ${t.durationMinutes} menit</p>
          <p><b>Status:</b> ${t.isActive ? "✅ Aktif" : "⛔ Nonaktif"}</p>
        </div>
      `,
      ...SWAL_THEME,
      width: 520,
    });
  };

  const toggleActive = (id: string) => {
    setInstruments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleDelete = (id: string) => {
    setOpenMenu(null);
    Swal.fire({
      icon: "warning",
      title: "Hapus Alat Tes?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      ...SWAL_THEME,
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
            <h1 className="text-xl font-bold text-foreground">Alat Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Kelola instrumen tes psikologi standar</p>
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
            <div key={t.id} className="glass rounded-xl p-5 glow-border space-y-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{t.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t.nameEn}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(t.id)} title={t.isActive ? "Nonaktifkan" : "Aktifkan"}>
                    {t.isActive ? (
                      <ToggleRight className="h-6 w-6 text-primary" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === t.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-border bg-card shadow-xl py-1 animate-in fade-in-0 zoom-in-95">
                        <button
                          onClick={() => handleDetail(t)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{t.category}</span>
                <span>{t.questionCount} soal</span>
                <span>·</span>
                <span>{t.durationMinutes} menit</span>
              </div>

              <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-0.5">
                <p><span className="text-foreground/70">Scoring:</span> {t.scoringMethod}</p>
                <p><span className="text-foreground/70">Audiens:</span> {t.targetAudience}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestInstruments;
