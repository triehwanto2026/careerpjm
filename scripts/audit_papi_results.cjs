const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = {};
fs.readFileSync(".env", "utf8").split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").replace(/["']/g, "").trim();
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const CODES = ["N", "G", "A", "L", "P", "I", "T", "V", "S", "B", "O", "X", "C", "D", "R", "Z", "E", "K", "F", "W"];

async function main() {
  const { data: instruments, error: instError } = await supabase.from("test_instruments").select("id,name,question_count,scoring_method").ilike("name", "%PAPI%");
  if (instError) throw instError;
  for (const instrument of instruments || []) {
    const { data: questions, error: questionError } = await supabase
      .from("test_questions")
      .select("id,question_number,question_text,test_question_options(id,option_label,option_text,category_target,score_value)")
      .eq("instrument_id", instrument.id)
      .order("question_number");
    if (questionError) throw questionError;
    const optionCounts = Object.fromEntries(CODES.map((code) => [code, 0]));
    const invalid = [];
    for (const question of questions || []) {
      for (const option of question.test_question_options || []) {
        const code = String(option.category_target || "").trim().toUpperCase();
        if (code in optionCounts) optionCounts[code] += 1;
        else invalid.push({ question: question.question_number, option: option.option_label, code });
      }
    }
    console.log("INSTRUMENT", instrument);
    console.log("OPTION_COUNTS", optionCounts, "TOTAL", Object.values(optionCounts).reduce((a, b) => a + b, 0));
    console.log("INVALID", invalid);
    console.log("FIRST_12", (questions || []).slice(0, 12).map((q) => ({ no: q.question_number, options: q.test_question_options.map((o) => ({ label: o.option_label, text: o.option_text, code: o.category_target })) })));
  }

  const { data: results, error: resultError } = await supabase
    .from("test_results")
    .select("id,candidate_name,test_name,categories,answered_questions,total_questions,completed_at")
    .ilike("test_name", "%PAPI%")
    .order("completed_at", { ascending: false })
    .limit(2);
  if (resultError) {
    console.log("LATEST_RESULTS_SKIPPED", resultError.message);
    return;
  }
  console.log("LATEST_RESULTS", results);
  for (const result of results || []) {
    const { data: answers, error: answerError } = await supabase.from("test_answers").select("question_number,selected_answer_label,category").eq("test_result_id", result.id).order("question_number");
    if (answerError) throw answerError;
    const recomputed = Object.fromEntries(CODES.map((code) => [code, 0]));
    for (const answer of answers || []) {
      const code = String(answer.category || "").trim().toUpperCase();
      if (code in recomputed) recomputed[code] += 1;
    }
    console.log("RESULT_CHECK", { id: result.id, candidate: result.candidate_name, stored: result.categories, recomputed, answerCount: answers?.length || 0 });
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
