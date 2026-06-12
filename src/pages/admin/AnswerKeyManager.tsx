import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Save, ChevronLeft, ListChecks } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Inst { id: string; name: string; category: string; scoring_method: string; }
interface Q { id: string; question_number: number; question_text: string; category: string | null; subtest_code: string | null; question_type: string; }
interface O { id: string; question_id: string; option_label: string; option_text: string; score_value: number; category_target: string | null; is_correct: boolean | null; display_order: number; }
interface IstSeedOption { label?: string; text: string; score: number; }

const IST_INSTRUMENT_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';
const CFIT_ANSWER_KEY: Record<number, string[]> = {
  1: ["B"], 2: ["C"], 3: ["B"], 4: ["D"], 5: ["E"], 6: ["B"], 7: ["D"], 8: ["B"], 9: ["E"], 10: ["C"], 11: ["B"], 12: ["B"], 13: ["E"],
  14: ["B", "E"], 15: ["A", "E"], 16: ["A", "D"], 17: ["C", "E"], 18: ["B", "E"], 19: ["A", "D"], 20: ["B", "E"], 21: ["B", "E"], 22: ["A", "D"], 23: ["B", "D"], 24: ["A", "E"], 25: ["C", "D"], 26: ["B", "C"], 27: ["A", "B"],
  28: ["E"], 29: ["E"], 30: ["E"], 31: ["B"], 32: ["C"], 33: ["D"], 34: ["E"], 35: ["E"], 36: ["A"], 37: ["A"], 38: ["F"], 39: ["C"], 40: ["C"],
  41: ["B"], 42: ["A"], 43: ["D"], 44: ["D"], 45: ["A"], 46: ["B"], 47: ["C"], 48: ["D"], 49: ["A"], 50: ["D"],
};

const getCfitMeta = (questionNumber: number) => {
  if (questionNumber <= 13) return { subtest_code: "S1", category: "Series", question_type: "single_choice", time_limit_minutes: 3, group_number: 1, labels: ["A", "B", "C", "D", "E", "F"] };
  if (questionNumber <= 27) return { subtest_code: "S2", category: "Classifications", question_type: "multi_choice", time_limit_minutes: 4, group_number: 2, labels: ["A", "B", "C", "D", "E"] };
  if (questionNumber <= 40) return { subtest_code: "S3", category: "Matrices", question_type: "single_choice", time_limit_minutes: 3, group_number: 3, labels: ["A", "B", "C", "D", "E", "F"] };
  return { subtest_code: "S4", category: "Conditions", question_type: "single_choice", time_limit_minutes: 3, group_number: 4, labels: ["A", "B", "C", "D", "E"] };
};

