import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const SWAL_THEME = {
  background: "hsl(220, 18%, 10%)",
  color: "hsl(210, 20%, 92%)",
  confirmButtonColor: "hsl(174, 72%, 46%)",
};

interface Instrument {
  id: string;
  name: string;
  scoring_method: string;
  category: string;
}

interface Interpretation {
  id: string;
  instrument_id: string;
  interpretation_key: string;
  category: string | null;
  min_value: number | null;
  max_value: number | null;
  interpretation_text: string;
  interpretation_text_en: string | null;
  _isNew?: boolean;
  _dirty?: boolean;
}

const IST_INTERPRETATION_SEEDS = [
  { key: "SE - Sentence Completion", label: "Rendah", min: 0, max: 8, text: "Kemampuan memahami dan melengkapi struktur bahasa masih terbatas. Kandidat membutuhkan instruksi yang jelas, sederhana, dan contoh konkret." },
  { key: "SE - Sentence Completion", label: "Sedang", min: 9, max: 14, text: "Pemahaman bahasa dan konsep verbal berada pada taraf cukup. Kandidat mampu menangkap makna umum, namun kualitas penalaran verbal perlu dilihat bersama subtes lain." },
  { key: "SE - Sentence Completion", label: "Tinggi", min: 15, max: 20, text: "Pemahaman bahasa dan konsep verbal baik. Kandidat cepat menangkap makna, konteks, dan kelengkapan ide dalam informasi verbal." },
  { key: "WA - Word Association", label: "Rendah", min: 0, max: 8, text: "Kemampuan asosiasi kata dan abstraksi verbal masih perlu dukungan. Kandidat mungkin lebih nyaman dengan informasi yang eksplisit." },
  { key: "WA - Word Association", label: "Sedang", min: 9, max: 14, text: "Kemampuan menemukan hubungan antar kata berada pada taraf cukup. Kandidat mampu membuat asosiasi umum dengan akurasi moderat." },
  { key: "WA - Word Association", label: "Tinggi", min: 15, max: 20, text: "Kemampuan asosiasi verbal baik. Kandidat mampu mengenali hubungan konseptual dan kategori makna secara cepat." },
  { key: "AN - Analogy", label: "Rendah", min: 0, max: 8, text: "Penalaran analogis masih terbatas. Kandidat membutuhkan waktu lebih untuk melihat pola hubungan dan perbandingan logis." },
  { key: "AN - Analogy", label: "Sedang", min: 9, max: 14, text: "Penalaran analogis berada pada taraf cukup. Kandidat mampu menangkap pola relasi umum, tetapi belum selalu konsisten pada relasi yang lebih abstrak." },
  { key: "AN - Analogy", label: "Tinggi", min: 15, max: 20, text: "Penalaran analogis kuat. Kandidat mampu memahami hubungan logis, perbandingan, dan transfer pola dengan baik." },
  { key: "GE - Generalization", label: "Rendah", min: 0, max: 13, text: "Kemampuan generalisasi dan pembentukan konsep masih rendah. Kandidat cenderung melihat informasi secara konkret atau parsial." },
  { key: "GE - Generalization", label: "Sedang", min: 14, max: 23, text: "Kemampuan generalisasi cukup. Kandidat mampu merangkum kesamaan konsep, meski kualitas abstraksi masih bervariasi." },
  { key: "GE - Generalization", label: "Tinggi", min: 24, max: 32, text: "Kemampuan generalisasi baik. Kandidat mampu menemukan konsep umum, kategori, dan inti hubungan dari dua stimulus." },
  { key: "RA - Arithmetic", label: "Rendah", min: 0, max: 8, text: "Kemampuan berhitung praktis dan pemecahan masalah numerik masih perlu penguatan." },
  { key: "RA - Arithmetic", label: "Sedang", min: 9, max: 14, text: "Kemampuan numerik praktis cukup. Kandidat mampu menyelesaikan persoalan hitung dasar dengan ketepatan moderat." },
  { key: "RA - Arithmetic", label: "Tinggi", min: 15, max: 20, text: "Kemampuan numerik praktis baik. Kandidat mampu menangani perhitungan dan soal cerita secara efektif." },
  { key: "ZR - Number Series", label: "Rendah", min: 0, max: 8, text: "Penalaran pola angka dan deret masih rendah. Kandidat mungkin membutuhkan contoh pola yang eksplisit." },
  { key: "ZR - Number Series", label: "Sedang", min: 9, max: 14, text: "Penalaran pola angka cukup. Kandidat mampu mengenali sebagian pola numerik dengan konsistensi moderat." },
  { key: "ZR - Number Series", label: "Tinggi", min: 15, max: 20, text: "Penalaran induktif numerik baik. Kandidat cepat mengenali pola, perubahan, dan aturan dalam deret angka." },
  { key: "FA - Figure Assembly", label: "Rendah", min: 0, max: 8, text: "Analisis bentuk dan konstruksi figural masih perlu dukungan. Kandidat dapat kesulitan memecah dan menyusun pola visual." },
  { key: "FA - Figure Assembly", label: "Sedang", min: 9, max: 14, text: "Kemampuan figural cukup. Kandidat mampu memahami pola visual sederhana hingga sedang." },
  { key: "FA - Figure Assembly", label: "Tinggi", min: 15, max: 20, text: "Kemampuan figural baik. Kandidat mampu menganalisis bentuk, struktur, dan bagian visual secara efektif." },
  { key: "WU - Cube Rotation", label: "Rendah", min: 0, max: 8, text: "Daya bayang ruang masih rendah. Kandidat mungkin membutuhkan bantuan visual konkret untuk tugas spasial." },
  { key: "WU - Cube Rotation", label: "Sedang", min: 9, max: 14, text: "Daya bayang ruang cukup. Kandidat mampu menangani rotasi mental pada pola sederhana hingga sedang." },
  { key: "WU - Cube Rotation", label: "Tinggi", min: 15, max: 20, text: "Daya bayang ruang baik. Kandidat mampu memutar, membandingkan, dan memanipulasi objek secara mental." },
  { key: "ME - Memory", label: "Rendah", min: 0, max: 8, text: "Daya ingat jangka pendek terhadap informasi terstruktur masih perlu diperhatikan." },
  { key: "ME - Memory", label: "Sedang", min: 9, max: 14, text: "Daya ingat berada pada taraf cukup. Kandidat mampu menyimpan informasi, namun akurasi dapat menurun pada beban tinggi." },
  { key: "ME - Memory", label: "Tinggi", min: 15, max: 20, text: "Daya ingat baik. Kandidat mampu mempertahankan dan mengambil kembali informasi dengan efektif." },
];

