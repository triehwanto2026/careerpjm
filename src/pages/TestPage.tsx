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

    let remaining: number;
    if (remainingSecOverride !== undefined) {
      // Jika override diberikan (e.g., test switch, time-up), gunakan itu
      remaining = remainingSecOverride;
    } else {
      // Hitung remaining berdasarkan elapsed time dari psytest_started_at
      const startedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const defaultRemaining = (instrument.duration_minutes || 30) * 60;
      remaining = Math.max(0, defaultRemaining - elapsed);
    }

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

  useEffect(() => {
    if (resumed || instruments.length === 0) return;
    const candRaw = sessionStorage.getItem("psytest_candidate");
    if (!candRaw) { setResumed(true); return; }
    const cand = JSON.parse(candRaw);
    if (!cand.activationCodeId) { setResumed(true); return; }
    (async () => {
      // Check if code was reactivated (status changed from 'completed' back to 'active')
      const { data: codeData } = await supabase.from("activation_codes").select("*").eq("id", cand.activationCodeId).maybeSingle();
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
      const defaultDuration = (restoredTest?.duration_minutes || 30) * 60;

      if (restoredSession) {
        // Restore saved progress
        setAnswers((restoredSession.answers as Record<string, string>) || {});
        setCurrentTestIdx(savedTestIdx);
        setCurrentQIdx(restoredSession.current_question_idx || 0);
        setCompletedSubtests(new Set(restoredSession.completed_subtests || []));

        // Gunakan seconds_remaining yang tersimpan LANGSUNG (waktu BERHENTI saat keluar)
        const remaining = Math.max(0, restoredSession.seconds_remaining ?? defaultDuration);

        if (remaining <= 0 && savedTestIdx < instruments.length - 1) {
          const nextTestIdx = savedTestIdx + 1;
          const nextTest = instruments[nextTestIdx];
          setCurrentTestIdx(nextTestIdx);
          setCurrentQIdx(0);
          setCompletedSubtests(new Set());
          setCurrentSubtest(null);
          const startTime = Date.now();
          sessionStorage.setItem("psytest_started_at", String(startTime));
          await persistSession({ testIdx: nextTestIdx, qIdx: 0, remainingSecOverride: (nextTest.duration_minutes || 30) * 60 });
        } else {
          // Set synthetic start time untuk countdown dari remaining seconds
          const syntheticStart = Date.now() - (defaultDuration - remaining) * 1000;
          sessionStorage.setItem("psytest_started_at", String(syntheticStart));
        }
      } else {
        // First time
        const startTime = Date.now();
        sessionStorage.setItem("psytest_started_at", String(startTime));
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
        await supabase.from("activation_codes").update({
          test_started_at: new Date().toISOString(),
          status: 'active',
        } as any).eq("id", cand.activationCodeId);
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

        // Hitung sisa waktu pada saat cheat terdeteksi
        const totalDur = instruments.reduce((s, t) => s + (t.duration_minutes || 30), 0);
        const startedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remainingAtViolation = Math.max(0, totalDur * 60 - elapsed);

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

        sessionStorage.removeItem("psytest_auth");
        sessionStorage.removeItem("psytest_candidate");
        sessionStorage.removeItem("psytest_started_at");
        try { await supabase.auth.signOut(); } catch {}

        await Swal.fire({
          icon: "error", title: "Sesi Berakhir — Pelanggaran Terdeteksi",
          html: `Anda berpindah tab/minimize. Sesi tes dihentikan dan jawaban telah disimpan.<br/><br/><b>Catatan:</b> Waktu tes <u>tetap berjalan</u> meskipun Anda logout. Segera login ulang dengan kode aktivasi yang sama untuk melanjutkan.`,
          ...SWAL_THEME, allowOutsideClick: false,
        });
        navigate("/", { replace: true });
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
      await supabase.from("activation_codes").update({
        status: 'completed',
        test_completed_at: new Date().toISOString(),
        is_used: true
      } as any).eq("id", cand.activationCodeId);
      // Bersihkan localStorage lama (kompatibilitas)
      localStorage.removeItem(`psytest_start_${cand.activationCodeId}`);
      clearSessionSnapshot(cand.activationCodeId, cand.email);
    }
    sessionStorage.removeItem("psytest_started_at");
  };

  const isIST = (t?: DbInstrument) => !!t && t.name.toUpperCase().includes("IST");
  const currentTest = instruments[currentTestIdx];
  const currentQuestion = currentTest?.questions[currentQIdx];
  
  // Show examples and instructions for IST subtests
  const showSubtestExample = useCallback((subtestCode: string) => {
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
    
    Swal.fire({
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
    }).then(() => {
      // After showing examples, show memory items if ME subtest
      if (subtestCode === 'ME') {
        showMemoryItems();
      }
    });
  }, []);

  // Track current IST subtest when question changes
  useEffect(() => {
    if (isIST(currentTest) && currentQuestion?.subtest_code && currentQuestion.subtest_code !== currentSubtest) {
      setCurrentSubtest(currentQuestion.subtest_code);
      setSubtestStartedAt(Date.now());
      
      // Show examples for all IST subtests
      showSubtestExample(currentQuestion.subtest_code);
    }
  }, [currentQIdx, currentTestIdx, currentTest, currentQuestion, currentSubtest, showSubtestExample]);

  // PAPIKOSTIK instructions effect is declared after showPAPIKOSTIKInstructions below


  // Show memory items for 3 minutes
  const showMemoryItems = useCallback(() => {
    const memoryItems = {
      'BUNGA': 'SOKA, LARAT, FLAMBOYAN, YASMIN, DAHLIA',
      'PERKAKAS': 'WAJAN, JARUM, KIKIR, CANGKUL, PALU',
      'BURUNG': 'ITIK, ELANG, WALET, TERUKUR, NURI',
      'KESENIAN': 'QUATET, ARCA, OPERA, UKIRAN, GAMELAN',
      'BINATANG': 'RUSA, MUSANG, BERUANG, HARIMAU, ZEBRA'
    };
    
    let html = '<div style="text-align:left;max-height:60vh;overflow-y:auto;">';
    html += '<h3 style="margin-bottom:15px;color:hsl(174,72%,46%);">HAFALKAN KATA-KATA INI (3 MENIT)</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">';
    
    Object.entries(memoryItems).forEach(([category, items]) => {
      html += `<div style="padding:10px;background:hsla(210,14%,15%,0.6);border-radius:8px;border:1px solid hsla(210,14%,25%);">`;
      html += `<h4 style="margin:0 0 8px 0;color:hsl(210,20%,92%);font-size:14px;">${category}</h4>`;
      html += `<p style="margin:0;color:hsl(210,20%,75%);font-size:13px;line-height:1.4">${items}</p>`;
      html += `</div>`;
    });
    
    html += '</div>';
    html += '<p style="margin-top:15px;text-align:center;color:hsl(210,20%,60%);font-size:12px;">Setelah 3 menit, halaman ini akan otomatis tertutup</p>';
    html += '</div>';
    
    Swal.fire({
      title: 'Subtest ME - Memory',
      html: html,
      timer: 180000, // 3 minutes
      timerProgressBar: true,
      showConfirmButton: false,
      showCloseButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      didOpen: () => {
        // Add countdown display
        let timeLeft = 180; // 3 minutes in seconds
        const interval = setInterval(() => {
          if (timeLeft > 0) {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            Swal.update({
              title: `Subtest ME - Memory (${minutes}:${seconds.toString().padStart(2, '0')})`
            });
          } else {
            clearInterval(interval);
          }
        }, 1000);
        
        // Store interval ID to clear it when modal closes
        (Swal as any).timerInterval = interval;
      },
      willClose: () => {
        clearInterval((Swal as any).timerInterval);
      }
    });
  }, []);

  // Show PAPIKOSTIK instructions and example
  const showPAPIKOSTIKInstructions = useCallback(() => {
    let html = '<div style="text-align:left;max-height:70vh;overflow-y:auto;">';
    html += '<div style="margin-bottom:20px;padding:12px;background:hsla(174,72%,46%,0.1);border-radius:8px;border:1px solid hsla(174,72%,46%,0.3);">';
    html += '<h3 style="margin:0 0 8px 0;color:hsl(174,72%,46%);">PETUNJUK PENGISIAN</h3>';
    html += '<ul style="margin:0;padding-left:20px;color:hsl(210,20%,75%);line-height:1.6">';
    html += '<li>Dalam Lembar ini terdapat 90 pertanyaan (Tidak ada batasan waktu)</li>';
    html += '<li>Semua pilihan dalam lembar ini bukanlah bersifat BENAR atau SALAH, jadi TIDAK ADA JAWABAN YANG SALAH</li>';
    html += '<li>Pilihlah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini</li>';
    html += '<li>Anda harus memilih jawaban a atau b dari dua pernyataan yang tersedia</li>';
    html += '<li>Seluruh pertanyaan harus dijawab</li>';
    html += '</ul>';
    html += '</div>';
    
    html += '<h4 style="margin-bottom:15px;color:hsl(210,20%,92%);">CONTOH:</h4>';
    html += '<div style="margin-bottom:20px;padding:12px;background:hsla(210,14%,15%,0.6);border-radius:8px;border:1px solid hsla(210,14%,25%);">';
    html += '<p style="margin:0 0 10px 0;color:hsl(210,20%,92%);font-weight:500;">Contoh Soal 1:</p>';
    html += '<p style="margin:0 0 8px 0;color:hsl(210,20%,75%);">a. Saya Seorang Pekerja Giat</p>';
    html += '<p style="margin:0 0 8px 0;color:hsl(210,20%,75%);">b. Saya Bukan Seorang Pemurung</p>';
    html += '<p style="margin:5px 0 0 0;color:hsl(174,72%,46%);font-size:13px;font-style:italic;">Bila anda merasa bahwa pernyataan pertama "Saya seorang pekerja giat" lebih mencerminkan diri anda saat ini ketimbang pernyataan kedua "Saya Bukan seorang pemurung" maka pilihlah a. Begitu pula sebaliknya.</p>';
    html += '</div>';
    
    html += '</div>';
    
    Swal.fire({
      title: 'SOAL PAPI Kostick',
      html: html,
      confirmButtonText: 'Mulai Tes',
      showConfirmButton: true,
      showCloseButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...SWAL_THEME,
      customClass: {
        popup: 'papikostik-modal'
      }
    });
  }, []);

  // Show PAPIKOSTIK instructions when test starts
  useEffect(() => {
    const isPAPIKOSTIK = currentTest?.name.toLowerCase().includes('papikostick') || currentTest?.name.toLowerCase().includes('papi');
    if (isPAPIKOSTIK && currentQIdx === 0) {
      showPAPIKOSTIKInstructions();
    }
  }, [currentTestIdx, currentTest, currentQIdx, showPAPIKOSTIKInstructions]);

  // Subtest info for IST strict mode (computed each render — also used by useEffect below)
  const subtestQuestions = isIST(currentTest) && currentSubtest
    ? currentTest.questions.filter(q => q.subtest_code === currentSubtest) : [];
  const subtestTimeLimit = subtestQuestions[0]?.time_limit_minutes || 6;
  const elapsedSec = Math.floor((Date.now() - subtestStartedAt) / 1000);
  const remainingSec = Math.max(0, subtestTimeLimit * 60 - elapsedSec);

  const handleNextTest = useCallback(() => {
    if (currentTestIdx < instruments.length - 1) {
      const nextTestIdx = currentTestIdx + 1;
      sessionStorage.setItem("psytest_started_at", String(Date.now()));
      setCurrentTestIdx(nextTestIdx);
      setCurrentQIdx(0);
      setCompletedSubtests(new Set());
      setCurrentSubtest(null);
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
      sessionStorage.setItem("psytest_started_at", String(Date.now()));
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

    await supabase.from("activation_codes").update({
      status: 'completed',
      test_completed_at: new Date().toISOString(),
      auto_submitted: true,
    } as any).eq("id", cand.activationCodeId);

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

  const totalAllQuestions = instruments.reduce((sum, t) => sum + t.questions.length, 0);
  const totalAnsweredAll = Object.keys(answers).length;
  const progress = totalAllQuestions > 0 ? (totalAnsweredAll / totalAllQuestions) * 100 : 0;

  const handleAnswer = (instrumentId: string, questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [`${instrumentId}:${questionId}`]: value }));
    // Auto-advance to next question
    handleNext();
  };
  const handleMultiPick = (instrumentId: string, questionId: string, optId: string, maxPick = 2) => {
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
    setAnswers(prev => ({ ...prev, [key]: sorted }));
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
    if (currentTestIdx < instruments.length - 1) {
      // Hanya boleh lanjut ke test berikutnya jika test saat ini selesai (semua soal terjawab)
      const currentTest = instruments[currentTestIdx];
      const questionsInTest = currentTest.questions.map(q => `${currentTest.id}:${q.id}`);
      const allAnswered = questionsInTest.every(key => key in answers);
      
      if (allAnswered) {
        const nextTestIdx = currentTestIdx + 1;
        sessionStorage.setItem("psytest_started_at", String(Date.now()));
        setCurrentTestIdx(nextTestIdx);
        setCurrentQIdx(0);
        setCompletedSubtests(new Set());
        setCurrentSubtest(null);
      } else {
        // Belum semua soal terjawab
        const answered = questionsInTest.filter(key => key in answers).length;
        const total = questionsInTest.length;
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
          
          // Map category_target to standard D/I/S/C codes
          const mapToCode = (target: string) => {
            const t = target?.toUpperCase().trim();
            if (t === 'D' || t === 'DOMINANCE') return 'D';
            if (t === 'I' || t === 'INFLUENCE') return 'I';
            if (t === 'S' || t === 'STEADINESS') return 'S';
            if (t === 'C' || t === 'COMPLIANCE') return 'C';
            return t;
          };
          
          if (mOpt?.category_target) {
            const d = mapToCode(mOpt.category_target);
            cats[d] = (cats[d] || 0) + 1;                  // Net (Mirror) = M - L
            cats[`${d}_M`] = (cats[`${d}_M`] || 0) + 1;    // Mask: Most-like count
          }
          if (lOpt?.category_target) {
            const d = mapToCode(lOpt.category_target);
            cats[d] = (cats[d] || 0) - 1;
            cats[`${d}_L`] = (cats[`${d}_L`] || 0) + 1;    // Core: Least-like count
          }
          return;
        }
        if (q.question_type === "multi_choice" && optId.includes("+")) {
          const ids = optId.split("+").filter(Boolean);
          const picked = q.options.filter(o => ids.includes(o.id));
          const correctIds = q.options.filter(o => o.is_correct).map(o => o.id);
          const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every(id => correctIds.includes(id));
          if (allCorrect) correctCount++;
          picked.forEach(opt => {
            totalScore += Number(opt.score_value || 0);
            const dim = opt.category_target?.trim() || q.category?.trim() || "Umum";
            cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
          });
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
          if (q.question_type === "multi_choice" && optId!.includes("+")) {
            const ids = optId!.split("+").filter(Boolean);
            const picked = q.options.filter(o => ids.includes(o.id));
            const correctIds = q.options.filter(o => o.is_correct).map(o => o.id);
            const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every(id => correctIds.includes(id));
            const correctOpts = q.options.filter(o => o.is_correct);
            return {
              test_result_id: resultData.id,
              question_number: q.question_number,
              question_text: q.question_text,
              question_text_en: q.question_text_en,
              selected_answer: picked.map(o => `${o.option_label}. ${o.option_text}`).join(" + "),
              selected_answer_label: picked.map(o => o.option_label).join("+"),
              category: q.category,
              is_correct: allCorrect,
              correct_answer: correctOpts.map(o => `${o.option_label}. ${o.option_text}`).join(" + ") || null,
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
            // Prefer option's category_target (e.g. Sanguine/Choleric for Personality Plus) over question.category
            category: opt?.category_target?.trim() || q.category || null,
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
    }).then(async () => {
      await clearSavedSession();
      sessionStorage.removeItem("psytest_auth");
      sessionStorage.removeItem("psytest_candidate");
      navigate("/", { replace: true });
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
    sessionStorage.clear();
    try { await supabase.auth.signOut(); } catch {}
    navigate("/", { replace: true });

  };

  if (submitted) return null;
  const currentDuration = currentTest?.duration_minutes || 30;
  
  // Calculate remaining seconds for timer recovery
  const startedAt = Number(sessionStorage.getItem("psytest_started_at")) || Date.now();
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const initialSeconds = Math.max(0, currentDuration * 60 - elapsed);
  
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
            <TestTimer key={currentTest?.id || 'test-timer'} durationMinutes={currentDuration} initialSeconds={initialSeconds} onTimeUp={handleTimeUp} />
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
                const isAccessible = i <= currentTestIdx;
                return (
                  <button key={t.id}
                    type="button"
                    onClick={() => {
                      if (!isAccessible) return;
                      setCurrentTestIdx(i);
                      setCurrentQIdx(0);
                      setCompletedSubtests(new Set());
                      setCurrentSubtest(null);
                      sessionStorage.setItem("psytest_started_at", String(Date.now()));
                    }}
                    disabled={!isAccessible}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all ${isCurrent ? "border-primary bg-primary/10" : isAccessible ? "border-border bg-muted/30 hover:bg-muted" : "border-border bg-slate-900/30 text-slate-500 cursor-not-allowed"}`}>
                    <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : isAccessible ? "text-foreground" : "text-slate-400"}`}>{t.name}</p>
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
                {/* DEBUG: Show image status */}
                <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded">
                  DEBUG: q{currentQuestion.question_number} | 
                  q_img: {currentQuestion.question_image ? 'YES' : 'NO'} | 
                  o_img: {currentQuestion.options_image ? 'YES' : 'NO'} | 
                  old: {currentQuestion.image_url ? 'YES' : 'NO'}
                </div>
                
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
                {/* Fallback untuk gambar lama (image_url) */}
                {!currentQuestion.question_image && !currentQuestion.options_image && currentQuestion.image_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Gambar Soal:</p>
                    <img src={currentQuestion.image_url} alt="Soal" className="max-h-72 w-auto rounded-lg border border-border bg-white" />
                  </div>
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
                  ) : currentQuestion.question_type === "multi_choice" ? (
                    <>
                      <p className="text-xs text-amber-400 font-medium">Pilih 2 jawaban yang benar.</p>
                      {currentQuestion.options.map(opt => {
                        const picked = new Set(((currentAns as string) || "").split("+").filter(Boolean));
                        const isSelected = picked.has(opt.id);
                        return (
                          <button key={opt.id} onClick={() => handleMultiPick(currentTest.id, currentQuestion.id, opt.id, 2)}
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
