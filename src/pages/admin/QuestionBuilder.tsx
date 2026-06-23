import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronLeft, Pencil, Check, X, Image as ImageIcon, Upload, Download } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { getAptitudeFallbackImage } from "@/lib/aptitudeImageFallback";

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

type AutoImageTemplate = "auto" | "series" | "matrix" | "rotation" | "analogy";

const encodeSvg = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const hashText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
};

const shapeSvg = (shape: string, x: number, y: number, size: number, color: string, rotate = 0, fill = "none") => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const stroke = `stroke="${color}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
  const transform = `transform="rotate(${rotate} ${cx} ${cy})"`;
  if (shape === "circle") return `<circle cx="${cx}" cy="${cy}" r="${size * 0.34}" fill="${fill}" ${stroke}/>`;
  if (shape === "triangle") return `<path d="M ${cx} ${y + 10} L ${x + size - 10} ${y + size - 10} L ${x + 10} ${y + size - 10} Z" fill="${fill}" ${stroke} ${transform}/>`;
  if (shape === "diamond") return `<path d="M ${cx} ${y + 8} L ${x + size - 8} ${cy} L ${cx} ${y + size - 8} L ${x + 8} ${cy} Z" fill="${fill}" ${stroke} ${transform}/>`;
  if (shape === "plus") return `<path d="M ${cx} ${y + 10} V ${y + size - 10} M ${x + 10} ${cy} H ${x + size - 10}" fill="none" ${stroke} ${transform}/>`;
  if (shape === "arrow") return `<path d="M ${x + 14} ${cy} H ${x + size - 18} M ${x + size - 34} ${y + 16} L ${x + size - 14} ${cy} L ${x + size - 34} ${y + size - 16}" fill="none" ${stroke} ${transform}/>`;
  return `<rect x="${x + 12}" y="${y + 12}" width="${size - 24}" height="${size - 24}" rx="8" fill="${fill}" ${stroke} ${transform}/>`;
};

const svgFrame = (width: number, height: number, title: string, body: string) => encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <text x="28" y="38" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#0f172a">${title}</text>
    ${body}
  </svg>
`);

const getTemplateForQuestion = (q: QuestionRow, requested: AutoImageTemplate): Exclude<AutoImageTemplate, "auto"> => {
  if (requested !== "auto") return requested;
  const text = `${q.question_text} ${q.category || ""}`.toLowerCase();
  if (/matrix|matriks|kotak|grid/.test(text)) return "matrix";
  if (/rotasi|rotate|putar|arah/.test(text)) return "rotation";
  if (/analogi|analogy|hubungan/.test(text)) return "analogy";
  return "series";
};

