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
      const answers = ip.answers || {};
      const cats: Record<string, number> = {};
      let correctCount = 0;
      let totalScore = 0;
      let answeredCount = 0;

      for (const q of questions) {
        const optId = answers[q.id];
        if (!optId) continue;
        answeredCount++;
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
          picked.forEach((opt: any) => {
            totalScore += Number(opt.score_value || 0);
            const dim = opt.category_target?.trim() || q.category?.trim() || "Umum";
            cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        if (!opt) continue;
        totalScore += Number(opt.score_value || 0);
        if (opt.is_correct) correctCount++;
        const dim = opt.category_target?.trim() || q.category?.trim() || "Umum";
        cats[dim] = (cats[dim] || 0) + Number(opt.score_value || 0);
      }

      const hasCorrectScoring = questions.some(
        (q: any) => q.scoring_rule === "correct_only" || q.options.some((o: any) => o.is_correct),
      );
      const score = hasCorrectScoring && questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
      const status = score >= 70 ? "passed" : score >= 50 ? "review" : "failed";

      const normalizedCats: Record<string, number> = {};
      Object.entries(cats).forEach(([k, v]) => (normalizedCats[k] = Math.round(v)));

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
          categories: normalizedCats,
          status,
          interpretation: `Kandidat menjawab ${answeredCount} dari ${questions.length} soal pada tes ${inst.name}. Skor akhir ${score}%. ${hasCorrectScoring ? `${correctCount} jawaban benar.` : "Diukur berdasar profil dimensi."}`,
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
            question_text_en: q.question_text_en,
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
            question_text_en: q.question_text_en,
            selected_answer: picked.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + "),
            selected_answer_label: picked.map((o: any) => o.option_label).join("+"),
            category: q.category,
            is_correct: allCorrect,
            correct_answer: correctOpts.map((o: any) => `${o.option_label}. ${o.option_text}`).join(" + ") || null,
          });
          continue;
        }
        const opt = q.options.find((o: any) => o.id === optId);
        answerRows.push({
          test_result_id: resultData.id,
          question_number: q.question_number,
          question_text: q.question_text,
          question_text_en: q.question_text_en,
          selected_answer: opt?.option_text || optId || "",
          selected_answer_label: opt?.option_label || "",
          category: opt?.category_target?.trim() || q.category || null,
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
