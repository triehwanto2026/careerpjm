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
}

export interface TestResult {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  categories: Record<string, string>;
  status: "passed" | "review" | "failed";
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
    id: genId(),
    name: "Tes Kepribadian DISC",
    nameEn: "DISC Personality Test",
    description: "Mengukur gaya perilaku dominan: Dominance, Influence, Steadiness, Compliance",
    category: "Personality",
    questionCount: 10,
    durationMinutes: 30,
    isActive: true,
  },
  {
    id: genId(),
    name: "Tes Kecerdasan Emosional",
    nameEn: "Emotional Intelligence Test",
    description: "Mengukur kemampuan mengelola emosi diri dan memahami emosi orang lain",
    category: "Emotional",
    questionCount: 15,
    durationMinutes: 25,
    isActive: true,
  },
  {
    id: genId(),
    name: "Tes Gaya Kepemimpinan",
    nameEn: "Leadership Style Test",
    description: "Mengidentifikasi gaya kepemimpinan dominan kandidat",
    category: "Leadership",
    questionCount: 12,
    durationMinutes: 20,
    isActive: false,
  },
];

export const initialCandidates: Candidate[] = [
  {
    id: genId(),
    name: "Ahmad Fauzi",
    email: "ahmad@email.com",
    phone: "081234567890",
    position: "Software Engineer",
    activationCodeId: "",
    status: "pending",
    createdAt: "2024-01-15",
  },
  {
    id: genId(),
    name: "Siti Nurhaliza",
    email: "siti@email.com",
    phone: "081298765432",
    position: "Product Manager",
    activationCodeId: "",
    status: "completed",
    createdAt: "2024-01-10",
  },
  {
    id: genId(),
    name: "Budi Santoso",
    email: "budi@email.com",
    phone: "081211223344",
    position: "UI/UX Designer",
    activationCodeId: "",
    status: "in_progress",
    createdAt: "2024-02-01",
  },
];

export const initialTestResults: TestResult[] = [
  {
    id: genId(),
    candidateId: "",
    candidateName: "Siti Nurhaliza",
    position: "Product Manager",
    completedAt: "2024-01-12",
    score: 85,
    totalQuestions: 10,
    answeredQuestions: 10,
    categories: {
      "Conflict Resolution": "compromising",
      "Work Style": "collaborative",
      "Stress Management": "resilient",
      "Emotional Intelligence": "open",
      "Decision Making": "analytical",
    },
    status: "passed",
  },
  {
    id: genId(),
    candidateId: "",
    candidateName: "Rini Wulandari",
    position: "Data Analyst",
    completedAt: "2024-01-08",
    score: 62,
    totalQuestions: 10,
    answeredQuestions: 8,
    categories: {
      "Conflict Resolution": "avoidant",
      "Work Style": "independent",
      "Stress Management": "adaptive",
    },
    status: "review",
  },
];
