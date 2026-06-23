import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const envFilePath of ['.env', '.env.local']) {
  if (!fs.existsSync(envFilePath)) continue;
  fs.readFileSync(envFilePath, 'utf8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) return;
    env[key.trim()] = rest.join('=').replace(/['"]+/g, '').trim();
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  || env.SUPABASE_SERVICE_ROLE_KEY
  || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing admin Supabase credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const findIstInstrument = async () => {
  const { data: named, error: namedError } = await supabase
    .from('test_instruments')
    .select('id, name, name_en, scoring_method, question_count, is_active')
    .or('name.ilike.%IST%,name_en.ilike.%IST%,name.ilike.%Intelligenz%')
    .limit(5);
  if (namedError) throw namedError;
  if (named?.[0]) return named[0];

  const { data: byQuestion, error: questionError } = await supabase
    .from('test_questions')
    .select('instrument_id, question_number, question_text')
    .gte('question_number', 61)
    .lte('question_number', 76)
    .limit(1);
  if (questionError) throw questionError;
  if (!byQuestion?.[0]?.instrument_id) return null;

  const { data: inst, error: instError } = await supabase
    .from('test_instruments')
    .select('id, name, name_en, scoring_method, question_count, is_active')
    .eq('id', byQuestion[0].instrument_id)
    .single();
  if (instError) throw instError;
  return inst;
};

const main = async () => {
  const instrument = await findIstInstrument();
  if (!instrument) {
    console.log(JSON.stringify({ ok: false, error: 'IST instrument/questions not found' }, null, 2));
    process.exit(1);
  }

  const { data: questions, error: qError } = await supabase
    .from('test_questions')
    .select('id, question_number, question_type, scoring_rule, subtest_code, category')
    .eq('instrument_id', instrument.id)
    .order('question_number');
  if (qError) throw qError;

  const questionIds = (questions || []).map((q) => q.id);
  const { data: options, error: oError } = questionIds.length
    ? await supabase
      .from('test_question_options')
      .select('question_id, option_label, option_text, score_value, is_correct')
      .in('question_id', questionIds)
    : { data: [], error: null };
  if (oError) throw oError;

  const optionsByQuestion = {};
  (options || []).forEach((option) => {
    (optionsByQuestion[option.question_id] ||= []).push(option);
  });

  const subtestRanges = {
    SE: [1, 20],
    WA: [21, 40],
    AN: [41, 60],
    GE: [61, 76],
    RA: [77, 96],
    ZR: [97, 116],
    FA: [117, 136],
    WU: [137, 156],
    ME: [157, 176],
  };

  const summary = Object.fromEntries(Object.entries(subtestRanges).map(([code, [start, end]]) => {
    const rows = (questions || []).filter((q) => q.question_number >= start && q.question_number <= end);
    const keyed = rows.filter((q) => (optionsByQuestion[q.id] || []).some((o) => o.is_correct || Number(o.score_value || 0) > 0));
    return [code, {
      questions: rows.length,
      keyed: keyed.length,
      types: Array.from(new Set(rows.map((q) => q.question_type))).sort(),
    }];
  }));

  const geRows = (questions || []).filter((q) => q.question_number >= 61 && q.question_number <= 76);
  const geNotText = geRows.filter((q) => q.question_type !== 'text').map((q) => q.question_number);
  const missingKeys = (questions || [])
    .filter((q) => !(optionsByQuestion[q.id] || []).some((o) => o.is_correct || Number(o.score_value || 0) > 0))
    .map((q) => q.question_number);

  console.log(JSON.stringify({
    ok: geNotText.length === 0 && missingKeys.length === 0,
    instrument,
    totalQuestions: questions?.length || 0,
    summary,
    geNotText,
    missingKeys: missingKeys.slice(0, 50),
    missingKeysCount: missingKeys.length,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
