import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Save, ChevronLeft, ListChecks } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Inst { id: string; name: string; category: string; scoring_method: string; }
interface Q { id: string; question_number: number; question_text: string; category: string | null; subtest_code: string | null; question_type: string; }
interface O { id: string; question_id: string; option_label: string; option_text: string; score_value: number; category_target: string | null; is_correct: boolean | null; display_order: number; }

const IST_INSTRUMENT_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';
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
  const isIstSelected = selected === IST_INSTRUMENT_ID || currentInstrument?.name.toUpperCase().includes("IST");

  const applyIstAnswerKey = () => {
    if (!isIstSelected) return;
    const newDirty: Record<string, Partial<O>> = {};

    setOpts(prevOpts => {
      const updatedOpts = { ...prevOpts };

      questions.forEach(q => {
        const answer = IST_ANSWER_KEY[q.question_number];
        if (answer === undefined) return;

        const qOpts = updatedOpts[q.id] || [];
        const normalizedAnswer = String(answer).trim();
        const matched = qOpts.find(o => String(o.option_label).trim() === normalizedAnswer)
          || qOpts.find(o => String(o.option_text).trim() === normalizedAnswer);

        updatedOpts[q.id] = qOpts.map(o => {
          const is_correct = Boolean(matched && o.id === matched.id);
          const score_value = is_correct ? 1 : 0;
          if (o.is_correct !== is_correct || o.score_value !== score_value) {
            newDirty[o.id] = { is_correct, score_value };
          }
          return { ...o, is_correct, score_value };
        });
      });

      return updatedOpts;
    });

    if (Object.keys(newDirty).length > 0) {
      setDirty(prev => ({ ...prev, ...newDirty }));
      Swal.fire({ icon: "success", title: "IST jawaban diterapkan", text: "Kunci IST sudah diatur sesuai mapping.", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "info", title: "Tidak ada perubahan", text: "Semua kunci jawaban IST sudah sesuai.", timer: 1500, showConfirmButton: false });
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

  const setCorrect = (qid: string, oid: string, multi: boolean) => {
    if (multi) {
      const target = opts[qid].find(o => o.id === oid);
      patch(oid, { is_correct: !target?.is_correct });
    } else {
      opts[qid].forEach(o => patch(o.id, { is_correct: o.id === oid }));
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
                        <button onClick={() => setCorrect(q.id, o.id, q.question_type === "multi_choice")} className={`h-6 w-6 rounded border-2 inline-flex items-center justify-center transition-all ${o.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500/60"}`}>
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
