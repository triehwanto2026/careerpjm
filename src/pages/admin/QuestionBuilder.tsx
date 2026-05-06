import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronLeft, Pencil, Check, X, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

/** Upload File ke bucket test-images, kembalikan public URL atau null. */
const uploadTestImage = async (file: File, hint = "img"): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${hint}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("test-images").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) { console.error("Upload err", error); return null; }
  return supabase.storage.from("test-images").getPublicUrl(path).data.publicUrl;
};

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
  cancelButtonColor: "hsl(var(--muted))",
});

interface Instrument {
  id: string;
  name: string;
  name_en: string;
  category: string;
  scoring_method: string;
}

interface QuestionRow {
  id: string;
  instrument_id: string;
  question_number: number;
  question_text: string;
  question_text_en: string;
  category: string;
  question_type: string;
  scoring_rule: string;
  image_url: string | null;
  question_image?: string | null; // Gambar 1: soal/pattern
  options_image?: string | null; // Gambar 2: pilihan jawaban
}

interface OptionRow {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  option_text_en: string;
  score_value: number;
  category_target: string;
  is_correct: boolean;
  display_order: number;
  image_url: string | null;
  option_definition: string | null;
  option_definition_en: string | null;
}

const QUESTION_TYPES = [
  { value: "single_choice", label: "Pilihan Tunggal" },
  { value: "multi_choice", label: "Pilihan Jamak" },
  { value: "likert", label: "Skala Likert (1-5)" },
  { value: "true_false", label: "Benar/Salah" },
  { value: "text", label: "Esai Singkat" },
  { value: "numeric", label: "Input Angka (Kraepelin)" },
];

const SCORING_RULES = [
  { value: "sum", label: "Jumlahkan skor (sum)" },
  { value: "ipsative", label: "Ipsative / Forced choice" },
  { value: "weighted", label: "Berbobot per dimensi" },
  { value: "correct_only", label: "Skor jika benar saja" },
];

