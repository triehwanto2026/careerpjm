import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Languages, ChevronLeft, ChevronRight, Send, LogOut, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { psychologyQuestions, TEST_DURATION_MINUTES } from "@/data/questions";
import QuestionCard from "@/components/QuestionCard";
import TestTimer from "@/components/TestTimer";
import WebcamPreview from "@/components/WebcamPreview";

const TestPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showEnglish, setShowEnglish] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auth guard
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
        icon: "warning",
        title: "Waktu Habis!",
        text: "Waktu pengerjaan telah berakhir. Jawaban Anda akan disimpan otomatis.",
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
        allowOutsideClick: false,
      }).then(() => handleSubmit(true));
    }
  }, [submitted]);

  const handleSubmit = (forced = false) => {
    if (!forced && answeredCount < totalQuestions) {
      Swal.fire({
        icon: "question",
        title: "Belum Semua Dijawab",
        html: `Anda baru menjawab <b>${answeredCount}</b> dari <b>${totalQuestions}</b> soal.<br/>Yakin ingin mengirim?`,
        showCancelButton: true,
        confirmButtonText: "Ya, Kirim",
        cancelButtonText: "Kembali",
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
      }).then((result) => {
        if (result.isConfirmed) completeSubmission();
      });
    } else {
      completeSubmission();
    }
  };

  const completeSubmission = () => {
    setSubmitted(true);
    console.log("Test results:", answers);
    Swal.fire({
      icon: "success",
      title: "Tes Selesai!",
      html: `Terima kasih telah menyelesaikan tes psikologi.<br/>Jawaban Anda telah berhasil disimpan.<br/><br/><b>${answeredCount}/${totalQuestions}</b> soal dijawab.`,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(174, 72%, 46%)",
      confirmButtonText: "Selesai",
      allowOutsideClick: false,
    }).then(() => {
      sessionStorage.removeItem("psytest_auth");
      navigate("/", { replace: true });
    });
  };

  const handleLogout = () => {
    Swal.fire({
      icon: "warning",
      title: "Keluar dari Tes?",
      text: "Semua jawaban Anda akan hilang. Yakin ingin keluar?",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem("psytest_auth");
        navigate("/", { replace: true });
      }
    });
  };

  if (submitted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">PsyTest</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <TestTimer durationMinutes={TEST_DURATION_MINUTES} onTimeUp={handleTimeUp} />

            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showEnglish
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">EN</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-6">
        {/* Sidebar */}
        <aside className="flex flex-row gap-4 md:w-56 md:flex-col md:gap-5">
          {/* Webcam */}
          <div className="w-1/2 md:w-full">
            <WebcamPreview />
          </div>

          {/* Progress + Navigation dots */}
          <div className="flex flex-1 flex-col gap-3">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progres</span>
                <span>{answeredCount}/{totalQuestions}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question dots */}
            <div className="flex flex-wrap gap-1.5">
              {psychologyQuestions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${
                    i === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : answers[q.id]
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col">
          <div className="glass flex-1 rounded-2xl p-5 glow-border md:p-8">
            {/* Question number */}
            <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Soal <span className="font-semibold text-foreground">{currentIndex + 1}</span> dari{" "}
                {totalQuestions}
              </span>
            </div>

            <QuestionCard
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id] || null}
              onAnswer={handleAnswer}
              showEnglish={showEnglish}
            />
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-primary"
              >
                <Send className="h-4 w-4" />
                Kirim Jawaban
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestPage;
