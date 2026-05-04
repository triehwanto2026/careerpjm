import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Save, ChevronLeft, ListChecks } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Inst { id: string; name: string; category: string; scoring_method: string; }
interface Q { id: string; question_number: number; question_text: string; category: string | null; subtest_code: string | null; }
interface O { id: string; question_id: string; option_label: string; option_text: string; score_value: number; category_target: string | null; is_correct: boolean | null; display_order: number; }

const AnswerKeyManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [instruments, setInstruments] = useState<Inst[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [opts, setOpts] = useState<Record<string, O[]>>({});
  const [dirty, setDirty] = useState<Record<string, Partial<O>>>({});
  const [loading, setLoading] = useState(false);

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
    const { data: qs } = await supabase.from("test_questions").select("id, question_number, question_text, category, subtest_code").eq("instrument_id", id).order("question_number");
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

  const setCorrect = (qid: string, oid: string) => {
    opts[qid].forEach(o => patch(o.id, { is_correct: o.id === oid }));
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
            <button onClick={saveAll} disabled={!Object.keys(dirty).length} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40">
              <Save className="h-4 w-4" /> Simpan ({Object.keys(dirty).length})
            </button>
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
                        <button onClick={() => setCorrect(q.id, o.id)} className={`h-6 w-6 rounded border-2 inline-flex items-center justify-center transition-all ${o.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500/60"}`}>
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