const buildAutoAptitudeImages = (q: QuestionRow, requested: AutoImageTemplate) => {
  const template = getTemplateForQuestion(q, requested);
  const seed = hashText(`${q.question_number}-${q.question_text}-${template}`);
  const shapes = ["circle", "square", "triangle", "diamond", "plus", "arrow"];
  const colors = ["#0f766e", "#2563eb", "#7c3aed", "#dc2626", "#ca8a04"];
  const s1 = shapes[seed % shapes.length];
  const s2 = shapes[(seed + 2) % shapes.length];
  const s3 = shapes[(seed + 4) % shapes.length];
  const color = colors[seed % colors.length];
  const accent = colors[(seed + 2) % colors.length];
  const rotations = [0, 45, 90, 135, 180];
  const rot = rotations[seed % rotations.length];

  if (template === "matrix") {
    const cells = Array.from({ length: 9 }).map((_, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = 52 + col * 116;
      const y = 62 + row * 92;
      if (idx === 8) {
        return `<rect x="${x}" y="${y}" width="80" height="64" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-dasharray="8 6" stroke-width="3"/><text x="${x + 40}" y="${y + 43}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#64748b">?</text>`;
      }
      return `<rect x="${x}" y="${y}" width="80" height="64" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>${shapeSvg(shapes[(seed + idx + row) % shapes.length], x + 8, y, 64, idx % 2 ? accent : color, (rot + idx * 45) % 360)}`;
    }).join("");
    return {
      questionImage: svgFrame(420, 360, `Soal #${q.question_number} - Matrix`, cells),
      optionsImage: buildOptionsSvg(q.question_number, shapes, colors, seed, "Pilih gambar yang melengkapi kotak kosong"),
    };
  }

  if (template === "rotation") {
    const body = [0, 1, 2, 3].map((idx) => {
      const x = 52 + idx * 88;
      return `<rect x="${x}" y="92" width="66" height="66" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>${shapeSvg("arrow", x + 1, 92, 64, color, idx * 90)}`;
    }).join("") + `<rect x="52" y="205" width="330" height="76" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><text x="217" y="252" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#334155">Arah berikutnya?</text>`;
    return {
      questionImage: svgFrame(430, 330, `Soal #${q.question_number} - Rotasi`, body),
      optionsImage: buildOptionsSvg(q.question_number, ["arrow", "arrow", "arrow", "arrow", "arrow"], colors, seed, "Pilih arah rotasi yang benar"),
    };
  }

  if (template === "analogy") {
    const body = `
      <rect x="42" y="80" width="96" height="96" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      ${shapeSvg(s1, 58, 92, 68, color, 0)}
      <text x="160" y="138" font-family="Arial" font-size="30" font-weight="700" fill="#64748b">:</text>
      <rect x="182" y="80" width="96" height="96" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      ${shapeSvg(s1, 198, 92, 68, accent, 90)}
      <text x="302" y="138" font-family="Arial" font-size="30" font-weight="700" fill="#64748b">=</text>
      <rect x="42" y="215" width="96" height="96" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      ${shapeSvg(s2, 58, 227, 68, color, 0)}
      <text x="160" y="273" font-family="Arial" font-size="30" font-weight="700" fill="#64748b">:</text>
      <rect x="182" y="215" width="96" height="96" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-dasharray="8 6" stroke-width="3"/>
      <text x="230" y="277" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#64748b">?</text>
    `;
    return {
      questionImage: svgFrame(360, 360, `Soal #${q.question_number} - Analogi`, body),
      optionsImage: buildOptionsSvg(q.question_number, shapes, colors, seed + 5, "Pilih gambar analogi yang sesuai"),
    };
  }

  const body = [0, 1, 2, 3, 4].map((idx) => {
    const x = 42 + idx * 78;
    if (idx === 4) {
      return `<rect x="${x}" y="110" width="58" height="58" rx="12" fill="#ffffff" stroke="#94a3b8" stroke-dasharray="8 6" stroke-width="3"/><text x="${x + 29}" y="149" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#64748b">?</text>`;
    }
    return `<rect x="${x}" y="110" width="58" height="58" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>${shapeSvg(idx % 2 ? s2 : s1, x + 2, 110, 54, idx % 2 ? accent : color, idx * 45)}`;
  }).join("") + `<text x="212" y="220" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">Lanjutkan pola gambar berikut.</text>`;
  return {
    questionImage: svgFrame(430, 280, `Soal #${q.question_number} - Deret Pola`, body),
    optionsImage: buildOptionsSvg(q.question_number, [s1, s2, s3, "square", "diamond"], colors, seed, "Pilih jawaban A-E"),
  };
};

function buildOptionsSvg(questionNumber: number, shapes: string[], colors: string[], seed: number, title: string) {
  const body = shapes.slice(0, 5).map((shape, idx) => {
    const x = 34 + idx * 94;
    const label = String.fromCharCode(65 + idx);
    return `
      <g>
        <rect x="${x}" y="78" width="72" height="82" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        ${shapeSvg(shape, x + 8, 84, 56, colors[(seed + idx) % colors.length], (seed + idx * 45) % 360)}
        <circle cx="${x + 36}" cy="184" r="17" fill="#0f172a"/>
        <text x="${x + 36}" y="190" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#ffffff">${label}</text>
      </g>
    `;
  }).join("");
  return svgFrame(520, 230, `Pilihan #${questionNumber} - ${title}`, body);
}

interface Instrument {
  id: string;
  name: string;
  name_en: string;
  category: string;
  scoring_method: string;
  question_count?: number;
}

