// Server-side scoring for psychological tests. Reads answer keys (is_correct / score_value)
// with the service role so they never leave the database; computes per-instrument results
// and persists test_results + test_answers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Candidate = {
  id?: string | null;
  name?: string;
  email?: string;
  position?: string;
  phone?: string;
  birth_date?: string;
  education?: string;
  gender?: string;
  photo_url?: string | null;
};

type SubmissionPayload = {
  candidate: Candidate;
  snap_url?: string | null;
  instruments: { id: string; answers: Record<string, string> }[];
};

const IST_SUBTEST_MAX: Record<string, number> = {
  SE: 20,
  WA: 20,
  AN: 20,
  GE: 32,
  RA: 20,
  ZR: 20,
  FA: 20,
  WU: 20,
  ME: 20,
};

const CFIT_IQ_TABLE: Record<number, { iq: number; classification: string }> = {
  49: { iq: 183, classification: "Genius" },
  48: { iq: 179, classification: "Genius" },
  47: { iq: 176, classification: "Genius" },
  46: { iq: 173, classification: "Genius" },
  45: { iq: 169, classification: "Very Superior" },
  44: { iq: 167, classification: "Very Superior" },
  43: { iq: 165, classification: "Very Superior" },
  42: { iq: 161, classification: "Very Superior" },
  41: { iq: 157, classification: "Very Superior" },
  40: { iq: 155, classification: "Very Superior" },
  39: { iq: 152, classification: "Very Superior" },
  38: { iq: 149, classification: "Very Superior" },
  37: { iq: 145, classification: "Very Superior" },
  36: { iq: 142, classification: "Very Superior" },
  35: { iq: 140, classification: "Very Superior" },
  34: { iq: 137, classification: "Superior" },
  33: { iq: 133, classification: "Superior" },
  32: { iq: 131, classification: "Superior" },
  31: { iq: 128, classification: "Superior" },
  30: { iq: 124, classification: "Superior" },
  29: { iq: 121, classification: "Superior" },
  28: { iq: 119, classification: "High Average" },
  27: { iq: 116, classification: "High Average" },
  26: { iq: 113, classification: "High Average" },
  25: { iq: 109, classification: "Average" },
  24: { iq: 106, classification: "Average" },
  23: { iq: 103, classification: "Average" },
  22: { iq: 100, classification: "Average" },
  21: { iq: 96, classification: "Average" },
  20: { iq: 94, classification: "Average" },
  19: { iq: 91, classification: "Average" },
  18: { iq: 88, classification: "Low Average" },
  17: { iq: 85, classification: "Low Average" },
  16: { iq: 81, classification: "Low Average" },
  15: { iq: 78, classification: "Borderline" },
  14: { iq: 75, classification: "Borderline" },
  13: { iq: 72, classification: "Borderline" },
  12: { iq: 70, classification: "Borderline" },
  11: { iq: 67, classification: "Mild" },
  10: { iq: 65, classification: "Mild" },
  9: { iq: 60, classification: "Mild" },
  8: { iq: 57, classification: "Mild" },
  7: { iq: 55, classification: "Mild" },
  6: { iq: 52, classification: "Mild" },
  5: { iq: 48, classification: "Moderate" },
  4: { iq: 47, classification: "Moderate" },
  3: { iq: 45, classification: "Moderate" },
  2: { iq: 43, classification: "Moderate" },
  1: { iq: 40, classification: "Moderate" },
  0: { iq: 38, classification: "Moderate" },
};

const getCfitIqInfo = (rawScore: number) => {
  const raw = Math.max(0, Math.min(49, Math.round(rawScore)));
  return CFIT_IQ_TABLE[raw] || CFIT_IQ_TABLE[0];
};

