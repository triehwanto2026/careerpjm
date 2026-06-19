const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = {};
fs.readFileSync(".env", "utf8").split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").replace(/["']/g, "").trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const problems = [];
  const { data: instruments, error: instError } = await supabase
    .from("test_instruments")
    .select("id,name,question_count,duration_minutes,scoring_method,is_active")
    .order("name");
  if (instError) throw instError;

  console.log(`Instruments: ${instruments?.length || 0}`);
  if (!instruments?.length) {
    problems.push("No test instruments found in this Supabase project.");
  }
  if ((instruments?.length || 0) > 0 && (instruments?.length || 0) < 8) {
    problems.push(`Expected at least 8 psychological tests, found ${instruments.length}.`);
  }

  for (const inst of instruments || []) {
    const { data: questions, error: qError } = await supabase
      .from("test_questions")
      .select("id,question_number,question_text,question_type,scoring_rule,category,test_question_options(id,option_label,score_value,is_correct)")
      .eq("instrument_id", inst.id)
      .order("question_number");
    if (qError) throw qError;

    const { data: interpretations, error: iError } = await supabase
      .from("test_interpretations")
      .select("id,interpretation_key,category,min_value,max_value")
      .eq("instrument_id", inst.id);
    if (iError) throw iError;

    const qCount = questions?.length || 0;
    const noOptions = [];
    const noCorrect = [];
    const multiCorrect = [];

    for (const q of questions || []) {
      const options = q.test_question_options || [];
      const correct = options.filter((o) => o.is_correct || Number(o.score_value) > 0);
      if (!["numeric", "text"].includes(q.question_type) && options.length === 0) noOptions.push(q.question_number);
      if (q.scoring_rule === "correct_only" && correct.length === 0) noCorrect.push(q.question_number);
      if (q.question_type === "single_choice" && correct.length > 1) multiCorrect.push(q.question_number);
    }

    if (qCount !== Number(inst.question_count || 0)) problems.push(`${inst.name}: question_count metadata ${inst.question_count}, actual ${qCount}`);
    if (noOptions.length) problems.push(`${inst.name}: questions without options ${noOptions.join(", ")}`);
    if (noCorrect.length) problems.push(`${inst.name}: correct_only questions without answer key ${noCorrect.join(", ")}`);
    if (multiCorrect.length) problems.push(`${inst.name}: single_choice questions with multiple correct keys ${multiCorrect.join(", ")}`);
    if (!interpretations?.length) problems.push(`${inst.name}: no interpretations`);

    console.log(`${inst.name}: ${qCount}/${inst.question_count} questions, ${interpretations?.length || 0} interpretations, ${noCorrect.length} missing keys`);
  }

  const { data: results, error: rError } = await supabase
    .from("test_results")
    .select("id,candidate_name,test_name,total_questions,answered_questions,score,completed_at")
    .order("completed_at", { ascending: false })
    .limit(200);
  if (rError) {
    console.log(`Results audit skipped: ${rError.message || "not readable with current key"}`);
    problems.push(hasServiceRole
      ? `Cannot read test_results: ${rError.message || "unknown error"}`
      : "Cannot fully audit test_results/test_answers without SUPABASE_SERVICE_ROLE_KEY.");
  } else {
    console.log(`Recent results checked: ${results?.length || 0}`);
    for (const result of results || []) {
      const { count, error } = await supabase
        .from("test_answers")
        .select("*", { count: "exact", head: true })
        .eq("test_result_id", result.id);
      if (error) {
        problems.push(`${result.test_name} / ${result.candidate_name}: answers not readable (${error.message})`);
        continue;
      }
      if ((count || 0) !== Number(result.answered_questions || 0)) {
        problems.push(`${result.test_name} / ${result.candidate_name}: answered_questions ${result.answered_questions}, stored answers ${count || 0}`);
      }
    }
  }

  if (problems.length) {
    console.log("\nPROBLEMS");
    problems.forEach((problem) => console.log(`- ${problem}`));
    process.exitCode = 1;
  } else {
    console.log("\nOK: question sets, answer keys, interpretations, results, and candidate answers are consistent.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
