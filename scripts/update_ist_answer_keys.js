import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFilePath = '.env';
const env = {};
if (fs.existsSync(envFilePath)) {
  fs.readFileSync(envFilePath, 'utf8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) return;
    env[key.trim()] = rest.join('=').replace(/['"]+/g, '').trim();
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IST_INSTRUMENT_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';

const answers = new Map([
  [1, 'E'], [2, 'C'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'B'], [7, 'C'], [8, 'A'], [9, 'E'], [10, 'B'],
  [11, 'C'], [12, 'D'], [13, 'D'], [14, 'E'], [15, 'C'], [16, 'A'], [17, 'B'], [18, 'B'], [19, 'C'], [20, 'B'],
  [21, 'B'], [22, 'B'], [23, 'D'], [24, 'C'], [25, 'C'], [26, 'C'], [27, 'C'], [28, 'D'], [29, 'D'], [30, 'A'],
  [31, 'E'], [32, 'A'], [33, 'A'], [34, 'B'], [35, 'C'], [36, 'A'], [37, 'D'], [38, 'E'], [39, 'B'], [40, 'C'],
  [41, 'C'], [42, 'E'], [43, 'D'], [44, 'D'], [45, 'D'], [46, 'A'], [47, 'D'], [48, 'B'], [49, 'E'], [50, 'D'],
  [51, 'C'], [52, 'C'], [53, 'C'], [54, 'C'], [55, 'D'], [56, 'C'], [57, 'C'], [58, 'D'], [59, 'E'], [60, 'E'],
  [61, 'B'], [62, 'C'], [63, 'D'], [64, 'C'], [65, 'A'], [66, 'B'], [67, 'A'], [68, 'B'], [69, 'A'], [70, 'B'],
  [71, 'C'], [72, 'A'], [73, 'A'], [74, 'B'], [75, 'D'], [76, 'A'],
  [77, 35], [78, 280], [79, 205], [80, 26], [81, 30], [82, 70], [83, 45], [84, 50], [85, 84], [86, 78],
  [87, 19], [88, 6], [89, 75], [90, 90], [91, 120], [92, 17], [93, 36], [94, 5], [95, 48], [96, 1],
  [97, 27], [98, 25], [99, 27], [100, 15], [101, 46], [102, 10], [103, 42], [104, 7], [105, 5], [106, 14],
  [107, 8], [108, 14], [109, 45], [110, 63], [111, 12], [112, 80], [113, 14], [114, 12], [115, 63], [116, 10],
  [117, 'A'], [118, 'C'], [119, 'B'], [120, 'A'], [121, 'D'], [122, 'B'], [123, 'C'], [124, 'E'], [125, 'E'], [126, 'D'],
  [127, 'E'], [128, 'B'], [129, 'D'], [130, 'C'], [131, 'B'], [132, 'A'], [133, 'B'], [134, 'D'], [135, 'C'], [136, 'A'],
  [137, 'A'], [138, 'C'], [139, 'D'], [140, 'E'], [141, 'A'], [142, 'C'], [143, 'D'], [144, 'C'], [145, 'E'], [146, 'A'],
  [147, 'B'], [148, 'D'], [149, 'E'], [150, 'B'], [151, 'D'], [152, 'B'], [153, 'A'], [154, 'E'], [155, 'B'], [156, 'C'],
  [157, 'D'], [158, 'E'], [159, 'B'], [160, 'C'], [161, 'A'], [162, 'A'], [163, 'D'], [164, 'E'], [165, 'C'], [166, 'B'],
  [167, 'B'], [168, 'A'], [169, 'E'], [170, 'C'], [171, 'D'], [172, 'B'], [173, 'E'], [174, 'A'], [175, 'C'], [176, 'D'],
]);

const normalize = (value) => String(value).trim();

async function main() {
  console.log('Updating IST answer keys for instrument', IST_INSTRUMENT_ID);

  for (const [questionNumber, answerValue] of answers.entries()) {
    const { data: questions, error: questionError } = await supabase
      .from('test_questions')
      .select('id, question_number')
      .eq('instrument_id', IST_INSTRUMENT_ID)
      .eq('question_number', questionNumber)
      .limit(1);

    if (questionError) {
      console.error(`Failed to fetch question ${questionNumber}:`, questionError.message || questionError);
      continue;
    }

    const question = questions?.[0];
    if (!question) {
      console.warn(`Question ${questionNumber} not found, skipping.`);
      continue;
    }

    const qid = question.id;

    const { data: options, error: optionsError } = await supabase
      .from('test_question_options')
      .select('id, option_label, option_text')
      .eq('question_id', qid);

    if (optionsError) {
      console.error(`Failed to fetch options for question ${questionNumber}:`, optionsError.message || optionsError);
      continue;
    }

    if (!options || options.length === 0) {
      console.warn(`No options found for question ${questionNumber}.`);
      continue;
    }

    const isLabelAnswer = typeof answerValue === 'string';
    let matchedOption = null;

    if (isLabelAnswer) {
      matchedOption = options.find((opt) => normalize(opt.option_label) === normalize(answerValue));
    } else {
      matchedOption = options.find((opt) => normalize(opt.option_text) === normalize(answerValue) || normalize(opt.option_label) === normalize(answerValue));
    }

    if (!matchedOption) {
      console.warn(`No matching option found for question ${questionNumber} with answer ${answerValue}.`);
    }

    const updates = options.map((opt) => ({
      id: opt.id,
      is_correct: matchedOption ? opt.id === matchedOption.id : false,
      score_value: matchedOption ? (opt.id === matchedOption.id ? 1 : 0) : 0,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('test_question_options')
        .update({ is_correct: update.is_correct, score_value: update.score_value })
        .eq('id', update.id);
      if (error) {
        console.error(`Failed to update option ${update.id} for question ${questionNumber}:`, error.message || error);
      }
    }

    console.log(`Question ${questionNumber} updated${matchedOption ? ` (matched option ${matchedOption.option_label})` : ''}.`);
  }

  console.log('IST answer key update completed.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
