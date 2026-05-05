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

async function updateAptitudeTest() {
  console.log('Updating Aptitude Test with 60 new questions...');
  
  // Find Aptitude Test instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .ilike('name', '%aptitude%');
  
  if (!instruments || instruments.length === 0) {
    console.error('Aptitude Test instrument not found');
    return;
  }
  
  const aptitudeTest = instruments[0];
  console.log(`Found Aptitude Test: ${aptitudeTest.name} (ID: ${aptitudeTest.id})`);
  
  // Delete existing questions and options
  console.log('Deleting existing questions...');
  await supabase.from('test_question_options').delete().eq('question_id', 
    await supabase.from('test_questions').select('id').eq('instrument_id', aptitudeTest.id).then(({ data }) => data?.map(q => q.id) || [])
  );
  await supabase.from('test_questions').delete().eq('instrument_id', aptitudeTest.id);
  
  // Define 60 new questions
  const questions = [
    {
      question_number: 1,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Gajah" },
        { label: "b", text: "Ulat" },
        { label: "c", text: "Kerbau" },
        { label: "d", text: "Kucing" },
        { label: "e", text: "Singa" }
      ],
      correct: "b"
    },
    {
      question_number: 2,
      question_text: "Jika Anda mengatur ulang kata-kata \"LINKECI\", maka Anda akan mendapat nama sebuah:",
      options: [
        { label: "a", text: "Lautan" },
        { label: "b", text: "Negara" },
        { label: "c", text: "Provinsi" },
        { label: "d", text: "Kota" },
        { label: "e", text: "Hewan" }
      ],
      correct: "c"
    },
    {
      question_number: 3,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (A)\n(b) (c)\n(d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "a"
    },
    {
      question_number: 4,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Kentang" },
        { label: "b", text: "Jagung" },
        { label: "c", text: "Apel" },
        { label: "d", text: "Wortel" },
        { label: "e", text: "Kacang" }
      ],
      correct: "c"
    },
    {
      question_number: 5,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "b"
    },
    {
      question_number: 6,
      question_text: "Saat ini John berumur 12 tahun, yaitu 3 kali lebih tua dari adiknya. Berapa umur John saat umurnya 2 kali lebih tua dari umur adiknya?",
      options: [
        { label: "a", text: "15" },
        { label: "b", text: "16" },
        { label: "c", text: "18" },
        { label: "d", text: "20" },
        { label: "e", text: "21" }
      ],
      correct: "b"
    },
    {
      question_number: 7,
      question_text: "Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut?\nJika \"Kakak Laki-Laki\" itu \"Kakak Perempuan\", maka \" Keponakan Perempuan\" adalah:",
      options: [
        { label: "a", text: "Ibu" },
        { label: "b", text: "Anak Perempuan" },
        { label: "c", text: "Bibi" },
        { label: "d", text: "Paman" },
        { label: "e", text: "Keponakan Laki-laki" }
      ],
      correct: "c"
    },
    {
      question_number: 8,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?\nA Z F N E\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Huruf A" },
        { label: "b", text: "Huruf B" },
        { label: "c", text: "Huruf C" },
        { label: "d", text: "Huruf D" },
        { label: "e", text: "Huruf E" }
      ],
      correct: "b"
    },
    {
      question_number: 9,
      question_text: "Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut.\nJika \"Susu\" itu \"Gelas\", maka \"Surat\" itu:",
      options: [
        { label: "a", text: "Stempel" },
        { label: "b", text: "Ballpoin" },
        { label: "c", text: "Amplop" },
        { label: "d", text: "Buku" },
        { label: "e", text: "Kiriman" }
      ],
      correct: "c"
    },
    {
      question_number: 10,
      question_text: "Mana dari ke-5 yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "c"
    },
    {
      question_number: 11,
      question_text: "Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut?\nJika \"HIDUP\" itu \"PUDIH\" maka 5232 adalah:",
      options: [
        { label: "a", text: "2523" },
        { label: "b", text: "3252" },
        { label: "c", text: "2325" },
        { label: "d", text: "3225" },
        { label: "e", text: "5223" }
      ],
      correct: "c"
    },
    {
      question_number: 12,
      question_text: "\"JIka beberapa Smaugs adalah Thors dan beberapa Thors adalah Thrains, maka beberapa Smaugs pasti adalah Thrains.\"\nPernyataan ini adalah:",
      options: [
        { label: "a", text: "Benar" },
        { label: "b", text: "Salah" },
        { label: "c", text: "Tidak keduanya" }
      ],
      correct: "b"
    },
    {
      question_number: 13,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "d"
    },
    {
      question_number: 14,
      question_text: "Mana dari ke-5 kata yang paling melengkapi kalimat tersebut?\nJika \"Pohon\" itu \"Tanah\" maka \"Cerobong Asap\" itu:",
      options: [
        { label: "a", text: "Asap" },
        { label: "b", text: "Batu bata" },
        { label: "c", text: "Langit" },
        { label: "d", text: "Garasi" },
        { label: "e", text: "Rumah" }
      ],
      correct: "e"
    },
    {
      question_number: 15,
      question_text: "Mana dari angka-angka ini yang TIDAK masuk ke dalam urutan di bawah ini?\n9 – 7 – 8 – 6 – 7 – 5 – 6 – 3\n(a) (b) (c) (d) (e) (f) (g) (h)",
      options: [
        { label: "a", text: "4" },
        { label: "b", text: "5" },
        { label: "c", text: "6" },
        { label: "d", text: "7" },
        { label: "e", text: "8" }
      ],
      correct: "a"
    },
    {
      question_number: 16,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Sentuh" },
        { label: "b", text: "Rasa" },
        { label: "c", text: "Dengar" },
        { label: "d", text: "Senyum" },
        { label: "e", text: "Lihat" }
      ],
      correct: "d"
    },
    {
      question_number: 17,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika >> adalah m maka adalah\n(a) << (b) (c) (d) (e)",
      options: [
        { label: "a", text: "<<" },
        { label: "b", text: ">" },
        { label: "c", text: "=" },
        { label: "d", text: "<" },
        { label: "e", text: ">>" }
      ],
      correct: "a"
    },
    {
      question_number: 18,
      question_text: "Jack lebih tinggi dari Peter, dan Bill lebih pendek dari Jack.\nMana kalimat yang paling akurat?",
      options: [
        { label: "a", text: "Bill lebih tinggi dari Peter" },
        { label: "b", text: "Bill lebih pendek dari Peter" },
        { label: "c", text: "Bill sama tingginya dengan Peter" },
        { label: "d", text: "Mustahil untuk mengetahui apakah Bill or Peter yang lebih tinggi" }
      ],
      correct: "d"
    },
    {
      question_number: 19,
      question_text: "Mana dari ke -5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Kaus kaki" },
        { label: "b", text: "Baju" },
        { label: "c", text: "Sepatu" },
        { label: "d", text: "Dompet" },
        { label: "e", text: "Topi" }
      ],
      correct: "d"
    },
    {
      question_number: 20,
      question_text: "Mana dari ke-5 ini yang paling melengkapi kalimat tersebut?\nJika \"CAACCAC\" adalah \"3113313\" maka \"CACAACAC\" adalah:",
      options: [
        { label: "a", text: "13133131" },
        { label: "b", text: "13133313" },
        { label: "c", text: "31311131" },
        { label: "d", text: "31311313" },
        { label: "e", text: "31313113" }
      ],
      correct: "e"
    },
    {
      question_number: 21,
      question_text: "Jika Anda mengatur ulang kata \"RAPIS\", maka Anda akan mendapat nama sebuah:",
      options: [
        { label: "a", text: "Lautan" },
        { label: "b", text: "Negara" },
        { label: "c", text: "Provinsi" },
        { label: "d", text: "Kota" },
        { label: "e", text: "Hewan" }
      ],
      correct: "d"
    },
    {
      question_number: 22,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "b"
    },
    {
      question_number: 23,
      question_text: "Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut?\nJika \"Peluru\" adalah \"Senjata\" maka \"Bola Api\" adalah:",
      options: [
        { label: "a", text: "Pentungan" },
        { label: "b", text: "Ketapel" },
        { label: "c", text: "Meriam" },
        { label: "d", text: "Pelempar" },
        { label: "e", text: "Jepretan" }
      ],
      correct: "b"
    },
    {
      question_number: 24,
      question_text: "\"Jika beberapa Bifurs adalah Bofurs dan semua Gloins adalah Bofurs, maka beberapa Bifurs pasti adalah Gloins.\" Pernyataan ini adalah:",
      options: [
        { label: "a", text: "Benar" },
        { label: "b", text: "Salah" },
        { label: "c", text: "Tidak keduanya" }
      ],
      correct: "a"
    },
    {
      question_number: 25,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)\nA1 B2 C3\nE6 D4",
      options: [
        { label: "a", text: "Pola A" },
        { label: "b", text: "Pola B" },
        { label: "c", text: "Pola C" },
        { label: "d", text: "Pola D" },
        { label: "e", text: "Pola E" }
      ],
      correct: "c"
    },
    {
      question_number: 26,
      question_text: "Mana dari angka-angka ini yang TIDAK masuk ke dalam urutan di bawah ini?\nA – D – G – I –J – M – P – S\nPilih jawaban Anda : (a) D (b) I (c) J (d) M (e) S",
      options: [
        { label: "a", text: "D" },
        { label: "b", text: "I" },
        { label: "c", text: "J" },
        { label: "d", text: "M" },
        { label: "e", text: "S" }
      ],
      correct: "b"
    },
    {
      question_number: 27,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "d"
    },
    {
      question_number: 28,
      question_text: "Harga dari sebuah baju di-discount 20% untuk sebuah acara tahunan. Berapa % baju tersebut harus di-naik-kan dari harga discount tersebut, sehingga harga baju tersebut menjadi sama dengan awalnya?",
      options: [
        { label: "a", text: "15%" },
        { label: "b", text: "20%" },
        { label: "c", text: "25%" },
        { label: "d", text: "30%" },
        { label: "e", text: "40%" }
      ],
      correct: "c"
    },
    {
      question_number: 29,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Tembaga" },
        { label: "b", text: "Besi" },
        { label: "c", text: "Kuningan" },
        { label: "d", text: "Emas" },
        { label: "e", text: "Timah" }
      ],
      correct: "c"
    },
    {
      question_number: 30,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "e"
    },
    {
      question_number: 31,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Botol" },
        { label: "b", text: "Cangkir" },
        { label: "c", text: "Bak" },
        { label: "d", text: "Terowongan" },
        { label: "e", text: "Mangkuk" }
      ],
      correct: "d"
    },
    {
      question_number: 32,
      question_text: "Mari memiliki beberapa kue. Setelah makan 1 kue, Mary memberikan ½ dari sisanya untuk adiknya. Setelah makan 1 kue lagi, Mary memberikan ½ dari sisanya untuk adiknya. Mary sekarang hanya memiliki 5 kue. Berapakah jumlah awal kue yang dimiliki Mary?",
      options: [
        { label: "a", text: "11" },
        { label: "b", text: "22" },
        { label: "c", text: "23" },
        { label: "d", text: "45" },
        { label: "e", text: "46" }
      ],
      correct: "c"
    },
    {
      question_number: 33,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Terigu" },
        { label: "b", text: "Jerami" },
        { label: "c", text: "Gandum" },
        { label: "d", text: "Bubur" },
        { label: "e", text: "Beras" }
      ],
      correct: "d"
    },
    {
      question_number: 34,
      question_text: "Mana dari angka-angka ini yang TIDAK masuk ke dalam urutan di bawah ini?\n2 – 3 – 6 – 7 – 8 – 14 – 15 – 30",
      options: [
        { label: "a", text: "Tiga" },
        { label: "b", text: "Tujuh" },
        { label: "c", text: "Delapan" },
        { label: "d", text: "Lima belas" },
        { label: "e", text: "Tiga puluh" }
      ],
      correct: "c"
    },
    {
      question_number: 35,
      question_text: "Mana dari ke -5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "b"
    },
    {
      question_number: 36,
      question_text: "\"Sebuah pesawat ruang angkasa menerima 3 pesan dalam bahasa yang aneh dari sebuah planet di kejauhan. Para astronot mempelajari pesan-pesan tersebut dan menemukan bahwa :\n\"Elros Aldarion Elendil\" berarti \"Bahaya Ledakan Roket\" dan \"Edain Mnyatur Elros\" berarti \"Bahaya Kebakaran Pesawat Ruang Angkasa\" dan \"Aldarion Gimilizor Gondor\" berarti \"Ledakan Gas Yang Buruk\". Apakah arti dari \"Elendil\"?",
      options: [
        { label: "a", text: "Bahaya" },
        { label: "b", text: "Ledakan" },
        { label: "c", text: "Bukan apa-apa" },
        { label: "d", text: "Roket" },
        { label: "e", text: "Gas" }
      ],
      correct: "d"
    },
    {
      question_number: 37,
      question_text: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "a"
    },
    {
      question_number: 38,
      question_text: "Mana dari ke-5 ini yang paling melengkapi kalimat tersebut?\n\"Jika \"GESPER\" adalah \"Kepala Gesper\", maka \"SEPATU\" adalah:",
      options: [
        { label: "a", text: "Kaos Kaki" },
        { label: "b", text: "Tumit" },
        { label: "c", text: "Kaki" },
        { label: "d", text: "Tali Sepatu" },
        { label: "e", text: "Sol Sepatu" }
      ],
      correct: "e"
    },
    {
      question_number: 39,
      question_text: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "d"
    },
    {
      question_number: 40,
      question_text: "John menerima USD 0.41 sebagai kembalian dari pembeliannya di apotik. Jika Jhon menerima 6 koin, maka ketiga dari koin-koin tersebut harusnya:",
      options: [
        { label: "a", text: "Satu Sen" },
        { label: "b", text: "Lima sen" },
        { label: "c", text: "Sepuluh sen" },
        { label: "d", text: "Seperempat dollar" },
        { label: "e", text: "Setengah dollar" }
      ],
      correct: "c"
    },
    {
      question_number: 41,
      question_text: "Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "c"
    },
    {
      question_number: 42,
      question_text: "Jika Anda mengatur ulang kata-kata \"RMANJE\", maka anda akan mendapat nama sebuah:",
      options: [
        { label: "a", text: "Lautan" },
        { label: "b", text: "Negara" },
        { label: "c", text: "Provinsi" },
        { label: "d", text: "Kota" },
        { label: "e", text: "Hewan" }
      ],
      correct: "e"
    },
    {
      question_number: 43,
      question_text: "Which one of the five designs makes the best comparison?\njika adalah maka adalah :\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Design A" },
        { label: "b", text: "Design B" },
        { label: "c", text: "Design C" },
        { label: "d", text: "Design D" },
        { label: "e", text: "Design E" }
      ],
      correct: "a"
    },
    {
      question_number: 44,
      question_text: "\"Jika semua Wargs adalah Twerps dan tidak ada Twerps yang merupakan Gollums maka tidak ada Gollums yang pasti adalah Wargs.\"\nPernyataan ini adalah:",
      options: [
        { label: "a", text: "Benar" },
        { label: "b", text: "Salah" },
        { label: "c", text: "Tidak Keduanya" }
      ],
      correct: "a"
    },
    {
      question_number: 45,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Kuda" },
        { label: "b", text: "Kanguru" },
        { label: "c", text: "Zebra" },
        { label: "d", text: "Rusa" },
        { label: "e", text: "Keledai" }
      ],
      correct: "b"
    },
    {
      question_number: 46,
      question_text: "Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar –gambar ini?\n(a) A B\nD C\n(b) E F\nH G\n(c) I J\nL K\n(d) M N\nO P\n(e)\nQ R\nT S",
      options: [
        { label: "a", text: "Pola A" },
        { label: "b", text: "Pola B" },
        { label: "c", text: "Pola C" },
        { label: "d", text: "Pola D" },
        { label: "e", text: "Pola E" }
      ],
      correct: "e"
    },
    {
      question_number: 47,
      question_text: "Mana dari ke-5 ini yang paling melengkapi kalimat tersebut?\nJika \"Jari\" adalah \"Tangan\" maka \"Daun\" adalah:",
      options: [
        { label: "a", text: "Pohon" },
        { label: "b", text: "Cabang" },
        { label: "c", text: "Bunga" },
        { label: "d", text: "Ranting" },
        { label: "e", text: "Kulit Kayu" }
      ],
      correct: "d"
    },
    {
      question_number: 48,
      question_text: "\"Ibunya John mengirimkannya ke toko untuk membeli 9 kotak besar jeruk. John hanya dapat membawa 2 kotak dalam sekali jalan. Berapa kali ia harus bolak-balik ke toko?",
      options: [
        { label: "a", text: "4" },
        { label: "b", text: "4½" },
        { label: "c", text: "5" },
        { label: "d", text: "½" },
        { label: "e", text: "6" }
      ],
      correct: "c"
    },
    {
      question_number: 49,
      question_text: "Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar-gambar ini?\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "b"
    },
    {
      question_number: 50,
      question_text: "Mana dari ke-5 ini yang paling melengkapi kalimat tersebut?\nJika \"Kaki\" adalah \"Lutut\", maka \"Tangan\" adalah:",
      options: [
        { label: "a", text: "Jari" },
        { label: "b", text: "Sikut" },
        { label: "c", text: "Tumit" },
        { label: "d", text: "Kaki" },
        { label: "e", text: "Lengan" }
      ],
      correct: "b"
    },
    {
      question_number: 51,
      question_text: "Mana gambar yang paling mengikuti logika dari diagram di bawah ini?",
      options: [
        { label: "a", text: "Diagram A" },
        { label: "b", text: "Diagram B" },
        { label: "c", text: "Diagram C" },
        { label: "d", text: "Diagram D" },
        { label: "e", text: "Diagram E" }
      ],
      correct: "c"
    },
    {
      question_number: 52,
      question_text: "Mary ada di peringkat ke-13 dari yang terbaik dan juga peringkat ke-13 dari yang terburuk dalam lomba mengeja kata. Ada berapa peserta dalam lomba mengeja kata tersebut?",
      options: [
        { label: "a", text: "13" },
        { label: "b", text: "25" },
        { label: "c", text: "26" },
        { label: "d", text: "27" },
        { label: "e", text: "28" }
      ],
      correct: "b"
    },
    {
      question_number: 53,
      question_text: "Mana dari ke-5 ini yang paling melengkapi kalimat tersebut?\nJika \"Air \" adalah \"Es Batu\", maka \"Susu\" adalah:",
      options: [
        { label: "a", text: "Madu" },
        { label: "b", text: "Keju" },
        { label: "c", text: "Sereal" },
        { label: "d", text: "Kopi" },
        { label: "e", text: "Kue" }
      ],
      correct: "b"
    },
    {
      question_number: 54,
      question_text: "Mana dari angka ini yang TIDAK sesuai dengan urutan angka-angka ini?\n1 - 2 - 5 - 10 - 13 - 26 - 29 - 48\n(a) (b) (c) (d) (e) (f) (g) (h)",
      options: [
        { label: "a", text: "2" },
        { label: "b", text: "5" },
        { label: "c", text: "10" },
        { label: "d", text: "13" },
        { label: "e", text: "26" }
      ],
      correct: "c"
    },
    {
      question_number: 55,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Sayap" },
        { label: "b", text: "Iga" },
        { label: "c", text: "Salmon" },
        { label: "d", text: "Ayam" },
        { label: "e", text: "Sapi" }
      ],
      correct: "c"
    },
    {
      question_number: 56,
      question_text: "\"Jika semua Fleeps adalah Sloops dan semua Sloops adalah Loopies, maka semua Fleeps adalah pasti Loopies.\"\nPernyataan ini adalah:",
      options: [
        { label: "a", text: "Benar" },
        { label: "b", text: "Salah" },
        { label: "c", text: "Tidak Keduanya" }
      ],
      correct: "a"
    },
    {
      question_number: 57,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nJika adalah maka adalah\n(a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "d"
    },
    {
      question_number: 58,
      question_text: "Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?",
      options: [
        { label: "a", text: "Sentimeter" },
        { label: "b", text: "Kilometer" },
        { label: "c", text: "Hektar" },
        { label: "d", text: "Meter" },
        { label: "e", text: "Kaki" }
      ],
      correct: "c"
    },
    {
      question_number: 59,
      question_text: "Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?\nadalah maka adalah\nJika (a) (b) (c) (d) (e)",
      options: [
        { label: "a", text: "Gambar A" },
        { label: "b", text: "Gambar B" },
        { label: "c", text: "Gambar C" },
        { label: "d", text: "Gambar D" },
        { label: "e", text: "Gambar E" }
      ],
      correct: "e"
    },
    {
      question_number: 60,
      question_text: "\"Seekor ikan mempunyai kepala sepanjang 9mm. Buntutnya sama panjangnya dengan ukuran kepalanya ditambah setengah kali ukuran badannya. Ukuran badannya adalah sama dengan ukuran kepala ditambah ukuran buntutnya.\" Berapa panjang ikan tersebut?",
      options: [
        { label: "a", text: "27mm" },
        { label: "b", text: "54mm" },
        { label: "c", text: "63mm" },
        { label: "d", text: "72mm" },
        { label: "e", text: "81mm" }
      ],
      correct: "d"
    }
  ];
  
  // Insert questions and options
  let insertedCount = 0;
  
  for (const q of questions) {
    // Insert question
    const { data: questionData, error: questionError } = await supabase
      .from('test_questions')
      .insert({
        instrument_id: aptitudeTest.id,
        question_number: q.question_number,
        question_text: q.question_text,
        question_text_en: q.question_text,
        category: 'General Aptitude',
        question_type: 'single_choice',
        scoring_rule: 'correct_only'
      })
      .select()
      .single();
    
    if (questionError) {
      console.error(`Error inserting question ${q.question_number}:`, questionError);
      continue;
    }
    
    // Insert options
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
    } else {
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`Inserted ${insertedCount} questions...`);
      }
    }
  }
  
  // Update instrument question count
  await supabase
    .from('test_instruments')
    .update({ question_count: 60, duration_minutes: 60 })
    .eq('id', aptitudeTest.id);
  
  console.log(`\n✅ Successfully inserted ${insertedCount} Aptitude Test questions!`);
  console.log('Test duration set to 60 minutes');
  console.log('\nNote: Questions with images need to be uploaded manually through QuestionBuilder');
}

updateAptitudeTest();