const MBTI_DIMS = ["E", "I", "S", "N", "T", "F", "J", "P"];
const normalizeMbtiDim = (value?: string | null) => {
  const key = String(value || "").trim().toUpperCase();
  if (MBTI_DIMS.includes(key)) return key;
  if (key.includes("EXTRAVERSION") || key.includes("EXTROVERSION") || key === "EXTROVERT") return "E";
  if (key.includes("INTROVERSION") || key === "INTROVERT") return "I";
  if (key.includes("SENSING")) return "S";
  if (key.includes("INTUITION") || key.includes("INTUITIVE")) return "N";
  if (key.includes("THINKING")) return "T";
  if (key.includes("FEELING")) return "F";
  if (key.includes("JUDGING")) return "J";
  if (key.includes("PERCEIVING")) return "P";
  return null;
};

const getMbtiType = (cats: Record<string, number>) =>
  [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]]
    .map(([a, b]) => Number(cats[a] || 0) >= Number(cats[b] || 0) ? a : b)
    .join("");

const buildMbtiInterpretation = (cats: Record<string, number>, answered: number, total: number, testName: string) => {
  const type = getMbtiType(cats);
  const labels: Record<string, string> = {
    E: "lebih energik melalui interaksi sosial",
    I: "lebih nyaman memproses secara reflektif dan mandiri",
    S: "praktis, faktual, dan berorientasi detail nyata",
    N: "konseptual, imajinatif, dan melihat kemungkinan",
    T: "menimbang keputusan secara logis dan objektif",
    F: "menimbang keputusan dengan empati dan dampak personal",
    J: "menyukai struktur, rencana, dan kepastian",
    P: "fleksibel, adaptif, dan terbuka pada perubahan",
  };
  const distribution = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]]
    .map(([a, b]) => `${a}/${b}: ${a}=${Number(cats[a] || 0)}, ${b}=${Number(cats[b] || 0)}`)
    .join("; ");
  return `Kandidat menjawab ${answered} dari ${total} soal pada tes ${testName}. Tipe MBTI kandidat adalah ${type}. Profil ini menunjukkan kandidat ${type.split("").map((key) => labels[key]).join(", ")}.

Distribusi pasangan dimensi: ${distribution}. Hasil MBTI dibaca sebagai preferensi gaya kerja dan komunikasi, bukan ukuran kemampuan mutlak.`;
};

const PAPI_LABELS: Record<string, string> = {
  A: "Need to Achieve",
  B: "Need to Belong to Groups",
  C: "Organized Type",
  D: "Leadership Role",
  E: "Emotional Resistance",
  F: "Need to Support Authority",
  G: "Hard Intense Worked",
  I: "Ease in Decision Making",
  K: "Need to be Forceful",
  L: "Leadership Role",
  N: "Need to Finish Task",
  O: "Need for Closeness and Affection",
  P: "Need to Control Others",
  R: "Theoretical Type",
  S: "Social Extension",
  T: "Pace",
  V: "Vigorous Type",
  W: "Need for Rules and Supervision",
  X: "Need to be Noticed",
  Z: "Need for Change",
};

