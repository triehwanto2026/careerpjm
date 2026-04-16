import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Languages, ChevronLeft, ChevronRight, Send, LogOut, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { psychologyQuestions, TEST_DURATION_MINUTES } from "@/data/questions";
import QuestionCard from "@/components/QuestionCard";
import TestTimer from "@/components/TestTimer";
import WebcamPreview from "@/components/WebcamPreview";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const TestPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showEnglish, setShowEnglish] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("psytest_auth") !== "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const totalQuestions = psychologyQuestions.length;
  const currentQuestion = psychologyQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const handleAnswer = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleTimeUp = useCallback(() => {
    if (!submitted) {
      Swal.fire({
        icon: "warning", title: "Waktu Habis!",
        text: "Waktu pengerjaan telah berakhir. Jawaban Anda akan disimpan otomatis.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))",
        confirmButtonColor: "hsl(174, 72%, 46%)", allowOutsideClick: false,
      }).then(() => handleSubmit(true));
    }
  }, [submitted]);

  const handleSubmit = async (forced = false) => {
    if (!forced && answeredCount < totalQuestions) {
      const result = await Swal.fire({
        icon: "question", title: "Belum Semua Dijawab",
        html: `Anda baru menjawab <b>${answeredCount}</b> dari <b>${totalQuestions}</b> soal.<br/>Yakin ingin mengirim?`,
        showCancelButton: true, confirmButtonText: "Ya, Kirim", cancelButtonText: "Kembali",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      if (result.isConfirmed) await completeSubmission();
    } else {
      await completeSubmission();
    }
  };

  const completeSubmission = async () => {
    setSubmitted(true);

    const candidateRaw = sessionStorage.getItem("psytest_candidate");
    const candidate = candidateRaw ? JSON.parse(candidateRaw) : null;

    // Calculate categories
    const cats: Record<string, number> = {};
    psychologyQuestions.forEach((q) => {
      const ans = answers[q.id];
      if (ans) {
        cats[q.category] = (cats[q.category] || 0) + 1;
      }
    });
    // Convert to percentage
    const catCounts: Record<string, number> = {};
    const catTotals: Record<string, number> = {};
    psychologyQuestions.forEach(q => { catTotals[q.category] = (catTotals[q.category] || 0) + 1; });
    Object.keys(cats).forEach(k => { catCounts[k] = Math.round((cats[k] / catTotals[k]) * 100); });

    const score = Math.round((answeredCount / totalQuestions) * 100);

    // Save candidate if not exists
    let candidateId: string | null = null;
    if (candidate) {
      const { data: existingCand } = await supabase.from("candidates").select("id").eq("email", candidate.email).maybeSingle();
      if (existingCand) {
        candidateId = existingCand.id;
        await supabase.from("candidates").update({ status: "completed" } as any).eq("id", candidateId);
      } else {
        const { data: newCand } = await supabase.from("candidates").insert({
          name: candidate.name,
          email: candidate.email,
          position: candidate.position,
          status: "completed",
          activation_code_id: candidate.codeId,
        }).select("id").single();
        candidateId = newCand?.id || null;
      }
    }

    // Save test result
    const { data: resultData } = await supabase.from("test_results").insert({
      candidate_id: candidateId,
      candidate_name: candidate?.name || "Unknown",
      position: candidate?.position || "",
      test_name: "Tes Psikologi Rekrutmen",
      score,
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      categories: catCounts,
      status: score >= 70 ? "passed" : score >= 50 ? "review" : "failed",
      interpretation: `Kandidat menjawab ${answeredCount} dari ${totalQuestions} soal dengan skor ${score}%.`,
      candidate_profile: candidate ? { email: candidate.email, phone: "", birthDate: "", education: "", gender: "" } : null,
    }).select("id").single();

    // Save individual answers
    if (resultData) {
      const answerRows = psychologyQuestions.filter(q => answers[q.id]).map(q => {
        const selectedVal = answers[q.id];
        const selectedOpt = q.options.find(o => o.value === selectedVal);
        return {
          test_result_id: resultData.id,
          question_number: q.id,
          question_text: q.textId,
          question_text_en: q.textEn,
          selected_answer: selectedVal,
          selected_answer_label: selectedOpt?.label || selectedVal,
          category: q.category,
        };
      });
      if (answerRows.length > 0) {
        await supabase.from("test_answers").insert(answerRows);
      }
    }

    Swal.fire({
      icon: "success", title: "Tes Selesai!",
      html: `Terima kasih telah menyelesaikan tes psikologi.<br/>Jawaban Anda telah berhasil disimpan.<br/><br/><b>${answeredCount}/${totalQuestions}</b> soal dijawab.`,
      background: "hsl(var(--card))", color: "hsl(var(--foreground))",
      confirmButtonColor: "hsl(174, 72%, 46%)", confirmButtonText: "Selesai", allowOutsideClick: false,
    }).then(() => {
      sessionStorage.removeItem("psytest_auth");
      sessionStorage.removeItem("psytest_candidate");
      navigate("/", { replace: true });
    });
  };

  const handleLogout = () => {
    Swal.fire({
      icon: "warning", title: "Keluar dari Tes?",
      text: "Semua jawaban Anda akan hilang. Yakin ingin keluar?",
      showCancelButton: true, confirmButtonText: "Ya, Keluar", cancelButtonText: "Batal",
      background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem("psytest_auth");
        sessionStorage.removeItem("psytest_candidate");
        navigate("/", { replace: true });
      }
    });
  };

  if (submitted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">PsyTest</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <TestTimer durationMinutes={TEST_DURATION_MINUTES} onTimeUp={handleTimeUp} />
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

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-6">
        <aside className="flex flex-row gap-4 md:w-56 md:flex-col md:gap-5">
          <div className="w-1/2 md:w-full"><WebcamPreview /></div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Progres</span><span>{answeredCount}/{totalQuestions}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {psychologyQuestions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrentIndex(i)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${i === currentIndex ? "bg-primary text-primary-foreground" : answers[q.id] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="glass flex-1 rounded-2xl p-5 glow-border md:p-8">
            <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
              <span>Soal <span className="font-semibold text-foreground">{currentIndex + 1}</span> dari {totalQuestions}</span>
            </div>
            <QuestionCard question={currentQuestion} selectedAnswer={answers[currentQuestion.id] || null} onAnswer={handleAnswer} showEnglish={showEnglish} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />Sebelumnya
            </button>
            {currentIndex === totalQuestions - 1 ? (
              <button onClick={() => handleSubmit(false)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-primary">
                <Send className="h-4 w-4" />Kirim Jawaban
              </button>
            ) : (
              <button onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
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
