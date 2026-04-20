import { supabase } from '../src/integrations/supabase/client';

async function addCFIT3AQuestions() {
  // Get CFIT instrument ID
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id')
    .ilike('name', '%CFIT%')
    .limit(1);

  if (!instruments || instruments.length === 0) {
    console.error('CFIT instrument not found');
    return;
  }

  const instrumentId = instruments[0].id;
  console.log('CFIT instrument ID:', instrumentId);

  // Clear existing questions
  await supabase.from('test_question_options').delete().in('question_id', 
    (await supabase.from('test_questions').select('id').eq('instrument_id', instrumentId)).data?.map(q => q.id) || []
  );
  await supabase.from('test_questions').delete().eq('instrument_id', instrumentId);

  // Series Completion (1-15)
  const seriesQuestions = [
    { q: 'Lengkapi pola: △ ○ △ ○ ?', qe: 'Complete: △ ○ △ ○ ?', cat: 'Series', correct: '△' },
    { q: 'Lengkapi pola: 2, 4, 8, 16, ?', qe: 'Complete: 2, 4, 8, 16, ?', cat: 'Series', correct: '32' },
    { q: 'Lengkapi pola: A, C, E, G, ?', qe: 'Complete: A, C, E, G, ?', cat: 'Series', correct: 'I' },
    { q: 'Lengkapi pola: □ △ □ △ ?', qe: 'Complete: □ △ □ △ ?', cat: 'Series', correct: '□' },
    { q: 'Lengkapi pola: 1, 4, 9, 16, ?', qe: 'Complete: 1, 4, 9, 16, ?', cat: 'Series', correct: '25' },
    { q: 'Lengkapi pola: ○ □ ○ □ ?', qe: 'Complete: ○ □ ○ □ ?', cat: 'Series', correct: '○' },
    { q: 'Lengkapi pola: 3, 6, 12, 24, ?', qe: 'Complete: 3, 6, 12, 24, ?', cat: 'Series', correct: '48' },
    { q: 'Lengkapi pola: △ □ ○ △ □ ?', qe: 'Complete: △ □ ○ △ □ ?', cat: 'Series', correct: '○' },
    { q: 'Lengkapi pola: 5, 10, 20, 40, ?', qe: 'Complete: 5, 10, 20, 40, ?', cat: 'Series', correct: '80' },
    { q: 'Lengkapi pola: B, D, F, H, ?', qe: 'Complete: B, D, F, H, ?', cat: 'Series', correct: 'J' },
    { q: 'Lengkapi pola: ◇ ◆ ◇ ◆ ?', qe: 'Complete: ◇ ◆ ◇ ◆ ?', cat: 'Series', correct: '◇' },
    { q: 'Lengkapi pola: 7, 14, 28, 56, ?', qe: 'Complete: 7, 14, 28, 56, ?', cat: 'Series', correct: '112' },
    { q: 'Lengkapi pola: □ ◇ □ ◇ ?', qe: 'Complete: □ ◇ □ ◇ ?', cat: 'Series', correct: '□' },
    { q: 'Lengkapi pola: 11, 22, 44, 88, ?', qe: 'Complete: 11, 22, 44, 88, ?', cat: 'Series', correct: '176' },
    { q: 'Lengkapi pola: ○ ◇ ◆ ○ ◇ ?', qe: 'Complete: ○ ◇ ◆ ○ ◇ ?', cat: 'Series', correct: '◆' },
  ];

  // Matrix (16-30)
  const matrixQuestions = Array.from({ length: 15 }, (_, i) => ({
    q: `Pilih bentuk yang melengkapi matriks (Soal ${i + 16})`,
    qe: `Choose shape to complete matrix (Q${i + 16})`,
    cat: 'Matrix',
    correct: ['A', 'B', 'C', 'D', 'E', 'F'][i % 6]
  }));

  // Classification (31-40)
  const classificationQuestions = [
    { q: 'Pilih yang berbeda: △ △ △ ?', qe: 'Choose different: △ △ △ ?', cat: 'Classification', correct: '○' },
    { q: 'Pilih yang berbeda: ○ ○ □ ?', qe: 'Choose different: ○ ○ □ ?', cat: 'Classification', correct: '□' },
    { q: 'Pilih yang sama: △ ○ □ ?', qe: 'Choose same: △ ○ □ ?', cat: 'Classification', correct: '△' },
    { q: 'Pilih yang berbeda: ◇ ◆ ◇ ?', qe: 'Choose different: ◇ ◆ ◇ ?', cat: 'Classification', correct: '◆' },
    { q: 'Pilih yang sama: □ △ ○ ?', qe: 'Choose same: □ △ ○ ?', cat: 'Classification', correct: '□' },
    { q: 'Pilih yang berbeda: ○ ○ ○ ?', qe: 'Choose different: ○ ○ ○ ?', cat: 'Classification', correct: '△' },
    { q: 'Pilih yang sama: △ □ ◇ ?', qe: 'Choose same: △ □ ◇ ?', cat: 'Classification', correct: '△' },
    { q: 'Pilih yang berbeda: ◆ ◆ ◆ ?', qe: 'Choose different: ◆ ◆ ◆ ?', cat: 'Classification', correct: '◇' },
    { q: 'Pilih yang sama: ○ △ □ ?', qe: 'Choose same: ○ △ □ ?', cat: 'Classification', correct: '○' },
    { q: 'Pilih yang berbeda: □ □ □ ?', qe: 'Choose different: □ □ □ ?', cat: 'Classification', correct: '○' },
  ];

  // Logic (41-50)
  const logicQuestions = [
    { q: 'Jika A > B dan B > C, maka A > C. Benar?', qe: 'If A > B and B > C, then A > C. True?', cat: 'Logic', correct: 'Ya' },
    { q: 'Jika semua X adalah Y, maka...', qe: 'If all X are Y, then...', cat: 'Logic', correct: 'X subset Y' },
    { q: 'Analogi: Segitiga : Lingkaran :: ?', qe: 'Analogy: Triangle : Circle :: ?', cat: 'Logic', correct: 'Kotak' },
    { q: 'Analogi: Kotak : Persegi Panjang :: ?', qe: 'Analogy: Square : Rectangle :: ?', cat: 'Logic', correct: 'Lingkaran' },
    { q: 'Jika A = B dan B = C, maka...', qe: 'If A = B and B = C, then...', cat: 'Logic', correct: 'A = C' },
    { q: 'Analogi: Atas : Bawah :: ?', qe: 'Analogy: Up : Down :: ?', cat: 'Logic', correct: 'Kiri' },
    { q: 'Jika beberapa A adalah B, maka...', qe: 'If some A are B, then...', cat: 'Logic', correct: 'Intersection' },
    { q: 'Analogi: Kiri : Kanan :: ?', qe: 'Analogy: Left : Right :: ?', cat: 'Logic', correct: 'Depan' },
    { q: 'Analogi: Besar : Kecil :: ?', qe: 'Analogy: Big : Small :: ?', cat: 'Logic', correct: 'Panjang' },
    { q: 'Jika tidak ada A yang B, maka...', qe: 'If no A are B, then...', cat: 'Logic', correct: 'Disjoint' },
  ];

  const allQuestions = [...seriesQuestions, ...matrixQuestions, ...classificationQuestions, ...logicQuestions];

  // Insert questions
  for (let i = 0; i < allQuestions.length; i++) {
    const q = allQuestions[i];
    const { data: question } = await supabase.from('test_questions').insert({
      instrument_id: instrumentId,
      question_number: i + 1,
      question_text: q.q,
      question_text_en: q.qe,
      category: q.cat,
      question_type: 'single_choice',
      scoring_rule: 'correct_only'
    }).select('id').single();

    if (question?.id) {
      // Add options
      const options = ['A', 'B', 'C', 'D'].map((label, idx) => ({
        question_id: question.id,
        option_label: label,
        option_text: label,
        option_text_en: label,
        score_value: label === q.correct ? 1 : 0,
        category_target: q.cat,
        is_correct: label === q.correct,
        display_order: idx
      }));

      await supabase.from('test_question_options').insert(options);
    }
  }

  // Update instrument
  await supabase.from('test_instruments').update({
    question_count: 50,
    duration_minutes: 45
  }).eq('id', instrumentId);

  console.log('✅ Successfully added 50 CFIT 3A questions');
}

addCFIT3AQuestions();
