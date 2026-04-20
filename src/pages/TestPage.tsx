import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Languages, ChevronLeft, ChevronRight, Send, LogOut, ShieldCheck, Clock } from "lucide-react";
import Swal from "sweetalert2";
import TestTimer from "@/components/TestTimer";
import WebcamPreview, { WebcamHandle } from "@/components/WebcamPreview";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { uploadDataUrlAsPhoto } from "@/lib/photoUpload";

interface DbOption {
  id: string; question_id: string; option_label: string; option_text: string; option_text_en: string | null;
  score_value: number; category_target: string | null; is_correct: boolean | null; display_order: number;
  image_url?: string | null;
}
interface DbQuestion {
  id: string; instrument_id: string; question_number: number; question_text: string; question_text_en: string | null;
  category: string | null; question_type: string; scoring_rule: string;
  subtest_code?: string | null; time_limit_minutes?: number | null; image_url?: string | null;
  options: DbOption[];
}
interface DbInstrument {
  id: string; name: string; name_en: string; duration_minutes: number; scoring_method: string;
  questions: DbQuestion[];
}

const SWAL_THEME = { background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)" };

const TestPage = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<WebcamHandle>(null);
  const [instruments, setInstruments] = useState<DbInstrument[]>([]);
  const [currentTestIdx, setCurrentTestIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showEnglish, setShowEnglish] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  // For IST strict subtest navigation
  const [completedSubtests, setCompletedSubtests] = useState<Set<string>>(new Set());
  const [currentSubtest, setCurrentSubtest] = useState<string | null>(null);
  const [subtestStartedAt, setSubtestStartedAt] = useState<number>(Date.now());

  const loadAssignedTests = useCallback(async () => {
    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) { navigate("/", { replace: true }); return; }
    const cand = JSON.parse(candRaw);
    const ids: string[] = cand.assignedTests || [];
    if (ids.length === 0) {
      Swal.fire({ icon: "warning", title: "Tidak Ada Tes", text: "Belum ada tes yang ditugaskan.", ...SWAL_THEME }).then(() => navigate("/", { replace: true }));
      return;
    }
    const { data: insts } = await supabase.from("test_instruments").select("id, name, name_en, duration_minutes, scoring_method").in("id", ids);
    if (!insts || insts.length === 0) { setLoading(false); return; }
    const { data: qs } = await supabase.from("test_questions").select("*").in("instrument_id", ids).order("question_number");
    const qIds = (qs || []).map((q: any) => q.id);
    const { data: opts } = qIds.length ? await supabase.from("test_question_options").select("*").in("question_id", qIds).order("display_order") : { data: [] };
    const optsByQ: Record<string, DbOption[]> = {};
    (opts as DbOption[] || []).forEach(o => { (optsByQ[o.question_id] ||= []).push(o); });
    const qsByInst: Record<string, DbQuestion[]> = {};
    (qs as any[] || []).forEach(q => { (qsByInst[q.instrument_id] ||= []).push({ ...q, options: optsByQ[q.id] || [] }); });
    const ordered: DbInstrument[] = ids.map(id => insts.find((i: any) => i.id === id)).filter(Boolean)
      .map((i: any) => ({ ...i, questions: qsByInst[i.id] || [] }));
    setInstruments(ordered);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (sessionStorage.getItem("psytest_auth") !== "true") { navigate("/", { replace: true }); return; }
    loadAssignedTests();
  }, [navigate, loadAssignedTests]);

  const isIST = (t?: DbInstrument) => !!t && t.name.toUpperCase().includes("IST");
  const currentTest = instruments[currentTestIdx];
  const currentQuestion = currentTest?.questions[currentQIdx];

  // Track current IST subtest when question changes
  useEffect(() => {
    if (isIST(currentTest) && currentQuestion?.subtest_code && currentQuestion.subtest_code !== currentSubtest) {
      setCurrentSubtest(currentQuestion.subtest_code);
      setSubtestStartedAt(Date.now());
    }
  }, [currentQIdx, currentTestIdx, currentTest, currentQuestion, currentSubtest]);

  // Subtest info for IST strict mode (computed each render — also used by useEffect below)
  const subtestQuestions = isIST(currentTest) && currentSubtest
    ? currentTest.questions.filter(q => q.subtest_code === currentSubtest) : [];
  const subtestTimeLimit = subtestQuestions[0]?.time_limit_minutes || 6;
  const elapsedSec = Math.floor((Date.now() - subtestStartedAt) / 1000);
  const remainingSec = Math.max(0, subtestTimeLimit * 60 - elapsedSec);

  const handleNextTest = useCallback(() => {
    if (currentTestIdx < instruments.length - 1) {
      setCurrentTestIdx(currentTestIdx + 1); setCurrentQIdx(0);
      setCompletedSubtests(new Set()); setCurrentSubtest(null);
    }
  }, [currentTestIdx, instruments.length]);

  const finishCurrentSubtest = useCallback(() => {
    if (!isIST(currentTest) || !currentSubtest) return false;
    const newSet = new Set(completedSubtests); newSet.add(currentSubtest);
    setCompletedSubtests(newSet);
    const allQs = currentTest.questions;
    const lastIdxOfThis = allQs.map((q, i) => ({ q, i })).filter(x => x.q.subtest_code === currentSubtest).slice(-1)[0]?.i ?? -1;
    if (lastIdxOfThis >= 0 && lastIdxOfThis < allQs.length - 1) {
      setCurrentQIdx(lastIdxOfThis + 1);
      return true;
    }
    return false;
  }, [currentTest, currentSubtest, completedSubtests]);

  // Check time-up for current IST subtest
  useEffect(() => {
    if (!isIST(currentTest) || !currentSubtest || submitted) return;
    if (remainingSec <= 0) {
      Swal.fire({ icon: "info", title: `Waktu Subtes ${currentSubtest} Habis`, text: "Otomatis pindah ke subtes berikutnya.", timer: 1800, showConfirmButton: false, ...SWAL_THEME });
      const moved = finishCurrentSubtest();
      if (!moved) handleNextTest();
    }
  }, [remainingSec, currentSubtest, currentTest, submitted, finishCurrentSubtest, handleNextTest]);

  const completeSubmissionRef = useRef<() => Promise<void>>(async () => {});

  const handleTimeUp = useCallback(() => {
    if (!submitted) {
      Swal.fire({ icon: "warning", title: "Waktu Habis!", text: "Jawaban Anda akan disimpan otomatis.", ...SWAL_THEME, allowOutsideClick: false })
        .then(() => completeSubmissionRef.current());
    }
  }, [submitted]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Memuat tes...</div>;
  if (instruments.length === 0) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Tidak ada tes tersedia.</div>;

  const totalAllQuestions = instruments.reduce((sum, t) => sum + t.questions.length, 0);
  const totalAnsweredAll = Object.keys(answers).length;
  const progress = totalAllQuestions > 0 ? (totalAnsweredAll / totalAllQuestions) * 100 : 0;

  const handleAnswer = (instrumentId: string, questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [`${instrumentId}:${questionId}`]: value }));
  };
  const handleDiscPick = (instrumentId: string, questionId: string, kind: "M" | "L", optId: string) => {
    const key = `${instrumentId}:${questionId}`;
    const current = (answers[key] as string) || "";
    const parts: Record<string, string> = { M: "", L: "" };
    current.split("|").forEach(p => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
    parts[kind] = optId;
    if (parts.M && parts.L && parts.M === parts.L) parts[kind === "M" ? "L" : "M"] = "";
    setAnswers(prev => ({ ...prev, [key]: `M:${parts.M}|L:${parts.L}` }));
  };

  const handleNextTestSync = () => {
    if (currentTestIdx < instruments.length - 1) { setCurrentTestIdx(currentTestIdx + 1); setCurrentQIdx(0); setCompletedSubtests(new Set()); setCurrentSubtest(null); }
  };

  const handleNext = () => {
    if (!currentTest) return;
    // IST strict: if next question belongs to a different subtest, treat as auto-advance
    if (isIST(currentTest) && currentQuestion?.subtest_code) {
      const nextQ = currentTest.questions[currentQIdx + 1];
      if (nextQ && nextQ.subtest_code !== currentQuestion.subtest_code) {
        const newSet = new Set(completedSubtests); newSet.add(currentQuestion.subtest_code);
        setCompletedSubtests(newSet);
      }
    }
    if (currentQIdx < currentTest.questions.length - 1) setCurrentQIdx(currentQIdx + 1);
    else if (currentTestIdx < instruments.length - 1) handleNextTestSync();
  };

  const handlePrev = () => {
    // IST strict: cannot go back to a completed subtest, and cannot go back across subtest
    if (isIST(currentTest) && currentQuestion?.subtest_code) {
      const prevQ = currentTest.questions[currentQIdx - 1];
      if (!prevQ || prevQ.subtest_code !== currentQuestion.subtest_code) return; // block
    }
    if (currentQIdx > 0) setCurrentQIdx(currentQIdx - 1);
    else if (currentTestIdx > 0) {
      const prev = instruments[currentTestIdx - 1];
      setCurrentTestIdx(currentTestIdx - 1); setCurrentQIdx(prev.questions.length - 1);
    }
  };

  const isLastQuestion = currentTestIdx === instruments.length - 1 && currentQIdx === (currentTest?.questions.length || 1) - 1;

  const handleSubmit = async () => {
    if (totalAnsweredAll < totalAllQuestions) {
      const r = await Swal.fire({ icon: "question", title: "Belum Semua Dijawab", html: `Dijawab <b>${totalAnsweredAll}</b>/<b>${totalAllQuestions}</b>. Yakin kirim?`, showCancelButton: true, confirmButtonText: "Ya, Kirim", cancelButtonText: "Kembali", ...SWAL_THEME });
      if (r.isConfirmed) await completeSubmission();
    } else await completeSubmission();
  };

  const completeSubmission = async () => {
    setSubmitted(true);
    const candidateRaw = sessionStorage.getItem("psytest_candidate");
    const candidate = candidateRaw ? JSON.parse(candidateRaw) : null;

    // Auto-capture webcam snap
    let snapUrl: string | null = null;
    const dataUrl = webcamRef.current?.capture();
    if (dataUrl) snapUrl = await uploadDataUrlAsPhoto(dataUrl, `snap-${candidate?.email || "anon"}`);

    let candidateId: string | null = candidate?.id || null;
    if (candidate && !candidateId) {
      const { data: existing } = await supabase.from("candidates").select("id").eq("email", candidate.email).maybeSingle();
      candidateId = existing?.id || null;
    }
    if (candidateId) await supabase.from("candidates").update({ status: "completed" } as any).eq("id", candidateId);

    for (const inst of instruments) {
      const instAnswers = inst.questions.map(q => ({ q, optId: answers[`${inst.id}:${q.id}`] as string | undefined }));
      const answeredCount = instAnswers.filter(a => a.optId).length;
      const cats: Record<string, number> = {};
      let correctCount = 0; let totalScore = 0;

      instAnswers.forEach(({ q, optId }) => {
        if (!optId) return;
        if (q.question_type === "disc_pair" && optId.includes("|")) {
          const parts: Record<string, string> = { M: "", L: "" };
          optId.split("|").forEach(p => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
          const mOpt = q.options.find(o => o.id === parts.M);
          const lOpt = q.options.find(o => o.id === parts.L);
          if (mOpt?.category_target) cats[mOpt.category_target] = (cats[mOpt.category_target] || 0) + 1;
          if (lOpt?.category_target) cats[lOpt.category_target] = (cats[lOpt.category_target] || 0) - 1;
          return;
        }
        const opt = q.options.find(o => o.id === optId);
        if (!opt) return;
        totalScore += Number(opt.score_value || 0);
        if (opt.is_correct) correctCount++;
        const dim = opt.category_target?.trim() || q.category?.trim() || "Umum";
        cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
      });

      const hasCorrectScoring = inst.questions.some(q => q.scoring_rule === "correct_only" || q.options.some(o => o.is_correct));
      const score = hasCorrectScoring && inst.questions.length > 0
        ? Math.round((correctCount / inst.questions.length) * 100)
        : Math.round((answeredCount / Math.max(inst.questions.length, 1)) * 100);

      const normalizedCats: Record<string, number> = {};
      Object.entries(cats).forEach(([k, v]) => { normalizedCats[k] = Math.round(v); });
      const status = score >= 70 ? "passed" : score >= 50 ? "review" : "failed";

      const { data: resultData } = await supabase.from("test_results").insert({
        candidate_id: candidateId,
        candidate_name: candidate?.name || "Unknown",
        position: candidate?.position || "",
        test_name: inst.name,
        score, total_questions: inst.questions.length, answered_questions: answeredCount,
        categories: normalizedCats, status,
        interpretation: `Kandidat menjawab ${answeredCount} dari ${inst.questions.length} soal pada tes ${inst.name}. Skor akhir ${score}%. ${hasCorrectScoring ? `${correctCount} jawaban benar.` : "Diukur berdasar profil dimensi."}`,
        candidate_profile: candidate ? {
          email: candidate.email, phone: candidate.phone || "", birthDate: candidate.birth_date || "",
          education: candidate.education || "", gender: candidate.gender || "", photo_url: candidate.photo_url || null,
        } : null,
        webcam_photo_url: snapUrl,
      } as any).select("id").single();

      if (resultData) {
        const answerRows = instAnswers.filter(a => a.optId).map(({ q, optId }) => {
          // DISC: format combined "M: <text> | L: <text>" instead of UUIDs
          if (q.question_type === "disc_pair" && optId!.includes("|")) {
            const parts: Record<string, string> = { M: "", L: "" };
            optId!.split("|").forEach(p => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
            const mOpt = q.options.find(o => o.id === parts.M);
            const lOpt = q.options.find(o => o.id === parts.L);
            const mText = mOpt ? `${mOpt.option_label}. ${mOpt.option_text}` : "-";
            const lText = lOpt ? `${lOpt.option_label}. ${lOpt.option_text}` : "-";
            return {
              test_result_id: resultData.id,
              question_number: q.question_number,
              question_text: q.question_text,
              question_text_en: q.question_text_en,
              selected_answer: `PALING (M): ${mText}  ·  TIDAK (L): ${lText}`,
              selected_answer_label: `M:${mOpt?.category_target || "?"} / L:${lOpt?.category_target || "?"}`,
              category: q.category,
              is_correct: null,
              correct_answer: null,
            };
          }
          const opt = q.options.find(o => o.id === optId);
          return {
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: q.question_text_en,
            selected_answer: opt?.option_text || optId || "",
            selected_answer_label: opt?.option_label || "",
            category: q.category,
            is_correct: opt?.is_correct ?? null,
            correct_answer: q.options.find(o => o.is_correct)?.option_text || null,
          };
        });
        if (answerRows.length > 0) await supabase.from("test_answers").insert(answerRows);
      }
    }

    Swal.fire({
      icon: "success", title: "Semua Tes Selesai!",
      html: `Terima kasih telah menyelesaikan ${instruments.length} alat tes.<br/><b>${totalAnsweredAll}/${totalAllQuestions}</b> soal dijawab.`,
      ...SWAL_THEME, confirmButtonText: "Selesai", allowOutsideClick: false,
    }).then(() => {
      sessionStorage.removeItem("psytest_auth");
      sessionStorage.removeItem("psytest_candidate");
      navigate("/", { replace: true });
    });
  };
  completeSubmissionRef.current = completeSubmission;


  const handleLogout = () => {
    Swal.fire({ icon: "warning", title: "Keluar dari Tes?", text: "Semua jawaban akan hilang.", showCancelButton: true, confirmButtonText: "Ya, Keluar", cancelButtonText: "Batal", ...SWAL_THEME, confirmButtonColor: "hsl(0, 72%, 51%)" })
      .then((r) => { if (r.isConfirmed) { sessionStorage.clear(); navigate("/", { replace: true }); } });
  };

  if (submitted) return null;
  const totalDuration = instruments.reduce((sum, t) => sum + (t.duration_minutes || 30), 0);
  const currentAnsKey = currentQuestion ? `${currentTest.id}:${currentQuestion.id}` : "";
  const currentAns = answers[currentAnsKey] as string | undefined;

  // For IST: cannot go back across subtest boundary
  const prevQ = currentTest?.questions[currentQIdx - 1];
  const canPrev = !(currentTestIdx === 0 && currentQIdx === 0) &&
    !(isIST(currentTest) && prevQ && prevQ.subtest_code !== currentQuestion?.subtest_code);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">PsyTest</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <TestTimer durationMinutes={totalDuration} onTimeUp={handleTimeUp} />
            <button onClick={() => setShowEnglish(!showEnglish)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${showEnglish ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}>
              <Languages className="h-3.5 w-3.5" /><span className="hidden sm:inline">EN</span>
            </button>
            <ThemeToggle />
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors">
              <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* IST subtest banner */}
      {isIST(currentTest) && currentSubtest && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          Subtes <b>{currentSubtest}</b> · Sisa waktu: {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")} · Tidak bisa kembali ke subtes sebelumnya
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-6">
        <aside className="flex flex-row gap-4 md:w-64 md:flex-col md:gap-5">
          <div className="w-1/2 md:w-full"><WebcamPreview ref={webcamRef} /></div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Progres Total</span><span>{totalAnsweredAll}/{totalAllQuestions}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daftar Tes</p>
              {instruments.map((t, i) => {
                const ansInThis = t.questions.filter(q => answers[`${t.id}:${q.id}`]).length;
                const isCurrent = i === currentTestIdx;
                return (
                  <button key={t.id} onClick={() => { setCurrentTestIdx(i); setCurrentQIdx(0); setCompletedSubtests(new Set()); setCurrentSubtest(null); }}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all ${isCurrent ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted"}`}>
                    <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ansInThis}/{t.questions.length} soal</p>
                  </button>
                );
              })}
            </div>

            {currentTest && currentTest.questions.length > 0 && !isIST(currentTest) && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {currentTest.questions.map((q, i) => (
                  <button key={q.id} onClick={() => setCurrentQIdx(i)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${i === currentQIdx ? "bg-primary text-primary-foreground" : answers[`${currentTest.id}:${q.id}`] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="glass flex-1 rounded-2xl p-5 glow-border md:p-8">
            <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
              <span><span className="font-semibold text-primary">{currentTest.name}</span> · Soal <span className="font-semibold text-foreground">{currentQIdx + 1}</span> dari {currentTest.questions.length}</span>
            </div>
            {currentQuestion ? (
              <div className="animate-fade-in space-y-5">
                {currentQuestion.category && (
                  <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{currentQuestion.category}</span>
                )}
                <h3 className="text-lg font-semibold leading-relaxed text-foreground">{currentQuestion.question_text}</h3>
                {showEnglish && currentQuestion.question_text_en && (
                  <p className="text-sm italic text-muted-foreground">{currentQuestion.question_text_en}</p>
                )}
                {currentQuestion.image_url && (
                  <img src={currentQuestion.image_url} alt="Soal" className="max-h-72 w-auto rounded-lg border border-border bg-white" loading="lazy" />
                )}
                <div className="space-y-3">
                  {currentQuestion.options.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada pilihan jawaban untuk soal ini.</p>
                  ) : currentQuestion.question_type === "disc_pair" ? (
                    <div>
                      <div className="mb-3 grid grid-cols-[1fr_60px_60px] gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Pernyataan</span>
                        <span className="text-center text-emerald-500">PALING (M)</span>
                        <span className="text-center text-amber-500">TIDAK (L)</span>
                      </div>
                      {(() => {
                        const parts: Record<string, string> = { M: "", L: "" };
                        ((currentAns as string) || "").split("|").forEach(p => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
                        return currentQuestion.options.map(opt => {
                          const isM = parts.M === opt.id;
                          const isL = parts.L === opt.id;
                          return (
                            <div key={opt.id} className={`grid grid-cols-[1fr_60px_60px] items-center gap-2 rounded-lg border p-3 mb-2 transition-all ${isM ? "border-emerald-500/60 bg-emerald-500/5" : isL ? "border-amber-500/60 bg-amber-500/5" : "border-border bg-card hover:bg-muted/40"}`}>
                              <div>
                                <span className="text-sm font-medium text-foreground">{opt.option_text}</span>
                                {showEnglish && opt.option_text_en && <span className="block text-xs text-muted-foreground italic mt-0.5">{opt.option_text_en}</span>}
                              </div>
                              <button type="button" onClick={() => handleDiscPick(currentTest.id, currentQuestion.id, "M", opt.id)}
                                className={`h-9 w-9 mx-auto rounded-md border-2 font-bold text-sm transition-all ${isM ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500/60"}`}>{isM ? "✓" : ""}</button>
                              <button type="button" onClick={() => handleDiscPick(currentTest.id, currentQuestion.id, "L", opt.id)}
                                className={`h-9 w-9 mx-auto rounded-md border-2 font-bold text-sm transition-all ${isL ? "border-amber-500 bg-amber-500 text-white" : "border-border hover:border-amber-500/60"}`}>{isL ? "✓" : ""}</button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : currentQuestion.options.map(opt => {
                    const isSelected = currentAns === opt.id;
                    return (
                      <button key={opt.id} onClick={() => handleAnswer(currentTest.id, currentQuestion.id, opt.id)}
                        className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/10 glow-border" : "border-border bg-card hover:border-primary/40 hover:bg-muted"}`}>
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60"}`}>{opt.option_label}</span>
                        <div className="flex-1">
                          {opt.image_url && <img src={opt.image_url} alt={opt.option_label} className="mb-2 max-h-32 rounded border border-border bg-white" loading="lazy" />}
                          <span className="text-sm font-medium text-foreground">{opt.option_text}</span>
                          {showEnglish && opt.option_text_en && <span className="block text-xs text-muted-foreground italic mt-0.5">{opt.option_text_en}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tes ini belum memiliki soal. Hubungi admin.</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={handlePrev} disabled={!canPrev}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />Sebelumnya
            </button>
            {isLastQuestion ? (
              <button onClick={handleSubmit}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-primary">
                <Send className="h-4 w-4" />Selesaikan Semua Tes
              </button>
            ) : (
              <button onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
                Selanjutnya<ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestPage;
