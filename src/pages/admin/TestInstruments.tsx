import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, MoreVertical, ListChecks } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const SWAL_THEME = {
  background: "hsl(220, 18%, 10%)",
  color: "hsl(210, 20%, 92%)",
  confirmButtonColor: "hsl(174, 72%, 46%)",
};

const categories = [
  "Personality", "Cognitive", "Work Personality", "Work Aptitude",
  "Intelligence", "Aptitude", "Temperament", "Behavioral",
];

const scoringMethods = [
  { value: "ipsative", label: "Ipsative (Forced-Choice) — DISC, Personality Plus" },
  { value: "correct_only", label: "Correct/Incorrect (IQ, Aptitude) — CFIT, IST" },
  { value: "typological", label: "Typological (Categorical) — MBTI 16 Types" },
  { value: "papi_scales", label: "PAPI 20 Scales (0-9 scoring)" },
  { value: "speed_accuracy", label: "Speed-Accuracy Curve — Kraepelin" },
  { value: "percent_temperament", label: "Percentage per Temperament" },
  { value: "likert_sum", label: "Likert Scale Sum" },
  { value: "weighted", label: "Weighted Score Per Dimension" },
];

const TEMPLATES = [
  { name: "DISC", name_en: "DISC Assessment", category: "Personality", scoring_method: "ipsative",
    target_audience: "Karyawan & Calon Karyawan", norm_reference: "Marston (1928), revisi DISC modern",
    question_count: 28, duration_minutes: 15,
    description: "Mengukur 4 dimensi perilaku: Dominance, Influence, Steadiness, Compliance." },
  { name: "MBTI", name_en: "Myers-Briggs Type Indicator", category: "Personality", scoring_method: "typological",
    target_audience: "Dewasa muda, profesional", norm_reference: "Myers & Briggs (1962)",
    question_count: 20, duration_minutes: 15,
    description: "Mengklasifikasi kepribadian ke 16 tipe berdasar 4 dikotomi: E/I, S/N, T/F, J/P." },
  { name: "CFIT", name_en: "Culture Fair Intelligence Test", category: "Intelligence", scoring_method: "correct_only",
    target_audience: "Usia 8-65 tahun", norm_reference: "Cattell (1949), IPAT",
    question_count: 30, duration_minutes: 30,
    description: "Mengukur intelegensi umum (g-factor) bebas budaya melalui penalaran non-verbal." },
  { name: "IST", name_en: "Intelligence Structure Test", category: "Intelligence", scoring_method: "correct_only",
    target_audience: "Usia 13-60 tahun", norm_reference: "Amthauer (1953), IST 2000-R",
    question_count: 30, duration_minutes: 60,
    description: "Mengukur 9 dimensi kecerdasan: SE, WA, AN, GE, RA, ZR, FA, WU, ME." },
  { name: "PAPIKOSTIK", name_en: "PAPI Kostick Inventory", category: "Work Personality", scoring_method: "papi_scales",
    target_audience: "Pelamar kerja, manajemen", norm_reference: "Dr. Max Kostick (1960)",
    question_count: 30, duration_minutes: 25,
    description: "Mengukur 20 aspek kepribadian kerja melalui 90 pasangan pernyataan ipsative." },
  { name: "Kraepelin", name_en: "Kraepelin Test", category: "Work Aptitude", scoring_method: "speed_accuracy",
    target_audience: "Pekerja klerikal, operator", norm_reference: "Emil Kraepelin (1895)",
    question_count: 30, duration_minutes: 10,
    description: "Mengukur kecepatan, ketelitian, daya tahan, dan stabilitas dalam pekerjaan rutin." },
  { name: "Personality Plus", name_en: "Four Temperaments", category: "Temperament", scoring_method: "percent_temperament",
    target_audience: "Umum, remaja & dewasa", norm_reference: "Florence Littauer (1992)",
    question_count: 40, duration_minutes: 20,
    description: "Mengidentifikasi temperamen dominan: Sanguinis, Koleris, Melankolis, Plegmatis." },
];

interface InstrumentRow {
  id: string; name: string; name_en: string; description: string; category: string;
  question_count: number; duration_minutes: number; scoring_method: string;
  target_audience: string; norm_reference: string; is_active: boolean;
}

