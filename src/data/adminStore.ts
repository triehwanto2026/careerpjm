// Local admin store (will be replaced with database later)

export interface ActivationCode {
  id: string;
  code: string;
  password: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  isUsed: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface TestInstrument {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: string;
  questionCount: number;
  durationMinutes: number;
  isActive: boolean;
  scoringMethod: string;
  targetAudience: string;
  normReference: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  activationCodeId: string;
  status: "pending" | "in_progress" | "completed" | "expired";
  createdAt: string;
  photoUrl?: string;
  birthDate?: string;
  education?: string;
  gender?: string;
}

export interface TestResult {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  testName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  categories: Record<string, number>;
  status: "passed" | "review" | "failed";
  candidateProfile?: {
    email: string;
    phone: string;
    birthDate: string;
    education: string;
    gender: string;
    photoUrl?: string;
  };
  interpretation?: string;
}

// Admin credentials
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

// Generate random ID
const genId = () => Math.random().toString(36).substring(2, 10);

// Initial mock data
export const initialActivationCodes: ActivationCode[] = [
  {
    id: genId(),
    code: "PSY2024",
    password: "recruit123",
    candidateName: "Ahmad Fauzi",
    candidateEmail: "ahmad@email.com",
    position: "Software Engineer",
    isUsed: false,
    createdAt: "2024-01-15",
    expiresAt: "2024-12-31",
  },
  {
    id: genId(),
    code: "PSY2025",
    password: "recruit456",
    candidateName: "Siti Nurhaliza",
    candidateEmail: "siti@email.com",
    position: "Product Manager",
    isUsed: true,
    createdAt: "2024-01-10",
    expiresAt: "2024-06-30",
  },
  {
    id: genId(),
    code: "PSY2026",
    password: "recruit789",
    candidateName: "Budi Santoso",
    candidateEmail: "budi@email.com",
    position: "UI/UX Designer",
    isUsed: false,
    createdAt: "2024-02-01",
    expiresAt: "2024-12-31",
  },
];

export const initialTestInstruments: TestInstrument[] = [
  {
    id: "disc-001",
    name: "Tes DISC",
    nameEn: "DISC Assessment",
    description: "Mengukur 4 dimensi perilaku: Dominance (D), Influence (I), Steadiness (S), Compliance (C). Digunakan untuk memahami gaya kerja dan komunikasi individu.",
    category: "Personality",
    questionCount: 28,
    durationMinutes: 25,
    isActive: true,
    scoringMethod: "Ipsative (forced-choice)",
    targetAudience: "Dewasa (18+ tahun)",
    normReference: "William Moulton Marston (1928)",
  },
  {
    id: "ist-001",
    name: "Intelligenz Struktur Test (IST)",
    nameEn: "Intelligence Structure Test",
    description: "Mengukur struktur inteligensi meliputi verbal, numerik, figuratif, dan memori. Terdiri dari 9 subtes yang mengukur berbagai aspek kognitif.",
    category: "Cognitive",
    questionCount: 176,
    durationMinutes: 90,
    isActive: true,
    scoringMethod: "Norm-referenced (IQ scale)",
    targetAudience: "Dewasa (15+ tahun)",
    normReference: "Rudolf Amthauer (1953)",
  },
  {
    id: "mbti-001",
    name: "Myers-Briggs Type Indicator (MBTI)",
    nameEn: "MBTI Personality Assessment",
    description: "Mengidentifikasi 16 tipe kepribadian berdasarkan 4 dimensi: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving.",
    category: "Personality",
    questionCount: 93,
    durationMinutes: 30,
    isActive: true,
    scoringMethod: "Typological (16 types)",
    targetAudience: "Dewasa (18+ tahun)",
    normReference: "Isabel B. Myers & Katharine C. Briggs",
  },
  {
    id: "papi-001",
    name: "PAPIKOSTIK (PAPI Kostick)",
    nameEn: "PAPI Kostick Inventory",
    description: "Mengukur 20 aspek kepribadian dalam konteks kerja meliputi: need (kebutuhan) dan role (peran). Digunakan untuk asesmen potensi kerja.",
    category: "Work Personality",
    questionCount: 90,
    durationMinutes: 40,
    isActive: true,
    scoringMethod: "Forced-choice (20 scales, 0-9)",
    targetAudience: "Dewasa (18+ tahun)",
    normReference: "Max Kostick (1960s)",
  },
  {
    id: "cfit-001",
    name: "Culture Fair Intelligence Test (CFIT)",
    nameEn: "CFIT Intelligence Test",
    description: "Tes inteligensi non-verbal yang mengukur kemampuan fluid intelligence, bebas dari pengaruh budaya dan bahasa. Terdiri dari 4 subtes.",
    category: "Cognitive",
    questionCount: 50,
    durationMinutes: 30,
    isActive: true,
    scoringMethod: "Norm-referenced (IQ scale)",
    targetAudience: "Dewasa & Remaja (14+ tahun)",
    normReference: "Raymond B. Cattell (1949)",
  },
  {
    id: "kraep-001",
    name: "Tes Kraepelin",
    nameEn: "Kraepelin Test",
    description: "Tes penjumlahan deret angka dengan 50 kolom untuk mengukur kecepatan kerja, ketelitian, ketahanan kerja, dan stabilitas emosi. Hasil berupa grafik kurva kerja.",
    category: "Work Aptitude",
    questionCount: 1350,
    durationMinutes: 30,
    isActive: true,
    scoringMethod: "Performance curve analysis",
    targetAudience: "Dewasa (17+ tahun)",
    normReference: "Emil Kraepelin / Pauli",
  },
  {
    id: "pp-001",
    name: "Personality Plus (4 Temperamen)",
    nameEn: "Personality Plus / Four Temperaments",
    description: "Mengidentifikasi tipe temperamen dominan: Koleris (pemimpin), Sanguinis (penghibur), Melankolis (pemikir), Phlegmatis (pengamat). Berdasarkan teori Hippocrates.",
    category: "Personality",
    questionCount: 40,
    durationMinutes: 20,
    isActive: true,
    scoringMethod: "Percentage per temperament",
    targetAudience: "Dewasa & Remaja (15+ tahun)",
    normReference: "Florence Littauer / Hippocrates",
  },
];

export const initialCandidates: Candidate[] = [
  {
    id: "cand-001",
    name: "Ahmad Fauzi",
    email: "ahmad@email.com",
    phone: "081234567890",
    position: "Software Engineer",
    activationCodeId: "",
    status: "pending",
    createdAt: "2024-01-15",
    birthDate: "1995-03-12",
    education: "S1 Teknik Informatika",
    gender: "Laki-laki",
  },
  {
    id: "cand-002",
    name: "Siti Nurhaliza",
    email: "siti@email.com",
    phone: "081298765432",
    position: "Product Manager",
    activationCodeId: "",
    status: "completed",
    createdAt: "2024-01-10",
    birthDate: "1993-07-25",
    education: "S2 Manajemen",
    gender: "Perempuan",
  },
  {
    id: "cand-003",
    name: "Budi Santoso",
    email: "budi@email.com",
    phone: "081211223344",
    position: "UI/UX Designer",
    activationCodeId: "",
    status: "in_progress",
    createdAt: "2024-02-01",
    birthDate: "1998-11-05",
    education: "S1 Desain Komunikasi Visual",
    gender: "Laki-laki",
  },
];

export const initialTestResults: TestResult[] = [
  {
    id: "res-001",
    candidateId: "cand-002",
    candidateName: "Siti Nurhaliza",
    position: "Product Manager",
    testName: "DISC",
    completedAt: "2024-01-12",
    score: 85,
    totalQuestions: 28,
    answeredQuestions: 28,
    categories: {
      "Dominance": 72,
      "Influence": 88,
      "Steadiness": 55,
      "Compliance": 65,
    },
    status: "passed",
    candidateProfile: {
      email: "siti@email.com",
      phone: "081298765432",
      birthDate: "1993-07-25",
      education: "S2 Manajemen",
      gender: "Perempuan",
    },
    interpretation: "Tipe kepribadian dominan: High I (Influence). Memiliki kemampuan komunikasi dan persuasi yang kuat. Cocok untuk posisi yang membutuhkan interaksi sosial tinggi dan kemampuan memimpin tim.",
  },
  {
    id: "res-002",
    candidateId: "cand-003",
    candidateName: "Budi Santoso",
    position: "UI/UX Designer",
    testName: "MBTI",
    completedAt: "2024-01-15",
    score: 78,
    totalQuestions: 93,
    answeredQuestions: 93,
    categories: {
      "Extraversion": 35,
      "Introversion": 65,
      "Sensing": 40,
      "Intuition": 60,
      "Thinking": 45,
      "Feeling": 55,
      "Judging": 30,
      "Perceiving": 70,
    },
    status: "passed",
    candidateProfile: {
      email: "budi@email.com",
      phone: "081211223344",
      birthDate: "1998-11-05",
      education: "S1 Desain Komunikasi Visual",
      gender: "Laki-laki",
    },
    interpretation: "Tipe MBTI: INFP (Mediator). Kreatif, idealis, dan memiliki nilai-nilai yang kuat. Sangat cocok untuk pekerjaan kreatif yang memerlukan pemahaman mendalam terhadap pengguna.",
  },
  {
    id: "res-003",
    candidateId: "cand-002",
    candidateName: "Siti Nurhaliza",
    position: "Product Manager",
    testName: "PAPIKOSTIK",
    completedAt: "2024-01-14",
    score: 82,
    totalQuestions: 90,
    answeredQuestions: 90,
    categories: {
      "G (Hard Worker)": 7,
      "L (Leadership)": 8,
      "I (Ease in Decision)": 6,
      "T (Pace)": 7,
      "V (Vigor)": 8,
      "S (Social Extension)": 9,
      "R (Theoretical)": 5,
      "D (Interest in Detail)": 4,
      "C (Organized)": 6,
      "N (Need to Finish)": 7,
      "A (Need Achievement)": 8,
      "P (Need Closeness)": 6,
      "X (Need Attention)": 7,
      "B (Need Belonging)": 5,
      "O (Need Rules)": 4,
      "Z (Need Change)": 6,
      "K (Need Control)": 7,
      "F (Need Support)": 3,
      "W (Need Stability)": 5,
      "E (Emotional Control)": 6,
    },
    status: "passed",
    candidateProfile: {
      email: "siti@email.com",
      phone: "081298765432",
      birthDate: "1993-07-25",
      education: "S2 Manajemen",
      gender: "Perempuan",
    },
    interpretation: "Profil PAPI menunjukkan motivasi tinggi dalam aspek Leadership (L=8), Social Extension (S=9), dan Achievement (A=8). Kandidat memiliki potensi besar sebagai pemimpin tim yang dinamis.",
  },
  {
    id: "res-004",
    candidateId: "cand-001",
    candidateName: "Ahmad Fauzi",
    position: "Software Engineer",
    testName: "Personality Plus",
    completedAt: "2024-01-20",
    score: 75,
    totalQuestions: 40,
    answeredQuestions: 40,
    categories: {
      "Koleris": 30,
      "Sanguinis": 15,
      "Melankolis": 45,
      "Phlegmatis": 10,
    },
    status: "passed",
    candidateProfile: {
      email: "ahmad@email.com",
      phone: "081234567890",
      birthDate: "1995-03-12",
      education: "S1 Teknik Informatika",
      gender: "Laki-laki",
    },
    interpretation: "Tipe temperamen dominan: Melankolis (45%). Memiliki ketelitian tinggi, analitis, dan perfeksionis. Sangat cocok untuk pekerjaan yang membutuhkan akurasi dan detail seperti programming.",
  },
  {
    id: "res-005",
    candidateId: "cand-001",
    candidateName: "Ahmad Fauzi",
    position: "Software Engineer",
    testName: "Kraepelin",
    completedAt: "2024-01-22",
    score: 70,
    totalQuestions: 45,
    answeredQuestions: 45,
    categories: {
      "Kecepatan Kerja": 75,
      "Ketelitian": 82,
      "Ketahanan Kerja": 68,
      "Stabilitas Emosi": 72,
      "Konsistensi": 65,
    },
    status: "review",
    candidateProfile: {
      email: "ahmad@email.com",
      phone: "081234567890",
      birthDate: "1995-03-12",
      education: "S1 Teknik Informatika",
      gender: "Laki-laki",
    },
    interpretation: "Ketelitian tinggi (82%), kecepatan kerja baik (75%). Ketahanan kerja perlu ditingkatkan (68%). Secara keseluruhan menunjukkan potensi yang baik untuk pekerjaan yang membutuhkan konsentrasi tinggi.",
  },
];
