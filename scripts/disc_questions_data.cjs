// DISC Assessment Questions - Classic 24-Question Format
// Each question has 4 statements, one for each DISC dimension (D, I, S, C)
// Users choose MOST (M) and LEAST (L) for each question set

const DISC_QUESTIONS = [
  {
    question_number: 1,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Mudah bergaul, ramah, mudah setuju", category: "I" },
      { text: "Mempercayai, percaya pada orang lain", category: "S" },
      { text: "Petualang, suka mengambil risiko", category: "D" },
      { text: "Penuh toleransi, menghormati orang lain", category: "C" }
    ]
  },
  {
    question_number: 2,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Yang penting adalah hasil", category: "D" },
      { text: "Kerjakan dengan benar, ketepatan sangat penting", category: "C" },
      { text: "Buat agar menyenangkan", category: "I" },
      { text: "Kerjakan bersama-sama", category: "S" }
    ]
  },
  {
    question_number: 3,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Pendidikan, kebudayaan", category: "C" },
      { text: "Prestasi, penghargaan", category: "D" },
      { text: "Keselamatan, keamanan", category: "S" },
      { text: "Sosial, pertemuan kelompok", category: "I" }
    ]
  },
  {
    question_number: 4,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Lembut, tertutup", category: "S" },
      { text: "Visionary / pandangan ke masa depan", category: "D" },
      { text: "Pusat perhatian, suka bersosialisasi", category: "I" },
      { text: "Pendamai, membawa ketenangan", category: "S" }
    ]
  },
  {
    question_number: 5,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menahan diri bisa hidup tanpa memiliki", category: "S" },
      { text: "Membeli karena dorongan hasrat / impulsif", category: "I" },
      { text: "Akan menunggu tanpa tekanan", category: "S" },
      { text: "Akan membeli apa yang diinginkan", category: "D" }
    ]
  },
  {
    question_number: 6,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Mengambil kendali, bersikap langsung (direct)", category: "D" },
      { text: "Suka bergaul, antusias", category: "I" },
      { text: "Mudah ditebak, konsisten", category: "S" },
      { text: "Waspada, berhati-hati", category: "C" }
    ]
  },
  {
    question_number: 7,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menyenangkan orang lain", category: "I" },
      { text: "Berusaha mencapai kesempurnaan", category: "C" },
      { text: "Menjadi bagian dari tim / kelompok", category: "S" },
      { text: "Ingin menetapkan goal / tujuan", category: "D" }
    ]
  },
  {
    question_number: 8,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Bersahabat, mudah bergaul", category: "I" },
      { text: "Unik, bosan pada rutinitas", category: "I" },
      { text: "Aktif melakukan perubahan", category: "D" },
      { text: "Ingin segala sesuatu akurat dan pasti", category: "C" }
    ]
  },
  {
    question_number: 9,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Sulit dikalahkan / ditundukkan", category: "D" },
      { text: "Melaksanakan sesuai perintah", category: "S" },
      { text: "Bersemangat, riang", category: "I" },
      { text: "Ingin keteraturan, rapi", category: "C" }
    ]
  },
  {
    question_number: 10,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menjadi frustrasi", category: "C" },
      { text: "Memendam perasaan dalam hati", category: "S" },
      { text: "Menyampaikan sudut pandang pribadi", category: "I" },
      { text: "Berani menghadapi oposisi", category: "D" }
    ]
  },
  {
    question_number: 11,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Mengalah, tidak suka pertentangan", category: "S" },
      { text: "Penuh dengan hal-hal kecil / detail", category: "C" },
      { text: "Berubah pada menit-menit terakhir", category: "I" },
      { text: "Mendesak / memaksa, agak kasar", category: "D" }
    ]
  },
  {
    question_number: 12,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Saya akan pimpin mereka", category: "D" },
      { text: "Saya akan ikut / mengikuti", category: "S" },
      { text: "Saya akan pengaruhi / bujuk mereka", category: "I" },
      { text: "Saya akan mendapatkan fakta-faktanya", category: "C" }
    ]
  },
  {
    question_number: 13,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Hidup / lincah, banyak bicara", category: "I" },
      { text: "Cepat, penuh keyakinan", category: "D" },
      { text: "Berusaha menjaga keseimbangan", category: "S" },
      { text: "Berusaha patuh pada peraturan", category: "C" }
    ]
  },
  {
    question_number: 14,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Ingin kemajuan / peningkatan", category: "D" },
      { text: "Puas dengan keadaan, tenang / mudah puas", category: "S" },
      { text: "Menunjukkan perasaan dengan terbuka", category: "I" },
      { text: "Rendah hati, sederhana", category: "S" }
    ]
  },
  {
    question_number: 15,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Memikirkan orang lain dahulu", category: "S" },
      { text: "Suka bersaing / kompetitif, suka tantangan", category: "D" },
      { text: "Optimis, berpikir positif", category: "I" },
      { text: "Sistematis, berpikir logis", category: "C" }
    ]
  },
  {
    question_number: 16,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Mengelola waktu dengan efisien", category: "C" },
      { text: "Sering terburu-buru, merasa ditekan", category: "D" },
      { text: "Hal-hal sosial adalah penting", category: "I" },
      { text: "Suka menyelesaikan hal yang sudah dimulai", category: "S" }
    ]
  },
  {
    question_number: 17,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Tenang, pendiam, tertutup", category: "S" },
      { text: "Gembira, bebas, riang", category: "I" },
      { text: "Menyenangkan, baik hati", category: "I" },
      { text: "Menyolok, berani", category: "D" }
    ]
  },
  {
    question_number: 18,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menyenangkan orang lain, ramah, penurut", category: "I" },
      { text: "Tertawa lepas, hidup", category: "I" },
      { text: "Pemberani, tegas", category: "D" },
      { text: "Pendiam, tertutup, tenang", category: "S" }
    ]
  },
  {
    question_number: 19,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menolak perubahan yang mendadak", category: "S" },
      { text: "Cenderung terlalu banyak berjanji", category: "I" },
      { text: "Mundur apabila berada di bawah tekanan", category: "S" },
      { text: "Tidak takut untuk berkelahi / berdebat", category: "D" }
    ]
  },
  {
    question_number: 20,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Menyediakan waktu untuk orang lain", category: "S" },
      { text: "Merencanakan masa depan, bersiap-siap", category: "C" },
      { text: "Menuju petualangan baru", category: "D" },
      { text: "Menerima penghargaan atas pencapaian target", category: "D" }
    ]
  },
  {
    question_number: 21,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Ingin wewenang / kekuasaan lebih", category: "D" },
      { text: "Ingin kesempatan baru", category: "I" },
      { text: "Menghindari perselisihan / konflik apapun", category: "S" },
      { text: "Ingin arahan yang jelas", category: "C" }
    ]
  },
  {
    question_number: 22,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Penyemangat / pendukung yang baik", category: "I" },
      { text: "Pendengar yang baik", category: "S" },
      { text: "Penganalisa yang baik", category: "C" },
      { text: "Pendelegasi yang baik / pandai membagi tugas", category: "D" }
    ]
  },
  {
    question_number: 23,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Peraturan perlu diuji", category: "D" },
      { text: "Peraturan membuat menjadi adil", category: "C" },
      { text: "Peraturan membuat menjadi membosankan", category: "I" },
      { text: "Peraturan membuat menjadi aman", category: "S" }
    ]
  },
  {
    question_number: 24,
    question_text: "Pilih pernyataan yang PALING dan TIDAK menggambarkan diri Anda:",
    question_text_en: "Choose the statement that MOST and LEAST describes you:",
    statements: [
      { text: "Dapat dipercaya dan diandalkan", category: "S" },
      { text: "Kreatif, unik", category: "I" },
      { text: "Berorientasi pada hasil / profit / untung", category: "D" },
      { text: "Memegang teguh standar yang tinggi, akurat", category: "C" }
    ]
  }
];

exports.DISC_QUESTIONS = DISC_QUESTIONS;
