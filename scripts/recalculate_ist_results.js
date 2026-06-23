import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const envFilePath of [".env", ".env.local"]) {
  if (!fs.existsSync(envFilePath)) continue;
  fs.readFileSync(envFilePath, "utf8").split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (!key || rest.length === 0) return;
    env[key.trim()] = rest.join("=").replace(/['"]/g, "").trim();
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  || env.SUPABASE_SERVICE_ROLE_KEY
  || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase admin credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IST_SUBTEST_MAX = {
  SE: 20,
  WA: 20,
  AN: 20,
  GE: 16,
  RA: 20,
  ZR: 20,
  FA: 20,
  WU: 20,
  ME: 20,
};

const IST_SUBTEST_RANGES = [
  { start: 1, end: 20, code: "SE" },
  { start: 21, end: 40, code: "WA" },
  { start: 41, end: 60, code: "AN" },
  { start: 61, end: 76, code: "GE" },
  { start: 77, end: 96, code: "RA" },
  { start: 97, end: 116, code: "ZR" },
  { start: 117, end: 136, code: "FA" },
  { start: 137, end: 156, code: "WU" },
  { start: 157, end: 176, code: "ME" },
];

const normalize = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[–—/\\-]/g, " ")
  .replace(/[^a-z0-9 ]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const getIstSubtestCode = (subtestOrQuestionNumber) => {
  const raw = String(subtestOrQuestionNumber ?? "").trim().toUpperCase();
  if (IST_SUBTEST_MAX[raw]) return raw;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  return IST_SUBTEST_RANGES.find((range) => num >= range.start && num <= range.end)?.code ?? null;
};

const isSelectedCorrect = (answer, question) => {
  if (answer.is_correct === true) return true;
  const selectedValues = [
    answer.selected_answer_label,
    answer.selected_answer,
  ].map(normalize).filter(Boolean);
  if (selectedValues.length === 0) return false;

  return (question.options || []).some((option) => {
    if (!option.is_correct && Number(option.score_value || 0) <= 0) return false;
    const correctValues = [
      option.option_label,
      option.option_text,
    ].map(normalize).filter(Boolean);
    return selectedValues.some((selected) =>
      correctValues.some((correct) => selected === correct || selected.includes(correct) || correct.includes(selected)),
    );
  });
};

const buildIstCategories = (answers, questionsByNumber) => {
  const categories = Object.fromEntries(Object.keys(IST_SUBTEST_MAX).map((code) => [code, 0]));
  let answered = 0;

  for (const answer of answers || []) {
    const question = questionsByNumber.get(Number(answer.question_number));
    const code = getIstSubtestCode(question?.subtest_code || answer.category || answer.question_number);
    if (!code) continue;
    answered += 1;
    if (isSelectedCorrect(answer, question || { options: [] })) {
      categories[code] += 1;
    }
  }

  const groupMapping = {
    Verbal: ["SE", "WA", "AN", "GE"],
    Numerik: ["RA", "ZR"],
    "Figural / Spasial": ["FA", "WU"],
    Memori: ["ME"],
  };
  Object.entries(groupMapping).forEach(([group, codes]) => {
    categories[group] = Math.round(codes.reduce((sum, code) => sum + (categories[code] / IST_SUBTEST_MAX[code]) * 100, 0) / codes.length);
  });
  categories["IST Raw Score"] = Object.keys(IST_SUBTEST_MAX).reduce((sum, code) => sum + categories[code], 0);
  categories["IST Max Score"] = Object.values(IST_SUBTEST_MAX).reduce((sum, max) => sum + max, 0);

  const score = Math.round(Object.entries(IST_SUBTEST_MAX).reduce((sum, [code, max]) => sum + (categories[code] / max) * 100, 0) / Object.keys(IST_SUBTEST_MAX).length);
  return { categories, score, answered };
};

const main = async () => {
  const { data: instruments, error: instrumentError } = await supabase
    .from("test_instruments")
    .select("id, name")
    .or("name.ilike.%IST%,name_en.ilike.%IST%,name.ilike.%Intelligenz%");
  if (instrumentError) throw instrumentError;
  if (!instruments?.length) throw new Error("IST instrument not found.");

  const instrumentIds = instruments.map((instrument) => instrument.id);
  const { data: questions, error: questionError } = await supabase
    .from("test_questions")
    .select("id, instrument_id, question_number, subtest_code")
    .in("instrument_id", instrumentIds)
    .order("question_number");
  if (questionError) throw questionError;

  const questionIds = (questions || []).map((question) => question.id);
  const { data: options, error: optionError } = await supabase
    .from("test_question_options")
    .select("question_id, option_label, option_text, score_value, is_correct")
    .in("question_id", questionIds);
  if (optionError) throw optionError;

  const optionsByQuestion = new Map();
  (options || []).forEach((option) => {
    const rows = optionsByQuestion.get(option.question_id) || [];
    rows.push(option);
    optionsByQuestion.set(option.question_id, rows);
  });

  const questionsByNumber = new Map();
  (questions || []).forEach((question) => {
    questionsByNumber.set(Number(question.question_number), {
      ...question,
      options: optionsByQuestion.get(question.id) || [],
    });
  });

  const { data: results, error: resultError } = await supabase
    .from("test_results")
    .select("id, test_name, categories")
    .ilike("test_name", "%IST%");
  if (resultError) throw resultError;

  let updated = 0;
  for (const result of results || []) {
    const { data: answers, error: answerError } = await supabase
      .from("test_answers")
      .select("question_number, selected_answer, selected_answer_label, category, is_correct")
      .eq("test_result_id", result.id)
      .order("question_number");
    if (answerError) {
      console.error(`Failed to fetch answers for ${result.id}:`, answerError.message);
      continue;
    }

    const rebuilt = buildIstCategories(answers || [], questionsByNumber);
    const status = rebuilt.score >= 70 ? "passed" : rebuilt.score >= 50 ? "review" : "failed";
    const interpretation = `Hasil IST telah dihitung ulang dari ${rebuilt.answered} jawaban tersimpan. Profil subtes: ${Object.keys(IST_SUBTEST_MAX).map((code) => `${code}=${rebuilt.categories[code]}/${IST_SUBTEST_MAX[code]}`).join("; ")}.`;

    const { error: updateError } = await supabase
      .from("test_results")
      .update({
        categories: rebuilt.categories,
        score: rebuilt.score,
        status,
        interpretation,
      })
      .eq("id", result.id);

    if (updateError) {
      console.error(`Failed to update ${result.id}:`, updateError.message);
      continue;
    }
    updated += 1;
    console.log(`Updated ${result.id}: score=${rebuilt.score}, raw=${rebuilt.categories["IST Raw Score"]}/${rebuilt.categories["IST Max Score"]}`);
  }

  console.log(`Done. Updated ${updated} IST result(s).`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
