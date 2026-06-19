import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Languages, ChevronLeft, ChevronRight, Send, LogOut, ShieldCheck, Clock } from "lucide-react";
import Swal from "sweetalert2";
import TestTimer from "@/components/TestTimer";
import WebcamPreview, { WebcamHandle } from "@/components/WebcamPreview";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { uploadDataUrlAsPhoto } from "@/lib/photoUpload";
import { getAptitudeFallbackImage } from "@/lib/aptitudeImageFallback";

interface DbOption {
  id: string; question_id: string; option_label: string; option_text: string; option_text_en: string | null;
  category_target: string | null; display_order: number;
  image_url?: string | null;
}
interface DbQuestion {
  id: string; instrument_id: string; question_number: number; question_text: string; question_text_en: string | null;
  category: string | null; question_type: string; scoring_rule: string;
  subtest_code?: string | null; time_limit_minutes?: number | null; group_number?: number | null; image_url?: string | null;
  question_image?: string | null; // Gambar 1: soal/pattern (IST subtest FA)
  options_image?: string | null; // Gambar 2: pilihan jawaban A-E (IST subtest FA)
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
  const [subtestIntroActive, setSubtestIntroActive] = useState(false);
  const [testIntroActive, setTestIntroActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"pending" | "active" | "error">("pending");
  const shownIstSubtestsRef = useRef<Set<string>>(new Set());
  const shownCfitSubtestsRef = useRef<Set<string>>(new Set());
  const shownTestInstructionsRef = useRef<Set<string>>(new Set());
  const testInstructionInProgressRef = useRef(false);
  const cameraViolationHandledRef = useRef(false);
  const cameraPauseStartedRef = useRef<number | null>(Date.now());

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
    // Use security-definer RPCs that strip answer keys (is_correct / score_value /
    // "CORRECT_ANSWER:" markers) before sending data to the client.
    const { data: qs } = await supabase.rpc("get_test_questions_safe" as any, { _instrument_ids: ids });
    const qIds = ((qs as any[]) || []).map((q: any) => q.id);
    const { data: opts } = qIds.length
      ? await supabase.rpc("get_test_question_options_safe" as any, { _question_ids: qIds })
      : { data: [] as any[] };
    const optsByQ: Record<string, DbOption[]> = {};
    ((opts as DbOption[]) || []).forEach(o => { (optsByQ[o.question_id] ||= []).push(o); });
    const qsByInst: Record<string, DbQuestion[]> = {};
    ((qs as any[]) || []).forEach(q => { (qsByInst[q.instrument_id] ||= []).push({ ...q, options: optsByQ[q.id] || [] }); });
    const ordered: DbInstrument[] = ids.map(id => insts.find((i: any) => i.id === id)).filter(Boolean)
      .map((i: any) => ({ ...i, questions: qsByInst[i.id] || [] }));
    setInstruments(ordered);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (sessionStorage.getItem("psytest_auth") !== "true") { navigate("/", { replace: true }); return; }
    loadAssignedTests();
  }, [navigate, loadAssignedTests]);

  // Resume saved progress (answers + position) once instruments load
  const [resumed, setResumed] = useState(false);

  const buildSavedSessionKey = (activationCodeId: string, email: string) =>
    `psytest_session_${activationCodeId}_${email}`;

  const saveSessionSnapshot = (activationCodeId: string, email: string, payload: Record<string, any>) => {
    try {
      localStorage.setItem(buildSavedSessionKey(activationCodeId, email), JSON.stringify(payload));
    } catch {
      // ignore localStorage failures
    }
  };

  const loadSessionSnapshot = (activationCodeId: string, email: string) => {
    try {
      const snapshot = localStorage.getItem(buildSavedSessionKey(activationCodeId, email));
      return snapshot ? JSON.parse(snapshot) : null;
    } catch {
      return null;
    }
  };

  const clearSessionSnapshot = (activationCodeId: string, email: string) => {
    try {
      localStorage.removeItem(buildSavedSessionKey(activationCodeId, email));
    } catch {
      // ignore
    }
  };

  const getInstrumentDurationSeconds = (instrument?: DbInstrument) => Math.max(1, (instrument?.duration_minutes || 30) * 60);

  const getRemainingSecondsForInstrument = (instrument?: DbInstrument, remainingSecOverride?: number) => {
    const duration = getInstrumentDurationSeconds(instrument);
    if (remainingSecOverride !== undefined) {
      return Math.max(0, Math.min(duration, Math.floor(remainingSecOverride)));
    }

    const startedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return Math.max(0, Math.min(duration, duration - elapsed));
  };

  const startTimerForInstrument = (instrument?: DbInstrument, remainingSeconds?: number) => {
    const duration = getInstrumentDurationSeconds(instrument);
    const remaining = Math.max(0, Math.min(duration, Math.floor(remainingSeconds ?? duration)));
    sessionStorage.setItem("psytest_started_at", String(Date.now() - (duration - remaining) * 1000));
  };

  const persistSession = useCallback(async ({
    testIdx = currentTestIdx,
    qIdx = currentQIdx,
    answerState = answers,
    completed = completedSubtests,
    remainingSecOverride,
  }: {
    testIdx?: number;
    qIdx?: number;
    answerState?: Record<string, string | string[]>;
    completed?: Set<string>;
    remainingSecOverride?: number;
  } = {}) => {
    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) return;
    const cand = JSON.parse(candRaw);
    if (!cand.activationCodeId) return;
    const instrument = instruments[testIdx];
    if (!instrument) return;

    const remaining = getRemainingSecondsForInstrument(instrument, remainingSecOverride);

    const snapshotPayload = {
      answers: answerState,
      seconds_remaining: remaining,
      current_test_idx: testIdx,
      current_question_idx: qIdx,
      completed_subtests: Array.from(completed),
      last_active_at: new Date().toISOString(),
    };
    saveSessionSnapshot(cand.activationCodeId, cand.email, snapshotPayload);

    await supabase.from("test_sessions").upsert({
      activation_code_id: cand.activationCodeId,
      candidate_email: cand.email,
      answers: answerState as any,
      seconds_remaining: remaining,
      current_test_idx: testIdx,
      current_question_idx: qIdx,
      completed_subtests: Array.from(completed),
      last_active_at: new Date().toISOString(),
    } as any, { onConflict: "activation_code_id,candidate_email" });
  }, [answers, completedSubtests, currentQIdx, currentTestIdx, instruments]);

  const handleCameraViolation = useCallback(async (message?: string) => {
    if (cameraViolationHandledRef.current || submitted) return;
    cameraViolationHandledRef.current = true;

    const candRaw = sessionStorage.getItem("psytest_candidate");
    const cand = candRaw ? JSON.parse(candRaw) : null;
    const instrument = instruments[currentTestIdx];
    const remaining = getRemainingSecondsForInstrument(instrument);

    if (cand?.activationCodeId) {
      await supabase.from("test_sessions").upsert({
        activation_code_id: cand.activationCodeId,
        candidate_email: cand.email,
        answers: answers as any,
        seconds_remaining: remaining,
        current_test_idx: currentTestIdx,
        current_question_idx: currentQIdx,
        completed_subtests: Array.from(completedSubtests),
        last_active_at: new Date().toISOString(),
        last_violation_at: new Date().toISOString(),
      } as any, { onConflict: "activation_code_id,candidate_email" });

      const { data } = await supabase.from("test_sessions")
        .select("violation_count")
        .eq("activation_code_id", cand.activationCodeId)
        .eq("candidate_email", cand.email)
        .maybeSingle();
      await supabase.from("test_sessions")
        .update({ violation_count: ((data?.violation_count as number) || 0) + 1 } as any)
        .eq("activation_code_id", cand.activationCodeId)
        .eq("candidate_email", cand.email);
    }

    const fromCandidate = sessionStorage.getItem("psytest_origin") === "candidate";
    sessionStorage.removeItem("psytest_auth");
    sessionStorage.removeItem("psytest_candidate");
    sessionStorage.removeItem("psytest_started_at");
    sessionStorage.removeItem("psytest_origin");
    if (!fromCandidate) {
      try { await supabase.auth.signOut(); } catch {}
    }

    await Swal.fire({
      icon: "error",
      title: "Pelanggaran Kamera Terdeteksi",
      html: message || "Kamera wajib aktif selama tes. Kamera tidak aktif/ditolak sehingga sesi ini dicatat sebagai <b>cheating</b>.",
      ...SWAL_THEME,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    navigate(fromCandidate ? "/candidate/tests" : "/", { replace: true });
  }, [answers, completedSubtests, currentQIdx, currentTestIdx, instruments, navigate, submitted]);

  const handleCameraStatusChange = useCallback((status: "pending" | "active" | "error") => {
    setCameraStatus(status);
  }, []);

  useEffect(() => {
    if (loading || submitted || instruments.length === 0) return;
    if (cameraStatus !== "error") return;
    handleCameraViolation("Kamera wajib aktif untuk mengikuti tes psikologi. Kamera tidak tersedia, ditolak, tertutup, atau dimatikan sehingga sesi dicatat sebagai <b>cheating</b>.");
  }, [cameraStatus, handleCameraViolation, instruments.length, loading, submitted]);

  useEffect(() => {
    if (submitted) return;
    if (cameraStatus !== "active") {
      if (cameraPauseStartedRef.current === null) cameraPauseStartedRef.current = Date.now();
      return;
    }
    if (cameraPauseStartedRef.current !== null) {
      const pauseDuration = Date.now() - cameraPauseStartedRef.current;
      const testStartedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
      sessionStorage.setItem("psytest_started_at", String(testStartedAt + pauseDuration));
      setSubtestStartedAt(prev => prev + pauseDuration);
      cameraPauseStartedRef.current = null;
    }
  }, [cameraStatus, submitted]);

  useEffect(() => {
    if (resumed || instruments.length === 0) return;
    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) { setResumed(true); return; }
    const cand = JSON.parse(candRaw);
    if (!cand.activationCodeId) { setResumed(true); return; }
    (async () => {
      // Check if code was reactivated (status changed from 'completed' back to 'active')
      const { data: codeData } = await (supabase as any).from("my_activation_codes").select("*").eq("id", cand.activationCodeId).maybeSingle();
      const isReactivated = (codeData as any)?.status === 'active' && (codeData as any)?.is_code_deactivated;
      
      // If reactivated, delete old session to start fresh
      if (isReactivated) {
        await supabase.from("test_sessions").delete()
          .eq("activation_code_id", cand.activationCodeId)
          .eq("candidate_email", cand.email);
        clearSessionSnapshot(cand.activationCodeId, cand.email);
        setResumed(true);
        return;
      }

      const { data: session } = await supabase.from("test_sessions").select("*")
        .eq("activation_code_id", cand.activationCodeId).eq("candidate_email", cand.email).maybeSingle();
      const snapshot = loadSessionSnapshot(cand.activationCodeId, cand.email);
      const useSnapshot = snapshot && (!session || new Date(snapshot.last_active_at || 0).getTime() >= new Date(session.last_active_at || 0).getTime());
      const restoredSession = useSnapshot ? {
        answers: snapshot.answers || {},
        current_test_idx: snapshot.current_test_idx ?? 0,
        current_question_idx: snapshot.current_question_idx ?? 0,
        completed_subtests: snapshot.completed_subtests || [],
        seconds_remaining: snapshot.seconds_remaining,
        last_active_at: snapshot.last_active_at,
      } : session;

      const savedTestIdx = Math.min(restoredSession?.current_test_idx ?? 0, instruments.length - 1);
      const restoredTest = instruments[savedTestIdx];
      const defaultDuration = getInstrumentDurationSeconds(restoredTest);

      if (restoredSession) {
        // Restore saved progress
        setAnswers((restoredSession.answers as Record<string, string>) || {});
        setCurrentTestIdx(savedTestIdx);
        setCurrentQIdx(restoredSession.current_question_idx || 0);
        setCompletedSubtests(new Set(restoredSession.completed_subtests || []));

        // Gunakan seconds_remaining yang tersimpan LANGSUNG (waktu BERHENTI saat keluar)
        const remaining = Math.max(0, Math.min(defaultDuration, restoredSession.seconds_remaining ?? defaultDuration));

        if (remaining <= 0 && savedTestIdx < instruments.length - 1) {
          const nextTestIdx = savedTestIdx + 1;
          const nextTest = instruments[nextTestIdx];
          setCurrentTestIdx(nextTestIdx);
          setCurrentQIdx(0);
          setCompletedSubtests(new Set());
          setCurrentSubtest(null);
          startTimerForInstrument(nextTest);
          await persistSession({ testIdx: nextTestIdx, qIdx: 0, remainingSecOverride: getInstrumentDurationSeconds(nextTest) });
        } else {
          startTimerForInstrument(restoredTest, remaining);
        }
      } else {
        // First time
        startTimerForInstrument(restoredTest);
        await supabase.from("test_sessions").insert({
          activation_code_id: cand.activationCodeId,
          candidate_email: cand.email,
          answers: {},
          seconds_remaining: defaultDuration,
          original_duration_seconds: defaultDuration,
          test_started_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          current_test_idx: 0,
          current_question_idx: 0,
          completed_subtests: [],
        } as any);
        // Tandai activation code sebagai started
        await (supabase as any).rpc("candidate_update_activation_code_status", {
          _id: cand.activationCodeId,
          _test_started_at: new Date().toISOString(),
          _status: 'active',
        });
      }
      setResumed(true);
    })();
  }, [instruments, persistSession, resumed]);

  const saveSessionRef = useRef<() => Promise<void>>(async () => {});
  saveSessionRef.current = persistSession;

  useEffect(() => {
    if (instruments.length === 0 || submitted) return;
    const intervalId = setInterval(() => { saveSessionRef.current(); }, 5000);
    return () => clearInterval(intervalId);
  }, [instruments.length, submitted]);

  useEffect(() => {
    if (instruments.length === 0 || submitted) return;
    const saveOnChange = window.setTimeout(() => { saveSessionRef.current(); }, 500);
    return () => window.clearTimeout(saveOnChange);
  }, [answers, currentTestIdx, currentQIdx, Array.from(completedSubtests).join(","), instruments.length, submitted]);

  useEffect(() => {
    if (instruments.length === 0 || submitted) return;
    const handleUnload = () => {
      saveSessionRef.current();
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [instruments.length, submitted]);

  // Anti-cheat: tab switch / minimize → save + force logout (waktu TERUS BERJALAN sebagai penalti)
  useEffect(() => {
    if (instruments.length === 0 || submitted) return;
    const onHide = async () => {
      if (document.hidden) {
        const candRaw = sessionStorage.getItem("psytest_candidate");
        if (!candRaw) return;
        const cand = JSON.parse(candRaw);

        const currentInstrument = instruments[currentTestIdx];
        const remainingAtViolation = getRemainingSecondsForInstrument(currentInstrument);

        // Simpan + tandai violation. last_active_at = sekarang ⇒ saat login ulang nanti,
        // selisih (now − last_active_at) akan dipotong dari sisa waktu (penalti).
        if (cand.activationCodeId) {
          await supabase.from("test_sessions").upsert({
            activation_code_id: cand.activationCodeId,
            candidate_email: cand.email,
            answers: answers as any,
            seconds_remaining: remainingAtViolation,
            current_test_idx: currentTestIdx,
            current_question_idx: currentQIdx,
            completed_subtests: Array.from(completedSubtests),
            last_active_at: new Date().toISOString(),
            last_violation_at: new Date().toISOString(),
          } as any, { onConflict: "activation_code_id,candidate_email" });
          // increment violation_count via SQL fallback
          await supabase.from("test_sessions")
            .select("violation_count")
            .eq("activation_code_id", cand.activationCodeId)
            .eq("candidate_email", cand.email)
            .maybeSingle()
            .then(async ({ data }) => {
              const next = ((data?.violation_count as number) || 0) + 1;
              await supabase.from("test_sessions")
                .update({ violation_count: next } as any)
                .eq("activation_code_id", cand.activationCodeId)
                .eq("candidate_email", cand.email);
            });
        }

        const fromCandidate = sessionStorage.getItem("psytest_origin") === "candidate";
        sessionStorage.removeItem("psytest_auth");
        sessionStorage.removeItem("psytest_candidate");
        sessionStorage.removeItem("psytest_started_at");
        sessionStorage.removeItem("psytest_origin");
        if (!fromCandidate) {
          try { await supabase.auth.signOut(); } catch {}
        }

        await Swal.fire({
          icon: "error", title: "Sesi Berakhir — Pelanggaran Terdeteksi",
          html: fromCandidate
            ? `Anda berpindah tab/minimize. Sesi tes dihentikan dan jawaban telah disimpan sebagai <b>draft</b>.<br/><br/><b>Catatan:</b> Waktu tes <u>tetap berjalan</u>. Anda akan diarahkan kembali ke daftar tes psikologi untuk melanjutkan dengan sisa waktu.`
            : `Anda berpindah tab/minimize. Sesi tes dihentikan dan jawaban telah disimpan.<br/><br/><b>Catatan:</b> Waktu tes <u>tetap berjalan</u> meskipun Anda logout. Segera login ulang dengan kode aktivasi yang sama untuk melanjutkan.`,
          ...SWAL_THEME, allowOutsideClick: false,
        });
        navigate(fromCandidate ? "/candidate/tests" : "/", { replace: true });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [instruments, submitted, navigate, answers, currentTestIdx, currentQIdx, completedSubtests]);

  // Clear session when test completed (called inside completeSubmission)
  const clearSavedSession = async () => {
    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) return;
    const cand = JSON.parse(candRaw);
    if (cand.activationCodeId) {
      await supabase.from("test_sessions").update({ is_code_deactivated: true } as any)
        .eq("activation_code_id", cand.activationCodeId).eq("candidate_email", cand.email);
      // Mark activation code as completed (kode tidak bisa dipakai lagi)
      await (supabase as any).rpc("candidate_update_activation_code_status", {
        _id: cand.activationCodeId,
        _status: 'completed',
        _test_completed_at: new Date().toISOString(),
        _is_used: true,
      });
      // Bersihkan localStorage lama (kompatibilitas)
      localStorage.removeItem(`psytest_start_${cand.activationCodeId}`);
      clearSessionSnapshot(cand.activationCodeId, cand.email);
    }
    sessionStorage.removeItem("psytest_started_at");
  };

  const isIST = (t?: DbInstrument) => !!t && t.name.toUpperCase().includes("IST");
  const isCFIT = (t?: DbInstrument) => !!t && (t.name.toUpperCase().includes("CFIT") || t.name.toUpperCase().includes("CULTURE FAIR"));
  const isKraepelinTest = (t?: DbInstrument) => !!t && (t.name.toUpperCase().includes("KRAEPELIN") || t.scoring_method === "speed_accuracy");
  const usesSubtestIntro = (t?: DbInstrument) => isIST(t) || isCFIT(t) || isKraepelinTest(t);
  const currentTest = instruments[currentTestIdx];
  const currentQuestion = currentTest?.questions[currentQIdx];

  // Show memory items before ME questions. The word list disappears automatically.
  const showMemoryItems = useCallback(async () => {
    const memoryItems = {
      'BUNGA': 'SOKA, LARAT, FLAMBOYAN, YASMIN, DAHLIA',
      'PERKAKAS': 'WAJAN, JARUM, KIKIR, CANGKUL, PALU',
      'BURUNG': 'ITIK, ELANG, WALET, TERUKUR, NURI',
      'KESENIAN': 'QUATET, ARCA, OPERA, UKIRAN, GAMELAN',
      'BINATANG': 'RUSA, MUSANG, BERUANG, HARIMAU, ZEBRA'
    };

    let html = '<div style="text-align:left;max-height:60vh;overflow-y:auto;">';
    html += '<h3 style="margin-bottom:15px;color:hsl(174,72%,46%);">HAFALKAN KATA-KATA INI</h3>';
    html += '<p style="margin:0 0 14px 0;color:hsl(210,20%,75%);font-size:13px;line-height:1.5">Perhatikan dan hafalkan daftar kata berikut. Setelah waktu habis, daftar ini akan hilang dan soal memori akan dimulai.</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">';

    Object.entries(memoryItems).forEach(([category, items]) => {
      html += `<div style="padding:10px;background:hsla(210,14%,15%,0.6);border-radius:8px;border:1px solid hsla(210,14%,25%);">`;
      html += `<h4 style="margin:0 0 8px 0;color:hsl(210,20%,92%);font-size:14px;">${category}</h4>`;
      html += `<p style="margin:0;color:hsl(210,20%,75%);font-size:13px;line-height:1.4">${items}</p>`;
      html += `</div>`;
    });

    html += '</div>';
    html += '<p style="margin-top:15px;text-align:center;color:hsl(210,20%,60%);font-size:12px;">Daftar hafalan akan tertutup otomatis setelah 3 menit.</p>';
    html += '</div>';

    await Swal.fire({
      title: 'Subtest ME - Hafalan (3:00)',
      html,
      timer: 180000,
      timerProgressBar: true,
      showConfirmButton: false,
      showCloseButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      didOpen: () => {
        let timeLeft = 180;
        const interval = setInterval(() => {
          timeLeft -= 1;
          const minutes = Math.max(0, Math.floor(timeLeft / 60));
          const seconds = Math.max(0, timeLeft % 60);
          Swal.update({ title: `Subtest ME - Hafalan (${minutes}:${seconds.toString().padStart(2, '0')})` });
          if (timeLeft <= 0) clearInterval(interval);
        }, 1000);
        (Swal as any).timerInterval = interval;
      },
      willClose: () => {
        clearInterval((Swal as any).timerInterval);
      }
    });
  }, []);
  
  // Show examples and instructions for IST subtests
  const showSubtestExample = useCallback(async (subtestCode: string) => {
    const examples = {
      SE: {
        title: 'Subtest SE - Sentence Completion',
        instructions: 'Soal-soal 01-20 terdiri atas kalimat-kalimat. Pada setiap kalimat satu kata hilang dan disediakan 5 (lima) kata pilihan sebagai penggantinya. Pilihan kata yang tepat dapat menyempurnakan kalimat itu!',
        examples: [
          {
            question: 'Seekor kuda mempunyai kesamaan terbanyak dengan seekor …..',
            options: ['a) kucing', 'b) bajing', 'c) keledai', 'd) lembu', 'e) anjing'],
            correct: 'c',
            explanation: 'Jawaban yang benar ialah : c) keledai. Oleh karena itu, pada lembar jawaban di belakang contoh 01, huruf c harus dicoret.'
          },
          {
            question: 'Lawannya "harapan" ialah …..',
            options: ['a) duka', 'b) putus asa', 'c) sengsara', 'd) cinta', 'e) benci'],
            correct: 'b',
            explanation: 'Jawabannya ialah b) putus asa. Maka huruf b yang seharusnya dicoret.'
          }
        ]
      },
      WA: {
        title: 'Subtest WA - Word Association',
        instructions: 'Ditentukan 5 kata. Pada 4 dari 5 kata itu terdapat suatu kesamaan. Carilah kata yang kelima yang tidak memiliki kesamaan dengan keempat kata itu.',
        examples: [
          {
            question: 'a) meja b) kursi c) burung d) lemari e) tempat tidur',
            options: ['a) meja', 'b) kursi', 'c) burung', 'd) lemari', 'e) tempat tidur'],
            correct: 'c',
            explanation: 'a), b), d), dan e) ialah perabot rumah (meubel). c) burung, bukan perabot rumah atau tidak memiliki kesamaan dengan keempat kata itu. Oleh karena itu, pada lembar jawaban di belakang contoh 02, huruf c harus dicoret.'
          },
          {
            question: 'a) duduk b) berbaring c) berdiri d) berjalan e) berjongkok',
            options: ['a) duduk', 'b) berbaring', 'c) berdiri', 'd) berjalan', 'e) berjongkok'],
            correct: 'd',
            explanation: 'pada a), b), c), dan e) orang berada dalam keadaan tidak bergerak, sedangkan d) orang dalam keadaan bergerak. Maka jawaban yang benar ialah : d) berjalan.'
          }
        ]
      },
      AN: {
        title: 'Subtest AN - Analogy',
        instructions: 'Ditentukan 3 (tiga) kata. Antara kata pertama dan kata kedua terdapat suatu hubungan tertentu. Antara kata ketiga dan salah satu diantara lima kata pilihan harus pula terdapat hubungan yang sama itu. Carilah kata itu.',
        examples: [
          {
            question: 'Hutan : pohon = tembok : ?',
            options: ['a) batu bata', 'b) rumah', 'c) semen', 'd) putih', 'e) dinding'],
            correct: 'a',
            explanation: 'hubungan antara hutan dan pohon ialah bahwa hutan terdiri atas pohon-pohon, maka hubungan antara tembok dan salah satu kata pilihan bahwa tembok terdiri atas batu-batu bata. Oleh karena itu, pada lembar jawaban di belakang contoh 03, huruf a harus dicoret.'
          },
          {
            question: 'Gelap : terang = basah : ?',
            options: ['a) Hujan', 'b) hari', 'c) lembab', 'd) angin', 'e) kering'],
            correct: 'e',
            explanation: 'Gelap ialah lawannya dari terang, maka untuk basah lawannya ialah kering. Maka jawaban contoh ini ialah : e) kering.'
          }
        ]
      },
      GE: {
        title: 'Subtest GE - Generalization',
        instructions: 'Ditentukan dua kata. Carilah satu perkataan yang meliputi pengertian kedua kata tadi. Tulislah perkataan itu pada lembar jawaban di belakang nomor soal yang sesuai.',
        examples: [
          {
            question: 'Ayam – itik',
            answer: 'burung',
            explanation: 'Perkataan "burung" dapat meliputi pengertian kedua kata itu. Maka jawabannya ialah "burung". Oleh karena itu, pada lembar jawaban di belakang contoh 04, harus ditulis "burung".'
          },
          {
            question: 'Gaun – celana',
            answer: 'pakaian',
            explanation: 'Pada contoh ini jawabannya ialah "pakaian" maka "pakaian" yang seharusnya ditulis. Carilah selalu perkataan yang tepat yang dapat meliputi pengertuan kedua kata itu.'
          }
        ]
      },
      RA: {
        title: 'Subtest RA - Arithmetic',
        instructions: 'Persoalan berikutnya ialah soal-soal hitungan.',
        examples: [
          {
            question: 'Sebatang pensil harganya 25 rupiah. Berapakah harga 3 batang?',
            answer: '75',
            explanation: 'Jawabannya ialah : 75. Perhatikan cara menjawab di atas lembar jawaban! Pada lembar jawaban lihatlah pada kolom 05. Kolom ini terdiri atas angka-angka 1 sampai 9 dan 0. Untuk menunjukkan jawaban suatu soal, maka coretlah angka-angka yang terdapat di dalam jawaban itu. Keurutan angka jawaban tidak perlu dihiraukan. Pada contoh 05 jawaban ialah 75. Oleh karena itu, pada lembar jawaban di belakang contoh 05, angka 7 dan 5 harus dicoret.'
          },
          {
            question: 'Dengan sepede Husin dapat mencapai 15 km dalam waktu 1 jam. Berapa km-kah yang dapat ia capai dalam waktu 4 jam?',
            answer: '60',
            explanation: 'Jawabannya ialah : 60. Maka untuk menunjukkan jawaban itu angka 6 dan 0 yang seharusnya dicoret.'
          }
        ]
      },
      ZR: {
        title: 'Subtest ZR - Number Series',
        instructions: 'Pada persoalan berikut akan diberikan deret angka. Setiap deret tersusun menurut suatu aturan yang tertentu dan dapat dilanjutkan menurut aturan itu. Carilah untuk setiap deret, angka berikutnya dan coretlah jawaban saudara pada lembar jawaban di belakang nomor soal yang sesuai.',
        examples: [
          {
            question: '2 4 6 8 10 12 14 ?',
            answer: '16',
            explanation: 'Pada deret ini angka berikutnya selelau didapat jika angka di depannya ditambah dengan 2. Maka jawabanya ialah 16. Oleh karena itu, pada lembar jawaban di belakang contoh 06, angka 1 dan 6 harus dicoret.'
          },
          {
            question: '9 7 10 8 11 9 12 ?',
            answer: '10',
            explanation: 'Pada deret ini berganti-ganti harus dikurangi dengan 2 dan setelah itu ditambah dengan 3. Jawaban contoh ini ialah : 10, maka dari itu angka 1 dan 0 seharusnya yang dicoret. Kadang-kadang pada beberapa soal harus pula dikalikan atau dibagi.'
          }
        ]
      },
      FA: {
        title: 'Subtest FA - Figure Assembly',
        instructions: 'Pada persoalan berikutnya, setiap soal memperlihatkan suatu bentuk tertentu yang terpotong menjadi beberapa bagian. Carilah di antara bentuk-bentuk yang ditentukan (a, b, c, d, e) bentuk yang dibangun dengan cara menyusun potongan-potongan itu sedemikian rupa, sehingga tidak ada kelebihan sudut atau ruang di antaranya.',
        examples: [
          {
            question: '[Gambar potongan-potongan]',
            options: ['a) Gambar A', 'b) Gambar B', 'c) Gambar C', 'd) Gambar D', 'e) Gambar E'],
            correct: 'a',
            explanation: 'Jika potongan-potongan pada contoh 07 di atas disusun (digabungkan), maka akan menghasilkan bentuk a. Oleh karena itu, pada lembar jawaban di belakang contoh 07, huruf a harus dicoret.'
          }
        ]
      },
      WU: {
        title: 'Subtest WU - Cube Rotation',
        instructions: 'Ditentukan 5 (lima) buah kubus a, b, c, d, e. Pada tiap-tiap kubus terdapat enam tanda yang berlainan pada setiap sisinya. Tiga dari tanda itu dapat dilihat. Kubus-kubus yang ditentukan itu (a, b, c, d, e) ialah kubus-kubus yang berbeda, artinya kubus-kubus itu dapat mempunyai tanda-tanda yang sama, akan tetapi susunannya berlainan, setiap soal memperlihatkan salah satu kubus yang ditentukan di dalam kedudukan yang berbeda. Carilah kubus yang dimaksudkan itu dan coretkanlah jawaban saudara pada lembar jawaban di belakang nomor yang sesuai.',
        examples: [
          {
            question: '[Gambar kubus dalam posisi berbeda]',
            options: ['a) Kubus A', 'b) Kubus B', 'c) Kubus C', 'd) Kubus D', 'e) Kubus E'],
            correct: 'a',
            explanation: 'Contoh ini memperlihatkan kubus a dengan kedudukan yang berbeda. Mendapatkannya adalah dengan cara menggulingkan lebih dulu kubus itu ke kiri satu kali dan kemudian diputar ke kiri satu kali, sehingga sisi kubus yang bertanda dua segi empat hitam terletak di depan, seperti kubus a. Oleh karena itu, pada lembar jawaban di belakang contoh 08, huruf a harus dicoret.'
          }
        ]
      },
      ME: {
        title: 'Subtest ME - Memory',
        instructions: 'Pada persoalan berikutnya, terdapat sejumlah pertanyaan mengenai kata-kata yang telah saudara hafalkan tadi. Coretlah jawaban saudara pada lembaran jawaban di belakang nomor soal yang sesuai.',
        examples: [
          {
            question: 'Kata yang mempunyai huruf permulaan – Q – adalah suatu …….',
            options: ['a) bunga', 'b) perkakas', 'c) burung', 'd) kesenian', 'e) binatang'],
            correct: 'd',
            explanation: 'Quintet adalah termasuk dalam jenis kesenian, sehingga jawaban yang benar adalah d). Oleh karena itu, pada lembar jawaban di belakang contoh 09 huruf d harus dicoret.'
          },
          {
            question: 'Kata yang mempunyai huruf pertama – Z – adalah suatu …….',
            options: ['a) bunga', 'b) perkakas', 'c) burung', 'd) kesenian', 'e) binatang'],
            correct: 'e',
            explanation: 'Jawabannya adalah e, karena Zebra termasuk dalam jenis binatang.'
          }
        ]
      }
    };
    
    const example = examples[subtestCode as keyof typeof examples];
    if (!example) return;
    
    let html = '<div style="text-align:left;max-height:70vh;overflow-y:auto;">';
    html += `<div style="margin-bottom:20px;padding:12px;background:hsla(174,72%,46%,0.1);border-radius:8px;border:1px solid hsla(174,72%,46%,0.3);">`;
    html += `<h3 style="margin:0 0 8px 0;color:hsl(174,72%,46%);">PETUNJUK</h3>`;
    html += `<p style="margin:0;color:hsl(210,20%,75%);line-height:1.5">${example.instructions}</p>`;
    html += `</div>`;
    
    html += '<h4 style="margin-bottom:15px;color:hsl(210,20%,92%);">CONTOH:</h4>';
    
    example.examples.forEach((ex, idx) => {
      html += `<div style="margin-bottom:20px;padding:12px;background:hsla(210,14%,15%,0.6);border-radius:8px;border:1px solid hsla(210,14%,25%);">`;
      html += `<p style="margin:0 0 10px 0;color:hsl(210,20%,92%);font-weight:500;">Contoh ${idx + 1}:</p>`;
      html += `<p style="margin:0 0 10px 0;color:hsl(210,20%,75%);">${ex.question}</p>`;
      
      if (ex.options) {
        ex.options.forEach(opt => {
          html += `<p style="margin:2px 0;color:hsl(210,20%,70%);font-size:13px;">${opt}</p>`;
        });
      }
      
      if (ex.answer) {
        html += `<p style="margin:10px 0 5px 0;color:hsl(174,72%,46%);font-weight:500;">Jawaban: ${ex.answer}</p>`;
      }
      
      if (ex.correct) {
        html += `<p style="margin:10px 0 5px 0;color:hsl(174,72%,46%);font-weight:500;">Jawaban yang benar: ${ex.correct})</p>`;
      }
      
      html += `<p style="margin:5px 0 0 0;color:hsl(210,20%,60%);font-size:12px;font-style:italic;">${ex.explanation}</p>`;
      html += `</div>`;
    });
    
    html += '</div>';
    
    await Swal.fire({
      title: example.title,
      html: html,
      confirmButtonText: 'Mulai Subtest',
      showConfirmButton: true,
      showCloseButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      customClass: {
        popup: 'ist-example-modal'
      }
    });
  }, []);

  const showCfitSubtestExample = useCallback(async (subtestCode: string) => {
    const code = String(subtestCode || "").toUpperCase();
    const examples: Record<string, { title: string; instruction: string; example: string; note: string }> = {
      S1: {
        title: "CFIT 3A - Tes 1: Series",
        instruction: "Pilih satu gambar/huruf yang paling tepat untuk melanjutkan deret pola.",
        example: "Contoh: A B A B ? maka pola berikutnya adalah A.",
        note: "Perhatikan perubahan bentuk, posisi, arah, jumlah, dan urutan pola.",
      },
      SERIES: {
        title: "CFIT 3A - Tes 1: Series",
        instruction: "Pilih satu gambar/huruf yang paling tepat untuk melanjutkan deret pola.",
        example: "Contoh: A B A B ? maka pola berikutnya adalah A.",
        note: "Perhatikan perubahan bentuk, posisi, arah, jumlah, dan urutan pola.",
      },
      S2: {
        title: "CFIT 3A - Tes 2: Classifications",
        instruction: "Pilih dua gambar/huruf yang bersama-sama membentuk kelompok jawaban yang tepat.",
        example: "Contoh: jika jawaban yang benar adalah B dan E, pilih B serta E.",
        note: "Pada Tes 2 setiap soal harus memilih tepat 2 pilihan.",
      },
      CLASSIFICATIONS: {
        title: "CFIT 3A - Tes 2: Classifications",
        instruction: "Pilih dua gambar/huruf yang bersama-sama membentuk kelompok jawaban yang tepat.",
        example: "Contoh: jika jawaban yang benar adalah B dan E, pilih B serta E.",
        note: "Pada Tes 2 setiap soal harus memilih tepat 2 pilihan.",
      },
      S3: {
        title: "CFIT 3A - Tes 3: Matrices",
        instruction: "Pilih satu gambar/huruf yang paling tepat untuk melengkapi matriks/pola.",
        example: "Contoh: cari aturan baris dan kolom, lalu pilih opsi yang melengkapi bagian kosong.",
        note: "Perhatikan relasi antar bentuk secara horizontal dan vertikal.",
      },
      MATRICES: {
        title: "CFIT 3A - Tes 3: Matrices",
        instruction: "Pilih satu gambar/huruf yang paling tepat untuk melengkapi matriks/pola.",
        example: "Contoh: cari aturan baris dan kolom, lalu pilih opsi yang melengkapi bagian kosong.",
        note: "Perhatikan relasi antar bentuk secara horizontal dan vertikal.",
      },
      S4: {
        title: "CFIT 3A - Tes 4: Conditions",
        instruction: "Pilih satu gambar/huruf yang memenuhi kondisi atau aturan yang sama dengan contoh.",
        example: "Contoh: jika titik berada di dalam lingkaran tetapi di luar segitiga, pilih opsi dengan kondisi yang sama.",
        note: "Baca kondisi posisi/relasi bentuk dengan teliti.",
      },
      CONDITIONS: {
        title: "CFIT 3A - Tes 4: Conditions",
        instruction: "Pilih satu gambar/huruf yang memenuhi kondisi atau aturan yang sama dengan contoh.",
        example: "Contoh: jika titik berada di dalam lingkaran tetapi di luar segitiga, pilih opsi dengan kondisi yang sama.",
        note: "Baca kondisi posisi/relasi bentuk dengan teliti.",
      },
    };
    const item = examples[code];
    if (!item) return;

    await Swal.fire({
      title: item.title,
      html: `
        <div style="text-align:left;line-height:1.6">
          <div style="padding:12px;border-radius:8px;background:hsla(174,72%,46%,0.1);border:1px solid hsla(174,72%,46%,0.3);margin-bottom:12px">
            <strong>Petunjuk:</strong><br/>${item.instruction}
          </div>
          <div style="padding:12px;border-radius:8px;background:hsla(210,14%,15%,0.6);border:1px solid hsla(210,14%,25%);margin-bottom:12px">
            <strong>Contoh:</strong><br/>${item.example}
          </div>
          <p style="margin:0;color:hsl(210,20%,75%)">${item.note}</p>
          <p style="margin:12px 0 0;color:hsl(174,72%,46%);font-size:13px">Waktu segmen akan mulai berjalan setelah Anda menekan tombol Mulai.</p>
        </div>
      `,
      confirmButtonText: "Mulai Segmen",
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      customClass: { popup: "ist-example-modal" },
    });
  }, []);

  const showKraepelinColumnIntro = useCallback(async (columnCode: string) => {
    const match = String(columnCode || "").match(/\d+/);
    const columnNo = match ? Number(match[0]) : 1;
    await Swal.fire({
      title: `Kraepelin - Kolom ${columnNo}`,
      html: `
        <div style="text-align:left;line-height:1.6">
          <div style="padding:12px;border-radius:8px;background:hsla(174,72%,46%,0.1);border:1px solid hsla(174,72%,46%,0.3);margin-bottom:12px">
            Jumlahkan dua angka yang berdekatan dari atas ke bawah, lalu tulis <b>angka satuan</b> hasilnya.
          </div>
          <p style="margin:0;color:hsl(210,20%,75%)">Kerjakan secepat dan seteliti mungkin. Saat waktu kolom habis, sistem otomatis memindahkan Anda ke kolom berikutnya.</p>
          <p style="margin:12px 0 0;color:hsl(174,72%,46%);font-size:13px">Waktu kolom mulai berjalan setelah tombol Mulai Kolom ditekan.</p>
        </div>
      `,
      confirmButtonText: "Mulai Kolom",
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      customClass: { popup: "ist-example-modal" },
    });
  }, []);

  const showTestInstructions = useCallback(async (test: DbInstrument) => {
    const name = test.name || "Tes";
    const upper = name.toUpperCase();
    let title = `Petunjuk ${name}`;
    let html = `
      <div style="text-align:left;line-height:1.6">
        <div style="padding:12px;border-radius:8px;background:hsla(174,72%,46%,0.1);border:1px solid hsla(174,72%,46%,0.3);margin-bottom:12px">
          Baca petunjuk dengan teliti sebelum mulai menjawab.
        </div>
        <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
          <li>Kerjakan sesuai instruksi pada layar.</li>
          <li>Jawab dengan tenang dan konsisten.</li>
          <li>Waktu tes akan mulai/berjalan setelah Anda menekan tombol OK.</li>
        </ul>
      </div>
    `;

    if (upper.includes("DISC")) {
      title = "Petunjuk Tes DISC";
      html = `
        <div style="text-align:left;line-height:1.6">
          <p style="margin:0 0 12px;color:hsl(210,20%,75%)">Setiap nomor berisi beberapa pernyataan. Pilih satu pernyataan yang <b>paling</b> menggambarkan diri Anda dan satu pernyataan yang <b>paling tidak</b> menggambarkan diri Anda.</p>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Tidak ada jawaban benar atau salah.</li>
            <li>Jawab spontan sesuai kebiasaan kerja Anda.</li>
            <li>Waktu berjalan setelah tombol OK ditekan.</li>
          </ul>
        </div>`;
    } else if (upper.includes("PERSONALITY") || upper.includes("TEMPERAMEN")) {
      title = "Petunjuk Personality Plus";
      html = `
        <div style="text-align:left;line-height:1.6">
          <p style="margin:0 0 12px;color:hsl(210,20%,75%)">Pilih pernyataan/kata yang paling menggambarkan diri Anda dalam kehidupan sehari-hari.</p>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Jawab sesuai kecenderungan alami, bukan yang dianggap paling baik.</li>
            <li>Tidak ada jawaban benar atau salah.</li>
            <li>Waktu berjalan setelah tombol OK ditekan.</li>
          </ul>
        </div>`;
    } else if (upper.includes("PAPI")) {
      title = "Petunjuk PAPI Kostick";
      html = `
        <div style="text-align:left;line-height:1.6">
          <div style="padding:12px;border-radius:8px;background:hsla(174,72%,46%,0.1);border:1px solid hsla(174,72%,46%,0.3);margin-bottom:12px">
            Setiap soal berisi dua pernyataan. Pilih pernyataan yang paling dominan atau paling mencerminkan diri Anda dalam konteks kerja.
          </div>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Tidak ada jawaban benar atau salah.</li>
            <li>Pilih salah satu dari dua pernyataan yang tersedia.</li>
            <li>Jawab seluruh pertanyaan secara konsisten.</li>
            <li>Waktu berjalan setelah tombol OK ditekan.</li>
          </ul>
        </div>`;
    } else if (upper.includes("KRAEPELIN")) {
      title = "Petunjuk Tes Kraepelin";
      html = `
        <div style="text-align:left;line-height:1.6">
          <div style="padding:12px;border-radius:8px;background:hsla(174,72%,46%,0.1);border:1px solid hsla(174,72%,46%,0.3);margin-bottom:12px">
            Jumlahkan dua angka pada setiap baris, lalu tulis <b>angka satuan</b> hasilnya. Contoh: 7 + 8 = 15, maka tulis 5.
          </div>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Kerjakan dari atas ke bawah pada kolom yang sedang aktif.</li>
            <li>Saat waktu kolom habis, sistem pindah ke kolom berikutnya.</li>
            <li>Waktu kolom berjalan setelah tombol OK/Mulai ditekan.</li>
          </ul>
        </div>`;
    } else if (upper.includes("CFIT") || upper.includes("CULTURE FAIR")) {
      title = "Petunjuk CFIT 3A";
      html = `
        <div style="text-align:left;line-height:1.6">
          <p style="margin:0 0 12px;color:hsl(210,20%,75%)">Tes ini mengukur penalaran nonverbal melalui pola gambar. Perhatikan contoh pada setiap segmen sebelum menjawab.</p>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Tes 2 meminta tepat dua pilihan jawaban.</li>
            <li>Setiap segmen memiliki instruksi dan waktu sendiri.</li>
            <li>Waktu berjalan setelah tombol OK/Mulai ditekan.</li>
          </ul>
        </div>`;
    } else if (upper.includes("IST")) {
      title = "Petunjuk IST";
      html = `
        <div style="text-align:left;line-height:1.6">
          <p style="margin:0 0 12px;color:hsl(210,20%,75%)">Tes IST terdiri dari beberapa subtes. Baca contoh dan petunjuk tiap subtes sebelum mulai menjawab.</p>
          <ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%)">
            <li>Kerjakan sesuai instruksi subtes yang sedang aktif.</li>
            <li>Anda tidak dapat kembali ke subtes sebelumnya.</li>
            <li>Waktu berjalan setelah tombol OK/Mulai ditekan.</li>
          </ul>
        </div>`;
    }

    await Swal.fire({
      title,
      html,
      confirmButtonText: "OK, Mulai",
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      customClass: { popup: "ist-example-modal" },
    });
  }, []);

  useEffect(() => {
    if (!currentTest || submitted) return;
    const introKey = currentTest.id;
    if (shownTestInstructionsRef.current.has(introKey)) return;
    shownTestInstructionsRef.current.add(introKey);
    testInstructionInProgressRef.current = true;
    setTestIntroActive(true);
    (async () => {
      const pauseStartedAt = Date.now();
      await showTestInstructions(currentTest);
      const pauseDuration = Date.now() - pauseStartedAt;
      const testStartedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
      sessionStorage.setItem("psytest_started_at", String(testStartedAt + pauseDuration));
      testInstructionInProgressRef.current = false;
      setTestIntroActive(false);
    })();
  }, [currentTestIdx, currentTest, submitted, showTestInstructions]);

  // Track current IST/CFIT subtest when question changes
  useEffect(() => {
    if (!testIntroActive && !testInstructionInProgressRef.current && usesSubtestIntro(currentTest) && currentQuestion?.subtest_code && currentQuestion.subtest_code !== currentSubtest) {
      const nextSubtest = currentQuestion.subtest_code;
      const introKey = `${currentTest.id}:${nextSubtest}`;
      setCurrentSubtest(nextSubtest);
      const shownRef = isCFIT(currentTest) ? shownCfitSubtestsRef : shownIstSubtestsRef;

      if (shownRef.current.has(introKey)) {
        setSubtestStartedAt(Date.now());
        return;
      }

      shownRef.current.add(introKey);
      setSubtestIntroActive(true);
      (async () => {
        const pauseStartedAt = Date.now();
        if (isKraepelinTest(currentTest)) {
          await showKraepelinColumnIntro(nextSubtest);
        } else if (isCFIT(currentTest)) {
          await showCfitSubtestExample(nextSubtest);
        } else {
          await showSubtestExample(nextSubtest);
        }
        if (isIST(currentTest) && nextSubtest === 'ME') {
          await showMemoryItems();
        }
        const pauseDuration = Date.now() - pauseStartedAt;
        const testStartedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
        sessionStorage.setItem("psytest_started_at", String(testStartedAt + pauseDuration));
        setSubtestStartedAt(Date.now());
        setSubtestIntroActive(false);
      })();
    }
  }, [currentQIdx, currentTestIdx, currentTest, currentQuestion, currentSubtest, testIntroActive, showSubtestExample, showCfitSubtestExample, showKraepelinColumnIntro, showMemoryItems]);

  // Subtest info for IST strict mode (computed each render — also used by useEffect below)
  const subtestQuestions = usesSubtestIntro(currentTest) && currentSubtest
    ? currentTest.questions.filter(q => q.subtest_code === currentSubtest) : [];
  const subtestTimeLimit = isKraepelinTest(currentTest) ? 0.5 : (subtestQuestions[0]?.time_limit_minutes || 6);
  const elapsedSec = Math.floor((Date.now() - subtestStartedAt) / 1000);
  const remainingSec = subtestIntroActive ? subtestTimeLimit * 60 : Math.max(0, subtestTimeLimit * 60 - elapsedSec);

  const handleNextTest = useCallback(() => {
    if (currentTestIdx < instruments.length - 1) {
      const nextTestIdx = currentTestIdx + 1;
      const nextTest = instruments[nextTestIdx];
      startTimerForInstrument(nextTest);
      setCurrentTestIdx(nextTestIdx);
      setCurrentQIdx(0);
      setCompletedSubtests(new Set());
      setCurrentSubtest(null);
    }
  }, [currentTestIdx, instruments]);

  const finishCurrentSubtest = useCallback(() => {
    if (!usesSubtestIntro(currentTest) || !currentSubtest) return false;
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

  // Check time-up for current IST/CFIT subtest
  useEffect(() => {
    if (!usesSubtestIntro(currentTest) || !currentSubtest || submitted || subtestIntroActive) return;
    if (remainingSec <= 0) {
      Swal.fire({ icon: "info", title: `Waktu ${isKraepelinTest(currentTest) ? "Kolom" : "Subtes"} ${currentSubtest} Habis`, text: `Otomatis pindah ke ${isKraepelinTest(currentTest) ? "kolom" : "subtes"} berikutnya.`, timer: 1800, showConfirmButton: false, ...SWAL_THEME });
      const moved = finishCurrentSubtest();
      if (!moved) handleNextTest();
    }
  }, [remainingSec, currentSubtest, currentTest, submitted, subtestIntroActive, finishCurrentSubtest, handleNextTest]);

  const completeSubmissionRef = useRef<() => Promise<void>>(async () => {});

  const handleTimeUp = useCallback(async () => {
    if (submitted) return;

    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) return;
    const cand = JSON.parse(candRaw);
    if (!cand.activationCodeId) return;

    if (currentTestIdx < instruments.length - 1) {
      const currentTest = instruments[currentTestIdx];
      const nextTestIdx = currentTestIdx + 1;
      const nextTest = instruments[nextTestIdx];

      await persistSession({ testIdx: currentTestIdx, qIdx: currentQIdx, remainingSecOverride: 0 });
      startTimerForInstrument(nextTest);
      setCurrentTestIdx(nextTestIdx);
      setCurrentQIdx(0);
      setCompletedSubtests(new Set());
      setCurrentSubtest(null);

      await Swal.fire({
        icon: "info",
        title: `Waktu ${currentTest?.name || "tes"} Habis`,
        text: `Lanjut ke ${nextTest?.name || "tes berikutnya"}. Waktu tes selanjutnya akan dimulai sekarang.`, 
        ...SWAL_THEME,
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    await (supabase as any).rpc("candidate_update_activation_code_status", {
      _id: cand.activationCodeId,
      _status: 'completed',
      _test_completed_at: new Date().toISOString(),
      _auto_submitted: true,
    });

    await Swal.fire({
      icon: "warning",
      title: "Waktu Habis!",
      text: "Jawaban Anda akan disimpan otomatis dan tes dianggap selesai.",
      ...SWAL_THEME,
      allowOutsideClick: false,
    }).then(() => completeSubmissionRef.current());
  }, [submitted, currentTestIdx, currentQIdx, instruments, persistSession]);

  // Check if auto-submit is needed after resume
  useEffect(() => {
    if (sessionStorage.getItem("psytest_should_auto_submit") === "true" && !submitted) {
      sessionStorage.removeItem("psytest_should_auto_submit");
      handleTimeUp();
    }
  }, [submitted, handleTimeUp]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Memuat tes...</div>;
  if (instruments.length === 0) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Tidak ada tes tersedia.</div>;

  const getRequiredPickCount = (q?: DbQuestion) => q?.question_type === "multi_choice" ? 2 : 1;
  const isStoredAnswerComplete = (q: DbQuestion, value: unknown) => {
    if (q.question_type === "multi_choice") {
      return String(value || "").split("+").filter(Boolean).length === getRequiredPickCount(q);
    }
    if (q.question_type === "disc_pair") {
      const text = String(value || "");
      return /M:[^|]+/.test(text) && /L:[^|]+/.test(text);
    }
    return String(value || "").trim().length > 0;
  };

  const totalAllQuestions = instruments.reduce((sum, t) => sum + t.questions.length, 0);
  const totalAnsweredAll = instruments.reduce((sum, t) => (
    sum + t.questions.filter(q => isStoredAnswerComplete(q, answers[`${t.id}:${q.id}`])).length
  ), 0);
  const progress = totalAllQuestions > 0 ? (totalAnsweredAll / totalAllQuestions) * 100 : 0;
  const isCameraReady = cameraStatus === "active";

  const ensureCameraActive = async () => {
    if (isCameraReady && webcamRef.current?.isActive()) return true;
    await Swal.fire({
      icon: "warning",
      title: "Kamera Wajib Aktif",
      html: "Kamera wajib menyala selama tes psikologi. Aktifkan/izinkan kamera untuk melanjutkan. Jika kamera tetap tidak aktif, sesi akan dicatat sebagai <b>cheating</b>.",
      ...SWAL_THEME,
      confirmButtonText: "Saya Mengerti",
    });
    if (cameraStatus === "error" || !webcamRef.current?.isActive()) {
      await handleCameraViolation("Kamera tidak aktif saat kandidat mencoba melanjutkan tes. Sesi dicatat sebagai <b>cheating</b>.");
    }
    return false;
  };

  const handleAnswer = async (instrumentId: string, questionId: string, value: string) => {
    if (!(await ensureCameraActive())) return;
    setAnswers(prev => ({ ...prev, [`${instrumentId}:${questionId}`]: value }));
    // Auto-advance to next question
    handleNext();
  };
  const handleNumericAnswer = (instrumentId: string, questionId: string, value: string) => {
    if (!isCameraReady) return;
    const cleaned = value.replace(/\D/g, "").slice(0, 2);
    setAnswers(prev => ({ ...prev, [`${instrumentId}:${questionId}`]: cleaned }));
  };
  const handleKraepelinAnswer = (instrumentId: string, questionId: string, value: string) => {
    if (!isCameraReady) {
      ensureCameraActive();
      return false;
    }
    const cleaned = value.replace(/\D/g, "").slice(-1);
    setAnswers(prev => {
      const next = { ...prev };
      if (cleaned) next[`${instrumentId}:${questionId}`] = cleaned;
      else delete next[`${instrumentId}:${questionId}`];
      return next;
    });
    return Boolean(cleaned);
  };
  const handleMultiPick = (instrumentId: string, questionId: string, optId: string, maxPick = 2) => {
    if (!isCameraReady) {
      ensureCameraActive();
      return;
    }
    const key = `${instrumentId}:${questionId}`;
    const current = (answers[key] as string) || "";
    const set = new Set(current ? current.split("+").filter(Boolean) : []);
    if (set.has(optId)) set.delete(optId);
    else {
      set.add(optId);
      if (set.size > maxPick) {
        // remove oldest (first)
        const first = Array.from(set)[0];
        set.delete(first);
      }
    }
    const sorted = Array.from(set).sort().join("+");
    setAnswers(prev => {
      const next = { ...prev };
      if (sorted) next[key] = sorted;
      else delete next[key];
      return next;
    });
  };
  const handleDiscPick = (instrumentId: string, questionId: string, kind: "M" | "L", optId: string) => {
    if (!isCameraReady) {
      ensureCameraActive();
      return;
    }
    const key = `${instrumentId}:${questionId}`;
    const current = (answers[key] as string) || "";
    const parts: Record<string, string> = { M: "", L: "" };
    current.split("|").forEach(p => { const [k, v] = p.split(":"); if (k && v) parts[k] = v; });
    parts[kind] = optId;
    if (parts.M && parts.L && parts.M === parts.L) parts[kind === "M" ? "L" : "M"] = "";
    setAnswers(prev => ({ ...prev, [key]: `M:${parts.M}|L:${parts.L}` }));
  };

  const handleNextTestSync = () => {
    if (currentTestIdx < instruments.length - 1) {
      // Hanya boleh lanjut ke test berikutnya jika test saat ini selesai (semua soal terjawab)
      const currentTest = instruments[currentTestIdx];
      const allAnswered = currentTest.questions.every(q => isStoredAnswerComplete(q, answers[`${currentTest.id}:${q.id}`]));
      
      if (allAnswered) {
        const nextTestIdx = currentTestIdx + 1;
        startTimerForInstrument(instruments[nextTestIdx]);
        setCurrentTestIdx(nextTestIdx);
        setCurrentQIdx(0);
        setCompletedSubtests(new Set());
        setCurrentSubtest(null);
      } else {
        // Belum semua soal terjawab
        const answered = currentTest.questions.filter(q => isStoredAnswerComplete(q, answers[`${currentTest.id}:${q.id}`])).length;
        const total = currentTest.questions.length;
        Swal.fire({
          icon: "warning",
          title: "Belum Selesai",
          text: `Selesaikan semua ${total} soal di tes ini terlebih dahulu (${answered}/${total}).`,
          ...SWAL_THEME,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  const handleNext = async () => {
    if (!currentTest) return;
    if (!(await ensureCameraActive())) return;
    if (currentQuestion?.question_type === "multi_choice" && !isStoredAnswerComplete(currentQuestion, answers[`${currentTest.id}:${currentQuestion.id}`])) {
      Swal.fire({
        icon: "warning",
        title: "Jawaban Belum Lengkap",
        text: `Pilih tepat ${getRequiredPickCount(currentQuestion)} jawaban untuk soal ini.`,
        ...SWAL_THEME,
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }
    // Subtest based tests: if next question belongs to a different subtest, mark current subtest completed.
    if (usesSubtestIntro(currentTest) && currentQuestion?.subtest_code) {
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
    // Segment based tests: cannot go back to a completed subtest/column.
    if (usesSubtestIntro(currentTest) && currentQuestion?.subtest_code) {
      const prevQ = currentTest.questions[currentQIdx - 1];
      if (!prevQ || prevQ.subtest_code !== currentQuestion.subtest_code) return;
    }
    if (currentQIdx > 0) setCurrentQIdx(currentQIdx - 1);
    else if (currentTestIdx > 0) {
      const prev = instruments[currentTestIdx - 1];
      setCurrentTestIdx(currentTestIdx - 1); setCurrentQIdx(prev.questions.length - 1);
    }
  };

  const isLastKraepelinColumn = isKraepelinTest(currentTest) && currentSubtest
    ? currentTest.questions.filter(q => q.subtest_code === currentSubtest).slice(-1)[0]?.question_number === currentTest.questions.slice(-1)[0]?.question_number
    : false;
  const isLastQuestion = currentTestIdx === instruments.length - 1 && (
    isLastKraepelinColumn || currentQIdx === (currentTest?.questions.length || 1) - 1
  );

  const handleSubmit = async () => {
    if (!(await ensureCameraActive())) return;
    const incompleteMulti = instruments.flatMap(t => (
      t.questions
        .filter(q => q.question_type === "multi_choice" && !isStoredAnswerComplete(q, answers[`${t.id}:${q.id}`]))
        .map(q => q.question_number)
    ));
    if (incompleteMulti.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Jawaban Pilihan Ganda Belum Lengkap",
        text: `Pilih tepat 2 jawaban pada soal nomor ${incompleteMulti.slice(0, 8).join(", ")}${incompleteMulti.length > 8 ? "..." : ""}.`,
        ...SWAL_THEME,
      });
      return;
    }
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
    if (!dataUrl) {
      setSubmitted(false);
      await handleCameraViolation("Kamera wajib aktif sampai tes selesai. Snapshot kamera gagal diambil sehingga sesi dicatat sebagai <b>cheating</b>.");
      return;
    }
    if (dataUrl) snapUrl = await uploadDataUrlAsPhoto(dataUrl, `snap-${candidate?.email || "anon"}`);

    // Build per-instrument answers map { question_id -> optId } for the server.
    const instrumentsPayload = instruments.map((inst) => {
      const answersMap: Record<string, string> = {};
      inst.questions.forEach((q) => {
        const v = answers[`${inst.id}:${q.id}`];
        if (typeof v === "string" && v) answersMap[q.id] = v;
      });
      return { id: inst.id, answers: answersMap };
    });

    // Server-side scoring: edge function reads answer keys with the service role
    // and writes test_results + test_answers. Keys never reach the client.
    try {
      const { data, error } = await supabase.functions.invoke("test-submit", {
        body: {
          candidate: candidate || {},
          snap_url: snapUrl,
          instruments: instrumentsPayload,
        },
      });
      if (error) throw error;
      if (!data?.ok || !Array.isArray(data.results) || data.results.length !== instrumentsPayload.length) {
        throw new Error(data?.error || "Hasil tes belum tersimpan lengkap di database.");
      }
    } catch (err) {
      console.error("test-submit failed", err);
      setSubmitted(false);
      await Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Hasil Tes",
        html: "Jawaban Anda belum berhasil disimpan ke database. Jangan tutup halaman ini. Silakan coba kirim ulang atau hubungi admin.",
        ...SWAL_THEME,
      });
      return;
    }

    Swal.fire({
      icon: "success", title: "Semua Tes Selesai!",
      html: `Terima kasih telah menyelesaikan ${instruments.length} alat tes.<br/><b>${totalAnsweredAll}/${totalAllQuestions}</b> soal dijawab.`,
      ...SWAL_THEME, confirmButtonText: "Selesai", allowOutsideClick: false,
    }).then(async () => {
      await clearSavedSession();
      const fromCandidate = sessionStorage.getItem("psytest_origin") === "candidate";
      sessionStorage.removeItem("psytest_auth");
      sessionStorage.removeItem("psytest_candidate");
      sessionStorage.removeItem("psytest_origin");
      if (!fromCandidate) {
        try { await supabase.auth.signOut(); } catch {}
      }
      navigate(fromCandidate ? "/candidate/tests" : "/", { replace: true });
    });
  };
  completeSubmissionRef.current = completeSubmission;


  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Keluar dari Tes?",
      text: "Data sementara akan disimpan dan Anda dapat melanjutkan lagi nanti.",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      ...SWAL_THEME,
      confirmButtonColor: "hsl(0, 72%, 51%)",
    });

    if (!result.isConfirmed) return;

    await saveSessionRef.current();
    const fromCandidate = sessionStorage.getItem("psytest_origin") === "candidate";
    sessionStorage.clear();
    if (!fromCandidate) {
      try { await supabase.auth.signOut(); } catch {}
    }
    navigate(fromCandidate ? "/candidate/tests" : "/", { replace: true });
  };

  if (submitted) return null;
  const currentDuration = currentTest?.duration_minutes || 30;
  
  // Calculate remaining seconds for timer recovery
  const initialSeconds = getRemainingSecondsForInstrument(currentTest);
  
  const currentAnsKey = currentQuestion ? `${currentTest.id}:${currentQuestion.id}` : "";
  const currentAns = answers[currentAnsKey] as string | undefined;
  const currentMultiPickLimit = getRequiredPickCount(currentQuestion);
  const aptitudeFallbackImage = getAptitudeFallbackImage(currentQuestion, currentTest?.name);

  // For subtest/column based tests: cannot go back across segment boundary
  const prevQ = currentTest?.questions[currentQIdx - 1];
  const canPrev = !(currentTestIdx === 0 && currentQIdx === 0) &&
    !(usesSubtestIntro(currentTest) && prevQ && prevQ.subtest_code !== currentQuestion?.subtest_code);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">PsyTest</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <TestTimer key={currentTest?.id || 'test-timer'} durationMinutes={currentDuration} initialSeconds={initialSeconds} onTimeUp={handleTimeUp} paused={subtestIntroActive || testIntroActive || !isCameraReady} />
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

      {/* Subtest/segment banner */}
      {usesSubtestIntro(currentTest) && currentSubtest && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {isCFIT(currentTest) ? "Segmen CFIT" : "Subtes"} <b>{currentSubtest}</b> · Sisa waktu: {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")} · Tidak bisa kembali ke segmen sebelumnya
        </div>
      )}

      {!isCameraReady && !submitted && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs font-semibold text-destructive">
          Kamera wajib aktif selama tes. Izinkan kamera di browser/perangkat untuk melanjutkan. Kamera mati/ditolak akan dicatat sebagai cheating.
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-6">
        <aside className="flex flex-row gap-4 md:w-64 md:flex-col md:gap-5">
          <div className="w-1/2 md:w-full"><WebcamPreview ref={webcamRef} onStatusChange={handleCameraStatusChange} /></div>
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
                const isAccessible = i === currentTestIdx;
                return (
                  <button key={t.id}
                    type="button"
                    onClick={() => {
                      if (!isAccessible) return;
                      setCurrentTestIdx(i);
                      setCurrentQIdx(0);
                      setCompletedSubtests(new Set());
                      setCurrentSubtest(null);
                    }}
                    disabled={!isAccessible}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all ${isCurrent ? "border-primary bg-primary/10" : isAccessible ? "border-border bg-muted/30 hover:bg-muted" : "border-border bg-slate-900/30 text-slate-500 cursor-not-allowed"}`}>
                    <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : isAccessible ? "text-foreground" : "text-slate-400"}`}>{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ansInThis}/{t.questions.length} soal</p>
                  </button>
                );
              })}
            </div>

            {currentTest && currentTest.questions.length > 0 && !usesSubtestIntro(currentTest) && (
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
            {isKraepelinTest(currentTest) && currentSubtest ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kolom Kraepelin</p>
                    <h3 className="text-xl font-bold text-foreground">{currentSubtest.replace(/^K/i, "Kolom ")}</h3>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                    Sisa waktu {Math.floor(remainingSec / 60)}:{String(Math.floor(remainingSec % 60)).padStart(2, "0")}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  Tulis angka satuan dari hasil penjumlahan. Contoh 7 + 8 = 15, tulis 5.
                </div>
                <div className="grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-5">
                  {subtestQuestions.map((q, idx) => (
                    <label key={q.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                      <span className="w-12 text-xs font-semibold text-muted-foreground">{idx + 1}.</span>
                      <span className="min-w-14 text-sm font-bold text-foreground">{q.question_text}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={(answers[`${currentTest.id}:${q.id}`] as string) || ""}
                        onChange={(e) => {
                          const filled = handleKraepelinAnswer(currentTest.id, q.id, e.target.value);
                          if (!filled) return;
                          window.setTimeout(() => {
                            const nextInput = document.querySelector<HTMLInputElement>(`[data-kraepelin-index="${idx + 1}"]`);
                            if (nextInput) {
                              nextInput.focus();
                              nextInput.select();
                              return;
                            }
                            const moved = finishCurrentSubtest();
                            if (!moved && currentTestIdx < instruments.length - 1) handleNextTestSync();
                          }, 80);
                        }}
                        data-kraepelin-index={idx}
                        className="ml-auto h-9 w-10 rounded-md border border-border bg-muted text-center text-lg font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="animate-fade-in space-y-5">
                {currentQuestion.category && (
                  <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{currentQuestion.category}</span>
                )}
                <h3 className="text-lg font-semibold leading-relaxed text-foreground">{currentQuestion.question_text}</h3>
                {showEnglish && currentQuestion.question_text_en && (
                  <p className="text-sm italic text-muted-foreground">{currentQuestion.question_text_en}</p>
                )}
                {currentQuestion.question_image && (
                  <div className="space-y-2 border border-dashed border-border p-2 rounded">
                    <p className="text-xs text-muted-foreground">Gambar 1 - Soal:</p>
                    <img 
                      src={currentQuestion.question_image} 
                      alt="Soal" 
                      className="max-h-72 w-auto rounded-lg border border-border bg-white" 
                      onError={(e) => { 
                        console.error('Failed to load question_image:', currentQuestion.question_image); 
                        const target = e.target as HTMLImageElement;
                        if (aptitudeFallbackImage && target.src !== aptitudeFallbackImage) {
                          target.src = aptitudeFallbackImage;
                          return;
                        }
                        target.style.display = 'none';
                        const errMsg = target.parentElement?.querySelector('.img-error');
                        if (errMsg) errMsg.classList.remove('hidden');
                      }}
                    />
                    <p className="img-error hidden text-xs text-destructive">⚠ Gagal memuat gambar 1</p>
                    <p className="text-[10px] text-muted-foreground break-all">{currentQuestion.question_image}</p>
                  </div>
                )}
                {currentQuestion.options_image && (
                  <div className="space-y-2 border border-dashed border-border p-2 rounded">
                    <p className="text-xs text-muted-foreground">Gambar 2 - Pilihan Jawaban:</p>
                    <img 
                      src={currentQuestion.options_image} 
                      alt="Pilihan Jawaban" 
                      className="max-h-72 w-auto rounded-lg border border-border bg-white" 
                      onError={(e) => { 
                        console.error('Failed to load options_image:', currentQuestion.options_image); 
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errMsg = target.parentElement?.querySelector('.img-error');
                        if (errMsg) errMsg.classList.remove('hidden');
                      }}
                    />
                    <p className="img-error hidden text-xs text-destructive">⚠ Gagal memuat gambar 2</p>
                    <p className="text-[10px] text-muted-foreground break-all">{currentQuestion.options_image}</p>
                  </div>
                )}
                {aptitudeFallbackImage && !currentQuestion.question_image && !currentQuestion.options_image && !currentQuestion.image_url && (
                  <div className="space-y-2 border border-dashed border-border p-2 rounded">
                    <p className="text-xs text-muted-foreground">Gambar Soal:</p>
                    <img src={aptitudeFallbackImage} alt="Gambar soal Aptitude" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
                )}
                {/* Fallback untuk gambar lama (image_url) */}
                {!currentQuestion.question_image && !currentQuestion.options_image && currentQuestion.image_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Gambar Soal:</p>
                    <img src={currentQuestion.image_url} alt="Soal" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
                )}
                <div className="space-y-3">
                  {currentQuestion.question_type === "numeric" ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Jawaban angka
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        value={currentAns || ""}
                        onChange={(e) => {
                          if (isKraepelinTest(currentTest)) {
                            const filled = handleKraepelinAnswer(currentTest.id, currentQuestion.id, e.target.value);
                            if (filled) window.setTimeout(() => { void handleNext(); }, 100);
                            return;
                          }
                          handleNumericAnswer(currentTest.id, currentQuestion.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentAns) handleNext();
                        }}
                        className="h-14 w-full max-w-xs rounded-lg border border-border bg-muted px-4 text-center text-3xl font-bold tracking-widest text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="0"
                      />
                    </div>
                  ) : currentQuestion.options.length === 0 ? (
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
                  ) : currentQuestion.question_type === "multi_choice" ? (
                    <>
                      <p className="text-xs text-amber-400 font-medium">Pilih {currentMultiPickLimit} jawaban yang benar.</p>
                      {currentQuestion.options.map(opt => {
                        const picked = new Set(((currentAns as string) || "").split("+").filter(Boolean));
                        const isSelected = picked.has(opt.id);
                        return (
                          <button key={opt.id} onClick={() => handleMultiPick(currentTest.id, currentQuestion.id, opt.id, currentMultiPickLimit)}
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
                  ) : currentQuestion.options.map(opt => {
                    const isSelected = currentAns === opt.id;
                    const definition = (opt as any).option_definition || null;
                    const definitionEn = (opt as any).option_definition_en || null;
                    return (
                      <button key={opt.id} onClick={() => handleAnswer(currentTest.id, currentQuestion.id, opt.id)}
                        className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/10 glow-border" : "border-border bg-card hover:border-primary/40 hover:bg-muted"}`}>
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60"}`}>{opt.option_label}</span>
                        <div className="flex-1">
                          {opt.image_url && <img src={opt.image_url} alt={opt.option_label} className="mb-2 max-h-32 rounded border border-border bg-white" loading="lazy" />}
                          <span className="text-sm font-medium text-foreground">{opt.option_text}</span>
                          {showEnglish && opt.option_text_en && <span className="block text-xs text-muted-foreground italic mt-0.5">{opt.option_text_en}</span>}
                          {definition && <span className="block text-xs text-muted-foreground mt-1">{definition}</span>}
                          {showEnglish && definitionEn && <span className="block text-xs text-muted-foreground italic mt-0.5">{definitionEn}</span>}
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
            ) : isKraepelinTest(currentTest) ? (
              <button onClick={async () => {
                  if (!(await ensureCameraActive())) return;
                  const moved = finishCurrentSubtest();
                  if (!moved && currentTestIdx < instruments.length - 1) handleNextTestSync();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
                Kolom Berikutnya<ChevronRight className="h-4 w-4" />
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
