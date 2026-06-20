const fs = require('fs');
const { statements, items, validate } = require('./setup_msdt_test.cjs');

validate();

const payload = items.map(([aId, bId], index) => ({
  n: index + 1,
  a: statements[aId][0],
  ac: statements[aId][1],
  b: statements[bId][0],
  bc: statements[bId][1],
}));

const sql = `-- Add Management Style Diagnostic Test (MSDT) with 64 forced-choice items.
DO $$
DECLARE
  msdt_id UUID;
  new_question_id UUID;
  item JSONB;
BEGIN
  SELECT id INTO msdt_id
  FROM public.test_instruments
  WHERE name ILIKE '%MSDT%' OR name ILIKE '%Management Style Diagnostic%'
  LIMIT 1;

  IF msdt_id IS NULL THEN
    INSERT INTO public.test_instruments (
      name, name_en, description, category, scoring_method,
      target_audience, norm_reference, question_count, duration_minutes, is_active
    )
    VALUES (
      'MSDT',
      'Management Style Diagnostic Test',
      'Memetakan kecenderungan gaya manajemen melalui 64 pasangan pernyataan forced-choice.',
      'Behavioral',
      'msdt_style',
      'Supervisor, leader, manager, kandidat posisi struktural',
      'Management Style Diagnostic profile',
      64, 30, TRUE
    )
    RETURNING id INTO msdt_id;
  ELSE
    UPDATE public.test_instruments
    SET name = 'MSDT',
        name_en = 'Management Style Diagnostic Test',
        description = 'Memetakan kecenderungan gaya manajemen melalui 64 pasangan pernyataan forced-choice.',
        category = 'Behavioral',
        scoring_method = 'msdt_style',
        target_audience = 'Supervisor, leader, manager, kandidat posisi struktural',
        norm_reference = 'Management Style Diagnostic profile',
        question_count = 64,
        duration_minutes = 30,
        is_active = TRUE
    WHERE id = msdt_id;
  END IF;

  DELETE FROM public.test_question_options AS tqo
  WHERE tqo.question_id IN (
    SELECT tq.id FROM public.test_questions AS tq WHERE tq.instrument_id = msdt_id
  );
  DELETE FROM public.test_questions WHERE instrument_id = msdt_id;

  FOR item IN
    SELECT value FROM jsonb_array_elements($msdt$${JSON.stringify(payload)}$msdt$::jsonb)
  LOOP
    INSERT INTO public.test_questions (
      instrument_id, question_number, question_text, question_text_en,
      category, question_type, scoring_rule
    )
    VALUES (
      msdt_id,
      (item->>'n')::INTEGER,
      'Pilih pernyataan yang paling mendekati gaya manajemen Anda.' ||
        E'\\n\\nA. ' || item->>'a' || E'\\nB. ' || item->>'b',
      'Choose the statement that best reflects your management style.' ||
        E'\\n\\nA. ' || item->>'a' || E'\\nB. ' || item->>'b',
      'MSDT',
      'single_choice',
      'msdt_style'
    )
    RETURNING id INTO new_question_id;

    INSERT INTO public.test_question_options (
      question_id, option_label, option_text, option_text_en,
      score_value, category_target, is_correct, display_order
    )
    VALUES
      (new_question_id, 'A', item->>'a', item->>'a', 1, item->>'ac', NULL, 0),
      (new_question_id, 'B', item->>'b', item->>'b', 1, item->>'bc', NULL, 1);
  END LOOP;
END $$;
`;

const output = 'supabase/migrations/20260620114000_add_msdt_test.sql';
fs.writeFileSync(output, sql);

const clientOutput = 'src/lib/msdtQuestions.ts';
fs.writeFileSync(
  clientOutput,
  `export type MsdtQuestionSeed = {
  number: number;
  a: string;
  aCategory: string;
  b: string;
  bCategory: string;
};

export const MSDT_QUESTIONS: MsdtQuestionSeed[] = ${JSON.stringify(payload.map((item) => ({
    number: item.n,
    a: item.a,
    aCategory: item.ac,
    b: item.b,
    bCategory: item.bc,
  })), null, 2)};
`
);

console.log(output);
console.log(clientOutput);
