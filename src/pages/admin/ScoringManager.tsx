import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Save, Calculator } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Instrument {
  id: string;
  name: string;
  scoring_method: string;
  category: string;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_text_en: string | null;
  category: string | null;
  subtest_code: string | null;
  question_type: string;
  scoring_rule: string;
}

interface Option {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  score_value: number;
  category_target: string | null;
  is_correct: boolean | null;
  display_order: number;
}

const ScoringManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selected, setSelected] = useState<string>(searchParams.get("instrument") || "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [opts, setOpts] = useState<Record<string, Option[]>>({});
  const [dirty, setDirty] = useState<Record<string, Partial<Option>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentInstrument = instruments.find(i => i.id === selected);

  useEffect(() => {
    supabase.from("test_instruments").select("id, name, scoring_method, category").order("name").then(({ data }) => {
      setInstruments((data as Instrument[]) || []);
      const instrumentParam = searchParams.get("instrument");
      if (instrumentParam && (data as Instrument[])?.some(i => i.id === instrumentParam)) {
        setSelected(instrumentParam);
      }
    });
  }, [searchParams]);

  const load = async (id: string) => {
    setLoading(true); setDirty({});
    const { data: qs } = await supabase.from("test_questions").select("id, question_number, question_text, question_text_en, category, subtest_code, question_type, scoring_rule").eq("instrument_id", id).order("question_number");
    setQuestions((qs as Question[]) || []);
    if (qs && qs.length) {
      const { data: os } = await supabase.from("test_question_options").select("*").in("question_id", qs.map((q: any) => q.id)).order("display_order");
      const grouped: Record<string, Option[]> = {};
      (os as Option[] || []).forEach(o => { (grouped[o.question_id] ||= []).push(o); });
      setOpts(grouped);
    } else setOpts({});
    setLoading(false);
  };

  useEffect(() => { if (selected) load(selected); }, [selected]);

  const patch = (oid: string, p: Partial<Option>) => {
    setDirty(prev => ({ ...prev, [oid]: { ...prev[oid], ...p } }));
    setOpts(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(qid => { copy[qid] = copy[qid].map(o => o.id === oid ? { ...o, ...p } : o); });
      return copy;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    const entries = Object.entries(dirty);
    if (!entries.length) return;
    for (const [oid, p] of entries) {
      await supabase.from("test_question_options").update(p as any).eq("id", oid);
    }
    setDirty({});
    setLoading(false);
    await load(selected);
    Swal.fire({ icon: "success", title: "Tersimpan", text: `${entries.length} perubahan scoring disimpan.`, timer: 1500, showConfirmButton: false });
  };

  const resetScoring = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reset Scoring?",
      text: "Semua nilai score_value akan di-reset ke 0. Lanjutkan?",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal"
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    const newDirty: Record<string, Partial<Option>> = {};
    Object.entries(opts).forEach(([qid, options]) => {
      options.forEach(o => {
        newDirty[o.id] = { score_value: 0 };
      });
    });
    setDirty(newDirty);
    await saveAll();
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
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Manajer Scoring</h1>
              <p className="text-sm text-muted-foreground">Edit manual nilai skor untuk setiap opsi jawaban.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button onClick={resetScoring} disabled={saving} className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-400/20 disabled:opacity-50">
                Reset Semua Skor ke 0
              </button>
              <button onClick={saveAll} disabled={!Object.keys(dirty).length || saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pilih Alat Tes
          </label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.scoring_method}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Kategori: <span className="text-foreground">{currentInstrument?.category}</span> · Metode:{" "}
              <span className="text-foreground">{currentInstrument?.scoring_method}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">Memuat data...</div>
        ) : questions.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">Belum ada soal. Tambahkan via Bank Soal.</div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const qOpts = opts[q.id] || [];
              return (
                <div key={q.id} className="glass rounded-xl p-4 glow-border">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Soal #{q.question_number}</p>
                      <p className="text-sm text-muted-foreground">{q.question_text}</p>
                      {q.subtest_code && <p className="text-xs text-primary mt-1">Subtest: {q.subtest_code}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-1">{q.question_type}</span>
                      <span className="rounded bg-muted px-2 py-1">{q.scoring_rule}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="px-2 py-2 text-left font-medium">Opsi</th>
                          <th className="px-2 py-2 text-left font-medium">Teks</th>
                          <th className="px-2 py-2 text-left font-medium">Skor</th>
                          <th className="px-2 py-2 text-left font-medium">Target</th>
                          <th className="px-2 py-2 text-left font-medium w-16">Benar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qOpts.map((o) => (
                          <tr key={o.id} className={`border-b border-border/50 ${dirty[o.id] ? "bg-primary/5" : ""}`}>
                            <td className="px-2 py-1 font-semibold">{o.option_label}</td>
                            <td className="px-2 py-1">{o.option_text}</td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                value={(dirty[o.id]?.score_value) ?? o.score_value}
                                onChange={(e) => patch(o.id, { score_value: Number(e.target.value) })}
                                className="w-16 rounded border border-border bg-background px-2 py-1 text-foreground text-center"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={(dirty[o.id]?.category_target) ?? (o.category_target || "")}
                                onChange={(e) => patch(o.id, { category_target: e.target.value })}
                                className="w-24 rounded border border-border bg-background px-2 py-1 text-foreground"
                                placeholder="target"
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={(dirty[o.id]?.is_correct) ?? o.is_correct}
                                onChange={(e) => patch(o.id, { is_correct: e.target.checked })}
                                className="h-4 w-4 accent-primary"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default ScoringManager;