const buildPapiInterpretation = (cats: Record<string, number>, answeredCount: number, totalQuestions: number) => {
  const rows = Object.entries(PAPI_LABELS)
    .map(([code, label]) => ({
      code,
      label,
      value: Math.max(0, Math.min(9, Math.round(Number(cats[code] || 0)))),
    }))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const top = rows.slice(0, 4);
  const low = rows.filter((row) => row.value <= 3).slice(0, 4);
  return `Kandidat menjawab ${answeredCount} dari ${totalQuestions} soal PAPI Kostick. Profil paling menonjol: ${top.map((row) => `${row.code} - ${row.label} (${row.value}/9)`).join(", ")}. ${low.length ? `Skala rendah: ${low.map((row) => `${row.code} - ${row.label} (${row.value}/9)`).join(", ")}. ` : ""}PAPI membaca kebutuhan dan peran kerja dalam konteks pekerjaan; interpretasi perlu dipadukan dengan wawancara, tuntutan jabatan, dan observasi perilaku.`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate JWT and get caller email
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userData.user?.email) return json({ error: "Unauthorized" }, 401);
    const callerEmail = userData.user.email.toLowerCase();

    const payload = (await req.json()) as SubmissionPayload;
    if (!payload?.candidate || !Array.isArray(payload.instruments)) {
      return json({ error: "Invalid payload" }, 400);
    }

    const candidateEmail = (payload.candidate.email || "").toLowerCase();
    if (candidateEmail !== callerEmail) {
      return json({ error: "Candidate mismatch" }, 403);
    }

    // Resolve candidate id
    let candidateId = payload.candidate.id || null;
    if (!candidateId) {
      const { data: existing } = await admin.from("candidates").select("id").eq("email", candidateEmail).maybeSingle();
      candidateId = existing?.id ?? null;
    }
    if (candidateId) {
      await admin.from("candidates").update({ status: "completed" }).eq("id", candidateId);
    }

    const { data: candidateProfile } = await admin
      .from("candidate_profiles")
      .select("phone, birth_date, education_level, education_institution, gender, photo_url")
      .eq("email", candidateEmail)
      .maybeSingle();

    const instIds = payload.instruments.map((i) => i.id);
    if (instIds.length === 0) return json({ ok: true, results: [] });

    const { data: insts, error: instErr } = await admin
      .from("test_instruments")
      .select("id, name, name_en, duration_minutes, scoring_method")
      .in("id", instIds);
    if (instErr) return json({ error: instErr.message }, 500);

    const { data: qs, error: qErr } = await admin
      .from("test_questions")
      .select("*")
      .in("instrument_id", instIds)
      .order("question_number");
    if (qErr) return json({ error: qErr.message }, 500);

    const qIds = (qs || []).map((q: any) => q.id);
    const { data: opts, error: oErr } = qIds.length
      ? await admin.from("test_question_options").select("*").in("question_id", qIds).order("display_order")
      : { data: [], error: null as any };
    if (oErr) return json({ error: oErr.message }, 500);

    const optsByQ: Record<string, any[]> = {};
    (opts || []).forEach((o: any) => ((optsByQ[o.question_id] ||= []).push(o)));
    const qsByInst: Record<string, any[]> = {};
    (qs || []).forEach((q: any) => ((qsByInst[q.instrument_id] ||= []).push({ ...q, options: optsByQ[q.id] || [] })));

    const mapDisc = (t?: string | null) => {
      const x = (t || "").toUpperCase().trim();
      if (x === "D" || x === "DOMINANCE") return "D";
      if (x === "I" || x === "INFLUENCE") return "I";
      if (x === "S" || x === "STEADINESS") return "S";
      if (x === "C" || x === "COMPLIANCE") return "C";
      return x;
    };

    const results: any[] = [];

    for (const ip of payload.instruments) {
      const inst = (insts || []).find((i: any) => i.id === ip.id);
      if (!inst) continue;
      const questions = qsByInst[ip.id] || [];
      const isIst = String(inst.name || "").toUpperCase().includes("IST")
        || questions.some((q: any) => q.question_number === 61 && String(q.question_text || "").toLowerCase().includes("mawar"));
      const upperName = String(inst.name || "").toUpperCase();
      const scoringMethod = String(inst.scoring_method || "").toLowerCase();
      const isCfit = upperName.includes("CFIT") || upperName.includes("CULTURE FAIR");
      const isMbti = upperName.includes("MBTI") || scoringMethod === "typological";
      const isPapi = upperName.includes("PAPI") || scoringMethod === "papi_scales"
        || questions.some((q: any) => q.scoring_rule === "papikostik_dimension");
      const isKraepelin = upperName.includes("KRAEPELIN") || scoringMethod === "speed_accuracy"
        || questions.some((q: any) => q.question_type === "numeric" || q.scoring_rule === "speed_accuracy");
      const answers = ip.answers || {};
      const cats: Record<string, number> = {};
      let correctCount = 0;
      let totalScore = 0;
      let answeredCount = 0;
      let maxPossibleScore = 0;
      const kraepelinSegmentCorrect: number[] = [];
      const kraepelinSegmentAnswered: number[] = [];

      questions.forEach((q: any) => {
        const optionMax = Math.max(0, ...(q.options || []).map((o: any) => Number(o.score_value || 0)));
        if (isIst && q.subtest_code && IST_SUBTEST_MAX[q.subtest_code]) {
          maxPossibleScore += optionMax || (q.subtest_code === "GE" ? 2 : 1);
        } else {
          maxPossibleScore += optionMax || (q.options?.some((o: any) => o.is_correct) ? 1 : 0);
        }
      });

      const categoryKey = (q: any) => {
        if (isIst && q.subtest_code) return `${q.subtest_code} - ${q.category || "IST"}`;
        return q.category?.trim() || "Umum";
      };

      const getKraepelinCorrectAnswer = (q: any) => {
        const marker = String(q.question_text_en || "").match(/CORRECT_ANSWER\s*:\s*(\d+)/i);
        if (marker) return marker[1];
        const sum = String(q.question_text || "").match(/(\d+)\s*\+\s*(\d+)/);
        if (!sum) return null;
        return String((Number(sum[1]) + Number(sum[2])) % 10);
      };

      const safeQuestionTextEn = (q: any) =>
        String(q.question_text_en || "").toUpperCase().startsWith("CORRECT_ANSWER:") ? null : q.question_text_en;

      for (const q of questions) {
        const optId = answers[q.id];
        if (!optId) continue;
        answeredCount++;
        if (q.question_type === "numeric" || isKraepelin) {
          const selected = String(optId).replace(/\D/g, "");
          const correctAnswer = getKraepelinCorrectAnswer(q);
          const isCorrect = correctAnswer !== null && selected === correctAnswer;
          if (isCorrect) correctCount++;
          const parsedSubtest = Number(String(q.subtest_code || "").replace(/\D/g, ""));
          const fallbackSegmentSize = Math.max(1, Math.ceil(questions.length / 20));
          const segment = Math.max(0, (Number(q.group_number || parsedSubtest || Math.floor((Number(q.question_number || 1) - 1) / fallbackSegmentSize) + 1) - 1));
          kraepelinSegmentAnswered[segment] = (kraepelinSegmentAnswered[segment] || 0) + 1;
          kraepelinSegmentCorrect[segment] = (kraepelinSegmentCorrect[segment] || 0) + (isCorrect ? 1 : 0);
          continue;
        }
        if (q.question_type === "disc_pair" && String(optId).includes("|")) {
          const parts: Record<string, string> = { M: "", L: "" };
          String(optId).split("|").forEach((p) => {
            const [k, v] = p.split(":");
            if (k && v) parts[k] = v;
          });
          const mOpt = q.options.find((o: any) => o.id === parts.M);
          const lOpt = q.options.find((o: any) => o.id === parts.L);
          if (mOpt?.category_target) {
            const d = mapDisc(mOpt.category_target);
            cats[d] = (cats[d] || 0) + 1;
            cats[`${d}_M`] = (cats[`${d}_M`] || 0) + 1;
          }
          if (lOpt?.category_target) {
            const d = mapDisc(lOpt.category_target);
            cats[d] = (cats[d] || 0) - 1;
            cats[`${d}_L`] = (cats[`${d}_L`] || 0) + 1;
          }
          continue;
        }
        if (q.question_type === "multi_choice" && String(optId).includes("+")) {
          const ids = String(optId).split("+").filter(Boolean);
          const picked = q.options.filter((o: any) => ids.includes(o.id));
          const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every((id) => correctIds.includes(id));
          if (allCorrect) correctCount++;
          if (isCfit) {
            const dim = categoryKey(q);
            const scoreValue = allCorrect ? 1 : 0;
            totalScore += scoreValue;
            cats[dim] = (cats[dim] || 0) + scoreValue;
            continue;
          }
          picked.forEach((opt: any) => {
            totalScore += Number(opt.score_value || 0);
            const dim = opt.category_target?.trim() || categoryKey(q);
            cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        if (!opt) continue;
        const mbtiDim = isMbti ? normalizeMbtiDim(opt.category_target || opt.option_label || opt.option_text) : null;
        const optScore = (isPapi && opt.category_target) || mbtiDim ? 1 : Number(opt.score_value || 0);
        totalScore += optScore;
        if (opt.is_correct) correctCount++;
        const dim = mbtiDim || opt.category_target?.trim() || categoryKey(q);
        cats[dim] = (cats[dim] || 0) + optScore;
      }

      const hasCorrectScoring = questions.some(
        (q: any) => q.scoring_rule === "correct_only" || q.options.some((o: any) => o.is_correct),
      );
      let kraepelinMetrics: Record<string, number> | null = null;
      if (isKraepelin) {
        const speed = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
        const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
        const workCapacity = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
        const activeSegments = kraepelinSegmentAnswered
          .map((answered, i) => ({ answered: answered || 0, correct: kraepelinSegmentCorrect[i] || 0 }))
          .filter((s) => s.answered > 0);
        const avg = activeSegments.length > 0
          ? activeSegments.reduce((sum, s) => sum + s.correct, 0) / activeSegments.length
          : 0;
        const variance = activeSegments.length > 0
          ? activeSegments.reduce((sum, s) => sum + Math.pow(s.correct - avg, 2), 0) / activeSegments.length
          : 0;
        const sd = Math.sqrt(variance);
        const stability = avg > 0 ? Math.max(0, Math.min(100, Math.round(100 - (sd / avg) * 100))) : 0;
        kraepelinMetrics = {
          speed,
          accuracy,
          stability,
          work_capacity: workCapacity,
          correct_answers: correctCount,
          wrong_answers: Math.max(0, answeredCount - correctCount),
          columns_completed: activeSegments.length,
          peak_column: activeSegments.reduce((max, s) => Math.max(max, s.correct), 0),
          average_column: Math.round(avg),
        };
        Object.assign(cats, kraepelinMetrics);
      }
      const score = isKraepelin && kraepelinMetrics
        ? Math.round((kraepelinMetrics.accuracy + kraepelinMetrics.work_capacity) / 2)
        : isIst && maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 100)
          : isMbti
            ? Math.round((answeredCount / Math.max(questions.length, 1)) * 100)
          : hasCorrectScoring && questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
      const status = score >= 70 ? "passed" : score >= 50 ? "review" : "failed";

      const normalizedCats: Record<string, number> = {};
      Object.entries(cats).forEach(([k, v]) => (normalizedCats[k] = Math.round(v)));
      const cfitIqInfo = isCfit ? getCfitIqInfo(correctCount) : null;

      const { data: resultData, error: insErr } = await admin
        .from("test_results")
        .insert({
          candidate_id: candidateId,
          candidate_name: payload.candidate.name || "Unknown",
          position: payload.candidate.position || "",
          test_name: inst.name,
          score,
          total_questions: questions.length,
          answered_questions: answeredCount,
          categories: isIst
            ? { ...normalizedCats, "IST Raw Score": Math.round(totalScore), "IST Max Score": Math.round(maxPossibleScore) }
            : isCfit && cfitIqInfo
              ? { ...normalizedCats, "CFIT Raw Score": correctCount, "CFIT Max Score": questions.length, "CFIT IQ": cfitIqInfo.iq }
            : normalizedCats,
          status,
          interpretation: isIst
            ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Skor mentah ${Math.round(totalScore)} dari maksimum ${Math.round(maxPossibleScore)}; skor akhir ${score}%. Profil subtes menunjukkan distribusi kemampuan pada aspek verbal, generalisasi, numerik, figural, spasial, dan memori.`
            : isCfit && cfitIqInfo
              ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Raw score ${correctCount} dari ${questions.length}; estimasi IQ ${cfitIqInfo.iq} dengan klasifikasi ${cfitIqInfo.classification}.`
            : isKraepelin && kraepelinMetrics
              ? `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Benar ${correctCount}, salah ${Math.max(0, answeredCount - correctCount)}. Kecepatan ${kraepelinMetrics.speed}%, ketelitian ${kraepelinMetrics.accuracy}%, stabilitas ${kraepelinMetrics.stability}%, dan kapasitas kerja ${kraepelinMetrics.work_capacity}%.`
            : isMbti
              ? buildMbtiInterpretation(normalizedCats, answeredCount, questions.length, inst.name)
            : isPapi
              ? buildPapiInterpretation(normalizedCats, answeredCount, questions.length)
            : `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Skor akhir ${score}%. ${hasCorrectScoring ? `${correctCount} jawaban benar.` : "Diukur berdasar profil dimensi."}`,
          candidate_profile: payload.candidate
            ? {
                email: candidateEmail,
                phone: candidateProfile?.phone || payload.candidate.phone || "",
                birthDate: candidateProfile?.birth_date || payload.candidate.birth_date || "",
                education: candidateProfile?.education_level || candidateProfile?.education_institution || payload.candidate.education || "",
                gender: candidateProfile?.gender || payload.candidate.gender || "",
                photo_url: candidateProfile?.photo_url || payload.candidate.photo_url || null,
              }
            : null,
          webcam_photo_url: payload.snap_url || null,
        })
        .select("id")
        .single();
      if (insErr || !resultData) continue;

      const answerRows: any[] = [];
      for (const q of questions) {
        const optId = answers[q.id];
        if (!optId) continue;
        if (q.question_type === "disc_pair" && String(optId).includes("|")) {
          const parts: Record<string, string> = { M: "", L: "" };
          String(optId).split("|").forEach((p) => {
            const [k, v] = p.split(":");
            if (k && v) parts[k] = v;
          });
          const mOpt = q.options.find((o: any) => o.id === parts.M);
          const lOpt = q.options.find((o: any) => o.id === parts.L);
          const mText = mOpt ? `${mOpt.option_label}. ${mOpt.option_text}` : "-";
          const lText = lOpt ? `${lOpt.option_label}. ${lOpt.option_text}` : "-";
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: `PALING (M): ${mText}  ·  TIDAK (L): ${lText}`,
            selected_answer_label: `M:${mOpt?.category_target || "?"} / L:${lOpt?.category_target || "?"}`,
            category: q.category,
            is_correct: null,
            correct_answer: null,
          });
          continue;
        }
        if (q.question_type === "multi_choice" && String(optId).includes("+")) {
          const ids = String(optId).split("+").filter(Boolean);
          const picked = q.options.filter((o: any) => ids.includes(o.id));
          const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          const allCorrect = correctIds.length > 0 && ids.length === correctIds.length && ids.every((id) => correctIds.includes(id));
          const correctOpts = q.options.filter((o: any) => o.is_correct);
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: picked.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + "),
            selected_answer_label: picked.map((o: any) => o.option_label).join("+"),
            category: q.category,
            is_correct: allCorrect,
            correct_answer: correctOpts.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + ") || null,
          });
          continue;
        }
        if (q.question_type === "numeric" || isKraepelin) {
          const selected = String(optId).replace(/\D/g, "");
          const correctAnswer = getKraepelinCorrectAnswer(q);
          answerRows.push({
            test_result_id: resultData.id,
            question_number: q.question_number,
            question_text: q.question_text,
            question_text_en: safeQuestionTextEn(q),
            selected_answer: selected,
            selected_answer_label: "",
            category: q.category || "Kraepelin",
            is_correct: correctAnswer === null ? null : selected === correctAnswer,
            correct_answer: correctAnswer,
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        answerRows.push({
          test_result_id: resultData.id,
          question_number: q.question_number,
          question_text: q.question_text,
          question_text_en: safeQuestionTextEn(q),
          selected_answer: opt?.option_text || optId || "",
          selected_answer_label: opt?.option_label || "",
          category: opt?.category_target?.trim() || categoryKey(q) || null,
          is_correct: opt?.is_correct ?? null,
          correct_answer: q.options.find((o: any) => o.is_correct)?.option_text || null,
        });
      }
      if (answerRows.length > 0) {
        await admin.from("test_answers").insert(answerRows);
      }
      results.push({ instrument_id: ip.id, score, status });
    }

    return json({ ok: true, results });
  } catch (e) {
    console.error("test-submit error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
