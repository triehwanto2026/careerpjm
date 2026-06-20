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

async function updatePAPIKOSTIKQuestions() {
  console.log('Updating PAPIKOSTIK questions with 90 new questions...');
  
  // Find PAPIKOSTIK instrument
  const { data: instruments } = await supabase
    .from('test_instruments')
    .select('id, name')
    .ilike('name', '%papikostik%');
  
  if (!instruments || instruments.length === 0) {
    console.error('PAPIKOSTIK instrument not found');
    return;
  }
  
  const papikostikTest = instruments[0];
  console.log(`Found PAPIKOSTIK: ${papikostikTest.name} (ID: ${papikostikTest.id})`);
  
  // Define 90 new questions with PAPIKOSTIK dimension mapping
  const instruction = "Pilihlah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini.";
  
  const questions = [
    {
      question_number: 1,
      question_text: `${instruction}\n\na. Saya seorang pekerja giat\nb. Saya Bukan Seorang Pemurung`,
      options: [
        { label: "a", text: "Saya seorang pekerja giat", dimension: "A" },
        { label: "b", text: "Saya Bukan Seorang Pemurung", dimension: "B" }
      ]
    },
    {
      question_number: 2,
      question_text: "a. Saya suka bekerja lebih baik dari yang lain\nb. Saya melakukan pekerjaan hingga tuntas",
      options: [
        { label: "a", text: "Saya suka bekerja lebih baik dari yang lain", dimension: "A" },
        { label: "b", text: "Saya melakukan pekerjaan hingga tuntas", dimension: "P" }
      ]
    },
    {
      question_number: 3,
      question_text: "a. Saya suka memberi orang petunjuk bagaimana melakukan sesuatu.\nb. Saya senang memberitahukan orang apa yang harus dikerjakan",
      options: [
        { label: "a", text: "Saya suka memberi orang petunjuk bagaimana melakukan sesuatu", dimension: "L" },
        { label: "b", text: "Saya senang memberitahukan orang apa yang harus dikerjakan", dimension: "D" }
      ]
    },
    {
      question_number: 4,
      question_text: "a. Saya suka melakukan atau mengatakan hal-hal lucu.\nb. Saya senang memberitahukan orang apa yang harus dikerjakan",
      options: [
        { label: "a", text: "Saya suka melakukan atau mengatakan hal-hal lucu", dimension: "G" },
        { label: "b", text: "Saya senang memberitahukan orang apa yang harus dikerjakan", dimension: "D" }
      ]
    },
    {
      question_number: 5,
      question_text: "a. Saya suka menggabungkan diri dalam kelompok\nb. Saya ingin diperhatikan dalam kelompok.",
      options: [
        { label: "a", text: "Saya suka menggabungkan diri dalam kelompok", dimension: "S" },
        { label: "b", text: "Saya ingin diperhatikan dalam kelompok", dimension: "N" }
      ]
    },
    {
      question_number: 6,
      question_text: "a. Saya suka Menjalin persahabatan\nb. Saya suka menggabungkan diri dalam suatu kelompok",
      options: [
        { label: "a", text: "Saya suka Menjalin persahabatan", dimension: "S" },
        { label: "b", text: "Saya suka menggabungkan diri dalam suatu kelompok", dimension: "S" }
      ]
    },
    {
      question_number: 7,
      question_text: "a. Jika saya rasa perlu, saya bisa cepat menyesuaikan diri\nb. Saya berusaha Menjalin persahabatan",
      options: [
        { label: "a", text: "Jika saya rasa perlu, saya bisa cepat menyesuaikan diri", dimension: "R" },
        { label: "b", text: "Saya berusaha Menjalin persahabatan", dimension: "S" }
      ]
    },
    {
      question_number: 8,
      question_text: "a. Saya akan membalas jika saya di sakiti\nb. Saya suka melakukan hal-hal baru dan berbeda",
      options: [
        { label: "a", text: "Saya akan membalas jika saya di sakiti", dimension: "O" },
        { label: "b", text: "Saya suka melakukan hal-hal baru dan berbeda", dimension: "Z" }
      ]
    },
    {
      question_number: 9,
      question_text: "a. Saya ingin atasan menyukai saya\nb. Saya suka memberitahukan orang jika mereka bersalah.",
      options: [
        { label: "a", text: "Saya ingin atasan menyukai saya", dimension: "N" },
        { label: "b", text: "Saya suka memberitahukan orang jika mereka bersalah", dimension: "D" }
      ]
    },
    {
      question_number: 10,
      question_text: "a. Saya suka mengikuti petunjuk yang di berikan kepada saya\nb. Saya suka membuat atasan senang",
      options: [
        { label: "a", text: "Saya suka mengikuti petunjuk yang di berikan kepada saya", dimension: "R" },
        { label: "b", text: "Saya suka membuat atasan senang", dimension: "N" }
      ]
    },
    {
      question_number: 11,
      question_text: "a. Saya berusaha keras sekali\nb. Saya seorang yang rapih",
      options: [
        { label: "a", text: "Saya berusaha keras sekali", dimension: "A" },
        { label: "b", text: "Saya seorang yang rapih", dimension: "P" }
      ]
    },
    {
      question_number: 12,
      question_text: "a. Saya dapat membuat orang melakukan apa yang saya inginkan\nb. Saya tidak mudah marah.",
      options: [
        { label: "a", text: "Saya dapat membuat orang melakukan apa yang saya inginkan", dimension: "D" },
        { label: "b", text: "Saya tidak mudah marah", dimension: "F" }
      ]
    },
    {
      question_number: 13,
      question_text: "a. Saya suka memberitahu kelompok apa yang harus mereka kerjakan.\nb. Saya selalu melakukan pekerjaan sampai tuntas.",
      options: [
        { label: "a", text: "Saya suka memberitahu kelompok apa yang harus mereka kerjakan", dimension: "D" },
        { label: "b", text: "Saya selalu melakukan pekerjaan sampai tuntas", dimension: "P" }
      ]
    },
    {
      question_number: 14,
      question_text: "a. Saya ingin menjadi orang yang menarik dan mengasyikan.\nb. Saya ingin menjadi orang yang sangat berhasil",
      options: [
        { label: "a", text: "Saya ingin menjadi orang yang menarik dan mengasyikan", dimension: "G" },
        { label: "b", text: "Saya ingin menjadi orang yang sangat berhasil", dimension: "A" }
      ]
    },
    {
      question_number: 15,
      question_text: "a. Saya ingin dapat menyesuaikan diri dengan kelompok-kelompok\nb. Saya suka membantu orang mengambil keputusan",
      options: [
        { label: "a", text: "Saya ingin dapat menyesuaikan diri dengan kelompok-kelompok", dimension: "R" },
        { label: "b", text: "Saya suka membantu orang mengambil keputusan", dimension: "D" }
      ]
    },
    {
      question_number: 16,
      question_text: "a. Saya cemas bila seseorang tidak menyukai saya\nb. Saya suka orang memperhatikan saya",
      options: [
        { label: "a", text: "Saya cemas bila seseorang tidak menyukai saya", dimension: "N" },
        { label: "b", text: "Saya suka orang memperhatikan saya", dimension: "N" }
      ]
    },
    {
      question_number: 17,
      question_text: "a. Saya suka mencoba hal-hal baru\nb. Saya lebih suka bekerja sama daripada bekerja Sendiri",
      options: [
        { label: "a", text: "Saya suka mencoba hal-hal baru", dimension: "Z" },
        { label: "b", text: "Saya lebih suka bekerja sama daripada bekerja Sendiri", dimension: "S" }
      ]
    },
    {
      question_number: 18,
      question_text: "a. Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres. b. Saya merasa terganggu bila ada yang tidak menyukai saya.",
      options: [
        { label: "a", text: "Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres", dimension: "D" },
        { label: "b", text: "Saya merasa terganggu bila ada yang tidak menyukai saya", dimension: "N" }
      ]
    },
    {
      question_number: 19,
      question_text: "a. Saya suka menyenangkan atasan\nb. Saya suka mencoba pekerjaan – pekerjaan yang baru dan berbeda.",
      options: [
        { label: "a", text: "Saya suka menyenangkan atasan", dimension: "N" },
        { label: "b", text: "Saya suka mencoba pekerjaan – pekerjaan yang baru dan berbeda", dimension: "Z" }
      ]
    },
    {
      question_number: 20,
      question_text: "a. Saya menyukai petunjuk-petujuk yang rinci dalam menyelesaikan pekerjaan\nb. Akan saya katakan kepada orang-orang yang bersangkutan bila mereka menjengkelkan saya",
      options: [
        { label: "a", text: "Saya menyukai petunjuk-petujuk yang rinci dalam menyelesaikan pekerjaan", dimension: "P" },
        { label: "b", text: "Akan saya katakan kepada orang-orang yang bersangkutan bila mereka menjengkelkan saya", dimension: "D" }
      ]
    },
    {
      question_number: 21,
      question_text: "a. Saya selalu berusaha keras\nb. Saya suka Melaksanakan Setiap langkah dengan hati-hati",
      options: [
        { label: "a", text: "Saya selalu berusaha keras", dimension: "A" },
        { label: "b", text: "Saya suka Melaksanakan Setiap langkah dengan hati-hati", dimension: "P" }
      ]
    },
    {
      question_number: 22,
      question_text: "a. Saya akan menjadi seorang pemimpin yang baik\nb. Saya dapat mengorganisir suatu pekerjaan dengan baik.",
      options: [
        { label: "a", text: "Saya akan menjadi seorang pemimpin yang baik", dimension: "L" },
        { label: "b", text: "Saya dapat mengorganisir suatu pekerjaan dengan baik", dimension: "D" }
      ]
    },
    {
      question_number: 23,
      question_text: "a. saya mudah tersinggung\nb. Saya lambat dalam membuat keputusan",
      options: [
        { label: "a", text: "saya mudah tersinggung", dimension: "F" },
        { label: "b", text: "Saya lambat dalam membuat keputusan", dimension: "I" }
      ]
    },
    {
      question_number: 24,
      question_text: "a. Saya suka mengerjakan beberapa pekerjaan sekaligus\nb. Bila saya dalam kelompok, saya lebih sering sebagai pendengar.",
      options: [
        { label: "a", text: "Saya suka mengerjakan beberapa pekerjaan sekaligus", dimension: "Z" },
        { label: "b", text: "Bila saya dalam kelompok, saya lebih sering sebagai pendengar", dimension: "S" }
      ]
    },
    {
      question_number: 25,
      question_text: "a. Saya sangat senang bila mendapat undangan\nb. Saya ingin lebih baik dari yang lain dalam mengerjakan sesuatu.",
      options: [
        { label: "a", text: "Saya sangat senang bila mendapat undangan", dimension: "S" },
        { label: "b", text: "Saya ingin lebih baik dari yang lain dalam mengerjakan sesuatu", dimension: "A" }
      ]
    },
    {
      question_number: 26,
      question_text: "a. Saya suka Menjalin persahabatan\nb. Saya suka menasehati orang lain",
      options: [
        { label: "a", text: "Saya suka Menjalin persahabatan", dimension: "S" },
        { label: "b", text: "Saya suka menasehati orang lain", dimension: "D" }
      ]
    },
    {
      question_number: 27,
      question_text: "a. Saya suka melakukan hal-hal baru dan berbeda\nb. Saya suka memberitahu bagaimana saya berhasil dalam melakukan sesuatu",
      options: [
        { label: "a", text: "Saya suka melakukan hal-hal baru dan berbeda", dimension: "Z" },
        { label: "b", text: "Saya suka memberitahu bagaimana saya berhasil dalam melakukan sesuatu", dimension: "N" }
      ]
    },
    {
      question_number: 28,
      question_text: "a. Bila pendapat saya benar, saya akan pertahankan\nb. Saya ingin diterima dan diakui dalam kelompok",
      options: [
        { label: "a", text: "Bila pendapat saya benar, saya akan pertahankan", dimension: "T" },
        { label: "b", text: "Saya ingin diterima dan diakui dalam kelompok", dimension: "N" }
      ]
    },
    {
      question_number: 29,
      question_text: "a. Saya tak mau menjadi lain dari yang lain\nb. Saya berusaha dekat dengan orang-orang",
      options: [
        { label: "a", text: "Saya tak mau menjadi lain dari yang lain", dimension: "R" },
        { label: "b", text: "Saya berusaha dekat dengan orang-orang", dimension: "S" }
      ]
    },
    {
      question_number: 30,
      question_text: "a. Saya senang memberitahu orang bagaimana melakukan suatu pekerjaan\nb. Saya berusaha dekat dengan orang – orang",
      options: [
        { label: "a", text: "Saya senang memberitahu orang bagaimana melakukan suatu pekerjaan", dimension: "L" },
        { label: "b", text: "Saya berusaha dekat dengan orang – orang", dimension: "S" }
      ]
    },
    {
      question_number: 31,
      question_text: "a. Saya bekerja keras\nb. Saya banyak berfikir dan membuat perencanaan",
      options: [
        { label: "a", text: "Saya bekerja keras", dimension: "A" },
        { label: "b", text: "Saya banyak berfikir dan membuat perencanaan", dimension: "I" }
      ]
    },
    {
      question_number: 32,
      question_text: "a. Saya memimpin kelompok\nb. Saya tertarik dengan hal-hal yang lebih detail",
      options: [
        { label: "a", text: "Saya memimpin kelompok", dimension: "L" },
        { label: "b", text: "Saya tertarik dengan hal-hal yang lebih detail", dimension: "P" }
      ]
    },
    {
      question_number: 33,
      question_text: "a. Saya mengambil Keputusan dengan mudah dan cepat\nb. Saya menyimpan barang-barang dengan rapih dan teratur",
      options: [
        { label: "a", text: "Saya mengambil Keputusan dengan mudah dan cepat", dimension: "I" },
        { label: "b", text: "Saya menyimpan barang-barang dengan rapih dan teratur", dimension: "P" }
      ]
    },
    {
      question_number: 34,
      question_text: "a. Saya melakukan pekerjaan dengan cepat\nb. Saya tidak sering marah atau sedih",
      options: [
        { label: "a", text: "Saya melakukan pekerjaan dengan cepat", dimension: "A" },
        { label: "b", text: "Saya tidak sering marah atau sedih", dimension: "F" }
      ]
    },
    {
      question_number: 35,
      question_text: "a. Saya ingin menjadi bagian dari kelompok\nb. Saya hanya ingin melakukan pekerjaan pada satu waktu",
      options: [
        { label: "a", text: "Saya ingin menjadi bagian dari kelompok", dimension: "S" },
        { label: "b", text: "Saya hanya ingin melakukan pekerjaan pada satu waktu", dimension: "P" }
      ]
    },
    {
      question_number: 36,
      question_text: "a. Saya berusaha Menjalin persahabatan\nb. Saya berusaha keras menjadi yang terbaik",
      options: [
        { label: "a", text: "Saya berusaha Menjalin persahabatan", dimension: "S" },
        { label: "b", text: "Saya berusaha keras menjadi yang terbaik", dimension: "A" }
      ]
    },
    {
      question_number: 37,
      question_text: "a. Saya suka mode terbaru untuk pakaian\nb. Saya suka di beri tanggungjawab.",
      options: [
        { label: "a", text: "Saya suka mode terbaru untuk pakaian", dimension: "G" },
        { label: "b", text: "Saya suka di beri tanggungjawab", dimension: "L" }
      ]
    },
    {
      question_number: 38,
      question_text: "a. Saya menyukai perdebatan\nb. Saya senang mendapat perhatian",
      options: [
        { label: "a", text: "Saya menyukai perdebatan", dimension: "T" },
        { label: "b", text: "Saya senang mendapat perhatian", dimension: "N" }
      ]
    },
    {
      question_number: 39,
      question_text: "a. Saya suka menyenangkan atasan\nb. Saya tertarik menjadi bagian dalam kelompok",
      options: [
        { label: "a", text: "Saya suka menyenangkan atasan", dimension: "N" },
        { label: "b", text: "Saya tertarik menjadi bagian dalam kelompok", dimension: "S" }
      ]
    },
    {
      question_number: 40,
      question_text: "a. Saya sangat memperhatikan peraturan\nb. Saya ingin orang mengenal saya dengan baik",
      options: [
        { label: "a", text: "Saya sangat memperhatikan peraturan", dimension: "R" },
        { label: "b", text: "Saya ingin orang mengenal saya dengan baik", dimension: "N" }
      ]
    },
    {
      question_number: 41,
      question_text: "a. Saya berusaha keras sekali\nb. Saya sangat ramah",
      options: [
        { label: "a", text: "Saya berusaha keras sekali", dimension: "A" },
        { label: "b", text: "Saya sangat ramah", dimension: "S" }
      ]
    },
    {
      question_number: 42,
      question_text: "a. Orang berpendapat saya memimpin dengan baik\nb. Saya berfikir lama dan berhati – hati",
      options: [
        { label: "a", text: "Orang berpendapat saya memimpin dengan baik", dimension: "L" },
        { label: "b", text: "Saya berfikir lama dan berhati – hati", dimension: "I" }
      ]
    },
    {
      question_number: 43,
      question_text: "a. Bila ada kesempatan, saya akan memanfaatkan nya.\nb. Saya senang menangani hal-hal kecil",
      options: [
        { label: "a", text: "Bila ada kesempatan, saya akan memanfaatkan nya", dimension: "X" },
        { label: "b", text: "Saya senang menangani hal-hal kecil", dimension: "P" }
      ]
    },
    {
      question_number: 44,
      question_text: "a. Orang berpendapat bahwa saya bekerja cepat\nb. Orang berpendapat bahwa saya rapi dan teratur",
      options: [
        { label: "a", text: "Orang berpendapat bahwa saya bekerja cepat", dimension: "A" },
        { label: "b", text: "Orang berpendapat bahwa saya rapi dan teratur", dimension: "P" }
      ]
    },
    {
      question_number: 45,
      question_text: "a. Saya senang mengikuti pertandingan dan berolahraga.\nb. Saya memiliki kepribadian yang menyenangkan",
      options: [
        { label: "a", text: "Saya senang mengikuti pertandingan dan berolahraga", dimension: "A" },
        { label: "b", text: "Saya memiliki kepribadian yang menyenangkan", dimension: "G" }
      ]
    },
    {
      question_number: 46,
      question_text: "a. Saya senang jika orang dekat dan bersahabat dengan saya\nb. Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai",
      options: [
        { label: "a", text: "Saya senang jika orang dekat dan bersahabat dengan saya", dimension: "S" },
        { label: "b", text: "Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai", dimension: "P" }
      ]
    },
    {
      question_number: 47,
      question_text: "a. Saya senang bereksperimen dan mencoba hal-hal baru\nb. Saya suka mengerjakan pekerjaan yang sulit-sulit",
      options: [
        { label: "a", text: "Saya senang bereksperimen dan mencoba hal-hal baru", dimension: "Z" },
        { label: "b", text: "Saya suka mengerjakan pekerjaan yang sulit-sulit", dimension: "A" }
      ]
    },
    {
      question_number: 48,
      question_text: "a. Saya suka diperlakukan dengan adil\nb. Saya suka memberitahu orang lain bagaimana Melaksanakan sesuatu.",
      options: [
        { label: "a", text: "Saya suka diperlakukan dengan adil", dimension: "T" },
        { label: "b", text: "Saya suka memberitahu orang lain bagaimana Melaksanakan sesuatu", dimension: "L" }
      ]
    },
    {
      question_number: 49,
      question_text: "a. Saya suka melakukan apa yang diharapkan orang dari saya.\nb. Saya suka jika orang perduli terhadap saya",
      options: [
        { label: "a", text: "Saya suka melakukan apa yang diharapkan orang dari saya", dimension: "R" },
        { label: "b", text: "Saya suka jika orang perduli terhadap saya", dimension: "N" }
      ]
    },
    {
      question_number: 50,
      question_text: "a. Saya suka diterangkan tugas saya sedetail-detailnya\nb. Saya senang berada bersama orang-orang",
      options: [
        { label: "a", text: "Saya suka diterangkan tugas saya sedetail-detailnya", dimension: "P" },
        { label: "b", text: "Saya senang berada bersama orang-orang", dimension: "S" }
      ]
    },
    {
      question_number: 51,
      question_text: "a. Saya selalu berusaha menyelesaikan pekerjaan dengan sempurna.\nb. Orang mengatakan bahwa saya hampir-hampir tidak pernah lelah.",
      options: [
        { label: "a", text: "Saya selalu berusaha menyelesaikan pekerjaan dengan sempurna", dimension: "P" },
        { label: "b", text: "Orang mengatakan bahwa saya hampir-hampir tidak pernah lelah", dimension: "A" }
      ]
    },
    {
      question_number: 52,
      question_text: "a. Saya tipe pemimpin\nb. Saya mudah bergaul",
      options: [
        { label: "a", text: "Saya tipe pemimpin", dimension: "L" },
        { label: "b", text: "Saya mudah bergaul", dimension: "S" }
      ]
    },
    {
      question_number: 53,
      question_text: "a. Saya gunakan kesempatan\nb. Saya banyak sekali berfikir",
      options: [
        { label: "a", text: "Saya gunakan kesempatan", dimension: "X" },
        { label: "b", text: "Saya banyak sekali berfikir", dimension: "I" }
      ]
    },
    {
      question_number: 54,
      question_text: "a. Saya bekerja dengan tempo yang tinggi dan mantap\nb. Saya senang menangani detail suatu pekerjaan",
      options: [
        { label: "a", text: "Saya bekerja dengan tempo yang tinggi dan mantap", dimension: "A" },
        { label: "b", text: "Saya senang menangani detail suatu pekerjaan", dimension: "P" }
      ]
    },
    {
      question_number: 55,
      question_text: "a. Saya memiliki banyak tenaga untuk kegiatan dan berolah raga.\nb. Saya mengatur dan menyimpan barang dengan teratur dan rapi.",
      options: [
        { label: "a", text: "Saya memiliki banyak tenaga untuk kegiatan dan berolah raga", dimension: "A" },
        { label: "b", text: "Saya mengatur dan menyimpan barang dengan teratur dan rapi", dimension: "P" }
      ]
    },
    {
      question_number: 56,
      question_text: "a. Saya dapat bergaul baik dengan semua orang\nb. Saya orang yang berwatak tenang",
      options: [
        { label: "a", text: "Saya dapat bergaul baik dengan semua orang", dimension: "S" },
        { label: "b", text: "Saya orang yang berwatak tenang", dimension: "F" }
      ]
    },
    {
      question_number: 57,
      question_text: "a. Saya ingin bertemu dengan orang-orang baru dan melakukan hal-hal baru.\nb. Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai",
      options: [
        { label: "a", text: "Saya ingin bertemu dengan orang-orang baru dan melakukan hal-hal baru", dimension: "Z" },
        { label: "b", text: "Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai", dimension: "P" }
      ]
    },
    {
      question_number: 58,
      question_text: "a. Saya biasanya mempertahankan pendapat yang saya yakini.\nb. Saya biasanya suka bekerja keras.",
      options: [
        { label: "a", text: "Saya biasanya mempertahankan pendapat yang saya yakini", dimension: "T" },
        { label: "b", text: "Saya biasanya suka bekerja keras", dimension: "A" }
      ]
    },
    {
      question_number: 59,
      question_text: "a. Saya menyambut baik saran-saran dari orang yang saya kagumi.\nb. Saya suka bertanggung jawab terhadap orang lain",
      options: [
        { label: "a", text: "Saya menyambut baik saran-saran dari orang yang saya kagumi", dimension: "R" },
        { label: "b", text: "Saya suka bertanggung jawab terhadap orang lain", dimension: "L" }
      ]
    },
    {
      question_number: 60,
      question_text: "a. Saya membiarkan diri saya dipengaruhi dengan kuat oleh orang lain\nb. Saya senang bila memperoleh banyak perhatian",
      options: [
        { label: "a", text: "Saya membiarkan diri saya dipengaruhi dengan kuat oleh orang lain", dimension: "R" },
        { label: "b", text: "Saya senang bila memperoleh banyak perhatian", dimension: "N" }
      ]
    },
    {
      question_number: 61,
      question_text: "a. Biasanya saya bekerja keras sekali.\nb. Biasanya saya bekerja cepat",
      options: [
        { label: "a", text: "Biasanya saya bekerja keras sekali", dimension: "A" },
        { label: "b", text: "Biasanya saya bekerja cepat", dimension: "A" }
      ]
    },
    {
      question_number: 62,
      question_text: "a. Apabila saya bicara, kelompok diam dan mendengarkan\nb. Saya trampil menggunakan perkakas",
      options: [
        { label: "a", text: "Apabila saya bicara, kelompok diam dan mendengarkan", dimension: "L" },
        { label: "b", text: "Saya trampil menggunakan perkakas", dimension: "W" }
      ]
    },
    {
      question_number: 63,
      question_text: "a. Saya lambat dalam membuat persahabatan\nb. Saya lambat dalam mengambil Keputusan",
      options: [
        { label: "a", text: "Saya lambat dalam membuat persahabatan", dimension: "S" },
        { label: "b", text: "Saya lambat dalam mengambil Keputusan", dimension: "I" }
      ]
    },
    {
      question_number: 64,
      question_text: "a. Biasanya saya makan dengan cepat\nb. Saya suka membaca",
      options: [
        { label: "a", text: "Biasanya saya makan dengan cepat", dimension: "A" },
        { label: "b", text: "Saya suka membaca", dimension: "I" }
      ]
    },
    {
      question_number: 65,
      question_text: "a. Saya suka pekerjaan Dimana saya banyak bergerak\nb. Saya suka pekerjaan yang harus dilaksanakan dengan hati-hati",
      options: [
        { label: "a", text: "Saya suka pekerjaan Dimana saya banyak bergerak", dimension: "A" },
        { label: "b", text: "Saya suka pekerjaan yang harus dilaksanakan dengan hati-hati", dimension: "P" }
      ]
    },
    {
      question_number: 66,
      question_text: "a. Saya mudah membuat sebanyak mungkin teman\nb. Saya mudah menemukan kembali barang-barang yang saya simpan",
      options: [
        { label: "a", text: "Saya mudah membuat sebanyak mungkin teman", dimension: "S" },
        { label: "b", text: "Saya mudah menemukan kembali barang-barang yang saya simpan", dimension: "P" }
      ]
    },
    {
      question_number: 67,
      question_text: "a. Saya membuat rencana jauh-jauh sebelumnya\nb. Saya selalu menyenangkan",
      options: [
        { label: "a", text: "Saya membuat rencana jauh-jauh sebelumnya", dimension: "I" },
        { label: "b", text: "Saya selalu menyenangkan", dimension: "G" }
      ]
    },
    {
      question_number: 68,
      question_text: "a. Saya menjunjung tinggi nama baik saya\nb. Saya terus menekuni suatu masalah sampai tuntas",
      options: [
        { label: "a", text: "Saya menjunjung tinggi nama baik saya", dimension: "T" },
        { label: "b", text: "Saya terus menekuni suatu masalah sampai tuntas", dimension: "P" }
      ]
    },
    {
      question_number: 69,
      question_text: "a. Saya suka menyenangkan orang-orang yang saya kagumi\nb. Saya ingin sukses",
      options: [
        { label: "a", text: "Saya suka menyenangkan orang-orang yang saya kagumi", dimension: "N" },
        { label: "b", text: "Saya ingin sukses", dimension: "A" }
      ]
    },
    {
      question_number: 70,
      question_text: "a. Saya suka orang lain mengambil Keputusan untuk kelompok\nb. Saya suka mengambil Keputusan untuk kelompok",
      options: [
        { label: "a", text: "Saya suka orang lain mengambil Keputusan untuk kelompok", dimension: "R" },
        { label: "b", text: "Saya suka mengambil Keputusan untuk kelompok", dimension: "L" }
      ]
    },
    {
      question_number: 71,
      question_text: "a. Saya selalu berusaha keras\nb. Saya mengambil Keputusan secara cepat dan mudah",
      options: [
        { label: "a", text: "Saya selalu berusaha keras", dimension: "A" },
        { label: "b", text: "Saya mengambil Keputusan secara cepat dan mudah", dimension: "I" }
      ]
    },
    {
      question_number: 72,
      question_text: "a. Kelompok biasanya melakukan apa yang saya inginkan\nb. Saya biasanya bekerja cepat-cepat",
      options: [
        { label: "a", text: "Kelompok biasanya melakukan apa yang saya inginkan", dimension: "L" },
        { label: "b", text: "Saya biasanya bekerja cepat-cepat", dimension: "A" }
      ]
    },
    {
      question_number: 73,
      question_text: "a. Saya sering merasa lelah\nb. Saya lambat dalam mengabil Keputusan",
      options: [
        { label: "a", text: "Saya sering merasa lelah", dimension: "A" },
        { label: "b", text: "Saya lambat dalam mengabil Keputusan", dimension: "I" }
      ]
    },
    {
      question_number: 74,
      question_text: "a. Saya bekerja cepat\nb. Saya mudah berteman",
      options: [
        { label: "a", text: "Saya bekerja cepat", dimension: "A" },
        { label: "b", text: "Saya mudah berteman", dimension: "S" }
      ]
    },
    {
      question_number: 75,
      question_text: "a. Saya biasanya mempunyai gairah dan tenaga\nb. Saya banyak menghabiskan waktu untuk berfikir",
      options: [
        { label: "a", text: "Saya biasanya mempunyai gairah dan tenaga", dimension: "A" },
        { label: "b", text: "Saya banyak menghabiskan waktu untuk berfikir", dimension: "I" }
      ]
    },
    {
      question_number: 76,
      question_text: "a. Saya sangat ramah terhadap orang\nb. Saya suka pekerjaan yang memerlukan ketelitian",
      options: [
        { label: "a", text: "Saya sangat ramah terhadap orang", dimension: "S" },
        { label: "b", text: "Saya suka pekerjaan yang memerlukan ketelitian", dimension: "P" }
      ]
    },
    {
      question_number: 77,
      question_text: "a. Saya banyak berfikir dan membuat perencanaan\nb. Saya menyimpan sesuatu pada tempatnya",
      options: [
        { label: "a", text: "Saya banyak berfikir dan membuat perencanaan", dimension: "I" },
        { label: "b", text: "Saya menyimpan sesuatu pada tempatnya", dimension: "P" }
      ]
    },
    {
      question_number: 78,
      question_text: "a. Saya suka pekerjaan yang menuntut perhatian terhadap hal detail.\nb. Saya tidak mudah marah",
      options: [
        { label: "a", text: "Saya suka pekerjaan yang menuntut perhatian terhadap hal detail", dimension: "P" },
        { label: "b", text: "Saya tidak mudah marah", dimension: "F" }
      ]
    },
    {
      question_number: 79,
      question_text: "a. Saya suka menuruti orang yang saya kagumi\nb. Saya selalu menyelesaikan pekerjaan yang saya telah saya mulai",
      options: [
        { label: "a", text: "Saya suka menuruti orang yang saya kagumi", dimension: "R" },
        { label: "b", text: "Saya selalu menyelesaikan pekerjaan yang saya telah saya mulai", dimension: "P" }
      ]
    },
    {
      question_number: 80,
      question_text: "a. Saya suka petunjuk – petunjuk yang jelas\nb. Saya suka bekerja keras.",
      options: [
        { label: "a", text: "Saya suka petunjuk – petunjuk yang jelas", dimension: "P" },
        { label: "b", text: "Saya suka bekerja keras", dimension: "A" }
      ]
    },
    {
      question_number: 81,
      question_text: "a. Saya mngejar apa yang saya inginkan\nb. Saya seorang pemimpin yang baik",
      options: [
        { label: "a", text: "Saya mngejar apa yang saya inginkan", dimension: "A" },
        { label: "b", text: "Saya seorang pemimpin yang baik", dimension: "L" }
      ]
    },
    {
      question_number: 82,
      question_text: "a. Saya dapat membuat orang lain bekerja keras\nb. Saya adalah type orang yang tak kenal susah",
      options: [
        { label: "a", text: "Saya dapat membuat orang lain bekerja keras", dimension: "L" },
        { label: "b", text: "Saya adalah type orang yang tak kenal susah", dimension: "A" }
      ]
    },
    {
      question_number: 83,
      question_text: "a. Saya mengambil Keputusan dengan cepat\nb. Saya bicara dengan cepat",
      options: [
        { label: "a", text: "Saya mengambil Keputusan dengan cepat", dimension: "I" },
        { label: "b", text: "Saya bicara dengan cepat", dimension: "A" }
      ]
    },
    {
      question_number: 84,
      question_text: "a. Rasanya saya bekerja secara tergesa-gesa\nb. Saya berolah raga secara teratur",
      options: [
        { label: "a", text: "Rasanya saya bekerja secara tergesa-gesa", dimension: "A" },
        { label: "b", text: "Saya berolah raga secara teratur", dimension: "A" }
      ]
    },
    {
      question_number: 85,
      question_text: "a. saya tidak suka bertemu kebanyakan orang\nb. Saya cepat merasa lelah",
      options: [
        { label: "a", text: "saya tidak suka bertemu kebanyakan orang", dimension: "S" },
        { label: "b", text: "Saya cepat merasa lelah", dimension: "A" }
      ]
    },
    {
      question_number: 86,
      question_text: "a. Saya mempunyai banyak sekali teman\nb. Saya banyak menghabiskan waktu untuk berfikir",
      options: [
        { label: "a", text: "Saya mempunyai banyak sekali teman", dimension: "S" },
        { label: "b", text: "Saya banyak menghabiskan waktu untuk berfikir", dimension: "I" }
      ]
    },
    {
      question_number: 87,
      question_text: "a. Saya suka bekerja dengan teori\nb. Saya suka menangani detail suatu pekerjaan",
      options: [
        { label: "a", text: "Saya suka bekerja dengan teori", dimension: "I" },
        { label: "b", text: "Saya suka menangani detail suatu pekerjaan", dimension: "P" }
      ]
    },
    {
      question_number: 88,
      question_text: "a. Saya suka menangani detail suatu pekerjaan\nb. Saya Suka mengorganisir pekerjaan saya",
      options: [
        { label: "a", text: "Saya suka menangani detail suatu pekerjaan", dimension: "P" },
        { label: "b", text: "Saya Suka mengorganisir pekerjaan saya", dimension: "D" }
      ]
    },
    {
      question_number: 89,
      question_text: "a. Saya menaruh barang pada tempatnya\nb. Saya selalu menyenangkan",
      options: [
        { label: "a", text: "Saya menaruh barang pada tempatnya", dimension: "P" },
        { label: "b", text: "Saya selalu menyenangkan", dimension: "G" }
      ]
    },
    {
      question_number: 90,
      question_text: "a. Saya suka diberitahu apa yang perlu saya kerjakan\nb. Saya harus menyelesaikan pekerjaan yang telah saya mulai",
      options: [
        { label: "a", text: "Saya suka diberitahu apa yang perlu saya kerjakan", dimension: "R" },
        { label: "b", text: "Saya harus menyelesaikan pekerjaan yang telah saya mulai", dimension: "P" }
      ]
    }
  ];

  // Validate the complete scoring key before changing any database rows.
  // A valid 90-item PAPI profile has two options per item and each of the
  // 20 dimensions appears exactly nine times in the option key.
  const papiCodes = ["N", "G", "A", "L", "P", "I", "T", "V", "S", "B", "O", "X", "C", "D", "R", "Z", "E", "K", "F", "W"];
  const dimensionCounts = Object.fromEntries(papiCodes.map(code => [code, 0]));
  const unknownDimensions = [];

  questions.forEach(question => {
    question.options.forEach(option => {
      if (Object.prototype.hasOwnProperty.call(dimensionCounts, option.dimension)) {
        dimensionCounts[option.dimension] += 1;
      } else {
        unknownDimensions.push(option.dimension);
      }
    });
  });

  const invalidCounts = papiCodes
    .filter(code => dimensionCounts[code] !== 9)
    .map(code => `${code}=${dimensionCounts[code]}`);
  const optionCount = questions.reduce((total, question) => total + question.options.length, 0);
  const validationErrors = [
    questions.length === 90 ? null : `jumlah soal=${questions.length} (seharusnya 90)`,
    optionCount === 180 ? null : `jumlah opsi=${optionCount} (seharusnya 180)`,
    unknownDimensions.length === 0 ? null : `kode tidak dikenal=${[...new Set(unknownDimensions)].join(', ')}`,
    invalidCounts.length === 0 ? null : `distribusi dimensi tidak seimbang: ${invalidCounts.join(', ')}`
  ].filter(Boolean);

  if (validationErrors.length > 0) {
    throw new Error(
      `PAPI seed dibatalkan sebelum database diubah. ${validationErrors.join('; ')}`
    );
  }

  // Delete only after the complete replacement key has passed validation.
  console.log('Deleting existing questions...');
  const { data: existingQuestions, error: existingQuestionsError } = await supabase
    .from('test_questions')
    .select('id')
    .eq('instrument_id', papikostikTest.id);

  if (existingQuestionsError) throw existingQuestionsError;

  if (existingQuestions && existingQuestions.length > 0) {
    const questionIds = existingQuestions.map(q => q.id);
    const { error: optionDeleteError } = await supabase
      .from('test_question_options')
      .delete()
      .in('question_id', questionIds);
    if (optionDeleteError) throw optionDeleteError;

    const { error: questionDeleteError } = await supabase
      .from('test_questions')
      .delete()
      .eq('instrument_id', papikostikTest.id);
    if (questionDeleteError) throw questionDeleteError;
  }
  
  // Insert questions and options
  let insertedCount = 0;
  
  for (const q of questions) {
    // Insert question
    const { data: questionData, error: questionError } = await supabase
      .from('test_questions')
      .insert({
        instrument_id: papikostikTest.id,
        question_number: q.question_number,
        question_text: q.question_text,
        question_text_en: q.question_text,
        category: 'PAPIKOSTIK',
        question_type: 'single_choice',
        scoring_rule: 'papikostik_dimension'
      })
      .select()
      .single();
    
    if (questionError) {
      console.error(`Error inserting question ${q.question_number}:`, questionError);
      continue;
    }
    
    // Insert options with dimension mapping
    const optionsToInsert = q.options.map((opt, idx) => ({
      question_id: questionData.id,
      option_label: opt.label,
      option_text: opt.text,
      option_text_en: opt.text,
      score_value: 1,
      category_target: opt.dimension, // Store PAPIKOSTIK dimension (A-Z)
      is_correct: null, // PAPIKOSTIK doesn't have correct answers, just dimensions
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
  
  // Update instrument question count and remove time limit (no time limit for PAPIKOSTIK)
  await supabase
    .from('test_instruments')
    .update({ question_count: 90, duration_minutes: null })
    .eq('id', papikostikTest.id);
  
  console.log(`\n✅ Successfully inserted ${insertedCount} PAPIKOSTIK questions!`);
  console.log('All answers mapped to PAPIKOSTIK dimensions (A-Z)');
  console.log('Time limit removed (no time limit for PAPIKOSTIK)');
}

updatePAPIKOSTIKQuestions();
