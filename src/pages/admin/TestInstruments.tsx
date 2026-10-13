import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, MoreVertical, ListChecks, Check, BookOpen, RefreshCw, Calculator, X, ChevronLeft, ChevronRight, Languages, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { MSDT_QUESTIONS } from "@/lib/msdtQuestions";

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
  { value: "msdt_style", label: "MSDT Management Style (Forced-Choice)" },
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
  { name: "MSDT", name_en: "Management Style Diagnostic Test", category: "Behavioral", scoring_method: "msdt_style",
    target_audience: "Supervisor, leader, manager, kandidat posisi struktural", norm_reference: "Management Style Diagnostic profile",
    question_count: 64, duration_minutes: 30,
    description: "Memetakan kecenderungan gaya manajemen melalui 64 pasangan pernyataan forced-choice." },
  { name: "Kraepelin", name_en: "Kraepelin Test", category: "Work Aptitude", scoring_method: "speed_accuracy",
    target_audience: "Pekerja klerikal, operator", norm_reference: "Emil Kraepelin (1895)",
    question_count: 1350, duration_minutes: 30,
    description: "Tes numerik dengan 50 kolom untuk mengukur kecepatan, ketelitian, daya tahan, dan stabilitas kerja rutin." },
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

const fillTemplateForm = (tpl: typeof TEMPLATES[number]) => {
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
  const [preview, setPreview] = useState<null | { instrument: InstrumentRow; questions: any[]; optionsByQ: Record<string, any[]> }>(null);
  const [loading, setLoading] = useState(true);
  const [installingMsdt, setInstallingMsdt] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("test_instruments").select("*").order("created_at", { ascending: false });
    setInstruments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (preset?: typeof TEMPLATES[number]) => {
    const { value } = await Swal.fire({
      title: "Tambah Alat Tes Psikologi", html: buildFormHtml(), ...SWAL_THEME,
      confirmButtonText: "Simpan", showCancelButton: true, cancelButtonText: "Batal",
      width: 640, preConfirm: extractForm,
      didOpen: () => {
        attachTemplateHandler();
        if (preset) fillTemplateForm(preset);
      },
    });
    if (value) {
      const { data, error } = await supabase.from("test_instruments").insert(value).select("id").single();
      if (error) {
        await Swal.fire({
          icon: "error",
          title: "Belum dapat ditambahkan",
          text: `${error.message}. Tambahkan melalui migration SQL yang sudah disediakan.`,
          ...SWAL_THEME,
        });
        return;
      }
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

  const handlePreview = async (t: InstrumentRow) => {
    setOpenMenu(null);
    const { data: questions } = await supabase.from("test_questions").select("*").eq("instrument_id", t.id).order("question_number");

    if (!questions || questions.length === 0) {
      Swal.fire({ icon: "info", title: "Belum Ada Soal", text: "Alat tes ini belum memiliki soal.", ...SWAL_THEME });
      return;
    }

    const questionIds = questions.map((q: any) => q.id);
    const { data: options } = await supabase.from("test_question_options").select("*").in("question_id", questionIds).order("display_order");

    const optionsByQ: Record<string, any[]> = {};
    (options || []).forEach((o: any) => {
      (optionsByQ[o.question_id] ||= []).push(o);
    });

    setPreview({ instrument: t, questions, optionsByQ });
  };

  const installMsdtQuestions = async (instrument: InstrumentRow) => {
    const confirmation = await Swal.fire({
      icon: "question",
      title: "Pasang Bank Soal MSDT?",
      text: "Bank soal MSDT pada instrument ini akan diganti dengan 64 soal dan 128 opsi scoring.",
      showCancelButton: true,
      confirmButtonText: "Ya, Pasang",
      cancelButtonText: "Batal",
      ...SWAL_THEME,
    });
    if (!confirmation.isConfirmed) return;

    setInstallingMsdt(true);
    try {
      const { data: existingQuestions, error: existingError } = await supabase
        .from("test_questions")
        .select("id")
        .eq("instrument_id", instrument.id);
      if (existingError) throw existingError;

      const existingIds = (existingQuestions || []).map((question) => question.id);
      if (existingIds.length > 0) {
        const { error: optionsDeleteError } = await supabase
          .from("test_question_options")
          .delete()
          .in("question_id", existingIds);
        if (optionsDeleteError) throw optionsDeleteError;

        const { error: questionsDeleteError } = await supabase
          .from("test_questions")
          .delete()
          .eq("instrument_id", instrument.id);
        if (questionsDeleteError) throw questionsDeleteError;
      }

      const questionRows = MSDT_QUESTIONS.map((question) => ({
        instrument_id: instrument.id,
        question_number: question.number,
        question_text: `Pilih pernyataan yang paling mendekati gaya manajemen Anda.\n\nA. ${question.a}\nB. ${question.b}`,
        question_text_en: `Choose the statement that best reflects your management style.\n\nA. ${question.a}\nB. ${question.b}`,
        category: "MSDT",
        question_type: "single_choice",
        scoring_rule: "msdt_style",
      }));

      const { data: insertedQuestions, error: questionInsertError } = await supabase
        .from("test_questions")
        .insert(questionRows)
        .select("id, question_number");
      if (questionInsertError) throw questionInsertError;
      if (!insertedQuestions || insertedQuestions.length !== 64) {
        throw new Error(`Jumlah soal tersimpan ${insertedQuestions?.length || 0}, seharusnya 64.`);
      }

      const idByNumber = new Map(insertedQuestions.map((question) => [question.question_number, question.id]));
      const optionRows = MSDT_QUESTIONS.flatMap((question) => {
        const questionId = idByNumber.get(question.number);
        if (!questionId) throw new Error(`ID soal MSDT nomor ${question.number} tidak ditemukan.`);
        return [
          {
            question_id: questionId,
            option_label: "A",
            option_text: question.a,
            option_text_en: question.a,
            score_value: 1,
            category_target: question.aCategory,
            is_correct: null,
            display_order: 0,
          },
          {
            question_id: questionId,
            option_label: "B",
            option_text: question.b,
            option_text_en: question.b,
            score_value: 1,
            category_target: question.bCategory,
            is_correct: null,
            display_order: 1,
          },
        ];
      });

      const { error: optionInsertError } = await supabase
        .from("test_question_options")
        .insert(optionRows);
      if (optionInsertError) throw optionInsertError;

      const { error: instrumentUpdateError } = await supabase
        .from("test_instruments")
        .update({
          name: "MSDT",
          name_en: "Management Style Diagnostic Test",
          description: "Memetakan kecenderungan gaya manajemen melalui 64 pasangan pernyataan forced-choice.",
          category: "Behavioral",
          scoring_method: "msdt_style",
          question_count: 64,
          duration_minutes: 30,
          is_active: true,
        })
        .eq("id", instrument.id);
      if (instrumentUpdateError) throw instrumentUpdateError;

      await load();
      await Swal.fire({
        icon: "success",
        title: "Bank Soal MSDT Terpasang",
        text: "64 soal, 128 opsi, dan mapping scoring gaya manajemen berhasil disimpan.",
        ...SWAL_THEME,
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal Memasang MSDT",
        text: error?.message || "Terjadi kesalahan saat menyimpan bank soal MSDT.",
        ...SWAL_THEME,
      });
    } finally {
      setInstallingMsdt(false);
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Memuat data...</div></AdminLayout>;

  const msdtTemplate = TEMPLATES.find((template) => template.name === "MSDT")!;
  const hasMsdt = instruments.some((instrument) =>
    instrument.name.toUpperCase().includes("MSDT")
    || instrument.name_en.toUpperCase().includes("MANAGEMENT STYLE DIAGNOSTIC")
    || instrument.scoring_method === "msdt_style"
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alat Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Kelola instrumen tes psikologi standar</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/admin/answer-keys")} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <ListChecks className="h-4 w-4" /> Manajer Kunci Jawaban
            </button>
            <button onClick={() => navigate("/admin/interpretations")} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <BookOpen className="h-4 w-4" /> Manajer Interpretasi
            </button>
            <button onClick={() => handleAdd()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
              <Plus className="h-4 w-4" /> Tambah Alat Tes
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!hasMsdt && (
            <div className="rounded-xl border border-dashed border-primary/60 bg-primary/5 p-5 space-y-3 relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">MSDT</h3>
                  <p className="text-xs text-muted-foreground">Management Style Diagnostic Test</p>
                </div>
                <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-400">
                  Belum dipasang
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Memetakan kecenderungan gaya manajemen melalui 64 pasangan pernyataan forced-choice.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">Behavioral</span>
                <span>64 soal</span><span>·</span><span>30 menit</span>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3 text-xs text-muted-foreground">
                Data belum ditemukan di database. Tambahkan melalui form ini atau jalankan migration MSDT.
              </div>
              <button
                onClick={() => handleAdd(msdtTemplate)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Tambahkan MSDT ke Database
              </button>
            </div>
          )}
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
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(t)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted text-foreground px-3 py-2 text-xs font-semibold hover:bg-muted/80 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => navigate(`/admin/test-instruments/${t.id}/questions`)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <ListChecks className="h-3.5 w-3.5" /> Soal
                </button>
              </div>
              <button
                onClick={() => navigate(`/admin/answer-keys?instrument=${t.id}`)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 text-primary px-3 py-2 text-xs font-semibold hover:bg-primary/10 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Set Jawaban Benar
              </button>
              <button
                onClick={() => navigate(`/admin/interpretations?instrument=${t.id}`)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border text-foreground px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" /> Atur Interpretasi
              </button>
              <button
                onClick={() => {
                  if (t.name.toUpperCase().includes("DISC")) {
                    navigate(`/admin/test-scoring?instrument=${t.id}`);
                  } else {
                    navigate(`/admin/scoring?instrument=${t.id}`);
                  }
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border text-foreground px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                <Calculator className="h-3.5 w-3.5" /> Edit Scoring
              </button>
            </div>
          ))}
        </div>
      </div>
      {preview && (
        <TestPreviewModal
          instrument={preview.instrument}
          questions={preview.questions}
          optionsByQ={preview.optionsByQ}
          onClose={() => setPreview(null)}
        />
      )}
    </AdminLayout>
  );
};

interface PreviewProps {
  instrument: InstrumentRow;
  questions: any[];
  optionsByQ: Record<string, any[]>;
  onClose: () => void;
}

const TestPreviewModal = ({ instrument, questions, optionsByQ, onClose }: PreviewProps) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showEnglish, setShowEnglish] = useState(false);

  const isKraepelin = instrument.name.toUpperCase().includes("KRAEPELIN") || instrument.scoring_method === "speed_accuracy";
  const q = questions[idx];
  const opts: any[] = q ? (optionsByQ[q.id] || []) : [];
  const currentAns = q ? answers[q.id] : undefined;

  // Kraepelin: group questions into columns by subtest_code
  const kraepelinColumns = (() => {
    if (!isKraepelin) return [] as { code: string; qs: any[] }[];
    const map = new Map<string, any[]>();
    questions.forEach((qq: any) => {
      const code = qq.subtest_code || "K1";
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(qq);
    });
    return Array.from(map.entries()).map(([code, qs]) => ({ code, qs }));
  })();
  const [colIdx, setColIdx] = useState(0);
  const activeColumn = kraepelinColumns[colIdx];

  const parsePair = (txt: string): [number, number] => {
    const m = String(txt || "").match(/(\d+)\s*\+\s*(\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
  };

  const kraepelinNumbers: number[] = activeColumn
    ? [...activeColumn.qs.map((qq: any) => parsePair(qq.question_text)[0]), parsePair(activeColumn.qs[activeColumn.qs.length - 1]?.question_text || "")[1]]
    : [];
  const kraepelinAnsweredCount = activeColumn ? activeColumn.qs.filter((qq: any) => answers[qq.id]).length : 0;
  const kraepelinCurrent = activeColumn?.qs[kraepelinAnsweredCount];
  const kraepelinPrevAns = kraepelinAnsweredCount > 0 ? answers[activeColumn.qs[kraepelinAnsweredCount - 1].id] : "";

  const pressKraepelin = (d: string) => {
    if (!kraepelinCurrent) return;
    setAnswers((a) => ({ ...a, [kraepelinCurrent.id]: d }));
  };

  const handleDiscPick = (part: "M" | "L", optId: string) => {
    if (!q) return;
    const parts: Record<string, string> = { M: "", L: "" };
    (currentAns || "").split("|").forEach((p) => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
    if (parts[part] === optId) parts[part] = ""; else parts[part] = optId;
    // ensure M and L differ
    if (part === "M" && parts.L === optId) parts.L = "";
    if (part === "L" && parts.M === optId) parts.M = "";
    const val = Object.entries(parts).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join("|");
    setAnswers((a) => ({ ...a, [q.id]: val }));
  };

  const handleMultiPick = (optId: string) => {
    if (!q) return;
    const picked = new Set((currentAns || "").split("+").filter(Boolean));
    if (picked.has(optId)) picked.delete(optId);
    else { if (picked.size >= 2) return; picked.add(optId); }
    setAnswers((a) => ({ ...a, [q.id]: Array.from(picked).join("+") }));
  };

  const cell = (n: number | undefined, active: boolean) => (
    <div className={`flex w-20 items-center justify-center rounded-md transition-all duration-300 tabular-nums ${
      n === undefined ? "h-16 opacity-0" :
      active ? "h-16 border-2 border-primary bg-primary/20 text-3xl font-bold text-foreground" : "h-14 bg-muted/40 text-lg font-semibold text-muted-foreground"
    }`}>{n ?? ""}</div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header — mirrors candidate test header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">PsyTest</span>
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">Mode Preview</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">{instrument.duration_minutes} menit</span>
            <button onClick={() => setShowEnglish(!showEnglish)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${showEnglish ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}>
              <Languages className="h-3.5 w-3.5" /><span className="hidden sm:inline">EN</span>
            </button>
            <button onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors">
              <X className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tutup</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto p-4 md:flex-row md:p-6">
        {/* Sidebar — progress + question grid */}
        <aside className="flex flex-row gap-4 md:w-64 md:flex-col md:gap-5">
          <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Progres</span><span>{Object.keys(answers).length}/{questions.length}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tes</p>
              <div className="w-full rounded-lg border border-primary bg-primary/10 p-2.5 text-left">
                <p className="text-xs font-semibold text-primary">{instrument.name}</p>
                <p className="text-[10px] text-muted-foreground">{Object.keys(answers).length}/{questions.length} soal</p>
              </div>
            </div>
            {!isKraepelin && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {questions.map((qq: any, i: number) => (
                  <button key={qq.id} onClick={() => setIdx(i)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${i === idx ? "bg-primary text-primary-foreground" : answers[qq.id] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
            {isKraepelin && kraepelinColumns.length > 1 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {kraepelinColumns.map((c, i) => (
                  <button key={c.code} onClick={() => setColIdx(i)}
                    className={`flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-medium transition-all ${i === colIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {c.code.replace(/^K/i, "")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main question card */}
        <main className="flex flex-1 flex-col">
          <div className="glass flex-1 rounded-2xl p-5 glow-border md:p-8">
            <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
              <span><span className="font-semibold text-primary">{instrument.name}</span> · Soal <span className="font-semibold text-foreground">{idx + 1}</span> dari {questions.length}</span>
            </div>

            {isKraepelin && activeColumn ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kolom Kraepelin</p>
                    <h3 className="text-xl font-bold text-foreground">{activeColumn.code.replace(/^K/i, "Kolom ")}</h3>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  Jumlahkan dua angka yang disorot, lalu tekan <b>angka satuan</b> hasilnya pada tombol. Contoh: 7 + 8 = 15 → tekan <b>5</b>. Soal akan otomatis bergerak ke soal berikutnya. Jawaban <b>tidak dapat direvisi</b>.
                </div>
                <div
                  tabIndex={0}
                  onKeyDown={(e) => { if (/^[0-9]$/.test(e.key)) { e.preventDefault(); pressKraepelin(e.key); } }}
                  className="rounded-xl border border-border bg-card p-6 outline-none"
                >
                  <p className="mb-6 text-center text-lg font-bold text-foreground">Soal Dijawab : <span className="text-primary">{kraepelinAnsweredCount}</span></p>
                  <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
                    <div className="flex items-center gap-6">
                      <div key={kraepelinAnsweredCount} className="flex flex-col gap-1 animate-fade-in">
                        {cell(kraepelinAnsweredCount > 0 ? kraepelinNumbers[kraepelinAnsweredCount - 1] : undefined, false)}
                        {cell(kraepelinCurrent ? kraepelinNumbers[kraepelinAnsweredCount] : undefined, true)}
                        {cell(kraepelinCurrent ? kraepelinNumbers[kraepelinAnsweredCount + 1] : undefined, true)}
                        {cell(kraepelinCurrent && kraepelinAnsweredCount + 2 < kraepelinNumbers.length ? kraepelinNumbers[kraepelinAnsweredCount + 2] : undefined, false)}
                      </div>
                      <span className="text-4xl font-bold text-foreground">=</span>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-16 w-20 items-center justify-center rounded-md border-2 border-primary/60 bg-background text-3xl font-bold text-primary" />
                        <span className="h-8 text-2xl font-bold text-muted-foreground/60">{kraepelinPrevAns}</span>
                      </div>
                    </div>
                    <div className="grid w-64 grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                      {["7","8","9","4","5","6","1","2","3"].map((d) => (
                        <button key={d} type="button" disabled={!kraepelinCurrent} onClick={() => pressKraepelin(d)}
                          className="h-14 rounded-xl border border-border bg-background text-xl font-semibold text-foreground shadow-sm transition active:scale-95 hover:border-primary hover:text-primary disabled:opacity-50">{d}</button>
                      ))}
                      <button type="button" disabled={!kraepelinCurrent} onClick={() => pressKraepelin("0")}
                        className="col-span-3 h-14 rounded-xl border border-border bg-background text-xl font-semibold text-foreground shadow-sm transition active:scale-95 hover:border-primary hover:text-primary disabled:opacity-50">0</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : q ? (
              <div className="animate-fade-in space-y-5">
                {q.category && (
                  <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{q.category}</span>
                )}
                <h3 className="text-lg font-semibold leading-relaxed text-foreground">{q.question_text}</h3>
                {showEnglish && q.question_text_en && (
                  <p className="text-sm italic text-muted-foreground">{q.question_text_en}</p>
                )}
                {q.question_image && (
                  <div className="space-y-2 rounded border border-dashed border-border p-2">
                    <p className="text-xs text-muted-foreground">Gambar 1 - Soal:</p>
                    <img src={q.question_image} alt="Soal" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
                )}
                {q.options_image && (
                  <div className="space-y-2 rounded border border-dashed border-border p-2">
                    <p className="text-xs text-muted-foreground">Gambar 2 - Pilihan Jawaban:</p>
                    <img src={q.options_image} alt="Pilihan Jawaban" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
                )}
                {!q.question_image && !q.options_image && q.image_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Gambar Soal:</p>
                    <img src={q.image_url} alt="Soal" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
                )}

                <div className="space-y-3">
                  {q.question_type === "numeric" ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jawaban angka</label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        value={currentAns || ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        className="h-14 w-full max-w-xs rounded-lg border border-border bg-muted px-4 text-center text-3xl font-bold tracking-widest text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="0"
                      />
                    </div>
                  ) : q.question_type === "essay" || q.question_type === "text" ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jawaban esai</label>
                      <textarea
                        rows={4}
                        value={currentAns || ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Tulis jawaban Anda di sini"
                      />
                    </div>
                  ) : opts.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Belum ada pilihan jawaban untuk soal ini.</p>
                  ) : q.question_type === "disc_pair" ? (
                    <div>
                      <div className="mb-3 grid grid-cols-[1fr_60px_60px] gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Pernyataan</span>
                        <span className="text-center text-emerald-500">PALING (M)</span>
                        <span className="text-center text-amber-500">TIDAK (L)</span>
                      </div>
                      {(() => {
                        const parts: Record<string, string> = { M: "", L: "" };
                        (currentAns || "").split("|").forEach((p) => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
                        return opts.map((opt: any) => {
                          const isM = parts.M === opt.id;
                          const isL = parts.L === opt.id;
                          return (
                            <div key={opt.id} className={`mb-2 grid grid-cols-[1fr_60px_60px] items-center gap-2 rounded-lg border p-3 transition-all ${isM ? "border-emerald-500/60 bg-emerald-500/5" : isL ? "border-amber-500/60 bg-amber-500/5" : "border-border bg-card hover:bg-muted/40"}`}>
                              <div>
                                <span className="text-sm font-medium text-foreground">{opt.option_text}</span>
                                {showEnglish && opt.option_text_en && <span className="mt-0.5 block text-xs italic text-muted-foreground">{opt.option_text_en}</span>}
                              </div>
                              <button type="button" onClick={() => handleDiscPick("M", opt.id)}
                                className={`mx-auto h-9 w-9 rounded-md border-2 text-sm font-bold transition-all ${isM ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500/60"}`}>{isM ? "✓" : ""}</button>
                              <button type="button" onClick={() => handleDiscPick("L", opt.id)}
                                className={`mx-auto h-9 w-9 rounded-md border-2 text-sm font-bold transition-all ${isL ? "border-amber-500 bg-amber-500 text-white" : "border-border hover:border-amber-500/60"}`}>{isL ? "✓" : ""}</button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : q.question_type === "multi_choice" ? (
                    <>
                      <p className="text-xs font-medium text-amber-400">Pilih 2 jawaban yang benar.</p>
                      {opts.map((opt: any) => {
                        const picked = new Set((currentAns || "").split("+").filter(Boolean));
                        const isSelected = picked.has(opt.id);
                        return (
                          <button key={opt.id} onClick={() => handleMultiPick(opt.id)}
                            className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/10 glow-border" : "border-border bg-card hover:border-primary/40 hover:bg-muted"}`}>
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60"}`}>{isSelected ? "✓" : opt.option_label}</span>
                            <div className="flex-1">
                              {opt.image_url && <img src={opt.image_url} alt={opt.option_label} className="mb-2 max-h-32 rounded border border-border bg-white" loading="lazy" />}
                              <span className="text-sm font-medium text-foreground">{opt.option_label}. {opt.option_text}</span>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    opts.map((opt: any) => {
                      const isSelected = currentAns === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                          className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/10 glow-border" : "border-border bg-card hover:border-primary/40 hover:bg-muted"}`}>
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60"}`}>{opt.option_label}</span>
                          <div className="flex-1">
                            {opt.image_url && <img src={opt.image_url} alt={opt.option_label} className="mb-2 max-h-32 rounded border border-border bg-white" loading="lazy" />}
                            <span className="text-sm font-medium text-foreground">{opt.option_text}</span>
                            {showEnglish && opt.option_text_en && <span className="mt-0.5 block text-xs italic text-muted-foreground">{opt.option_text_en}</span>}
                            {opt.option_definition && <span className="mt-1 block text-xs text-muted-foreground">{opt.option_definition}</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => (isKraepelin ? setColIdx((c) => Math.max(0, c - 1)) : setIdx((i) => Math.max(0, i - 1)))}
              disabled={isKraepelin ? colIdx === 0 : idx === 0}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />Sebelumnya
            </button>
            {isKraepelin ? (
              <button
                onClick={() => setColIdx((c) => Math.min(kraepelinColumns.length - 1, c + 1))}
                disabled={colIdx >= kraepelinColumns.length - 1}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40">
                Kolom Berikutnya<ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                disabled={idx >= questions.length - 1}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40">
                Selanjutnya<ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestInstruments;
