const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

const IST_ID = '9dccb6bc-cb33-42e8-b432-8af156ad6d5c';

// Define all IST questions
const istQuestions = {
  // SE - Sentence Completion (Questions 1-20)
  SE: [
    {
      question_number: 1,
      question_text: "Pengaruh seseorang terhadap orang lain seharusnya bergantung pada …..",
      options: [
        { label: "a", text: "kekuasaan" },
        { label: "b", text: "bujukan" },
        { label: "c", text: "kekayaan" },
        { label: "d", text: "keberanian" },
        { label: "e", text: "kewibawaan" }
      ],
      correct: "e"
    },
    {
      question_number: 2,
      question_text: "Lawannya \"hemat\" ialah ……………",
      options: [
        { label: "a", text: "murah" },
        { label: "b", text: "kikir" },
        { label: "c", text: "boros" },
        { label: "d", text: "bernilai" },
        { label: "e", text: "kaya" }
      ],
      correct: "c"
    },
    {
      question_number: 3,
      question_text: "………. tidak termasuk cuaca",
      options: [
        { label: "a", text: "angin puyuh" },
        { label: "b", text: "halilintar" },
        { label: "c", text: "salju" },
        { label: "d", text: "gempa bumi" },
        { label: "e", text: "kabut" }
      ],
      correct: "d"
    },
    {
      question_number: 4,
      question_text: "Lawannya \"setia\" ialah ……………",
      options: [
        { label: "a", text: "cinta" },
        { label: "b", text: "benci" },
        { label: "c", text: "persahabatan" },
        { label: "d", text: "khianat" },
        { label: "e", text: "permusuhan" }
      ],
      correct: "d"
    },
    {
      question_number: 5,
      question_text: "Seekor kuda selalu mempunyai ……………",
      options: [
        { label: "a", text: "kandang" },
        { label: "b", text: "ladam" },
        { label: "c", text: "pelana" },
        { label: "d", text: "kuku" },
        { label: "e", text: "surai" }
      ],
      correct: "b"
    },
    {
      question_number: 6,
      question_text: "Seorang paman …………… lebih tua dari kemenakannya.",
      options: [
        { label: "a", text: "jarang" },
        { label: "b", text: "biasanya" },
        { label: "c", text: "selalu" },
        { label: "d", text: "tidak pernah" },
        { label: "e", text: "kadang-kadang" }
      ],
      correct: "b"
    },
    {
      question_number: 7,
      question_text: "Pada jumlah yang sama, nilai kalori yang tertinggi terdapat pada ……………",
      options: [
        { label: "a", text: "ikan" },
        { label: "b", text: "daging" },
        { label: "c", text: "lemak" },
        { label: "d", text: "tahu" },
        { label: "e", text: "sayuran" }
      ],
      correct: "c"
    },
    {
      question_number: 8,
      question_text: "Pada suatu pertandingan selalu terdapat ……………",
      options: [
        { label: "a", text: "lawan" },
        { label: "b", text: "wasit" },
        { label: "c", text: "penonton" },
        { label: "d", text: "sorak" },
        { label: "e", text: "kemenangan" }
      ],
      correct: "a"
    },
    {
      question_number: 9,
      question_text: "Suatu pernyataan yang belum dipastikan dikatakan sebagai pernyataan yang …..",
      options: [
        { label: "a", text: "paradoks" },
        { label: "b", text: "tergesa-gesa" },
        { label: "c", text: "mempunyai arti rangkap" },
        { label: "d", text: "menyesatkan" },
        { label: "e", text: "hipotesis" }
      ],
      correct: "e"
    },
    {
      question_number: 10,
      question_text: "Pada sepatu selalu terdapat ……………",
      options: [
        { label: "a", text: "kulit" },
        { label: "b", text: "sol" },
        { label: "c", text: "tali sepatu" },
        { label: "d", text: "gesper" },
        { label: "e", text: "lidah" }
      ],
      correct: "b"
    },
    {
      question_number: 11,
      question_text: "Suatu …………… tidak menyangkut persoalan pencegahan kecelakaan.",
      options: [
        { label: "a", text: "lampu lalu lintas" },
        { label: "b", text: "kacamata pelindung" },
        { label: "c", text: "kotak PPPK" },
        { label: "d", text: "tanda peringatan" },
        { label: "e", text: "palang kereta api" }
      ],
      correct: "c"
    },
    {
      question_number: 12,
      question_text: "Mata uang logam Rp 50,- tahun 1991, garis tengahnya ialah …………… mm.",
      options: [
        { label: "a", text: "17" },
        { label: "b", text: "29" },
        { label: "c", text: "25" },
        { label: "d", text: "20" },
        { label: "e", text: "15" }
      ],
      correct: "b"
    },
    {
      question_number: 13,
      question_text: "Seseorang yang bersikap menyangsikan setiap kemajuan ialah seorang yang …..",
      options: [
        { label: "a", text: "demokratis" },
        { label: "b", text: "radikal" },
        { label: "c", text: "liberal" },
        { label: "d", text: "konservatif" },
        { label: "e", text: "anarkis" }
      ],
      correct: "d"
    },
    {
      question_number: 14,
      question_text: "Lawannya \"tidak pernah\" ialah ……………",
      options: [
        { label: "a", text: "sering" },
        { label: "b", text: "kadang-kadang" },
        { label: "c", text: "jarang" },
        { label: "d", text: "kerap kali" },
        { label: "e", text: "selalu" }
      ],
      correct: "e"
    },
    {
      question_number: 15,
      question_text: "Jarak antara Jakarta – Surabaya kira-kira …………… Km",
      options: [
        { label: "a", text: "650" },
        { label: "b", text: "1000" },
        { label: "c", text: "800" },
        { label: "d", text: "600" },
        { label: "e", text: "950" }
      ],
      correct: "c"
    },
    {
      question_number: 16,
      question_text: "Untuk dapat membuat nada yang rendah dan mendalam, kita memerlukan banyak ….",
      options: [
        { label: "a", text: "kekuatan" },
        { label: "b", text: "peranan" },
        { label: "c", text: "ayunan" },
        { label: "d", text: "berat" },
        { label: "e", text: "suara" }
      ],
      correct: "d"
    },
    {
      question_number: 17,
      question_text: "Ayah …………… lebih berpengalaman dari pada anaknya",
      options: [
        { label: "a", text: "selalu" },
        { label: "b", text: "biasanya" },
        { label: "c", text: "jauh" },
        { label: "d", text: "jarang" },
        { label: "e", text: "pada dasarnya" }
      ],
      correct: "b"
    },
    {
      question_number: 18,
      question_text: "Diantara kota-kota berikut ini, maka kota ….. letaknya paling selatan.",
      options: [
        { label: "a", text: "Jakarta" },
        { label: "b", text: "Bandung" },
        { label: "c", text: "Cirebon" },
        { label: "d", text: "Semarang" },
        { label: "e", text: "Surabaya" }
      ],
      correct: "e"
    },
    {
      question_number: 19,
      question_text: "Jika kita mengetahui jumlah presentase nomor-nomor lotere yang tidak menang, maka kita dapat menghitung …..",
      options: [
        { label: "a", text: "jumlah nomor yang menang" },
        { label: "b", text: "pajak lotere" },
        { label: "c", text: "kemungkinan menang" },
        { label: "d", text: "jumlah pengikut" },
        { label: "e", text: "tinggi keuntungan" }
      ],
      correct: "a"
    },
    {
      question_number: 20,
      question_text: "Seorang anak yang berumur 10 tahun tingginya rata-rata …………… cm",
      options: [
        { label: "a", text: "150" },
        { label: "b", text: "130" },
        { label: "c", text: "110" },
        { label: "d", text: "105" },
        { label: "e", text: "115" }
      ],
      correct: "b"
    }
  ],
  
  // WA - Word Association (Questions 21-40)
  WA: [
    {
      question_number: 21,
      question_text: "a) lingkungan b) panah c) elips d) busur e) lengkungan",
      options: [
        { label: "a", text: "lingkungan" },
        { label: "b", text: "panah" },
        { label: "c", text: "elips" },
        { label: "d", text: "busur" },
        { label: "e", text: "lengkungan" }
      ],
      correct: "b" // panah is the odd one out (others are curves)
    },
    {
      question_number: 22,
      question_text: "a) mengetuk b) memaki c) menjahit d) menggergaji e) memukul",
      options: [
        { label: "a", text: "mengetuk" },
        { label: "b", text: "memaki" },
        { label: "c", text: "menjahit" },
        { label: "d", text: "menggergaji" },
        { label: "e", text: "memukul" }
      ],
      correct: "b" // memaki is verbal, others are physical actions
    },
    {
      question_number: 23,
      question_text: "a) lebar b) keliling c) luas d) isi e) panjang",
      options: [
        { label: "a", text: "lebar" },
        { label: "b", text: "keliling" },
        { label: "c", text: "luas" },
        { label: "d", text: "isi" },
        { label: "e", text: "panjang" }
      ],
      correct: "d" // isi is 3D, others are 2D measurements
    },
    {
      question_number: 24,
      question_text: "a) mengikat b) menyatukan c) melepaskan d) mengaitkan e) melekatkan",
      options: [
        { label: "a", text: "mengikat" },
        { label: "b", text: "menyatukan" },
        { label: "c", text: "melepaskan" },
        { label: "d", text: "mengaitkan" },
        { label: "e", text: "melekatkan" }
      ],
      correct: "c" // melepaskan is opposite (separating), others are joining
    },
    {
      question_number: 25,
      question_text: "a) arah b) timur c) perjalanan d) tujuan e) selatan",
      options: [
        { label: "a", text: "arah" },
        { label: "b", text: "timur" },
        { label: "c", text: "perjalanan" },
        { label: "d", text: "tujuan" },
        { label: "e", text: "selatan" }
      ],
      correct: "c" // perjalanan is process, others are static directions
    },
    {
      question_number: 26,
      question_text: "a) jarak b) perpisahan c) tugas d) batas e) perceraian",
      options: [
        { label: "a", text: "jarak" },
        { label: "b", text: "perpisahan" },
        { label: "c", text: "tugas" },
        { label: "d", text: "batas" },
        { label: "e", text: "perceraian" }
      ],
      correct: "c" // tugas is not about separation
    },
    {
      question_number: 27,
      question_text: "a) saringan b) kelambu c) payung d) tapisan e) jala",
      options: [
        { label: "a", text: "saringan" },
        { label: "b", text: "kelambu" },
        { label: "c", text: "payung" },
        { label: "d", text: "tapisan" },
        { label: "e", text: "jala" }
      ],
      correct: "c" // payung is for protection from rain, others are for filtering
    },
    {
      question_number: 28,
      question_text: "a) putih b) pucat c) buram d) kasar e) berkilauan",
      options: [
        { label: "a", text: "putih" },
        { label: "b", text: "pucat" },
        { label: "c", text: "buram" },
        { label: "d", text: "kasar" },
        { label: "e", text: "berkilauan" }
      ],
      correct: "d" // kasar is texture, others are colors/shades
    },
    {
      question_number: 29,
      question_text: "a) otobis b) pesawat terbang c) sepeda motor d) sepeda e) kapal api",
      options: [
        { label: "a", text: "otobis" },
        { label: "b", text: "pesawat terbang" },
        { label: "c", text: "sepeda motor" },
        { label: "d", text: "sepeda" },
        { label: "e", text: "kapal api" }
      ],
      correct: "b" // pesawat terbang flies, others are ground/water vehicles
    },
    {
      question_number: 30,
      question_text: "a) biola b) seruling c) klarinet d) terompet e) saxophon",
      options: [
        { label: "a", text: "biola" },
        { label: "b", text: "seruling" },
        { label: "c", text: "klarinet" },
        { label: "d", text: "terompet" },
        { label: "e", text: "saxophon" }
      ],
      correct: "a" // biola is string instrument, others are wind instruments
    },
    {
      question_number: 31,
      question_text: "a) bergelombang b) kasar c) berduri d) licin e) lurus",
      options: [
        { label: "a", text: "bergelombang" },
        { label: "b", text: "kasar" },
        { label: "c", text: "berduri" },
        { label: "d", text: "licin" },
        { label: "e", text: "lurus" }
      ],
      correct: "c" // berduri has sharp points, others are surface textures
    },
    {
      question_number: 32,
      question_text: "a) jam b) kompas c) penunjuk jalan d) bintang pari e) arah",
      options: [
        { label: "a", text: "jam" },
        { label: "b", text: "kompas" },
        { label: "c", text: "penunjuk jalan" },
        { label: "d", text: "bintang pari" },
        { label: "e", text: "arah" }
      ],
      correct: "a" // jam tells time, others show direction
    },
    {
      question_number: 33,
      question_text: "a) kebijaksanaan b) pendidikan c) perencanaan d) penempatan e) pengerahan",
      options: [
        { label: "a", text: "kebijaksanaan" },
        { label: "b", text: "pendidikan" },
        { label: "c", text: "perencanaan" },
        { label: "d", text: "penempatan" },
        { label: "e", text: "pengerahan" }
      ],
      correct: "a" // kebijaksanaan is wisdom, others are management functions
    },
    {
      question_number: 34,
      question_text: "a) bermotor b) berjalan c) berlayar d) bersepeda e) berkuda",
      options: [
        { label: "a", text: "bermotor" },
        { label: "b", text: "berjalan" },
        { label: "c", text: "berlayar" },
        { label: "d", text: "bersepeda" },
        { label: "e", text: "berkuda" }
      ],
      correct: "b" // berjalan is without vehicle, others use vehicles
    },
    {
      question_number: 35,
      question_text: "a) gambar b) lukisan c) potret d) patung e) ukiran",
      options: [
        { label: "a", text: "gambar" },
        { label: "b", text: "lukisan" },
        { label: "c", text: "potret" },
        { label: "d", text: "patung" },
        { label: "e", text: "ukiran" }
      ],
      correct: "d" // patung is 3D, others are 2D art
    },
    {
      question_number: 36,
      question_text: "a) panjang b) lonjong c) runcing d) bulat e) bersudut",
      options: [
        { label: "a", text: "panjang" },
        { label: "b", text: "lonjong" },
        { label: "c", text: "runcing" },
        { label: "d", text: "bulat" },
        { label: "e", text: "bersudut" }
      ],
      correct: "a" // panjang is measurement, others are shapes
    },
    {
      question_number: 37,
      question_text: "a) kunci b) palang pintu c) gerendel d) gunting e) obeng",
      options: [
        { label: "a", text: "kunci" },
        { label: "b", text: "palang pintu" },
        { label: "c", text: "gerendel" },
        { label: "d", text: "gunting" },
        { label: "e", text: "obeng" }
      ],
      correct: "d" // gunting is cutting tool, others are for locking/unlocking
    },
    {
      question_number: 38,
      question_text: "a) jembatan b) batas c) perkawinan d) pagar e) masyarakat",
      options: [
        { label: "a", text: "jembatan" },
        { label: "b", text: "batas" },
        { label: "c", text: "perkawinan" },
        { label: "d", text: "pagar" },
        { label: "e", text: "masyarakat" }
      ],
      correct: "c" // perkawinan is union of people, others are physical barriers
    },
    {
      question_number: 39,
      question_text: "a) mengetam b) menasehati c) mengasah d) melicinkan e) menggosok",
      options: [
        { label: "a", text: "mengetam" },
        { label: "b", text: "menasehati" },
        { label: "c", text: "mengasah" },
        { label: "d", text: "melicinkan" },
        { label: "e", text: "menggosok" }
      ],
      correct: "b" // menasehati is verbal, others are physical actions
    },
    {
      question_number: 40,
      question_text: "a) batu b) baja c) bulu d) karet e) kayu",
      options: [
        { label: "a", text: "batu" },
        { label: "b", text: "baja" },
        { label: "c", text: "bulu" },
        { label: "d", text: "karet" },
        { label: "e", text: "kayu" }
      ],
      correct: "c" // bulu is organic/soft, others are hard materials
    }
  ],
  
  // AN - Analogy (Questions 41-60)
  AN: [
    {
      question_number: 41,
      question_text: "Menemukan : menghilangkan = Mengingat : ?",
      options: [
        { label: "a", text: "menghapal" },
        { label: "b", text: "mengenai" },
        { label: "c", text: "melupakan" },
        { label: "d", text: "berpikir" },
        { label: "e", text: "memimpikan" }
      ],
      correct: "c"
    },
    {
      question_number: 42,
      question_text: "Bunga : jambangan = Burung : ?",
      options: [
        { label: "a", text: "sarang" },
        { label: "b", text: "langit" },
        { label: "c", text: "pagar" },
        { label: "d", text: "pohon" },
        { label: "e", text: "sangkar" }
      ],
      correct: "e"
    },
    {
      question_number: 43,
      question_text: "Kereta api : rel = Otobis : ?",
      options: [
        { label: "a", text: "roda" },
        { label: "b", text: "poros" },
        { label: "c", text: "ban" },
        { label: "d", text: "jalan raya" },
        { label: "e", text: "kecepatan" }
      ],
      correct: "d"
    },
    {
      question_number: 44,
      question_text: "Perak : emas = Cincin : ?",
      options: [
        { label: "a", text: "arloji" },
        { label: "b", text: "berlian" },
        { label: "c", text: "permata" },
        { label: "d", text: "gelang" },
        { label: "e", text: "platina" }
      ],
      correct: "b"
    },
    {
      question_number: 45,
      question_text: "Lingkaran : bola = Bujur sangkar : ?",
      options: [
        { label: "a", text: "bentuk" },
        { label: "b", text: "gambar" },
        { label: "c", text: "segi empat" },
        { label: "d", text: "kubus" },
        { label: "e", text: "piramida" }
      ],
      correct: "d"
    },
    {
      question_number: 46,
      question_text: "Saran : kepustakaan = Merundingkan : ?",
      options: [
        { label: "a", text: "menawarkan" },
        { label: "b", text: "menentukan" },
        { label: "c", text: "menilai" },
        { label: "d", text: "menimbang" },
        { label: "e", text: "merenungkan" }
      ],
      correct: "d"
    },
    {
      question_number: 47,
      question_text: "Lidah : asam = Hidung : ?",
      options: [
        { label: "a", text: "mencium" },
        { label: "b", text: "bernapas" },
        { label: "c", text: "mengecap" },
        { label: "d", text: "tengik" },
        { label: "e", text: "asin" }
      ],
      correct: "a"
    },
    {
      question_number: 48,
      question_text: "Darah : pembuluh = Air : ?",
      options: [
        { label: "a", text: "pintu air" },
        { label: "b", text: "sungai" },
        { label: "c", text: "talang" },
        { label: "d", text: "hujan" },
        { label: "e", text: "ember" }
      ],
      correct: "b"
    },
    {
      question_number: 49,
      question_text: "Saraf : penyalur = Pupil : ?",
      options: [
        { label: "a", text: "penyinaran" },
        { label: "b", text: "mata" },
        { label: "c", text: "melihat" },
        { label: "d", text: "cahaya" },
        { label: "e", text: "pelindung" }
      ],
      correct: "d"
    },
    {
      question_number: 50,
      question_text: "Pengantar surat : pengantar telegram = Pandai besi : ?",
      options: [
        { label: "a", text: "palu godam" },
        { label: "b", text: "pedagang besi" },
        { label: "c", text: "api" },
        { label: "d", text: "tukang emas" },
        { label: "e", text: "besi tempa" }
      ],
      correct: "d"
    },
    {
      question_number: 51,
      question_text: "Buta : warna = Tuli : ?",
      options: [
        { label: "a", text: "pendengaran" },
        { label: "b", text: "mendengar" },
        { label: "c", text: "nada" },
        { label: "d", text: "kata" },
        { label: "e", text: "telinga" }
      ],
      correct: "e"
    },
    {
      question_number: 52,
      question_text: "Makanan : bumbu = Ceramah : ?",
      options: [
        { label: "a", text: "penghinaan" },
        { label: "b", text: "pidato" },
        { label: "c", text: "kelakar" },
        { label: "d", text: "kesan" },
        { label: "e", text: "ayat" }
      ],
      correct: "e"
    },
    {
      question_number: 53,
      question_text: "Marah : emosi = Duka cita : ?",
      options: [
        { label: "a", text: "suka cita" },
        { label: "b", text: "sakit hati" },
        { label: "c", text: "suasana hati" },
        { label: "d", text: "sedih" },
        { label: "e", text: "rindu" }
      ],
      correct: "d"
    },
    {
      question_number: 54,
      question_text: "Mantel : jubah = wool : ?",
      options: [
        { label: "a", text: "bahan sandang" },
        { label: "b", text: "domba" },
        { label: "c", text: "sutra" },
        { label: "d", text: "jas" },
        { label: "e", text: "tekstil" }
      ],
      correct: "c"
    },
    {
      question_number: 55,
      question_text: "Ketinggian puncak : tekanan udara = ketinggian nada : ?",
      options: [
        { label: "a", text: "garpu tala" },
        { label: "b", text: "sopran" },
        { label: "c", text: "nyanyian" },
        { label: "d", text: "panjang senar" },
        { label: "e", text: "suara" }
      ],
      correct: "e"
    },
    {
      question_number: 56,
      question_text: "Negara : revolusi = Hidup : ?",
      options: [
        { label: "a", text: "biologi" },
        { label: "b", text: "keturunan" },
        { label: "c", text: "mutasi" },
        { label: "d", text: "seleksi" },
        { label: "e", text: "ilmu hewan" }
      ],
      correct: "c"
    },
    {
      question_number: 57,
      question_text: "Kekurangan : penemuan = Panas : ?",
      options: [
        { label: "a", text: "haus" },
        { label: "b", text: "khatulistiwa" },
        { label: "c", text: "es" },
        { label: "d", text: "matahari" },
        { label: "e", text: "dingin" }
      ],
      correct: "e"
    },
    {
      question_number: 58,
      question_text: "Kayu : diketam = Besi : ?",
      options: [
        { label: "a", text: "dipalu" },
        { label: "b", text: "digergaji" },
        { label: "c", text: "dituang" },
        { label: "d", text: "dikikir" },
        { label: "e", text: "ditempa" }
      ],
      correct: "e"
    },
    {
      question_number: 59,
      question_text: "Olahragawan : lembing = Cendekiawan : ?",
      options: [
        { label: "a", text: "perpustakaan" },
        { label: "b", text: "penelitian" },
        { label: "c", text: "karya" },
        { label: "d", text: "studi" },
        { label: "e", text: "mikroskop" }
      ],
      correct: "c"
    },
    {
      question_number: 60,
      question_text: "Keledai : kuda pacuan = Pembakaran : ?",
      options: [
        { label: "a", text: "pemadam api" },
        { label: "b", text: "obor" },
        { label: "c", text: "letupan" },
        { label: "d", text: "korek api" },
        { label: "e", text: "lautan api" }
      ],
      correct: "a"
    }
  ],
  
  // GE - Generalization (Questions 61-76) - These are open-ended, need typed answers
  GE: [
    { question_number: 61, question_text: "mawar – melati", answer: "Bunga" },
    { question_number: 62, question_text: "mata – telinga", answer: "Indera / Alat Indra" },
    { question_number: 63, question_text: "gula – intan", answer: "Kristal" },
    { question_number: 64, question_text: "hujan – salju", answer: "Presipitasi / Jenis Cuaca" },
    { question_number: 65, question_text: "pengantar surat – telepon", answer: "Alat Komunikasi / Penghubung" },
    { question_number: 66, question_text: "kamera – kacamata", answer: "Alat Optik / Lensa" },
    { question_number: 67, question_text: "lambung – usus", answer: "Pencernaan / Organ" },
    { question_number: 68, question_text: "banyak – sedikit", answer: "Jumlah / Kuantitas" },
    { question_number: 69, question_text: "telur – benih", answer: "Calon Makhluk Hidup / Bibit" },
    { question_number: 70, question_text: "bendera – lencana", answer: "Simbol / Lambang" },
    { question_number: 71, question_text: "rumput – gajah", answer: "Makanan" },
    { question_number: 72, question_text: "ember – kantong", answer: "Wadah / Tempat" },
    { question_number: 73, question_text: "awal – akhir", answer: "Batas / Bagian" },
    { question_number: 74, question_text: "kikir – boros", answer: "Sifat / Karakter" },
    { question_number: 75, question_text: "penawaran – permintaan", answer: "Ekonomi / Pasar" },
    { question_number: 76, question_text: "atas – bawah", answer: "Arah / Posisi" }
  ],
  
  // RA - Arithmetic (Questions 77-96)
  RA: [
    { question_number: 77, question_text: "Jika seorang anak memiliki 50 rupiah dan memberikan 15 rupiah kepada orang lain, berapa rupiahkah yang masih tinggal padanya?", answer: "35" },
    { question_number: 78, question_text: "Berapa km-kah yang dapat ditempuh oleh kereta api dalam waktu 7 jam, jika kecepatannya 40 km/jam?", answer: "280" },
    { question_number: 79, question_text: "15 peti buah-buahan beratnya 250 kg dan setiap peti kosong beratnya 3 kg, berapakah berat buah-buahan itu?", answer: "205" },
    { question_number: 80, question_text: "Seseorang mempunyai persediaan rumput yang cukup untuk 7 ekor kuda selama 78 hari. Berapa harikah persediaan itu cukup untuk 21 ekor kuda?", answer: "26" },
    { question_number: 81, question_text: "3 batang coklat harganya Rp 5,- Berapa batangkah yang dapat kita beli dengan Rp 50,-?", answer: "30" },
    { question_number: 82, question_text: "Seseorang dapat berjalan 1,75 m dalam waktu ¼ detik. Berapakah meterkah yang dapat ia tempuh dalam waktu 10 detik?", answer: "70" },
    { question_number: 83, question_text: "Jika sebuah batu terletak 15 m di sebelah selatan dari sebatang pohon dan pohon itu berada 30 m di sebelah selatan dari sebuah rumah, berapa meterkah jarak antara batu dan rumah itu?", answer: "45" },
    { question_number: 84, question_text: "Jika 4 ½ m bahan sandang harganya Rp 90,- berapakah rupiahkah harganya 2 ½ m?", answer: "50" },
    { question_number: 85, question_text: "7 orang dapat menyelesaikan sesuatu pekerjaan dalam 6 hari. Berapa orangkah yang diperlukan untuk menyelesaikan pekerjaan itu dalam setengah hari?", answer: "84" },
    { question_number: 86, question_text: "Karena dipanaskan, kawat yang panjangnya 48 cm akan mengembang menjadi 52 cm. setelah pemanasan, berapakah panjangnya kawat yang berukuran 72 cm?", answer: "78" },
    { question_number: 87, question_text: "Suatu pabrik dapat menghasilkan 304 batang pensil dalam waktu 8 jam. Berapa batangkah dihasilkan dalam waktu setengah jam?", answer: "19" },
    { question_number: 88, question_text: "Untuk suatu campuran diperlukan 2 bagian perak dan 3 bagian timah. Berapa gramkah perak yang diperlukan untuk mendapatkan campuran itu yang beratnya 15 gram?", answer: "6" },
    { question_number: 89, question_text: "Untuk setiap Rp 3,- yang dimiliki Sidin, Hamid memiliki Rp 5,- Jika mereka bersama mempunyai Rp 120,- berapa rupiahkah yang dimiliki Hamid?", answer: "75" },
    { question_number: 90, question_text: "Mesin A menenun 60 m kain, sedangkan mesin B menenun 40 m. berapa meterkah yang ditenun mesin A, jika mesin B menenun 60 m?", answer: "90" },
    { question_number: 91, question_text: "Seseorang membelikan 1/10 dari uangnya untuk perangko dan 4 kali jumlah itu untuk alat tulis. Sisa uangnya masih Rp 60,- Berapa rupiahkah uang semula?", answer: "100" },
    { question_number: 92, question_text: "Di dalam dua peti terdapat 43 piring. Di dalam peti yang satu terdapat 9 piring lebih banyak dari pada di dalam peti yang lain. Berapa buah piring terdapat di dalam peti yang lebih kecil?", answer: "17" },
    { question_number: 93, question_text: "Suatu lembaran kain yang panjangnya 60 cm harus dibagikan sedemikian rupa sehingga panjangnya satu bagian ialah 2/3 dari bagian yang lain. Berapa panjangnya bagian yang terpendek.", answer: "24" },
    { question_number: 94, question_text: "Suatu perusahaan mengekspor ¾ dari hasil produksinya dan menjual 4/5 dari sisa itu dalam negeri. Berapa % kah hasil produksi yang masih tinggal?", answer: "5" },
    { question_number: 95, question_text: "Jika suatu botol berisi anggur hanya 7/8 bagian dan harganya ialah Rp 84,- berapakah harga anggur itu jika botol itu hanya terisi ½ penuh?", answer: "48" },
    { question_number: 96, question_text: "Di dalam suatu keluarga setiap anak perempuan mempunyai jumlah saudara laki-laki yang sama dengan jumlah saudara perempuan dan setiap anak laki-laki mempunyai dua kali lebih banyak saudara perempuan dari pada saudara laki-laki. Berapa anak laki-lakikah yang terdapat di dalam keluarga tersebut?", answer: "3" }
  ],
  
  // ZR - Number Series (Questions 97-116)
  ZR: [
    { question_number: 97, question_text: "6 9 12 15 18 21 24 ?", answer: "27" },
    { question_number: 98, question_text: "15 16 18 19 21 22 24 ?", answer: "25" },
    { question_number: 99, question_text: "19 18 22 21 25 24 28 ?", answer: "27" },
    { question_number: 100, question_text: "16 12 17 13 18 14 19 ?", answer: "15" },
    { question_number: 101, question_text: "2 4 8 10 20 22 44 ?", answer: "46" },
    { question_number: 102, question_text: "15 13 16 12 17 11 18 ?", answer: "10" },
    { question_number: 103, question_text: "25 22 11 33 30 15 45 ?", answer: "42" },
    { question_number: 104, question_text: "49 51 54 27 9 11 14 ?", answer: "7" },
    { question_number: 105, question_text: "2 3 1 3 4 2 4 ?", answer: "5" },
    { question_number: 106, question_text: "19 17 20 16 21 15 22 ?", answer: "14" },
    { question_number: 107, question_text: "94 92 46 44 22 20 10 ?", answer: "8" },
    { question_number: 108, question_text: "5 8 9 8 11 12 11 ?", answer: "14" },
    { question_number: 109, question_text: "12 15 19 23 28 33 39 ?", answer: "45" },
    { question_number: 110, question_text: "7 5 10 7 21 17 68 ?", answer: "64" },
    { question_number: 111, question_text: "11 15 18 9 13 16 8 ?", answer: "12" },
    { question_number: 112, question_text: "3 8 15 24 35 48 63 ?", answer: "80" },
    { question_number: 113, question_text: "4 5 7 4 8 13 7 ?", answer: "14" },
    { question_number: 114, question_text: "8 5 15 18 6 3 9 ?", answer: "12" },
    { question_number: 115, question_text: "15 6 18 10 30 23 69 ?", answer: "62" },
    { question_number: 116, question_text: "5 35 28 4 11 77 70 ?", answer: "46" }
  ],
  
  // FA - Figure Assembly (Questions 117-136) - Support 2 images: question image + answer choices image
  FA: Array.from({ length: 20 }, (_, i) => ({
    question_number: 117 + i,
    question_text: `Pilih potongan gambar yang tepat untuk melengkapi pola di atas (Soal No ${117 + i})`,
    question_image: `fa${117 + i}_soal.png`, // Gambar 1: soal/pattern yang harus dilengkapi
    options_image: `fa${117 + i}_pilihan.png`, // Gambar 2: pilihan jawaban A-E
    options: [
      { label: "a", text: "A" },
      { label: "b", text: "B" },
      { label: "c", text: "C" },
      { label: "d", text: "D" },
      { label: "e", text: "E" }
    ],
    correct: "a" // Placeholder - update dengan jawaban yang benar
  })),
  
  // WU - Cube Rotation (Questions 137-156) - Need images
  WU: Array.from({ length: 20 }, (_, i) => ({
    question_number: 137 + i,
    question_text: `[IMAGE NEEDED - Soal No ${137 + i}]`,
    options: [
      { label: "a", text: "Kubus A" },
      { label: "b", text: "Kubus B" },
      { label: "c", text: "Kubus C" },
      { label: "d", text: "Kubus D" },
      { label: "e", text: "Kubus E" }
    ],
    correct: "a" // Placeholder
  })),
  
  // ME - Memory (Questions 157-176)
  ME: [
    {
      question_number: 157,
      question_text: "Kata yang mempunyai huruf permulaan – A – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "d" // ARCA
    },
    {
      question_number: 158,
      question_text: "Kata yang mempunyai huruf permulaan – B – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // BUNGA (any of the flower options)
    },
    {
      question_number: 159,
      question_text: "Kata yang mempunyai huruf permulaan – C – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // CANGKUL
    },
    {
      question_number: 160,
      question_text: "Kata yang mempunyai huruf permulaan – D – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // DAHLIA
    },
    {
      question_number: 161,
      question_text: "Kata yang mempunyai huruf permulaan – E – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // ELANG
    },
    {
      question_number: 162,
      question_text: "Kata yang mempunyai huruf permulaan – F – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // FLAMBOYAN
    },
    {
      question_number: 163,
      question_text: "Kata yang mempunyai huruf permulaan – G – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "e" // GAMELAN
    },
    {
      question_number: 164,
      question_text: "Kata yang mempunyai huruf permulaan – H – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // HARIMAU
    },
    {
      question_number: 165,
      question_text: "Kata yang mempunyai huruf permulaan – I – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // ITIK
    },
    {
      question_number: 166,
      question_text: "Kata yang mempunyai huruf permulaan – J – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "d" // JARUM
    },
    {
      question_number: 167,
      question_text: "Kata yang mempunyai huruf permulaan – K – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "b" // KIKIR
    },
    {
      question_number: 168,
      question_text: "Kata yang mempunyai huruf permulaan – L – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // LARAT
    },
    {
      question_number: 169,
      question_text: "Kata yang mempunyai huruf permulaan – M – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "e" // MUSANG
    },
    {
      question_number: 170,
      question_text: "Kata yang mempunyai huruf permulaan – N – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "c" // NURI
    },
    {
      question_number: 171,
      question_text: "Kata yang mempunyai huruf permulaan – O – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "d" // OPERA
    },
    {
      question_number: 172,
      question_text: "Kata yang mempunyai huruf permulaan – P – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "b" // PALU
    },
    {
      question_number: 173,
      question_text: "Kata yang mempunyai huruf permulaan – R – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "e" // RUSA
    },
    {
      question_number: 174,
      question_text: "Kata yang mempunyai huruf permulaan – S – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "a" // SOKA
    },
    {
      question_number: 175,
      question_text: "Kata yang mempunyai huruf permulaan – T – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "e" // TERUKUR
    },
    {
      question_number: 176,
      question_text: "Kata yang mempunyai huruf permulaan – U – adalah …….",
      options: [
        { label: "a", text: "bunga" },
        { label: "b", text: "perkakas" },
        { label: "c", text: "burung" },
        { label: "d", text: "kesenian" },
        { label: "e", text: "binatang" }
      ],
      correct: "d" // UKIRAN
    }
  ]
};