const IST_ANSWER_KEY: Record<number, string | number> = {
  1: 'E', 2: 'C', 3: 'D', 4: 'D', 5: 'D', 6: 'B', 7: 'C', 8: 'A', 9: 'E', 10: 'B',
  11: 'C', 12: 'D', 13: 'D', 14: 'E', 15: 'C', 16: 'A', 17: 'B', 18: 'B', 19: 'C', 20: 'B',
  21: 'B', 22: 'B', 23: 'D', 24: 'C', 25: 'C', 26: 'C', 27: 'C', 28: 'D', 29: 'D', 30: 'A',
  31: 'E', 32: 'A', 33: 'A', 34: 'B', 35: 'C', 36: 'A', 37: 'D', 38: 'E', 39: 'B', 40: 'C',
  41: 'C', 42: 'E', 43: 'D', 44: 'D', 45: 'D', 46: 'A', 47: 'D', 48: 'B', 49: 'E', 50: 'D',
  51: 'C', 52: 'C', 53: 'C', 54: 'C', 55: 'D', 56: 'C', 57: 'C', 58: 'D', 59: 'E', 60: 'E',
  61: 'B', 62: 'C', 63: 'D', 64: 'C', 65: 'A', 66: 'B', 67: 'A', 68: 'B', 69: 'A', 70: 'B',
  71: 'C', 72: 'A', 73: 'A', 74: 'B', 75: 'D', 76: 'A',
  77: 35, 78: 280, 79: 205, 80: 26, 81: 30, 82: 70, 83: 45, 84: 50, 85: 84, 86: 78,
  87: 19, 88: 6, 89: 75, 90: 90, 91: 120, 92: 17, 93: 36, 94: 5, 95: 48, 96: 1,
  97: 27, 98: 25, 99: 27, 100: 15, 101: 46, 102: 10, 103: 42, 104: 7, 105: 5, 106: 14,
  107: 8, 108: 14, 109: 45, 110: 63, 111: 12, 112: 80, 113: 14, 114: 12, 115: 63, 116: 10,
  117: 'A', 118: 'C', 119: 'B', 120: 'A', 121: 'D', 122: 'B', 123: 'C', 124: 'E', 125: 'E', 126: 'D',
  127: 'E', 128: 'B', 129: 'D', 130: 'C', 131: 'B', 132: 'A', 133: 'B', 134: 'D', 135: 'C', 136: 'A',
  137: 'A', 138: 'C', 139: 'D', 140: 'E', 141: 'A', 142: 'C', 143: 'D', 144: 'C', 145: 'E', 146: 'A',
  147: 'B', 148: 'D', 149: 'E', 150: 'B', 151: 'D', 152: 'B', 153: 'A', 154: 'E', 155: 'B', 156: 'C',
  157: 'D', 158: 'E', 159: 'B', 160: 'C', 161: 'A', 162: 'A', 163: 'D', 164: 'E', 165: 'C', 166: 'B',
  167: 'B', 168: 'A', 169: 'E', 170: 'C', 171: 'D', 172: 'B', 173: 'E', 174: 'A', 175: 'C', 176: 'D',
};

const IST_GE_SCORE_KEY: Record<number, Record<string, number>> = {
  61: { bunga: 2, kembang: 2, perdu: 2, "tumbuh tumbuhan": 1, tangkai: 1, harum: 1, pohon: 0 },
  62: { "alat indera": 2, indera: 2, "panca indera": 2, organ: 1, "alat tubuh": 1, kepala: 0 },
  63: { hablur: 2, kristal: 2, "zat arang": 2, berkilauan: 1, mengkilat: 1, bening: 1 },
  64: { musim: 2, cuaca: 1, iklim: 0 },
  65: { "pembawa berita": 2, "alat perhubungan": 2, telekomunikasi: 1, perhubungan: 1, komunikasi: 1 },
  66: { "alat optik": 2, optik: 2, lensa: 1, melihat: 0, alat: 0, "alat melihat": 0 },
  67: { "alat pencernaan": 2, "jalan makanan": 1, perut: 1, "isi perut": 1, "pencernaan makanan": 1, makanan: 0 },
  68: { jumlah: 2, kuantitas: 2, "jumlah kuantitas": 2, "penyebut jumlah": 2, "penyertaan jumlah": 2, mengukur: 1, ukuran: 1, uang: 0 },
  69: { bibit: 2, bakal: 2, embrio: 2, "bibit bakal embrio": 2, "alat pembiak": 2, "permulaan penghidupan": 2, sel: 1, pembiakan: 1, pertanian: 0, keturunan: 0 },
  70: { simbol: 2, lambang: 2, tanda: 2, "lambang tanda": 2, nama: 1, "tanda pengenal": 1, warna: 0 },
  71: { makhluk: 2, organism: 2, organisme: 2, "makhluk organism": 2, "makhluk hidup": 2, tumbuh: 1, "ilmu hayat": 1, biologi: 1, hidup: 0, hutan: 0, "hidup hutan": 0, hayat: 0 },
  72: { wadah: 2, "tempat pengisi": 2, "wadah tempat pengisi": 2, "tempat penyimpan": 2, alat: 1, "tempat sesuatu": 1, "alat tempat sesuatu": 1, tempat: 1, benda: 1, "tempat benda": 1, lubang: 0 },
  73: { "pengertian waktu": 2, batas: 2, waktu: 1, lamanya: 1, "waktu lamanya": 1, masa: 1, saat: 1, "masa saat": 1, "kata waktu": 0, buku: 0 },
  74: { "kata sifat": 2, "kata sifat watak": 2, "sifat karakter": 2, sifat: 1, uang: 0, karakter: 0, "uang karakter": 0, watak: 0 },
  75: { "regulator harga": 2, "pengertian ekonomi": 2, dagang: 1, pembelian: 1, "dagang pembelian": 1, penjualan: 1, niaga: 1, "jual beli": 1, "niaga jual beli": 1, "lawan kata": 0 },
  76: { "pengertian ruang": 2, "penyebut ruang": 2, arah: 1, tempat: 1, ruang: 1, "tempat ruang": 1, "arah tempat ruang": 1, letak: 1, "penunjuk tempat": 1, "letak penunjuk tempat": 1, "penentuan daerah": 1, daerah: 0, ruangan: 0, "daerah ruangan": 0, tingkatan: 0, kata: 0, "tingkatan kata": 0 },
};

