interface AptitudeTestParams {
  testName: string;
  testNameEn: string;
  category: string;
  questionCount: number;
  targetAudience: string;
  aptitudeType: string; // verbal, numerical, abstract, mechanical, spatial
}

interface GeneratedQuestion {
  question_text: string;
  question_text_en: string;
  category: string;
  question_type: string;
  options: Array<{
    option_label: string;
    option_text: string;
    option_text_en: string;
    score_value: number;
    is_correct: boolean;
    display_order: number;
  }>;
}

interface GeneratedInterpretation {
  dimension: string;
  low_score: string;
  medium_score: string;
  high_score: string;
  job_matches: string;
}

// Generate aptitude test questions using AI
export async function generateAptitudeTestQuestions(params: AptitudeTestParams): Promise<GeneratedQuestion[]> {
  // This is a placeholder - in production, you would call an AI API like OpenAI
  // For now, we'll return structured mock data that follows psychology standards
  
  const aptitudePrompts = {
    verbal: {
      categories: ["Vocabulary", "Comprehension", "Verbal Reasoning"],
      questionTypes: ["single_choice"],
      sampleQuestions: [
        {
          question_text: "Pilih sinonim yang paling tepat dari kata: 'ABUNDAN'",
          question_text_en: "Choose the most appropriate synonym for the word: 'ABUNDANT'",
          category: "Vocabulary",
          question_type: "single_choice",
          options: [
            { option_label: "A", option_text: "Langka", option_text_en: "Scarce", score_value: 0, is_correct: false, display_order: 0 },
            { option_label: "B", option_text: "Melimpah", option_text_en: "Plentiful", score_value: 1, is_correct: true, display_order: 1 },
            { option_label: "C", option_text: "Sedikit", option_text_en: "Few", score_value: 0, is_correct: false, display_order: 2 },
            { option_label: "D", option_text: "Kosong", option_text_en: "Empty", score_value: 0, is_correct: false, display_order: 3 },
          ]
        },
        {
          question_text: "Jika semua A adalah B, dan beberapa B adalah C, maka...",
          question_text_en: "If all A are B, and some B are C, then...",
          category: "Verbal Reasoning",
          question_type: "single_choice",
          options: [
            { option_label: "A", option_text: "Semua A adalah C", option_text_en: "All A are C", score_value: 0, is_correct: false, display_order: 0 },
            { option_label: "B", option_text: "Beberapa A adalah C", option_text_en: "Some A are C", score_value: 0, is_correct: false, display_order: 1 },
            { option_label: "C", option_text: "Tidak dapat ditarik kesimpulan", option_text_en: "Cannot be concluded", score_value: 1, is_correct: true, display_order: 2 },
            { option_label: "D", option_text: "Tidak ada A yang C", option_text_en: "No A are C", score_value: 0, is_correct: false, display_order: 3 },
          ]
        }
      ]
    },
    numerical: {
      categories: ["Arithmetic", "Number Series", "Problem Solving"],
      questionTypes: ["single_choice"],
      sampleQuestions: [
        {
          question_text: "Lanjutkan deret angka berikut: 2, 6, 18, 54, ...",
          question_text_en: "Continue the number series: 2, 6, 18, 54, ...",
          category: "Number Series",
          question_type: "single_choice",
          options: [
            { option_label: "A", option_text: "108", option_text_en: "108", score_value: 0, is_correct: false, display_order: 0 },
            { option_label: "B", option_text: "162", option_text_en: "162", score_value: 1, is_correct: true, display_order: 1 },
            { option_label: "C", option_text: "160", option_text_en: "160", score_value: 0, is_correct: false, display_order: 2 },
            { option_label: "D", option_text: "150", option_text_en: "150", score_value: 0, is_correct: false, display_order: 3 },
          ]
        },
        {
          question_text: "Sebuah toko menjual barang dengan harga Rp 100.000. Jika diskon 20%, berapa harga akhirnya?",
          question_text_en: "A store sells an item for Rp 100,000. If there's a 20% discount, what's the final price?",
          category: "Arithmetic",
          question_type: "single_choice",
          options: [
            { option_label: "A", option_text: "Rp 70.000", option_text_en: "Rp 70,000", score_value: 0, is_correct: false, display_order: 0 },
            { option_label: "B", option_text: "Rp 80.000", option_text_en: "Rp 80,000", score_value: 1, is_correct: true, display_order: 1 },
            { option_label: "C", option_text: "Rp 90.000", option_text_en: "Rp 90,000", score_value: 0, is_correct: false, display_order: 2 },
            { option_label: "D", option_text: "Rp 75.000", option_text_en: "Rp 75,000", score_value: 0, is_correct: false, display_order: 3 },
          ]
        }
      ]
    },
    abstract: {
      categories: ["Pattern Recognition", "Matrix Reasoning", "Figure Analogies"],
      questionTypes: ["single_choice"],
      sampleQuestions: [
        {
          question_text: "Pilih pola yang melengkapi seri: △ ○ △ ○ ?",
          question_text_en: "Choose the pattern that completes the series: △ ○ △ ○ ?",
          category: "Pattern Recognition",
          question_type: "single_choice",
          options: [
            { option_label: "A", option_text: "△", option_text_en: "△", score_value: 1, is_correct: true, display_order: 0 },
            { option_label: "B", option_text: "○", option_text_en: "○", score_value: 0, is_correct: false, display_order: 1 },
            { option_label: "C", option_text: "□", option_text_en: "□", score_value: 0, is_correct: false, display_order: 2 },
            { option_label: "D", option_text: "◇", option_text_en: "◇", score_value: 0, is_correct: false, display_order: 3 },
          ]
        }
      ]
    }
  };

  const aptitudeData = aptitudePrompts[params.aptitudeType as keyof typeof aptitudePrompts];
  if (!aptitudeData) {
    throw new Error(`Unsupported aptitude type: ${params.aptitudeType}`);
  }

  // Generate questions based on the requested count
  const questions: GeneratedQuestion[] = [];
  for (let i = 0; i < Math.min(params.questionCount, aptitudeData.sampleQuestions.length); i++) {
    const sample = aptitudeData.sampleQuestions[i % aptitudeData.sampleQuestions.length];
    questions.push({
      ...sample,
      question_text: `[AI Generated] ${sample.question_text}`,
      question_text_en: `[AI Generated] ${sample.question_text_en}`
    });
  }

  // Fill remaining with variations
  while (questions.length < params.questionCount) {
    const sample = aptitudeData.sampleQuestions[Math.floor(Math.random() * aptitudeData.sampleQuestions.length)];
    questions.push({
      ...sample,
      question_text: `[AI Generated - Variation] ${sample.question_text}`,
      question_text_en: `[AI Generated - Variation] ${sample.question_text_en}`
    });
  }

  return questions;
}