async function updateISTQuestions() {
  console.log('Updating IST questions...');
  
  // Delete existing questions and options
  console.log('Deleting existing IST questions...');
  await supabase.from('test_question_options').delete().eq('question_id', 
    await supabase.from('test_questions').select('id').eq('instrument_id', IST_ID).then(({ data }) => data?.map(q => q.id) || [])
  );
  await supabase.from('test_questions').delete().eq('instrument_id', IST_ID);
  
  // Insert questions by subtest
  const subtestInfo = {
    SE: { name: 'Sentence Completion', type: 'single_choice' },
    WA: { name: 'Word Association', type: 'single_choice' },
    AN: { name: 'Analogy', type: 'single_choice' },
    GE: { name: 'Generalization', type: 'text' },
    RA: { name: 'Arithmetic', type: 'numeric' },
    ZR: { name: 'Number Series', type: 'numeric' },
    FA: { name: 'Figure Assembly', type: 'single_choice' },
    WU: { name: 'Cube Rotation', type: 'single_choice' },
    ME: { name: 'Memory', type: 'single_choice' }
  };
  
  let totalInserted = 0;
  
  for (const [subtestCode, questions] of Object.entries(istQuestions)) {
    console.log(`\nProcessing subtest ${subtestCode} (${questions.length} questions)...`);
    
    for (const q of questions) {
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from('test_questions')
        .insert({
          instrument_id: IST_ID,
          question_number: q.question_number,
          question_text: q.question_text,
          question_text_en: q.question_text,
          category: subtestInfo[subtestCode].name,
          question_type: subtestInfo[subtestCode].type,
          scoring_rule: 'correct_only',
          subtest_code: subtestCode,
          time_limit_minutes: subtestCode === 'ME' ? 3 : null, // Memory has 3 minutes
          question_image: q.question_image || null, // Gambar 1: soal
          options_image: q.options_image || null // Gambar 2: pilihan jawaban
        })
        .select()
        .single();
      
      if (questionError) {
        console.error(`Error inserting question ${q.question_number}:`, questionError);
        continue;
      }
      
      // Insert options for multiple choice questions
      if (q.options) {
        const optionsToInsert = q.options.map((opt, idx) => ({
          question_id: questionData.id,
          option_label: opt.label,
          option_text: opt.text,
          option_text_en: opt.text,
          score_value: opt.label.toLowerCase() === q.correct?.toLowerCase() ? 1 : 0,
          is_correct: opt.label.toLowerCase() === q.correct?.toLowerCase(),
          display_order: idx
        }));
        
        const { error: optionsError } = await supabase
          .from('test_question_options')
          .insert(optionsToInsert);
        
        if (optionsError) {
          console.error(`Error inserting options for question ${q.question_number}:`, optionsError);
        }
      }
      
      totalInserted++;
      if (totalInserted % 20 === 0) {
        console.log(`Inserted ${totalInserted} questions...`);
      }
    }
  }
  
  console.log(`\n✅ Successfully inserted ${totalInserted} IST questions!`);
  console.log('\nSubtest summary:');
  Object.entries(istQuestions).forEach(([code, questions]) => {
    console.log(`- ${code}: ${questions.length} questions`);
  });
  console.log('\nNote: Subtest FA (117-136) now supports 2 images: question_image (soal) and options_image (pilihan jawaban)');
console.log('Subtest WU (137-156) need images to be uploaded manually');
  console.log('Subtest ME (157-176) includes 3-minute memory display at the beginning');
}

updateISTQuestions();
