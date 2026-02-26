export interface Question {
  id: number;
  textId: string;
  textEn: string;
  options: {
    id: string;
    label: string;
    labelEn: string;
    value: string;
  }[];
  category: string;
}

export const psychologyQuestions: Question[] = [
  {
    id: 1,
    textId: "Ketika menghadapi konflik di tempat kerja, saya cenderung...",
    textEn: "When facing conflict at work, I tend to...",
    options: [
      { id: "1a", label: "Menghindari konfrontasi", labelEn: "Avoid confrontation", value: "avoidant" },
      { id: "1b", label: "Mencari solusi kompromi", labelEn: "Seek a compromise", value: "compromising" },
      { id: "1c", label: "Mempertahankan posisi saya", labelEn: "Stand my ground", value: "assertive" },
      { id: "1d", label: "Meminta bantuan mediator", labelEn: "Ask for mediation", value: "collaborative" },
    ],
    category: "Conflict Resolution",
  },
  {
    id: 2,
    textId: "Saya merasa paling produktif ketika...",
    textEn: "I feel most productive when...",
    options: [
      { id: "2a", label: "Bekerja sendiri tanpa gangguan", labelEn: "Working alone without interruption", value: "independent" },
      { id: "2b", label: "Berkolaborasi dalam tim kecil", labelEn: "Collaborating in a small team", value: "collaborative" },
      { id: "2c", label: "Memimpin proyek besar", labelEn: "Leading a big project", value: "leadership" },
      { id: "2d", label: "Mengikuti instruksi yang jelas", labelEn: "Following clear instructions", value: "structured" },
    ],
    category: "Work Style",
  },
  {
    id: 3,
    textId: "Dalam situasi yang penuh tekanan, saya biasanya...",
    textEn: "In high-pressure situations, I usually...",
    options: [
      { id: "3a", label: "Tetap tenang dan fokus", labelEn: "Stay calm and focused", value: "resilient" },
      { id: "3b", label: "Merasa cemas tapi tetap berusaha", labelEn: "Feel anxious but keep trying", value: "adaptive" },
      { id: "3c", label: "Mencari dukungan dari orang lain", labelEn: "Seek support from others", value: "social" },
      { id: "3d", label: "Mengambil waktu istirahat sejenak", labelEn: "Take a short break", value: "self-aware" },
    ],
    category: "Stress Management",
  },
  {
    id: 4,
    textId: "Ketika menerima kritik, reaksi pertama saya adalah...",
    textEn: "When receiving criticism, my first reaction is...",
    options: [
      { id: "4a", label: "Menerima dan mengevaluasi diri", labelEn: "Accept and self-evaluate", value: "open" },
      { id: "4b", label: "Merasa tersinggung sesaat", labelEn: "Feel briefly offended", value: "emotional" },
      { id: "4c", label: "Meminta penjelasan lebih lanjut", labelEn: "Ask for further explanation", value: "analytical" },
      { id: "4d", label: "Mengabaikannya", labelEn: "Ignore it", value: "dismissive" },
    ],
    category: "Emotional Intelligence",
  },
  {
    id: 5,
    textId: "Saya lebih suka membuat keputusan berdasarkan...",
    textEn: "I prefer making decisions based on...",
    options: [
      { id: "5a", label: "Data dan fakta", labelEn: "Data and facts", value: "analytical" },
      { id: "5b", label: "Intuisi dan pengalaman", labelEn: "Intuition and experience", value: "intuitive" },
      { id: "5c", label: "Konsensus kelompok", labelEn: "Group consensus", value: "democratic" },
      { id: "5d", label: "Prinsip dan nilai pribadi", labelEn: "Personal principles and values", value: "principled" },
    ],
    category: "Decision Making",
  },
  {
    id: 6,
    textId: "Cara saya mengelola waktu adalah...",
    textEn: "My approach to time management is...",
    options: [
      { id: "6a", label: "Membuat jadwal terperinci", labelEn: "Create detailed schedules", value: "organized" },
      { id: "6b", label: "Fleksibel dan spontan", labelEn: "Flexible and spontaneous", value: "flexible" },
      { id: "6c", label: "Prioritas berdasarkan urgensi", labelEn: "Prioritize by urgency", value: "pragmatic" },
      { id: "6d", label: "Mendelegasikan tugas", labelEn: "Delegate tasks", value: "delegator" },
    ],
    category: "Time Management",
  },
  {
    id: 7,
    textId: "Dalam sebuah tim, peran yang paling cocok untuk saya adalah...",
    textEn: "In a team, the role that suits me best is...",
    options: [
      { id: "7a", label: "Pemimpin yang mengarahkan", labelEn: "A directing leader", value: "leader" },
      { id: "7b", label: "Kreator ide-ide baru", labelEn: "Creator of new ideas", value: "innovator" },
      { id: "7c", label: "Pelaksana yang handal", labelEn: "Reliable executor", value: "implementer" },
      { id: "7d", label: "Penengah dan penyatu", labelEn: "Mediator and unifier", value: "harmonizer" },
    ],
    category: "Team Role",
  },
  {
    id: 8,
    textId: "Ketika menghadapi perubahan mendadak, saya...",
    textEn: "When facing sudden changes, I...",
    options: [
      { id: "8a", label: "Cepat beradaptasi", labelEn: "Adapt quickly", value: "adaptable" },
      { id: "8b", label: "Butuh waktu untuk menyesuaikan", labelEn: "Need time to adjust", value: "cautious" },
      { id: "8c", label: "Mencari peluang dari perubahan", labelEn: "Look for opportunities", value: "opportunistic" },
      { id: "8d", label: "Merasa tidak nyaman", labelEn: "Feel uncomfortable", value: "resistant" },
    ],
    category: "Adaptability",
  },
  {
    id: 9,
    textId: "Motivasi utama saya dalam bekerja adalah...",
    textEn: "My main motivation at work is...",
    options: [
      { id: "9a", label: "Pencapaian dan prestasi", labelEn: "Achievement and accomplishment", value: "achievement" },
      { id: "9b", label: "Hubungan dan kerja sama", labelEn: "Relationships and cooperation", value: "affiliation" },
      { id: "9c", label: "Pengakuan dan penghargaan", labelEn: "Recognition and appreciation", value: "recognition" },
      { id: "9d", label: "Keamanan dan stabilitas", labelEn: "Security and stability", value: "security" },
    ],
    category: "Motivation",
  },
  {
    id: 10,
    textId: "Ketika menyelesaikan masalah kompleks, pendekatan saya adalah...",
    textEn: "When solving complex problems, my approach is...",
    options: [
      { id: "10a", label: "Menganalisis secara sistematis", labelEn: "Analyze systematically", value: "systematic" },
      { id: "10b", label: "Brainstorming berbagai solusi", labelEn: "Brainstorm various solutions", value: "creative" },
      { id: "10c", label: "Berkonsultasi dengan ahli", labelEn: "Consult with experts", value: "consultative" },
      { id: "10d", label: "Mencoba trial and error", labelEn: "Try trial and error", value: "experimental" },
    ],
    category: "Problem Solving",
  },
];

export const TEST_DURATION_MINUTES = 30;
export const VALID_CREDENTIALS = {
  activationCode: "PSY2024",
  password: "recruit123",
};