// Generate interpretation guidelines for aptitude tests
export function generateAptitudeInterpretation(aptitudeType: string): GeneratedInterpretation {
  const interpretations: Record<string, GeneratedInterpretation> = {
    verbal: {
      dimension: "Verbal Aptitude",
      low_score: "Kemampuan verbal dalam kategori rendah. Membutuhkan dukungan dalam komunikasi tertulis dan pemahaman teks kompleks. Cocok untuk peran yang lebih menekankan pada keterampilan praktis daripada komunikasi verbal.",
      medium_score: "Kemampuan verbal dalam kategori menengah. Mampu berkomunikasi dengan baik dalam situasi rutin. Cocok untuk berbagai peran yang membutuhkan komunikasi standar.",
      high_score: "Kemampuan verbal yang sangat baik. Mampu mengolah informasi verbal dengan cepat, memahami teks kompleks, dan berkomunikasi secara efektif. Cocok untuk peran seperti penulis, pengacara, konsultan, manajer komunikasi.",
      job_matches: "Penulis, Editor, Pengacara, Konsultan, Manajer Komunikasi, PR Specialist, Trainer, HR Manager"
    },
    numerical: {
      dimension: "Numerical Aptitude",
      low_score: "Kemampuan numerik dalam kategori rendah. Membutuhkan dukungan dalam perhitungan dan analisis data. Lebih cocok untuk peran yang tidak menekankan pada keterampilan matematika.",
      medium_score: "Kemampuan numerik dalam kategori menengah. Mampu melakukan perhitungan dasar dan analisis sederhana. Cocok untuk peran yang membutuhkan keterampilan numerik standar.",
      high_score: "Kemampuan numerik yang sangat baik. Mampu menganalisis data kompleks, melakukan perhitungan cepat, dan memecahkan masalah matematika. Cocok untuk peran seperti akuntan, analis data, engineer, financial planner.",
      job_matches: "Akuntan, Analis Data, Engineer, Financial Planner, Statistician, Banker, Auditor, Actuary"
    },
    abstract: {
      dimension: "Abstract/Reasoning Aptitude",
      low_score: "Kemampuan penalaran abstrak dalam kategori rendah. Membutuhkan dukungan dalam memecahkan masalah non-verbal dan pola kompleks. Lebih cocok untuk peran yang terstruktur dan prosedural.",
      medium_score: "Kemampuan penalaran abstrak dalam kategori menengah. Mampu memecahkan masalah standar dengan pola yang jelas. Cocok untuk berbagai peran yang membutuhkan pemecahan masalah.",
      high_score: "Kemampuan penalaran abstrak yang sangat baik. Mampu mengidentifikasi pola kompleks, berpikir konseptual, dan memecahkan masalah novel. Cocok untuk peran seperti researcher, software engineer, architect, strategic planner.",
      job_matches: "Researcher, Software Engineer, Architect, Strategic Planner, Designer, Innovation Manager, R&D Specialist"
    },
    mechanical: {
      dimension: "Mechanical Aptitude",
      low_score: "Kemampuan mekanikal dalam kategori rendah. Membutuhkan dukungan dalam memahami prinsip mekanikal dan fisika dasar. Lebih cocok untuk peran administratif atau berbasis layanan.",
      medium_score: "Kemampuan mekanikal dalam kategori menengah. Mampu memahami prinsip dasar dan bekerja dengan peralatan standar. Cocok untuk peran teknis yang tidak terlalu kompleks.",
      high_score: "Kemampuan mekanikal yang sangat baik. Mampu memahami sistem kompleks, memecahkan masalah mekanikal, dan bekerja dengan presisi. Cocok untuk peran seperti engineer mekanik, technician, maintenance supervisor.",
      job_matches: "Mechanical Engineer, Technician, Maintenance Supervisor, Industrial Designer, Quality Control Engineer"
    },
    spatial: {
      dimension: "Spatial Aptitude",
      low_score: "Kemampuan spasial dalam kategori rendah. Membutuhkan dukungan dalam visualisasi 3D dan orientasi ruang. Lebih cocok untuk peran yang berbasis teks atau komunikasi.",
      medium_score: "Kemampuan spasial dalam kategori menengah. Mampu visualisasi dasar dan orientasi ruang standar. Cocok untuk berbagai peran yang membutuhkan visualisasi sederhana.",
      high_score: "Kemampuan spasial yang sangat baik. Mampu memvisualisasikan objek 3D, memahami hubungan spasial, dan bekerja dengan presisi. Cocok untuk peran seperti architect, designer, pilot, surgeon.",
      job_matches: "Architect, Designer, Pilot, Surgeon, Urban Planner, 3D Artist, CAD Specialist"
    }
  };

  return interpretations[aptitudeType] || interpretations.verbal;
}