const QuestionBuilder = () => {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, OptionRow[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!instrumentId) return;
    const [{ data: inst }, { data: qs }] = await Promise.all([
      supabase.from("test_instruments").select("id, name, name_en, category, scoring_method").eq("id", instrumentId).maybeSingle(),
      supabase.from("test_questions").select("*").eq("instrument_id", instrumentId).order("question_number"),
    ]);
    setInstrument(inst as Instrument);
    setQuestions((qs as QuestionRow[]) || []);

    if (qs && qs.length > 0) {
      const ids = qs.map((q: any) => q.id);
      const { data: opts } = await supabase.from("test_question_options").select("*").in("question_id", ids).order("display_order");
      const grouped: Record<string, OptionRow[]> = {};
      (opts as OptionRow[] || []).forEach(o => {
        (grouped[o.question_id] ||= []).push(o);
      });
      setOptionsByQ(grouped);
    } else {
      setOptionsByQ({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [instrumentId]);

  const handleAddQuestion = async () => {
    const nextNum = (questions[questions.length - 1]?.question_number || 0) + 1;
    const { value } = await Swal.fire({
      title: `Tambah Soal #${nextNum}`,
      html: `
        <div style="text-align:left;font-size:13px;max-height:65vh;overflow-y:auto;padding-right:8px;">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Soal (ID) *</label>
          <textarea id="q-text" class="swal2-textarea" style="margin:0 0 10px;width:100%;min-height:60px"></textarea>
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Soal (EN)</label>
          <textarea id="q-text-en" class="swal2-textarea" style="margin:0 0 10px;width:100%;min-height:50px"></textarea>
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Kategori / Dimensi</label>
          <input id="q-cat" class="swal2-input" placeholder="mis. Dominance, Extraversion" style="margin:0 0 10px;width:100%">
          <div style="display:flex;gap:10px">
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Tipe Soal</label>
              <select id="q-type" class="swal2-select" style="margin:0;width:100%">
                ${QUESTION_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join("")}
              </select>
            </div>
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Aturan Skoring</label>
              <select id="q-scoring" class="swal2-select" style="margin:0;width:100%">
                ${SCORING_RULES.map(t => `<option value="${t.value}">${t.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div style="border-top:1px solid hsl(var(--border));padding-top:12px;margin-top:12px;">
            <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--primary))">Gambar 1: Soal/Pola (opsional — IST subtest FA)</label>
            <input id="q-image1" type="file" accept="image/*" class="swal2-file" style="margin:0 0 10px;width:100%">
            <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--primary))">Gambar 2: Pilihan Jawaban A-E (opsional — IST subtest FA)</label>
            <input id="q-image2" type="file" accept="image/*" class="swal2-file" style="margin:0;width:100%">
          </div>
        </div>`,
      ...SWAL_THEME(),
      confirmButtonText: "Simpan Soal",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 580,
      preConfirm: () => {
        const text = (document.getElementById("q-text") as HTMLTextAreaElement).value.trim();
        if (!text) { Swal.showValidationMessage("Teks soal wajib diisi"); return; }
        const fileInput1 = document.getElementById("q-image1") as HTMLInputElement;
        const fileInput2 = document.getElementById("q-image2") as HTMLInputElement;
        return {
          question_text: text,
          question_text_en: (document.getElementById("q-text-en") as HTMLTextAreaElement).value.trim(),
          category: (document.getElementById("q-cat") as HTMLInputElement).value.trim(),
          question_type: (document.getElementById("q-type") as HTMLSelectElement).value,
          scoring_rule: (document.getElementById("q-scoring") as HTMLSelectElement).value,
          _imageFile1: fileInput1?.files?.[0] || null,
          _imageFile2: fileInput2?.files?.[0] || null,
        };
      },
    });
    if (value) {
      const { _imageFile1, _imageFile2, ...payload } = value as any;
      let question_image: string | null = null;
      let options_image: string | null = null;
      if (_imageFile1) question_image = await uploadTestImage(_imageFile1, `q${nextNum}-soal`);
      if (_imageFile2) options_image = await uploadTestImage(_imageFile2, `q${nextNum}-pilihan`);
      await supabase.from("test_questions").insert({
        instrument_id: instrumentId,
        question_number: nextNum,
        ...payload,
        question_image,
        options_image,
      });
      await load();
    }
  };

  const handleEditQuestion = async (q: QuestionRow) => {
    const { value } = await Swal.fire({
      title: `Edit Soal #${q.question_number}`,
      html: `
        <div style="text-align:left;font-size:13px;max-height:65vh;overflow-y:auto;padding-right:8px;">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Soal (ID) *</label>
          <textarea id="q-text" class="swal2-textarea" style="margin:0 0 10px;width:100%;min-height:60px">${q.question_text}</textarea>
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Soal (EN)</label>
          <textarea id="q-text-en" class="swal2-textarea" style="margin:0 0 10px;width:100%;min-height:50px">${q.question_text_en || ""}</textarea>
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Kategori / Dimensi</label>
          <input id="q-cat" class="swal2-input" value="${q.category || ""}" style="margin:0 0 10px;width:100%">
          <div style="display:flex;gap:10px">
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Tipe Soal</label>
              <select id="q-type" class="swal2-select" style="margin:0;width:100%">
                ${QUESTION_TYPES.map(t => `<option value="${t.value}" ${q.question_type === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
              </select>
            </div>
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Aturan Skoring</label>
              <select id="q-scoring" class="swal2-select" style="margin:0;width:100%">
                ${SCORING_RULES.map(t => `<option value="${t.value}" ${q.scoring_rule === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div style="border-top:1px solid hsl(var(--border));padding-top:12px;margin-top:12px;">
            ${q.question_image ? `<div style="margin-top:10px;"><img src="${q.question_image}" style="max-height:80px;border:1px solid #cbd5e1;border-radius:4px;" /><span style="font-size:11px;color:hsl(var(--muted-foreground))">Gambar 1: Soal</span></div>` : ""}
            <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--primary))">Ganti Gambar 1: Soal/Pola (opsional)</label>
            <input id="q-image1" type="file" accept="image/*" class="swal2-file" style="margin:0 0 8px;width:100%">
            ${q.question_image ? `<label style="display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:12px"><input id="q-rmimg1" type="checkbox" style="width:16px;height:16px;accent-color:hsl(0,72%,51%)">Hapus Gambar 1</label>` : ""}
            
            ${q.options_image ? `<div style="margin-top:10px;"><img src="${q.options_image}" style="max-height:80px;border:1px solid #cbd5e1;border-radius:4px;" /><span style="font-size:11px;color:hsl(var(--muted-foreground))">Gambar 2: Pilihan</span></div>` : ""}
            <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--primary))">Ganti Gambar 2: Pilihan Jawaban (opsional)</label>
            <input id="q-image2" type="file" accept="image/*" class="swal2-file" style="margin:0 0 8px;width:100%">
            ${q.options_image ? `<label style="display:flex;align-items:center;gap:6px;font-size:12px"><input id="q-rmimg2" type="checkbox" style="width:16px;height:16px;accent-color:hsl(0,72%,51%)">Hapus Gambar 2</label>` : ""}
          </div>
        </div>`,
      ...SWAL_THEME(),
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 580,
      preConfirm: () => {
        const text = (document.getElementById("q-text") as HTMLTextAreaElement).value.trim();
        if (!text) { Swal.showValidationMessage("Teks soal wajib diisi"); return; }
        const fileInput1 = document.getElementById("q-image1") as HTMLInputElement;
        const fileInput2 = document.getElementById("q-image2") as HTMLInputElement;
        const rmImg1 = document.getElementById("q-rmimg1") as HTMLInputElement | null;
        const rmImg2 = document.getElementById("q-rmimg2") as HTMLInputElement | null;
        return {
          question_text: text,
          question_text_en: (document.getElementById("q-text-en") as HTMLTextAreaElement).value.trim(),
          category: (document.getElementById("q-cat") as HTMLInputElement).value.trim(),
          question_type: (document.getElementById("q-type") as HTMLSelectElement).value,
          scoring_rule: (document.getElementById("q-scoring") as HTMLSelectElement).value,
          _imageFile1: fileInput1?.files?.[0] || null,
          _imageFile2: fileInput2?.files?.[0] || null,
          _removeImage1: rmImg1?.checked || false,
          _removeImage2: rmImg2?.checked || false,
        };
      },
    });
    if (value) {
      const { _imageFile1, _imageFile2, _removeImage1, _removeImage2, ...payload } = value as any;
      const updates: any = { ...payload };
      if (_imageFile1) updates.question_image = await uploadTestImage(_imageFile1, `q${q.question_number}-soal`);
      else if (_removeImage1) updates.question_image = null;
      if (_imageFile2) updates.options_image = await uploadTestImage(_imageFile2, `q${q.question_number}-pilihan`);
      else if (_removeImage2) updates.options_image = null;
      await supabase.from("test_questions").update(updates).eq("id", q.id);
      await load();
    }
  };

  const handleDeleteQuestion = async (q: QuestionRow) => {
    const r = await Swal.fire({
      icon: "warning", title: `Hapus Soal #${q.question_number}?`,
      text: "Soal beserta semua opsi jawaban akan dihapus.",
      showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
      ...SWAL_THEME(), confirmButtonColor: "hsl(0, 72%, 51%)",
    });
    if (r.isConfirmed) {
      await supabase.from("test_questions").delete().eq("id", q.id);
      await load();
    }
  };

  const handleAddOption = async (q: QuestionRow) => {
    const opts = optionsByQ[q.id] || [];
    const nextOrder = opts.length;
    const nextLabel = String.fromCharCode(65 + nextOrder); // A, B, C
    const { value } = await Swal.fire({
      title: `Tambah Pilihan untuk Soal #${q.question_number}`,
      html: `
        <div style="text-align:left;font-size:13px;max-height:65vh;overflow-y:auto;padding-right:8px;">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Label (A/B/C/dll) *</label>
          <input id="o-label" class="swal2-input" value="${nextLabel}" style="margin:0 0 10px;width:100%">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Pilihan (ID) *</label>
          <input id="o-text" class="swal2-input" style="margin:0 0 10px;width:100%">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Teks Pilihan (EN)</label>
          <input id="o-text-en" class="swal2-input" style="margin:0 0 10px;width:100%">
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Definisi Pilihan (ID) - untuk Personality Plus</label>
          <textarea id="o-def" class="swal2-textarea" placeholder="Jelaskan arti dari pilihan ini..." style="margin:0 0 10px;width:100%;min-height:50px"></textarea>
          <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Definisi Pilihan (EN)</label>
          <textarea id="o-def-en" class="swal2-textarea" placeholder="Explain the meaning of this option..." style="margin:0 0 10px;width:100%;min-height:50px"></textarea>
          <div style="display:flex;gap:10px">
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Nilai Skor</label>
              <input id="o-score" type="number" step="0.1" value="1" class="swal2-input" style="margin:0;width:100%">
            </div>
            <div style="flex:1">
              <label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Dimensi Target</label>
              <input id="o-cat" class="swal2-input" placeholder="mis. D, I, E, N" style="margin:0;width:100%">
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px">
            <input id="o-correct" type="checkbox" style="width:16px;height:16px;accent-color:hsl(174,72%,46%)">
            Tandai sebagai jawaban BENAR (untuk tes kognitif)
          </label>
          <label style="display:block;margin-top:10px;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Gambar Pilihan (opsional — CFIT/IST)</label>
          <input id="o-image" type="file" accept="image/*" class="swal2-file" style="margin:0;width:100%">
        </div>`,
      ...SWAL_THEME(),
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 580,
      preConfirm: () => {
        const label = (document.getElementById("o-label") as HTMLInputElement).value.trim();
        const text = (document.getElementById("o-text") as HTMLInputElement).value.trim();
        if (!label || !text) { Swal.showValidationMessage("Label dan teks pilihan wajib diisi"); return; }
        const fileInput = document.getElementById("o-image") as HTMLInputElement;
        return {
          option_label: label,
          option_text: text,
          option_text_en: (document.getElementById("o-text-en") as HTMLInputElement).value.trim(),
          option_definition: (document.getElementById("o-def") as HTMLTextAreaElement).value.trim(),
          option_definition_en: (document.getElementById("o-def-en") as HTMLTextAreaElement).value.trim(),
          score_value: parseFloat((document.getElementById("o-score") as HTMLInputElement).value) || 0,
          category_target: (document.getElementById("o-cat") as HTMLInputElement).value.trim(),
          is_correct: (document.getElementById("o-correct") as HTMLInputElement).checked,
          _imageFile: fileInput?.files?.[0] || null,
        };
      },
    });
    if (value) {
      const { _imageFile, ...payload } = value as any;
      let image_url: string | null = null;
      if (_imageFile) image_url = await uploadTestImage(_imageFile, `q${q.question_number}-${payload.option_label}`);
      await supabase.from("test_question_options").insert({
        question_id: q.id,
        display_order: nextOrder,
        ...payload,
        image_url,
      });
      await load();
    }
  };

  const handleDeleteOption = async (o: OptionRow) => {
    await supabase.from("test_question_options").delete().eq("id", o.id);
    await load();
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div></AdminLayout>;
  if (!instrument) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Alat tes tidak ditemukan</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate("/admin/test-instruments")} className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Alat Tes
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Bank Soal — {instrument.name}</h1>
              <p className="text-sm text-muted-foreground">{instrument.category} · {questions.length} soal · {instrument.scoring_method || "—"}</p>
            </div>
            <button onClick={handleAddQuestion} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
              <Plus className="h-4 w-4" /> Tambah Soal
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center glow-border">
            <p className="text-sm text-muted-foreground mb-4">Belum ada soal. Mulai dengan menambah soal pertama.</p>
            <button onClick={handleAddQuestion} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
              <Plus className="h-4 w-4" /> Tambah Soal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const opts = optionsByQ[q.id] || [];
              return (
                <div key={q.id} className="glass rounded-xl p-5 glow-border space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {q.question_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">{q.question_text}</p>
                      {q.question_text_en && <p className="text-xs text-muted-foreground italic mt-1">{q.question_text_en}</p>}
                      {(q.question_image || q.options_image) && (
                        <div className="mt-3 space-y-3">
                          {q.question_image && (
                            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Gambar 1 - Soal/Pola:</span>
                                <a href={q.question_image} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:underline ml-auto">Buka di tab baru</a>
                              </div>
                              <img src={q.question_image} alt="Soal" className="max-h-48 w-auto rounded border border-border bg-white" />
                            </div>
                          )}
                          {q.options_image && (
                            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-primary/80" />
                                <span className="text-xs font-medium text-primary/80">Gambar 2 - Pilihan Jawaban:</span>
                                <a href={q.options_image} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:underline ml-auto">Buka di tab baru</a>
                              </div>
                              <img src={q.options_image} alt="Pilihan Jawaban" className="max-h-48 w-auto rounded border border-border bg-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        {q.category && <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{q.category}</span>}
                        <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5">{QUESTION_TYPES.find(t => t.value === q.question_type)?.label || q.question_type}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{SCORING_RULES.find(t => t.value === q.scoring_rule)?.label || q.scoring_rule}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditQuestion(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilihan Jawaban ({opts.length})</p>
                      <button onClick={() => handleAddOption(q)} className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                        <Plus className="h-3 w-3" /> Tambah Opsi
                      </button>
                    </div>
                    {opts.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">Belum ada pilihan jawaban</p>
                    ) : (
                      <div className="grid gap-1.5">
                        {opts.map((o) => (
                          <div key={o.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-card border border-border text-xs font-bold text-foreground">{o.option_label}</span>
                            {o.image_url && <img src={o.image_url} alt={o.option_label} className="h-10 w-10 rounded object-cover border border-border bg-card" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground truncate">{o.option_text}</p>
                              {o.option_text_en && <p className="text-[10px] text-muted-foreground italic truncate">{o.option_text_en}</p>}
                              {o.option_definition && <p className="text-[10px] text-primary/80 mt-0.5 truncate">Def: {o.option_definition}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {o.is_correct && <span className="flex items-center gap-0.5 rounded bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5"><Check className="h-2.5 w-2.5" /> Benar</span>}
                              {o.category_target && <span className="rounded bg-blue-400/10 text-blue-400 px-1.5 py-0.5">→ {o.category_target}</span>}
                              <span className="rounded bg-muted text-muted-foreground px-1.5 py-0.5 font-mono">{o.score_value}</span>
                              <button onClick={() => handleDeleteOption(o)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default QuestionBuilder;