const InterpretationManager = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedId, setSelectedId] = useState<string>(params.get("instrument") || "");
  const [items, setItems] = useState<Interpretation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("test_instruments")
        .select("id,name,scoring_method,category")
        .order("name");
      setInstruments((data || []) as Instrument[]);
      if (!selectedId && data && data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setParams({ instrument: selectedId });
    (async () => {
      const { data } = await supabase
        .from("test_interpretations")
        .select("*")
        .eq("instrument_id", selectedId)
        .order("interpretation_key")
        .order("min_value");
      setItems((data || []) as Interpretation[]);
    })();
  }, [selectedId]);

  const grouped = useMemo(() => {
    const g: Record<string, Interpretation[]> = {};
    items.forEach((it) => {
      const k = it.interpretation_key || "—";
      (g[k] ||= []).push(it);
    });
    return g;
  }, [items]);

  const updateItem = (id: string, patch: Partial<Interpretation>) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch, _dirty: true } : i)));

  const selected = instruments.find((i) => i.id === selectedId);

  const addRow = (key: string) => {
    setItems((s) => [
      ...s,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        instrument_id: selectedId,
        interpretation_key: key,
        category: "",
        min_value: 0,
        max_value: 0,
        interpretation_text: "",
        interpretation_text_en: "",
        _isNew: true,
        _dirty: true,
      },
    ]);
  };

  const addNewKey = async () => {
    const r = await Swal.fire({
      title: "Tambah Dimensi/Kunci Baru",
      input: "text",
      inputLabel: "Nama kunci (mis. iq, speed, accuracy, D, I, S, C, type)",
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      ...SWAL_THEME,
    });
    if (r.isConfirmed && r.value) addRow(String(r.value).trim());
  };

  const isIstSelected = selected?.name.toUpperCase().includes("IST") || items.some((item) => item.interpretation_key.startsWith("SE -"));

  const seedIstInterpretations = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const existing = new Set(items.map((item) => `${item.interpretation_key}|${item.category}|${item.min_value}|${item.max_value}`));
      const rows = IST_INTERPRETATION_SEEDS
        .filter((seed) => !existing.has(`${seed.key}|${seed.label}|${seed.min}|${seed.max}`))
        .map((seed) => ({
          instrument_id: selectedId,
          interpretation_key: seed.key,
          category: seed.label,
          min_value: seed.min,
          max_value: seed.max,
          interpretation_text: seed.text,
          interpretation_text_en: null,
        }));

      if (rows.length > 0) await supabase.from("test_interpretations").insert(rows);
      const { data } = await supabase
        .from("test_interpretations")
        .select("*")
        .eq("instrument_id", selectedId)
        .order("interpretation_key")
        .order("min_value");
      setItems((data || []) as Interpretation[]);
      Swal.fire({ icon: "success", title: "Interpretasi IST dilengkapi", text: `${rows.length} baris baru ditambahkan.`, timer: 1500, showConfirmButton: false, ...SWAL_THEME });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal melengkapi IST", text: error?.message || "Terjadi kesalahan.", ...SWAL_THEME });
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (it._isNew) {
      setItems((s) => s.filter((i) => i.id !== id));
      return;
    }
    const r = await Swal.fire({
      icon: "warning",
      title: "Hapus interpretasi ini?",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      ...SWAL_THEME,
      confirmButtonColor: "hsl(0,72%,51%)",
    });
    if (r.isConfirmed) {
      await supabase.from("test_interpretations").delete().eq("id", id);
      setItems((s) => s.filter((i) => i.id !== id));
    }
  };

  const saveAll = async () => {
    setSaving(true);
    const dirty = items.filter((i) => i._dirty);
    for (const it of dirty) {
      const payload = {
        instrument_id: selectedId,
        interpretation_key: it.interpretation_key,
        category: it.category || null,
        min_value: it.min_value,
        max_value: it.max_value,
        interpretation_text: it.interpretation_text,
        interpretation_text_en: it.interpretation_text_en || null,
      };
      if (it._isNew) {
        await supabase.from("test_interpretations").insert(payload);
      } else {
        await supabase.from("test_interpretations").update(payload).eq("id", it.id);
      }
    }
    setSaving(false);
    // reload
    const { data } = await supabase
      .from("test_interpretations")
      .select("*")
      .eq("instrument_id", selectedId)
      .order("interpretation_key")
      .order("min_value");
    setItems((data || []) as Interpretation[]);
    Swal.fire({ icon: "success", title: "Tersimpan", timer: 1200, showConfirmButton: false, ...SWAL_THEME });
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat data…</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/test-instruments")}
            className="rounded-lg border border-border bg-card p-2 text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Manajer Interpretasi</h1>
            <p className="text-sm text-muted-foreground">
              Kelola semua kemungkinan interpretasi tiap dimensi alat tes.
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving || items.every((i) => !i._dirty)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan…" : "Simpan Semua"}
          </button>
        </div>

        <div className="glass rounded-xl p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pilih Alat Tes
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.scoring_method}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Kategori: <span className="text-foreground">{selected.category}</span> · Metode:{" "}
              <span className="text-foreground">{selected.scoring_method}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Total interpretasi: <span className="text-foreground font-semibold">{items.length}</span>
          </p>
          <button
            onClick={addNewKey}
            className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Dimensi
          </button>
          {isIstSelected && (
            <button
              onClick={seedIstInterpretations}
              disabled={saving}
              className="ml-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50"
            >
              Lengkapi Analisa IST
            </button>
          )}
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
            Belum ada interpretasi untuk alat tes ini. Klik "Tambah Dimensi" untuk mulai.
          </div>
        )}

        {Object.entries(grouped).map(([key, rows]) => (
          <div key={key} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-primary">
                Dimensi: <span className="text-foreground">{key}</span>{" "}
                <span className="text-xs text-muted-foreground">({rows.length} level)</span>
              </h3>
              <button
                onClick={() => addRow(key)}
                className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
              >
                <Plus className="h-3 w-3" /> Level
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 text-left font-medium">Kategori / Label</th>
                    <th className="px-2 py-2 text-left font-medium">Min</th>
                    <th className="px-2 py-2 text-left font-medium">Max</th>
                    <th className="px-2 py-2 text-left font-medium">Interpretasi (ID)</th>
                    <th className="px-2 py-2 text-left font-medium">Interpretasi (EN)</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((it) => (
                    <tr key={it.id} className={`border-b border-border/50 ${it._dirty ? "bg-primary/5" : ""}`}>
                      <td className="px-2 py-1">
                        <input
                          value={it.category || ""}
                          onChange={(e) => updateItem(it.id, { category: e.target.value })}
                          className="w-32 rounded border border-border bg-background px-2 py-1 text-foreground"
                          placeholder="mis. Tinggi"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={it.min_value ?? 0}
                          onChange={(e) => updateItem(it.id, { min_value: Number(e.target.value) })}
                          className="w-20 rounded border border-border bg-background px-2 py-1 text-foreground"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={it.max_value ?? 0}
                          onChange={(e) => updateItem(it.id, { max_value: Number(e.target.value) })}
                          className="w-20 rounded border border-border bg-background px-2 py-1 text-foreground"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <textarea
                          value={it.interpretation_text}
                          onChange={(e) => updateItem(it.id, { interpretation_text: e.target.value })}
                          rows={2}
                          className="w-full min-w-[260px] rounded border border-border bg-background px-2 py-1 text-foreground"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <textarea
                          value={it.interpretation_text_en || ""}
                          onChange={(e) => updateItem(it.id, { interpretation_text_en: e.target.value })}
                          rows={2}
                          className="w-full min-w-[260px] rounded border border-border bg-background px-2 py-1 text-foreground"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => removeRow(it.id)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default InterpretationManager;