interface QuestionRow {
  id: string;
  instrument_id: string;
  question_number: number;
  question_text: string;
  question_text_en: string | null;
  category: string | null;
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

const isKraepelinInstrument = (instrument?: Instrument | null) =>
  !!instrument && (instrument.name.toUpperCase().includes("KRAEPELIN") || instrument.scoring_method === "speed_accuracy");

const getKraepelinCorrectAnswer = (q: QuestionRow) => {
  if (!q) return "";
  const answerHint = String(q.question_text_en || "").trim();
  const marker = answerHint.match(/CORRECT_ANSWER\s*:\s*(\d+)/i);
  if (marker) return marker[1];
  if (/^\d$/.test(answerHint)) return answerHint;
  const sum = String(q.question_text || "").match(/(\d+)\s*\+\s*(\d+)/);
  if (!sum) return "";
  return String((Number(sum[1]) + Number(sum[2])) % 10);
};

const KRAEPELIN_DEFAULT_QUESTION_COUNT = 1350;
const KRAEPELIN_QUESTIONS_PER_COLUMN = 27;

const getInstrumentQuestionCount = (instrument: Instrument | null, questionCount: number) => {
  if (!instrument) return questionCount;
  if (instrument.question_count != null) return instrument.question_count;
  if (isKraepelinInstrument(instrument)) return KRAEPELIN_DEFAULT_QUESTION_COUNT;
  return questionCount;
};

const getKraepelinColumnCount = (instrument: Instrument | null, questionCount: number) => {
  if (!instrument) return undefined;
  const count = getInstrumentQuestionCount(instrument, questionCount);
  return Math.ceil(count / KRAEPELIN_QUESTIONS_PER_COLUMN);
};

const normalizeCsvHeader = (header: string) =>
  header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

const csvRowsFromText = (text: string) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : /,(?=(?:[^"]*"[^"]*")*[^\"]*$)/;
      const values = line
        .split(delimiter)
        .map((value) => value.trim().replace(/^"|"$/g, ""));
      return values;
    });
};

const buildCsvValue = (value: unknown) => {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
};

const buildImportQuestions = (rows: string[][]) => {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeCsvHeader);
  const idx = {
    question_number: headers.indexOf("question_number"),
    question_text: headers.indexOf("question_text"),
    question_text_en: headers.indexOf("question_text_en"),
    category: headers.indexOf("category"),
    question_type: headers.indexOf("question_type"),
    scoring_rule: headers.indexOf("scoring_rule"),
    correct_answer: headers.indexOf("correct_answer"),
    question_image: headers.indexOf("question_image"),
    options_image: headers.indexOf("options_image"),
  };

  return rows.slice(1).map((cols, index) => {
    const question_text = cols[idx.question_text] || "";
    const question_text_en = cols[idx.question_text_en] || "";
    const correct_answer = cols[idx.correct_answer] || "";
    return {
      question_number: Number(cols[idx.question_number] || "0") || index + 1,
      question_text,
      question_text_en: correct_answer ? `CORRECT_ANSWER: ${correct_answer}` : (question_text_en || null),
      category: cols[idx.category] || null,
      question_type: cols[idx.question_type] || "numeric",
      scoring_rule: cols[idx.scoring_rule] || "correct_only",
      question_image: cols[idx.question_image] || null,
      options_image: cols[idx.options_image] || null,
    };
  }).filter((item) => item.question_text);
};

const buildExportCsv = (rows: QuestionRow[]) => {
  const headers = [
    "question_number",
    "question_text",
    "question_text_en",
    "category",
    "question_type",
    "scoring_rule",
    "correct_answer",
    "question_image",
    "options_image",
  ];
  const lines = [headers.map(buildCsvValue).join(",")];
  rows.forEach((q) => {
    lines.push([
      q.question_number,
      q.question_text,
      q.question_text_en || "",
      q.category || "",
      q.question_type,
      q.scoring_rule,
      getKraepelinCorrectAnswer(q),
      q.question_image || "",
      q.options_image || "",
    ].map(buildCsvValue).join(","));
  });
  return lines.join("\n");
};

const QuestionBuilder = () => {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, OptionRow[]>>({});
  const [loading, setLoading] = useState(true);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const isKraepelin = isKraepelinInstrument(instrument);

  const load = async () => {
    if (!instrumentId) return;
    const [{ data: inst }, { data: qs }] = await Promise.all([
      supabase.from("test_instruments").select("id, name, name_en, category, scoring_method, question_count").eq("id", instrumentId).maybeSingle(),
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
          ${isKraepelin ? `<label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Jawaban Benar</label><input id="q-correct" class="swal2-input" placeholder="Contoh: 7" style="margin:0 0 10px;width:100%">` : ""}
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
          correct_answer: isKraepelin ? (document.getElementById("q-correct") as HTMLInputElement).value.trim() : undefined,
          category: (document.getElementById("q-cat") as HTMLInputElement).value.trim(),
          question_type: (document.getElementById("q-type") as HTMLSelectElement).value,
          scoring_rule: (document.getElementById("q-scoring") as HTMLSelectElement).value,
          _imageFile1: fileInput1?.files?.[0] || null,
          _imageFile2: fileInput2?.files?.[0] || null,
        };
      },
    });
    if (value) {
      const { _imageFile1, _imageFile2, correct_answer, ...payload } = value as any;
      let question_image: string | null = null;
      let options_image: string | null = null;
      if (_imageFile1) question_image = await uploadTestImage(_imageFile1, `q${nextNum}-soal`);
      if (_imageFile2) options_image = await uploadTestImage(_imageFile2, `q${nextNum}-pilihan`);
      const question_text_en = correct_answer
        ? `CORRECT_ANSWER: ${correct_answer}`
        : payload.question_text_en || null;
      await supabase.from("test_questions").insert({
        instrument_id: instrumentId,
        question_number: nextNum,
        ...payload,
        question_text_en,
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
          ${isKraepelin && q.question_type === "numeric" ? `<label style="display:block;margin-bottom:3px;font-weight:600;color:hsl(var(--muted-foreground))">Jawaban Benar</label><input id="q-correct" class="swal2-input" style="margin:0 0 10px;width:100%" value="${getKraepelinCorrectAnswer(q)}">` : ""}
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
          correct_answer: isKraepelin && q.question_type === "numeric" ? (document.getElementById("q-correct") as HTMLInputElement).value.trim() : undefined,
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
      const { _imageFile1, _imageFile2, _removeImage1, _removeImage2, correct_answer, ...payload } = value as any;
      const updates: any = { ...payload };
      if (isKraepelin && q.question_type === "numeric") {
        updates.question_text_en = correct_answer ? `CORRECT_ANSWER: ${correct_answer}` : payload.question_text_en || null;
      }
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

  const askImageTemplate = async (title: string) => {
    const { value } = await Swal.fire({
      title,
      html: `
        <div style="text-align:left;font-size:13px">
          <label style="display:block;margin-bottom:6px;font-weight:600;color:hsl(var(--muted-foreground))">Jenis gambar aptitude</label>
          <select id="auto-template" class="swal2-select" style="margin:0;width:100%">
            <option value="auto">Otomatis dari teks/kategori soal</option>
            <option value="series">Deret pola gambar</option>
            <option value="matrix">Matrix / kotak kosong</option>
            <option value="rotation">Rotasi / arah</option>
            <option value="analogy">Analogi gambar</option>
          </select>
          <p style="margin-top:12px;color:hsl(var(--muted-foreground));font-size:12px;line-height:1.6">
            Gambar dibuat otomatis sebagai SVG. Jika kurang tepat, gambar bisa diganti manual lewat menu edit soal.
          </p>
        </div>
      `,
      ...SWAL_THEME(),
      confirmButtonText: "Buat Gambar",
      showCancelButton: true,
      cancelButtonText: "Batal",
      width: 520,
      preConfirm: () => (document.getElementById("auto-template") as HTMLSelectElement).value as AutoImageTemplate,
    });
    return value as AutoImageTemplate | undefined;
  };

  const handleGenerateQuestionImages = async (q: QuestionRow) => {
    const template = await askImageTemplate(`Buat Gambar Otomatis #${q.question_number}`);
    if (!template) return;
    const generated = buildAutoAptitudeImages(q, template);
    const { error } = await supabase
      .from("test_questions")
      .update({
        question_image: generated.questionImage,
        options_image: generated.optionsImage,
      })
      .eq("id", q.id);
    if (error) {
      Swal.fire("Error", "Gagal menyimpan gambar otomatis", "error");
      return;
    }
    await load();
    Swal.fire({ icon: "success", title: "Gambar otomatis dibuat", timer: 1400, showConfirmButton: false, ...SWAL_THEME() });
  };

  const handleGenerateMissingImages = async () => {
    const targets = questions.filter((q) => !q.question_image && !q.options_image);
    if (targets.length === 0) {
      Swal.fire({ icon: "info", title: "Semua soal sudah punya gambar", ...SWAL_THEME() });
      return;
    }
    const template = await askImageTemplate(`Lengkapi ${targets.length} Soal`);
    if (!template) return;

    for (const q of targets) {
      const generated = buildAutoAptitudeImages(q, template);
      const { error } = await supabase
        .from("test_questions")
        .update({
          question_image: generated.questionImage,
          options_image: generated.optionsImage,
        })
        .eq("id", q.id);
      if (error) {
        console.error("Auto image generation error:", error);
        Swal.fire("Error", `Gagal menyimpan gambar soal #${q.question_number}`, "error");
        await load();
        return;
      }
    }

    await load();
    Swal.fire({ icon: "success", title: "Gambar otomatis selesai", text: `${targets.length} soal sudah dilengkapi gambar.`, ...SWAL_THEME() });
  };

  const handleCsvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const text = await file.text();
    const importedRows = buildImportQuestions(csvRowsFromText(text));
    if (importedRows.length === 0) {
      Swal.fire("Gagal", "Tidak ada baris valid di file yang dipilih.", "error");
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: `Impor ${importedRows.length} soal`,
      html: `
        <p style="text-align:left;font-size:13px;line-height:1.5;color:hsl(var(--muted-foreground));">File akan menambahkan soal ke alat tes ini. Pastikan kolom <strong>question_number</strong>, <strong>question_text</strong>, dan <strong>correct_answer</strong> tersedia untuk Kraepelin.</p>
      `,
      ...SWAL_THEME(),
      showCancelButton: true,
      confirmButtonText: "Impor sekarang",
      cancelButtonText: "Batal",
      width: 560,
    });
    if (!isConfirmed) return;

    const lastNumber = questions[questions.length - 1]?.question_number || 0;
    const rowsWithNumbers = importedRows.map((row, index) => ({
      ...row,
      question_number: row.question_number || lastNumber + index + 1,
    }));

    const { error } = await supabase.from("test_questions").insert(
      rowsWithNumbers.map((row) => ({
        instrument_id: instrumentId,
        ...row,
      }))
    );
    if (error) {
      Swal.fire("Error", "Gagal mengimpor soal dari file.", "error");
      return;
    }
    await load();
    Swal.fire("Sukses", `${rowsWithNumbers.length} soal berhasil diimpor.`, "success");
  };

  const handleImportQuestions = () => {
    csvInputRef.current?.click();
  };

  const handleExportQuestions = () => {
    const csv = buildExportCsv(questions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${instrument?.name?.replace(/\s+/g, "_").toLowerCase() || "questions"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              <p className="text-sm text-muted-foreground">
                {instrument.category} · {getInstrumentQuestionCount(instrument, questions.length)} soal
                {isKraepelin ? ` · ${getKraepelinColumnCount(instrument, questions.length)} kolom` : ` · ${instrument.scoring_method || "—"}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={handleAddQuestion} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary">
                <Plus className="h-4 w-4" /> Tambah Soal
              </button>
              <button onClick={handleImportQuestions} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80">
                <Upload className="h-4 w-4" /> Impor CSV/TSV
              </button>
              <button onClick={handleExportQuestions} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80">
                <Download className="h-4 w-4" /> Ekspor CSV
              </button>
            </div>
          </div>
          <input
            ref={csvInputRef}
            type="file"
            accept=",.csv,.tsv,text/csv,text/tab-separated-values"
            className="hidden"
            onChange={handleCsvFileChange}
          />
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
              const aptitudeFallbackImage = getAptitudeFallbackImage(q, instrument.name);
              return (
                <div key={q.id} className="glass rounded-xl p-5 glow-border space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {q.question_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">{q.question_text}</p>
                      {q.question_text_en && <p className="text-xs text-muted-foreground italic mt-1">{q.question_text_en}</p>}
                      {isKraepelin && q.question_type === "numeric" && (
                        <p className="text-xs font-semibold text-primary mt-1">Kunci: {getKraepelinCorrectAnswer(q) || "—"}</p>
                      )}
                      {(q.question_image || q.options_image || aptitudeFallbackImage) && (
                        <div className="mt-3 space-y-3">
                          {q.question_image && (
                            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Gambar 1 - Soal/Pola:</span>
                                <a href={q.question_image} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:underline ml-auto">Buka di tab baru</a>
                              </div>
                              <img
                                src={q.question_image}
                                alt="Soal"
                                className="max-h-48 w-auto rounded border border-border bg-white"
                                onError={(event) => {
                                  if (!aptitudeFallbackImage) return;
                                  const target = event.currentTarget;
                                  if (target.src !== aptitudeFallbackImage) target.src = aptitudeFallbackImage;
                                }}
                              />
                            </div>
                          )}
                          {!q.question_image && !q.options_image && aptitudeFallbackImage && (
                            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Gambar Soal Aptitude:</span>
                                <span className="ml-auto rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">Fallback</span>
                              </div>
                              <img src={aptitudeFallbackImage} alt="Gambar soal Aptitude" className="max-h-48 w-auto rounded border border-border bg-white" />
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

                  {(q.question_type === 'essay' || q.question_type === 'text') ? (
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kunci Jawaban Tersembunyi ({opts.length})</p>
                        <button onClick={() => handleAddOption(q)} className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                          <Plus className="h-3 w-3" /> Tambah Kunci
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic mb-2">Soal esai - kandidat mengetik jawaban. Opsi di bawah adalah kunci jawaban untuk scoring.</p>
                      {opts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2 text-center">Belum ada kunci jawaban</p>
                      ) : (
                        <div className="grid gap-1.5">
                          {opts.map((o) => (
                            <div key={o.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-card border border-border text-xs font-bold text-foreground">{o.option_label}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground truncate">{o.option_text}</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
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
                  ) : (
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
                  )}
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