const IST_GE_SEED_OPTIONS: Record<number, IstSeedOption[]> = {
  61: [{ text: "Bunga", score: 2 }, { text: "Kembang", score: 2 }, { text: "Perdu", score: 2 }, { text: "Tumbuh-tumbuhan", score: 1 }, { text: "Tangkai", score: 1 }, { text: "Harum", score: 1 }, { text: "Pohon", score: 0 }],
  62: [{ text: "Alat indera", score: 2 }, { text: "Indera", score: 2 }, { text: "Panca Indera", score: 2 }, { text: "Organ", score: 1 }, { text: "Alat tubuh", score: 1 }, { text: "Kepala", score: 0 }],
  63: [{ text: "Hablur", score: 2 }, { text: "Kristal", score: 2 }, { text: "Zat arang", score: 2 }, { text: "Berkilauan", score: 1 }, { text: "Mengkilat", score: 1 }, { text: "Bening", score: 1 }],
  64: [{ text: "Musim", score: 2 }, { text: "Cuaca", score: 1 }, { text: "Iklim", score: 0 }],
  65: [{ text: "Pembawa Berita", score: 2 }, { text: "Alat Perhubungan", score: 2 }, { text: "Telekomunikasi", score: 1 }, { text: "Perhubungan", score: 1 }, { text: "Komunikasi", score: 1 }],
  66: [{ text: "alat optik", score: 2 }, { text: "Optik", score: 2 }, { text: "Lensa", score: 1 }, { text: "Melihat", score: 0 }, { text: "alat", score: 0 }, { text: "Alat Melihat", score: 0 }],
  67: [{ text: "Alat Pencernaan", score: 2 }, { text: "Jalan Makanan", score: 1 }, { text: "Perut", score: 1 }, { text: "Isi Perut", score: 1 }, { text: "Pencernaan Makanan", score: 1 }, { text: "Makanan", score: 0 }],
  68: [{ text: "Jumlah/Kuantitas", score: 2 }, { text: "Penyebut Jumlah", score: 2 }, { text: "Penyertaan Jumlah", score: 2 }, { text: "Mengukur", score: 1 }, { text: "Ukuran", score: 1 }, { text: "Uang", score: 0 }],
  69: [{ text: "Bibit/bakal/embrio", score: 2 }, { text: "Alat Pembiak", score: 2 }, { text: "Permulaan Penghidupan", score: 2 }, { text: "Sel", score: 1 }, { text: "Pembiakan", score: 1 }, { text: "Pertanian", score: 0 }, { text: "Keturunan", score: 0 }],
  70: [{ text: "Simbol", score: 2 }, { text: "Lambang", score: 2 }, { text: "Tanda", score: 2 }, { text: "Nama", score: 1 }, { text: "Tanda Pengenal", score: 1 }, { text: "Warna", score: 0 }],
  71: [{ text: "Makhluk", score: 2 }, { text: "Organism", score: 2 }, { text: "Makhluk Hidup", score: 2 }, { text: "Tumbuh", score: 1 }, { text: "Ilmu hayat", score: 1 }, { text: "Biologi", score: 1 }, { text: "Hidup", score: 0 }, { text: "Hutan", score: 0 }, { text: "Hayat", score: 0 }],
  72: [{ text: "Wadah", score: 2 }, { text: "Tempat pengisi", score: 2 }, { text: "Tempat Penyimpan", score: 2 }, { text: "Alat", score: 1 }, { text: "Tempat sesuatu", score: 1 }, { text: "Tempat", score: 1 }, { text: "Benda", score: 1 }, { text: "Lubang", score: 0 }],
  73: [{ text: "Pengertian Waktu", score: 2 }, { text: "Batas", score: 2 }, { text: "Waktu", score: 1 }, { text: "Lamanya", score: 1 }, { text: "Masa/saat", score: 1 }, { text: "Kata Waktu", score: 0 }, { text: "Buku", score: 0 }],
  74: [{ text: "Kata Sifat - Watak", score: 2 }, { text: "Sifat Karakter", score: 2 }, { text: "Sifat", score: 1 }, { text: "Uang", score: 0 }, { text: "Karakter", score: 0 }, { text: "Watak", score: 0 }],
  75: [{ text: "Regulator harga", score: 2 }, { text: "Pengertian Ekonomi", score: 2 }, { text: "Dagang", score: 1 }, { text: "Pembelian", score: 1 }, { text: "Penjualan", score: 1 }, { text: "Niaga", score: 1 }, { text: "Jual beli", score: 1 }, { text: "Lawan kata", score: 0 }],
  76: [{ text: "Pengertian ruang", score: 2 }, { text: "Penyebut ruang", score: 2 }, { text: "Arah", score: 1 }, { text: "Tempat/ruang", score: 1 }, { text: "Letak", score: 1 }, { text: "penunjuk tempat", score: 1 }, { text: "Penentuan Daerah", score: 1 }, { text: "Daerah", score: 0 }, { text: "Ruangan", score: 0 }, { text: "Tingkatan", score: 0 }, { text: "Kata", score: 0 }],
};