const buildFormHtml = (t?: InstrumentRow) => `
  <div style="text-align:left;font-size:13px;max-height:70vh;overflow-y:auto;padding-right:8px;">
    ${!t ? `
    <div style="margin-bottom:14px;padding:10px;background:hsla(174,72%,46%,0.08);border:1px solid hsla(174,72%,46%,0.25);border-radius:8px">
      <label style="display:block;margin-bottom:5px;color:hsl(174,72%,60%);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">⚡ Template Cepat</label>
      <select id="swal-template" class="swal2-select" style="margin:0;width:100%">
        <option value="">— Pilih untuk auto-isi form —</option>
        ${TEMPLATES.map((tpl, i) => `<option value="${i}">${tpl.name} — ${tpl.name_en}</option>`).join("")}
      </select>
    </div>` : ""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Nama Alat Tes (ID) <span style="color:#f87171">*</span></label>
        <input id="swal-name" class="swal2-input" value="${t?.name || ""}" placeholder="cth. Tes DISC" style="margin:0;width:100%">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Name (EN)</label>
        <input id="swal-nameEn" class="swal2-input" value="${t?.name_en || ""}" placeholder="e.g. DISC Assessment" style="margin:0;width:100%">
      </div>
    </div>

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Deskripsi & Tujuan Tes</label>
    <textarea id="swal-desc" class="swal2-textarea" placeholder="Jelaskan apa yang diukur, untuk apa hasilnya, dan instruksi singkat..." style="margin:0 0 10px;width:100%;min-height:70px">${t?.description || ""}</textarea>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Kategori</label>
        <select id="swal-cat" class="swal2-select" style="margin:0;width:100%">
          ${categories.map(c => `<option value="${c}" ${t?.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Metode Scoring</label>
        <select id="swal-scoring" class="swal2-select" style="margin:0;width:100%">
          ${scoringMethods.map(s => `<option value="${s.value}" ${t?.scoring_method === s.value ? "selected" : ""}>${s.label}</option>`).join("")}
        </select>
      </div>
    </div>

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Target Audiens</label>
    <input id="swal-target" class="swal2-input" value="${t?.target_audience || ""}" placeholder="cth. Karyawan, Pelamar kerja, Usia 18-50" style="margin:0 0 10px;width:100%">

    <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Referensi Norma / Author</label>
    <input id="swal-norm" class="swal2-input" value="${t?.norm_reference || ""}" placeholder="cth. Marston (1928), Norma Indonesia HIMPSI" style="margin:0 0 10px;width:100%">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px">
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Jumlah Soal</label>
        <input id="swal-count" type="number" min="1" class="swal2-input" value="${t?.question_count || 10}" style="margin:0;width:100%">
      </div>
      <div>
        <label style="display:block;margin-bottom:3px;color:hsl(210,20%,75%);font-weight:600">Durasi (menit)</label>
        <input id="swal-dur" type="number" min="1" class="swal2-input" value="${t?.duration_minutes || 30}" style="margin:0;width:100%">
      </div>
    </div>

    <div style="margin-top:10px;padding:8px 10px;background:hsla(0,0%,100%,0.04);border-radius:6px;font-size:11px;color:hsl(210,20%,65%);line-height:1.5">
      💡 Setelah disimpan, klik <b>"Kelola Bank Soal"</b> pada kartu untuk menambah soal & opsi jawaban dengan dimensi (D/I/S/C, E/I, dll) dan bobot skor.
    </div>
  </div>
`;

const attachTemplateHandler = () => {
  const sel = document.getElementById("swal-template") as HTMLSelectElement | null;
  if (!sel) return;
  sel.onchange = () => {
    const idx = parseInt(sel.value);
    if (isNaN(idx)) return;
    const tpl = TEMPLATES[idx];
    (document.getElementById("swal-name") as HTMLInputElement).value = tpl.name;
    (document.getElementById("swal-nameEn") as HTMLInputElement).value = tpl.name_en;
    (document.getElementById("swal-desc") as HTMLTextAreaElement).value = tpl.description;
    (document.getElementById("swal-cat") as HTMLSelectElement).value = tpl.category;
    (document.getElementById("swal-scoring") as HTMLSelectElement).value = tpl.scoring_method;
    (document.getElementById("swal-target") as HTMLInputElement).value = tpl.target_audience;
    (document.getElementById("swal-norm") as HTMLInputElement).value = tpl.norm_reference;
    (document.getElementById("swal-count") as HTMLInputElement).value = String(tpl.question_count);
    (document.getElementById("swal-dur") as HTMLInputElement).value = String(tpl.duration_minutes);
  };
};

const extractForm = () => {
  const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
  const name_en = (document.getElementById("swal-nameEn") as HTMLInputElement).value.trim();
  const description = (document.getElementById("swal-desc") as HTMLTextAreaElement).value.trim();
  const category = (document.getElementById("swal-cat") as HTMLSelectElement).value;
  const scoring_method = (document.getElementById("swal-scoring") as HTMLSelectElement).value;
  const target_audience = (document.getElementById("swal-target") as HTMLInputElement).value.trim();
  const norm_reference = (document.getElementById("swal-norm") as HTMLInputElement).value.trim();
  const question_count = parseInt((document.getElementById("swal-count") as HTMLInputElement).value);
  const duration_minutes = parseInt((document.getElementById("swal-dur") as HTMLInputElement).value);
  if (!name) { Swal.showValidationMessage("Nama alat tes wajib diisi"); return; }
  if (!description) { Swal.showValidationMessage("Deskripsi wajib diisi"); return; }
  return { name, name_en: name_en || name, description, category, scoring_method, target_audience, norm_reference, question_count: question_count || 10, duration_minutes: duration_minutes || 30 };
};

const TestInstruments = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("test_instruments").select("*").order("created_at", { ascending: false });
    setInstruments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: "Tambah Alat Tes Psikologi", html: buildFormHtml(), ...SWAL_THEME,
      confirmButtonText: "Simpan", showCancelButton: true, cancelButtonText: "Batal",
      width: 640, preConfirm: extractForm,
      didOpen: () => attachTemplateHandler(),
    });
    if (value) {
      const { data } = await supabase.from("test_instruments").insert(value).select("id").single();
      await load();
      if (data?.id) {
        const r = await Swal.fire({ icon: "success", title: "Tersimpan!",
          text: "Lanjut ke Bank Soal untuk menambah pertanyaan & opsi jawaban?",
          showCancelButton: true, confirmButtonText: "Ya, Kelola Soal", cancelButtonText: "Nanti", ...SWAL_THEME });
        if (r.isConfirmed) navigate(`/admin/test-instruments/${data.id}/questions`);
      }
    }
  };

  const handleEdit = async (t: InstrumentRow) => {
    setOpenMenu(null);
    const { value } = await Swal.fire({
      title: "Edit Alat Tes", html: buildFormHtml(t), ...SWAL_THEME,
      confirmButtonText: "Simpan Perubahan", showCancelButton: true, cancelButtonText: "Batal",
      width: 640, preConfirm: extractForm,
    });
    if (value) {
      await supabase.from("test_instruments").update(value).eq("id", t.id);
      await load();
    }
  };

  const handleDetail = (t: InstrumentRow) => {
    setOpenMenu(null);
    Swal.fire({
      title: t.name,
      html: `<div style="text-align:left;font-size:13px;line-height:1.9">
        <p><b>Nama (EN):</b> ${t.name_en}</p><p><b>Kategori:</b> ${t.category}</p>
        <p><b>Deskripsi:</b></p><p style="color:hsl(210,20%,70%)">${t.description}</p>
        <hr style="border-color:hsl(220,14%,20%);margin:8px 0">
        <p><b>Metode Scoring:</b> ${t.scoring_method}</p><p><b>Target Audiens:</b> ${t.target_audience}</p>
        <p><b>Referensi Norma:</b> ${t.norm_reference}</p>
        <hr style="border-color:hsl(220,14%,20%);margin:8px 0">
        <p><b>Jumlah Soal:</b> ${t.question_count}</p><p><b>Durasi:</b> ${t.duration_minutes} menit</p>
        <p><b>Status:</b> ${t.is_active ? "✅ Aktif" : "⛔ Nonaktif"}</p></div>`,
      ...SWAL_THEME, width: 520,
    });
  };

  const toggleActive = async (t: InstrumentRow) => {
    await supabase.from("test_instruments").update({ is_active: !t.is_active }).eq("id", t.id);
    await load();
  };

  const handleDelete = async (id: string) => {
    setOpenMenu(null);
    const r = await Swal.fire({ icon: "warning", title: "Hapus Alat Tes?", text: "Data yang dihapus tidak dapat dikembalikan.", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal", ...SWAL_THEME, confirmButtonColor: "hsl(0, 72%, 51%)" });
    if (r.isConfirmed) { await supabase.from("test_instruments").delete().eq("id", id); await load(); }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Memuat data...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alat Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Kelola instrumen tes psikologi standar</p>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
            <Plus className="h-4 w-4" /> Tambah Alat Tes
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instruments.map((t) => (
            <div key={t.id} className="glass rounded-xl p-5 glow-border space-y-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{t.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t.name_en}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(t)} title={t.is_active ? "Nonaktifkan" : "Aktifkan"}>
                    {t.is_active ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)} className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === t.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-border bg-card shadow-xl py-1 animate-in fade-in-0 zoom-in-95">
                        <button onClick={() => handleDetail(t)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"><Eye className="h-3.5 w-3.5" /> Detail</button>
                        <button onClick={() => handleEdit(t)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{t.category}</span>
                <span>{t.question_count} soal</span><span>·</span><span>{t.duration_minutes} menit</span>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-0.5">
                <p><span className="text-foreground/70">Scoring:</span> {t.scoring_method}</p>
                <p><span className="text-foreground/70">Audiens:</span> {t.target_audience}</p>
              </div>
              <button
                onClick={() => navigate(`/admin/test-instruments/${t.id}/questions`)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <ListChecks className="h-3.5 w-3.5" /> Kelola Bank Soal
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestInstruments;