const normalizeIstAnswer = (value: string | number | null | undefined) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const getIstAnswerCandidates = (value: string) => {
  const rawParts = value
    .split(/[–—/\-]/g)
    .map(part => normalizeIstAnswer(part))
    .filter(Boolean);
  return Array.from(new Set([normalizeIstAnswer(value), ...rawParts]));
};

const getIstGeScore = (questionNumber: number, optionText: string) => {
  const scoreKey = IST_GE_SCORE_KEY[questionNumber];
  if (!scoreKey) return null;
  const scores = getIstAnswerCandidates(optionText)
    .map(candidate => scoreKey[candidate])
    .filter((score): score is number => score !== undefined);
  return scores.length > 0 ? Math.max(...scores) : null;
};

const optionLabel = (idx: number) => String.fromCharCode(65 + idx);

const getIstSeedOptions = (q: Q): IstSeedOption[] => {
  const geOptions = IST_GE_SEED_OPTIONS[q.question_number];
  if (geOptions) return geOptions.map((option, idx) => ({ ...option, label: option.label || optionLabel(idx) }));

  const answer = IST_ANSWER_KEY[q.question_number];
  if (q.question_number >= 77 && q.question_number <= 116 && answer !== undefined) {
    return [{ label: String(answer), text: String(answer), score: 1 }];
  }

  return [];
};

const getExpectedOptionScore = (q: Q, o: O, isCorrect: boolean) => {
  if (!isCorrect) return 0;
  const geScore = getIstGeScore(q.question_number, o.option_text);
  if (geScore !== null) return geScore;
  return 1;
};

const AnswerKeyManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [instruments, setInstruments] = useState<Inst[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [opts, setOpts] = useState<Record<string, O[]>>({});
  const [dirty, setDirty] = useState<Record<string, Partial<O>>>({});
  const [loading, setLoading] = useState(false);

  const currentInstrument = instruments.find(i => i.id === selected);
  const hasIstQuestionSet = questions.some(q => q.question_number === 61 && normalizeIstAnswer(q.question_text).includes("mawar melati"))
    || questions.some(q => q.question_number === 116);
  const isIstSelected = selected === IST_INSTRUMENT_ID || currentInstrument?.name.toUpperCase().includes("IST") || hasIstQuestionSet;
  const isCfitSelected = currentInstrument?.name.toUpperCase().includes("CFIT")
    || currentInstrument?.name.toUpperCase().includes("CULTURE FAIR")
    || questions.some(q => q.question_number === 14 && q.question_number <= 27);

  const applyIstAnswerKey = async () => {
    if (!isIstSelected) return;
    const newDirty: Record<string, Partial<O>> = {};
    setLoading(true);

    try {
      let workingOpts: Record<string, O[]> = { ...opts };
      const rowsToInsert = questions.flatMap(q => {
        const existing = workingOpts[q.id] || [];
        const existingTexts = new Set(existing.map(o => normalizeIstAnswer(o.option_text)));

        return getIstSeedOptions(q).filter(option => !existingTexts.has(normalizeIstAnswer(option.text))).map((option, idx) => ({
          question_id: q.id,
          option_label: option.label || optionLabel(idx),
          option_text: option.text,
          option_text_en: option.text,
          score_value: option.score,
          is_correct: option.score > 0,
          display_order: existing.length + idx,
        }));
      });

      if (rowsToInsert.length > 0) {
        const { data: inserted, error } = await supabase
          .from("test_question_options")
          .insert(rowsToInsert)
          .select("*");

        if (error) throw error;
        (inserted as O[] || []).forEach(o => { (workingOpts[o.question_id] ||= []).push(o); });
      }

      const updatedOpts = { ...workingOpts };

      questions.forEach(q => {
        const geScoreKey = IST_GE_SCORE_KEY[q.question_number];
        if (geScoreKey) {
          const qOpts = updatedOpts[q.id] || [];
          updatedOpts[q.id] = qOpts.map(o => {
            const score = getIstGeScore(q.question_number, o.option_text);
            const score_value = score ?? 0;
            const is_correct = score_value > 0;
            if (o.is_correct !== is_correct || o.score_value !== score_value) {
              newDirty[o.id] = { is_correct, score_value };
            }
            return { ...o, is_correct, score_value };
          });
          return;
        }

        const answer = IST_ANSWER_KEY[q.question_number];
        if (answer === undefined) return;

        const qOpts = updatedOpts[q.id] || [];
        const normalizedAnswer = normalizeIstAnswer(answer);
        const matched = qOpts.find(o => normalizeIstAnswer(o.option_label) === normalizedAnswer)
          || qOpts.find(o => normalizeIstAnswer(o.option_text) === normalizedAnswer);

        updatedOpts[q.id] = qOpts.map(o => {
          const is_correct = Boolean(matched && o.id === matched.id);
          const score_value = getExpectedOptionScore(q, o, is_correct);
          if (o.is_correct !== is_correct || o.score_value !== score_value) {
            newDirty[o.id] = { is_correct, score_value };
          }
          return { ...o, is_correct, score_value };
        });
      });

      setOpts(updatedOpts);

      if (Object.keys(newDirty).length > 0) {
        setDirty(prev => ({ ...prev, ...newDirty }));
      }

      if (rowsToInsert.length > 0 || Object.keys(newDirty).length > 0) {
        Swal.fire({ icon: "success", title: "IST jawaban diterapkan", text: `${rowsToInsert.length} opsi dibuat. ${Object.keys(newDirty).length} opsi diubah.`, timer: 1800, showConfirmButton: false });
      } else {
        Swal.fire({ icon: "info", title: "Tidak ada perubahan", text: "Semua kunci jawaban IST sudah sesuai.", timer: 1500, showConfirmButton: false });
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal menerapkan kunci IST", text: error?.message || "Terjadi kesalahan saat membuat opsi jawaban." });
    } finally {
      setLoading(false);
    }
  };

  const applyCfitAnswerKey = async () => {
    if (!isCfitSelected) return;
    const newDirty: Record<string, Partial<O>> = {};
    setLoading(true);

    try {
      let workingOpts: Record<string, O[]> = { ...opts };
      const updatedQuestions = questions.map(q => {
        const key = CFIT_ANSWER_KEY[q.question_number];
        if (!key) return q;
        const meta = getCfitMeta(q.question_number);
        return { ...q, category: meta.category, subtest_code: meta.subtest_code, question_type: meta.question_type };
      });

      for (const q of questions) {
        const key = CFIT_ANSWER_KEY[q.question_number];
        if (!key) continue;
        const meta = getCfitMeta(q.question_number);

        await supabase
          .from("test_questions")
          .update({
            category: meta.category,
            subtest_code: meta.subtest_code,
            question_type: meta.question_type,
            scoring_rule: "correct_only",
            time_limit_minutes: meta.time_limit_minutes,
            group_number: meta.group_number,
          } as any)
          .eq("id", q.id);

        const existing = workingOpts[q.id] || [];
        const existingLabels = new Set(existing.map(o => normalizeIstAnswer(o.option_label)));
        const rowsToInsert = meta.labels
          .filter(label => !existingLabels.has(normalizeIstAnswer(label)))
          .map((label, idx) => ({
            question_id: q.id,
            option_label: label,
            option_text: label,
            option_text_en: label,
            score_value: key.includes(label) ? 1 : 0,
            category_target: meta.category,
            is_correct: key.includes(label),
            display_order: existing.length + idx + 1,
          }));

        if (rowsToInsert.length > 0) {
          const { data: inserted, error } = await supabase
            .from("test_question_options")
            .insert(rowsToInsert)
            .select("*");
          if (error) throw error;
          (inserted as O[] || []).forEach(o => { (workingOpts[o.question_id] ||= []).push(o); });
        }

        workingOpts[q.id] = (workingOpts[q.id] || [])
          .filter(o => meta.labels.includes(o.option_label.toUpperCase()))
          .map(o => {
            const label = o.option_label.toUpperCase();
            const is_correct = key.includes(label);
            const score_value = is_correct ? 1 : 0;
            const category_target = meta.category;
            if (o.is_correct !== is_correct || Number(o.score_value) !== score_value || o.category_target !== category_target) {
              newDirty[o.id] = { is_correct, score_value, category_target };
            }
            return { ...o, is_correct, score_value, category_target };
          });
      }

      setQuestions(updatedQuestions);
      setOpts(workingOpts);

      if (Object.keys(newDirty).length > 0) {
        setDirty(prev => ({ ...prev, ...newDirty }));
      }

      Swal.fire({
        icon: Object.keys(newDirty).length > 0 ? "success" : "info",
        title: Object.keys(newDirty).length > 0 ? "Kunci CFIT diterapkan" : "Kunci CFIT sudah sesuai",
        text: Object.keys(newDirty).length > 0
          ? `${Object.keys(newDirty).length} opsi disesuaikan. Klik Simpan untuk menyimpan perubahan skor dan centang.`
          : "Semua centang, skor, dan kategori target CFIT 3A sudah sesuai.",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal menerapkan kunci CFIT", text: error?.message || "Terjadi kesalahan saat menyelaraskan kunci CFIT 3A." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.from("test_instruments").select("id, name, category, scoring_method").order("name").then(({ data }) => {
      setInstruments((data as Inst[]) || []);
      // Pre-select instrument from URL parameter
      const instrumentParam = searchParams.get("instrument");
      if (instrumentParam && (data as Inst[])?.some(i => i.id === instrumentParam)) {
        setSelected(instrumentParam);
      }
    });
  }, [searchParams]);

  const load = async (id: string) => {
    setLoading(true); setDirty({});
    const { data: qs } = await supabase.from("test_questions").select("id, question_number, question_text, category, subtest_code, question_type").eq("instrument_id", id).order("question_number");
    setQuestions((qs as Q[]) || []);
    if (qs && qs.length) {
      const { data: os } = await supabase.from("test_question_options").select("*").in("question_id", qs.map((q: any) => q.id)).order("display_order");
      const grouped: Record<string, O[]> = {};
      (os as O[] || []).forEach(o => { (grouped[o.question_id] ||= []).push(o); });
      setOpts(grouped);
    } else setOpts({});
    setLoading(false);
  };

  useEffect(() => { if (selected) load(selected); }, [selected]);

  const patch = (oid: string, p: Partial<O>) => {
    setDirty(prev => ({ ...prev, [oid]: { ...prev[oid], ...p } }));
    setOpts(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(qid => { copy[qid] = copy[qid].map(o => o.id === oid ? { ...o, ...p } : o); });
      return copy;
    });
  };

  const setCorrect = (q: Q, oid: string) => {
    const qOpts = opts[q.id] || [];
    if (q.question_type === "multi_choice") {
      const target = qOpts.find(o => o.id === oid);
      if (!target) return;
      const is_correct = !target?.is_correct;
      patch(oid, { is_correct, score_value: getExpectedOptionScore(q, target, is_correct) });
    } else {
      qOpts.forEach(o => {
        const is_correct = o.id === oid;
        patch(o.id, { is_correct, score_value: getExpectedOptionScore(q, o, is_correct) });
      });
    }
  };

  const saveAll = async () => {
    const entries = Object.entries(dirty);
    if (!entries.length) return;
    for (const [oid, p] of entries) {
      await supabase.from("test_question_options").update(p as any).eq("id", oid);
    }
    setDirty({});
    Swal.fire({ icon: "success", title: "Tersimpan", text: `${entries.length} perubahan disimpan.`, timer: 1500, showConfirmButton: false });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate("/admin/test-instruments")} className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Alat Tes
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Manajer Kunci Jawaban</h1>
              <p className="text-sm text-muted-foreground">Atur kunci jawaban benar, skor, dan kategori target untuk setiap opsi — semua alat tes.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {isIstSelected && (
                <button onClick={applyIstAnswerKey} type="button" className="rounded-lg border border-primary bg-transparent px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                  Terapkan Kunci IST
                </button>
              )}
              {isCfitSelected && (
                <button onClick={applyCfitAnswerKey} type="button" className="rounded-lg border border-primary bg-transparent px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                  Terapkan Kunci CFIT 3A
                </button>
              )}
              <button onClick={saveAll} disabled={!Object.keys(dirty).length} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40">
                <Save className="h-4 w-4" /> Simpan ({Object.keys(dirty).length})
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 glow-border">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pilih Alat Tes</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full max-w-md rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <option value="">— Pilih —</option>
            {instruments.map(i => <option key={i.id} value={i.id}>{i.name} · {i.category} · {i.scoring_method}</option>)}
          </select>
        </div>

        {loading && <p className="text-sm text-muted-foreground py-8 text-center">Memuat...</p>}

        {!loading && selected && questions.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center glass rounded-xl glow-border">Belum ada soal. Tambahkan via Bank Soal.</p>
        )}

        {!loading && questions.map(q => {
          const oo = opts[q.id] || [];
          return (
            <div key={q.id} className="glass rounded-xl p-4 glow-border">
              <div className="flex items-start gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">{q.question_number}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{q.question_text}</p>
                  <div className="flex gap-2 text-[10px] mt-1">
                    {q.subtest_code && <span className="rounded bg-amber-400/10 text-amber-400 px-1.5 py-0.5">Subtes {q.subtest_code}</span>}
                    {q.category && <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5">{q.category}</span>}
                  </div>
                </div>
              </div>
              {q.question_type === "multi_choice" && (
                <p className="mb-2 text-xs text-amber-400">Soal pilihan berpasangan — tandai 2 jawaban benar.</p>
              )}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 px-2">Label</th>
                    <th className="text-left py-1.5 px-2">Teks Opsi</th>
                    <th className="text-left py-1.5 px-2 w-20">Skor</th>
                    <th className="text-left py-1.5 px-2 w-32">Kategori Target</th>
                    <th className="text-center py-1.5 px-2 w-16">Benar</th>
                  </tr>
                </thead>
                <tbody>
                  {oo.map(o => (
                    <tr key={o.id} className="border-b border-border/40">
                      <td className="py-1.5 px-2 font-bold text-foreground">{o.option_label}</td>
                      <td className="py-1.5 px-2 text-foreground">{o.option_text}</td>
                      <td className="py-1.5 px-2">
                        <input type="number" step="0.5" value={o.score_value} onChange={e => patch(o.id, { score_value: parseFloat(e.target.value) || 0 })} className="w-16 rounded border border-border bg-muted px-1.5 py-0.5 text-xs" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="text" value={o.category_target || ""} onChange={e => patch(o.id, { category_target: e.target.value })} placeholder="D, Sanguine..." className="w-full rounded border border-border bg-muted px-1.5 py-0.5 text-xs" />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button onClick={() => setCorrect(q, o.id)} className={`h-6 w-6 rounded border-2 inline-flex items-center justify-center transition-all ${o.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500/60"}`}>
                          {o.is_correct && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AnswerKeyManager;
