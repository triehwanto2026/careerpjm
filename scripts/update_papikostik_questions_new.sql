-- Update PAPIKOSTIK questions with new text and category targets
-- Run this in Supabase SQL Editor

-- First, let's check current PAPIKOSTIK questions
SELECT 
  q.id,
  q.question_number,
  q.question_text,
  o.option_label,
  o.option_text,
  o.category_target
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
JOIN test_instruments ti ON q.instrument_id = ti.id
WHERE ti.name ILIKE '%papikostik%'
ORDER BY q.question_number, o.option_label
LIMIT 20;

-- Update instruction text for question 1 (which contains the full instruction)
UPDATE test_questions q
SET question_text = 'SOAL PAPI Kostick
PETUNJUK PENGISIAN
1. Dalam Lembar ini terdapat 90 pertanyaan. (Tidak ada batasan waktu)
2. Semua pilihan dalam lembar ini bukanlah bersifat BENAR atau SALAH, jadi TIDAK ADA JAWABAN YANG SALAH
3. Anda harus memilih dengan milingkari memberi jawaban a atau b dari dua pernyataan yang terdapat dalam 90 pernyataan tersebut.
4. Pernyataan yang dimaksud adalah pernyataan paling dominant atau paling mencerminkan diri anda atau menggambarkan perasaan anda saat ini.
5. Terkadang anda akan menemukan pernyataan yang keduanya tidak mencerminkan atau anda tidak sesuai dengan kedua pernyataan tersebut, dalam hal ini anda tetap harus memilih salah satu pernyataan tersebut yang paling mencermikan diri anda.
6. Dalam kasus yang lain anda akan menemukan pernytaan yang keduanya mencerminkan diri anda, dalam hal ini anda harus tetap memilih salah satu dari kedua pernytaan tersebut – yang paling mencerminkan diri anda.
7. Cara menjawabnya anda harus memberikan pernyataan a atau b dari setiap nomor yang terdapat pada pernyataan.
8. Sebagai contoh ;
a. Saya Seorang Pekerja Giat……
b. Saya Bukan seorang pemurung …..
bila anda merasa bahwa pernyataan pertama "Saya seorang pejerja giat" lebih mencerminkan diri anda saat ini ketimbang pernyataan kedua "Saya Bukan seorang pemurung ….." maka tulislah a dengan huruf Kapital (A) pada lembar jawab no 1 begitu pula sebaliknya.
Bila salah dan ingin mengganti pernyataan beri tanda X apda jawaban , kemudian tulis jawaban yang sesuai dengan diri anda.
Perhatian ; seluruh pertanyaan harus di jawab. Perhatikan lagi dengan seksama.

SOAL
1. a. Saya seorang pekerja giat
b. Saya Bukan Seorang Pemurung'
WHERE q.question_number = 1
  AND q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%papikostik%' LIMIT 1);

-- Update question texts for questions 2-90
UPDATE test_questions q
SET question_text = 
  CASE q.question_number
    WHEN 2 THEN '2. a. Saya suka bekerja lebih baik dari yang lain
b. Saya melakukan pekerjaan hingga tuntas'
    WHEN 3 THEN '3. a. Saya suka memberi orang petunjuk bagaimana melakukan sesuatu.
b. Saya senang memberitahukan orang apa yang harus dikerjakan'
    WHEN 4 THEN '4. a. Saya suka melakukan atau mengatakan hal-hal lucu.
b. Saya senang memberitahukan orang apa yang harus dikerjakan'
    WHEN 5 THEN '5. a. Saya suka menggabungkan diri dalam kelompok
b. Saya ingin diperhatikan dalam kelompok.'
    WHEN 6 THEN '6. a. Saya suka Menjalin persahabatan
b. Saya suka menggabungkan diri dalam suatu kelompok'
    WHEN 7 THEN '7. a. Jika saya rasa perlu, saya bisa cepat menyesuaikan diri
b. Saya berusaha Menjalin persahabatan'
    WHEN 8 THEN '8. a. Saya akan membalas jika saya di sakiti
b. Saya suka melakukan hal-hal baru dan berbeda'
    WHEN 9 THEN '9. a. Saya ingin atasan menyukai saya
b. Saya suka memberitahukan orang jika mereka bersalah.'
    WHEN 10 THEN '10. a. Saya suka mengikuti petunjuk yang di berikan kepada saya
b. Saya suka membuat atasan senang'
    WHEN 11 THEN '11. a. Saya berusaha keras sekali
b. Saya seorang yang rapih'
    WHEN 12 THEN '12. a. Saya dapat membuat orang melakukan apa yang saya inginkan
b. Saya tidak mudah marah.'
    WHEN 13 THEN '13. a. Saya suka memberitahu kelompok apa yang harus mereka kerjakan.
b. Saya selalu melakukan pekerjaan sampai tuntas.'
    WHEN 14 THEN '14. a. Saya ingin menjadi orang yang menarik dan mengasyikan.
b. Saya ingin menjadi orang yang sangat berhasil'
    WHEN 15 THEN '15. a. Saya ingin dapat menyesuaikan diri dengan kelompok-kelompok
b. Saya suka membantu orang mengambil keputusan'
    WHEN 16 THEN '16. a. Saya cemas bila seseorang tidak menyukai saya
b. Saya suka orang memperhatikan saya'
    WHEN 17 THEN '17. a. Saya suka mencoba hal-hal baru
b. Saya lebih suka bekerja sama daripada bekerja Sendiri'
    WHEN 18 THEN '18. a. Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres. b. Saya merasa terganggu bila ada yang tidak menyukai saya.'
    WHEN 19 THEN '19. a. Saya suka menyenangkan atasan
b. Saya suka mencoba pekerjaan – pekerjaan yang baru dan berbeda.'
    WHEN 20 THEN '20. a. Saya menyukai petunjuk-petujuk yang rinci dalam menyelesaikan pekerjaan
b. Akan saya katakan kepada orang-orang yang bersangkutan bila mereka menjengkelkan saya'
    WHEN 21 THEN '21. a. Saya selalu berusaha keras
b. Saya suka Melaksanakan Setiap langkah dengan hati-hati'
    WHEN 22 THEN '22. a. Saya akan menjadi seorang pemimpin yang baik
b. Saya dapat mengorganisir suatu pekerjaan dengan baik.'
    WHEN 23 THEN '23. a. saya mudah tersinggung
b. Saya lambat dalam membuat keputusan'
    WHEN 24 THEN '24. a. Saya suka mengerjakan beberapa pekerjaan sekaligus
b. Bila saya dalam kelompok, saya lebih sering sebagai pendengar.'
    WHEN 25 THEN '25. a. Saya sangat senang bila mendapat undangan
b. Saya ingin lebih baik dari yang lain dalam mengerjakan sesuatu.'
    WHEN 26 THEN '26. a. Saya suka Menjalin persahabatan
b. Saya suka menasehati orang lain'
    WHEN 27 THEN '27. a. Saya suka melakukan hal-hal baru dan berbeda
b. Saya suka memberitahu bagaimana saya berhasil dalam melakukan sesuatu'
    WHEN 28 THEN '28. a. Bila pendapat saya benar, saya akan pertahankan
b. Saya ingin diterima dan diakui dalam kelompok'
    WHEN 29 THEN '29. a. Saya tak mau menjadi lain dari yang lain
b. Saya berusaha dekat dengan orang-orang'
    WHEN 30 THEN '30. a. Saya senang memberitahu orang bagaimana melakukan suatu pekerjaan
b. Saya berusaha dekat dengan orang – orang'
    WHEN 31 THEN '31. a. Saya bekerja keras
b. Saya banyak berfikir dan membuat perencanaan'
    WHEN 32 THEN '32. a. Saya memimpin kelompok
b. Saya tertarik dengan hal-hal yang lebih detail'
    WHEN 33 THEN '33. a. Saya mengambil Keputusan dengan mudah dan cepat
b. Saya menyimpan barang-barang dengan rapih dan teratur'
    WHEN 34 THEN '34. a. Saya melakukan pekerjaan dengan cepat
b. Saya tidak sering marah atau sedih'
    WHEN 35 THEN '35. a. Saya ingin menjadi bagian dari kelompok
b. Saya hanya ingin melakukan pekerjaan pada satu waktu'
    WHEN 36 THEN '36. a. Saya berusaha Menjalin persahabatan
b. Saya berusaha keras menjadi yang terbaik'
    WHEN 37 THEN '37. a. Saya suka mode terbaru untuk pakaian
b. Saya suka di beri tanggungjawab.'
    WHEN 38 THEN '38. a. Saya menyukai perdebatan
b. Saya senang mendapat perhatian'
    WHEN 39 THEN '39. a. Saya suka menyenangkan atasan
b. Saya tertarik menjadi bagian dalam kelompok'
    WHEN 40 THEN '40. a. Saya sangat memperhatikan peraturan
b. Saya ingin orang mengenal saya dengan baik'
    WHEN 41 THEN '41. a. Saya berusaha keras sekali
b. Saya sangat ramah'
    WHEN 42 THEN '42. a. Orang berpendapat saya memimpin dengan baik
b. Saya berfikir lama dan berhati – hati'
    WHEN 43 THEN '43. a. Bila ada kesempatan, saya akan memanfaatkan nya.
b. Saya senang menangani hal-hal kecil'
    WHEN 44 THEN '44. a. Orang berpendapat bahwa saya bekerja cepat
b. Orang berpendapat bahwa saya rapi dan teratur'
    WHEN 45 THEN '45. a. Saya senang mengikuti pertandingan dan berolahraga.
b. Saya memiliki kepribadian yang menyenangkan'
    WHEN 46 THEN '46. a. Saya senang jika orang dekat dan bersahabat dengan saya
b. Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai'
    WHEN 47 THEN '47. a. Saya senang bereksperimen dan mencoba hal-hal baru
b. Saya suka mengerjakan pekerjaan yang sulit-sulit'
    WHEN 48 THEN '48. a. Saya suka diperlakukan dengan adil
b. Saya suka memberitahu orang lain bagaimana Melaksanakan sesuatu.'
    WHEN 49 THEN '49. a. Saya suka melakukan apa yang diharapkan orang dari saya.
b. Saya suka jika orang perduli terhadap saya'
    WHEN 50 THEN '50. a. Saya suka diterangkan tugas saya sedetail-detailnya
b. Saya senang berada bersama orang-orang'
    WHEN 51 THEN '51. a. Saya selalu berusaha menyelesaikan pekerjaan dengan sempurna.
b. Orang mengatakan bahwa saya hampir-hampir tidak pernah lelah.'
    WHEN 52 THEN '52. a. Saya tipe pemimpin
b. Saya mudah bergaul'
    WHEN 53 THEN '53. a. Saya gunakan kesempatan
b. Saya banyak sekali berfikir'
    WHEN 54 THEN '54. a. Saya bekerja dengan tempo yang tinggi dan mantap
b. Saya senang menangani detail suatu pekerjaan'
    WHEN 55 THEN '55. a. Saya memiliki banyak tenaga untuk kegiatan dan berolah raga.
b. Saya mengatur dan menyimpan barang dengan teratur dan rapi.'
    WHEN 56 THEN '56. a. Saya dapat bergaul baik dengan semua orang
b. Saya orang yang berwatak tenang'
    WHEN 57 THEN '57. a. Saya ingin bertemu dengan orang-orang baru dan melakukan hal-hal baru.
b. Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai'
    WHEN 58 THEN '58. a. Saya biasanya mempertahankan pendapat yang saya yakini.
b. Saya biasanya suka bekerja keras.'
    WHEN 59 THEN '59. a. Saya menyambut baik saran-saran dari orang yang saya kagumi.
b. Saya suka bertanggung jawab terhadap orang lain'
    WHEN 60 THEN '60. a. Saya membiarkan diri saya dipengaruhi dengan kuat oleh orang lain
b. Saya senang bila memperoleh banyak perhatian'
    WHEN 61 THEN '61. a. Biasanya saya bekerja keras sekali.
b. Biasanya saya bekerja cepat'
    WHEN 62 THEN '62. a. Apabila saya bicara, kelompok diam dan mendengarkan
b. Saya trampil menggunakan perkakas'
    WHEN 63 THEN '63. a. Saya lambat dalam membuat persahabatan
b. Saya lambat dalam mengambil Keputusan'
    WHEN 64 THEN '64. a. Biasanya saya makan dengan cepat
b. Saya suka membaca'
    WHEN 65 THEN '65. a. Saya suka pekerjaan Dimana saya banyak bergerak
b. Saya suka pekerjaan yang harus dilaksanakan dengan hati-hati'
    WHEN 66 THEN '66. a. Saya mudah membuat sebanyak mungkin teman
b. Saya mudah menemukan kembali barang-barang yang saya simpan'
    WHEN 67 THEN '67. a. Saya membuat rencana jauh-jauh sebelumnya
b. Saya selalu menyenangkan'
    WHEN 68 THEN '68. a. Saya menjunjung tinggi nama baik saya
b. Saya terus menekuni suatu masalah sampai tuntas'
    WHEN 69 THEN '69. a. Saya suka menyenangkan orang-orang yang saya kagumi
b. Saya ingin sukses'
    WHEN 70 THEN '70. a. Saya suka orang lain mengambil Keputusan untuk kelompok
b. Saya suka mengambil Keputusan untuk kelompok'
    WHEN 71 THEN '71. a. Saya selalu berusaha keras
b. Saya mengambil Keputusan secara cepat dan mudah'
    WHEN 72 THEN '72. a. Kelompok biasanya melakukan apa yang saya inginkan
b. Saya biasanya bekerja cepat-cepat'
    WHEN 73 THEN '73. a. Saya sering merasa lelah
b. Saya lambat dalam mengabil Keputusan'
    WHEN 74 THEN '74. a. Saya bekerja cepat
b. Saya mudah berteman'
    WHEN 75 THEN '75. a. Saya biasanya mempunyai gairah dan tenaga
b. Saya banyak menghabiskan waktu untuk berfikir'
    WHEN 76 THEN '76. a. Saya sangat ramah terhadap orang
b. Saya suka pekerjaan yang memerlukan ketelitian'
    WHEN 77 THEN '77. a. Saya banyak berfikir dan membuat perencanaan
b. Saya menyimpan sesuatu pada tempatnya'
    WHEN 78 THEN '78. a. Saya suka pekerjaan yang menuntut perhatian terhadap hal detail.
b. Saya tidak mudah marah'
    WHEN 79 THEN '79. a. Saya suka menuruti orang yang saya kagumi
b. Saya selalu menyelesaikan pekerjaan yang saya telah saya mulai'
    WHEN 80 THEN '80. a. Saya suka petunjuk – petunjuk yang jelas
b. Saya suka bekerja keras.'
    WHEN 81 THEN '81. a. Saya mngejar apa yang saya inginkan
b. Saya seorang pemimpin yang baik'
    WHEN 82 THEN '82. a. Saya dapat membuat orang lain bekerja keras
b. Saya adalah type orang yang tak kenal susah'
    WHEN 83 THEN '83. a. Saya mengambil Keputusan dengan cepat
b. Saya bicara dengan cepat'
    WHEN 84 THEN '84. a. Rasanya saya bekerja secara tergesa-gesa
b. Saya berolah raga secara teratur'
    WHEN 85 THEN '85. a. saya tidak suka bertemu kebanyakan orang
b. Saya cepat merasa lelah'
    WHEN 86 THEN '86. a. Saya mempunyai banyak sekali teman
b. Saya banyak menghabiskan waktu untuk berfikir'
    WHEN 87 THEN '87. a. Saya suka bekerja dengan teori
b. Saya suka menangani detail suatu pekerjaan'
    WHEN 88 THEN '88. a. Saya suka menangani detail suatu pekerjaan
b. Saya Suka mengorganisir pekerjaan saya'
    WHEN 89 THEN '89. a. Saya menaruh barang pada tempatnya
b. Saya selalu menyenangkan'
    WHEN 90 THEN '90. a. Saya suka diberitahu apa yang perlu saya kerjakan
b. Saya harus menyelesaikan pekerjaan yang telah saya mulai'
    ELSE q.question_text
  END
WHERE q.instrument_id = (SELECT id FROM test_instruments WHERE name ILIKE '%papikostik%' LIMIT 1)
  AND q.question_number BETWEEN 2 AND 90;

-- Update option texts and category targets
WITH pap AS (
  SELECT id FROM test_instruments WHERE name ILIKE '%papikostik%' LIMIT 1
)
UPDATE test_question_options o
SET 
  option_text = CASE
    WHEN q.question_number = 1 AND o.option_label = 'a' THEN 'Saya seorang pekerja giat'
    WHEN q.question_number = 1 AND o.option_label = 'b' THEN 'Saya Bukan Seorang Pemurung'
    WHEN q.question_number = 2 AND o.option_label = 'a' THEN 'Saya suka bekerja lebih baik dari yang lain'
    WHEN q.question_number = 2 AND o.option_label = 'b' THEN 'Saya melakukan pekerjaan hingga tuntas'
    WHEN q.question_number = 3 AND o.option_label = 'a' THEN 'Saya suka memberi orang petunjuk bagaimana melakukan sesuatu.'
    WHEN q.question_number = 3 AND o.option_label = 'b' THEN 'Saya senang memberitahukan orang apa yang harus dikerjakan'
    WHEN q.question_number = 4 AND o.option_label = 'a' THEN 'Saya suka melakukan atau mengatakan hal-hal lucu.'
    WHEN q.question_number = 4 AND o.option_label = 'b' THEN 'Saya senang memberitahukan orang apa yang harus dikerjakan'
    WHEN q.question_number = 5 AND o.option_label = 'a' THEN 'Saya suka menggabungkan diri dalam kelompok'
    WHEN q.question_number = 5 AND o.option_label = 'b' THEN 'Saya ingin diperhatikan dalam kelompok.'
    WHEN q.question_number = 6 AND o.option_label = 'a' THEN 'Saya suka Menjalin persahabatan'
    WHEN q.question_number = 6 AND o.option_label = 'b' THEN 'Saya suka menggabungkan diri dalam suatu kelompok'
    WHEN q.question_number = 7 AND o.option_label = 'a' THEN 'Jika saya rasa perlu, saya bisa cepat menyesuaikan diri'
    WHEN q.question_number = 7 AND o.option_label = 'b' THEN 'Saya berusaha Menjalin persahabatan'
    WHEN q.question_number = 8 AND o.option_label = 'a' THEN 'Saya akan membalas jika saya di sakiti'
    WHEN q.question_number = 8 AND o.option_label = 'b' THEN 'Saya suka melakukan hal-hal baru dan berbeda'
    WHEN q.question_number = 9 AND o.option_label = 'a' THEN 'Saya ingin atasan menyukai saya'
    WHEN q.question_number = 9 AND o.option_label = 'b' THEN 'Saya suka memberitahukan orang jika mereka bersalah.'
    WHEN q.question_number = 10 AND o.option_label = 'a' THEN 'Saya suka mengikuti petunjuk yang di berikan kepada saya'
    WHEN q.question_number = 10 AND o.option_label = 'b' THEN 'Saya suka membuat atasan senang'
    WHEN q.question_number = 11 AND o.option_label = 'a' THEN 'Saya berusaha keras sekali'
    WHEN q.question_number = 11 AND o.option_label = 'b' THEN 'Saya seorang yang rapih'
    WHEN q.question_number = 12 AND o.option_label = 'a' THEN 'Saya dapat membuat orang melakukan apa yang saya inginkan'
    WHEN q.question_number = 12 AND o.option_label = 'b' THEN 'Saya tidak mudah marah.'
    WHEN q.question_number = 13 AND o.option_label = 'a' THEN 'Saya suka memberitahu kelompok apa yang harus mereka kerjakan.'
    WHEN q.question_number = 13 AND o.option_label = 'b' THEN 'Saya selalu melakukan pekerjaan sampai tuntas.'
    WHEN q.question_number = 14 AND o.option_label = 'a' THEN 'Saya ingin menjadi orang yang menarik dan mengasyikan.'
    WHEN q.question_number = 14 AND o.option_label = 'b' THEN 'Saya ingin menjadi orang yang sangat berhasil'
    WHEN q.question_number = 15 AND o.option_label = 'a' THEN 'Saya ingin dapat menyesuaikan diri dengan kelompok-kelompok'
    WHEN q.question_number = 15 AND o.option_label = 'b' THEN 'Saya suka membantu orang mengambil keputusan'
    WHEN q.question_number = 16 AND o.option_label = 'a' THEN 'Saya cemas bila seseorang tidak menyukai saya'
    WHEN q.question_number = 16 AND o.option_label = 'b' THEN 'Saya suka orang memperhatikan saya'
    WHEN q.question_number = 17 AND o.option_label = 'a' THEN 'Saya suka mencoba hal-hal baru'
    WHEN q.question_number = 17 AND o.option_label = 'b' THEN 'Saya lebih suka bekerja sama daripada bekerja Sendiri'
    WHEN q.question_number = 18 AND o.option_label = 'a' THEN 'Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres.'
    WHEN q.question_number = 18 AND o.option_label = 'b' THEN 'Saya merasa terganggu bila ada yang tidak menyukai saya.'
    WHEN q.question_number = 19 AND o.option_label = 'a' THEN 'Saya suka menyenangkan atasan'
    WHEN q.question_number = 19 AND o.option_label = 'b' THEN 'Saya suka mencoba pekerjaan – pekerjaan yang baru dan berbeda.'
    WHEN q.question_number = 20 AND o.option_label = 'a' THEN 'Saya menyukai petunjuk-petujuk yang rinci dalam menyelesaikan pekerjaan'
    WHEN q.question_number = 20 AND o.option_label = 'b' THEN 'Akan saya katakan kepada orang-orang yang bersangkutan bila mereka menjengkelkan saya'
    WHEN q.question_number = 21 AND o.option_label = 'a' THEN 'Saya selalu berusaha keras'
    WHEN q.question_number = 21 AND o.option_label = 'b' THEN 'Saya suka Melaksanakan Setiap langkah dengan hati-hati'
    WHEN q.question_number = 22 AND o.option_label = 'a' THEN 'Saya akan menjadi seorang pemimpin yang baik'
    WHEN q.question_number = 22 AND o.option_label = 'b' THEN 'Saya dapat mengorganisir suatu pekerjaan dengan baik.'
    WHEN q.question_number = 23 AND o.option_label = 'a' THEN 'saya mudah tersinggung'
    WHEN q.question_number = 23 AND o.option_label = 'b' THEN 'Saya lambat dalam membuat keputusan'
    WHEN q.question_number = 24 AND o.option_label = 'a' THEN 'Saya suka mengerjakan beberapa pekerjaan sekaligus'
    WHEN q.question_number = 24 AND o.option_label = 'b' THEN 'Bila saya dalam kelompok, saya lebih sering sebagai pendengar.'
    WHEN q.question_number = 25 AND o.option_label = 'a' THEN 'Saya sangat senang bila mendapat undangan'
    WHEN q.question_number = 25 AND o.option_label = 'b' THEN 'Saya ingin lebih baik dari yang lain dalam mengerjakan sesuatu.'
    WHEN q.question_number = 26 AND o.option_label = 'a' THEN 'Saya suka Menjalin persahabatan'
    WHEN q.question_number = 26 AND o.option_label = 'b' THEN 'Saya suka menasehati orang lain'
    WHEN q.question_number = 27 AND o.option_label = 'a' THEN 'Saya suka melakukan hal-hal baru dan berbeda'
    WHEN q.question_number = 27 AND o.option_label = 'b' THEN 'Saya suka memberitahu bagaimana saya berhasil dalam melakukan sesuatu'
    WHEN q.question_number = 28 AND o.option_label = 'a' THEN 'Bila pendapat saya benar, saya akan pertahankan'
    WHEN q.question_number = 28 AND o.option_label = 'b' THEN 'Saya ingin diterima dan diakui dalam kelompok'
    WHEN q.question_number = 29 AND o.option_label = 'a' THEN 'Saya tak mau menjadi lain dari yang lain'
    WHEN q.question_number = 29 AND o.option_label = 'b' THEN 'Saya berusaha dekat dengan orang-orang'
    WHEN q.question_number = 30 AND o.option_label = 'a' THEN 'Saya senang memberitahu orang bagaimana melakukan suatu pekerjaan'
    WHEN q.question_number = 30 AND o.option_label = 'b' THEN 'Saya berusaha dekat dengan orang – orang'
    WHEN q.question_number = 31 AND o.option_label = 'a' THEN 'Saya bekerja keras'
    WHEN q.question_number = 31 AND o.option_label = 'b' THEN 'Saya banyak berfikir dan membuat perencanaan'
    WHEN q.question_number = 32 AND o.option_label = 'a' THEN 'Saya memimpin kelompok'
    WHEN q.question_number = 32 AND o.option_label = 'b' THEN 'Saya tertarik dengan hal-hal yang lebih detail'
    WHEN q.question_number = 33 AND o.option_label = 'a' THEN 'Saya mengambil Keputusan dengan mudah dan cepat'
    WHEN q.question_number = 33 AND o.option_label = 'b' THEN 'Saya menyimpan barang-barang dengan rapih dan teratur'
    WHEN q.question_number = 34 AND o.option_label = 'a' THEN 'Saya melakukan pekerjaan dengan cepat'
    WHEN q.question_number = 34 AND o.option_label = 'b' THEN 'Saya tidak sering marah atau sedih'
    WHEN q.question_number = 35 AND o.option_label = 'a' THEN 'Saya ingin menjadi bagian dari kelompok'
    WHEN q.question_number = 35 AND o.option_label = 'b' THEN 'Saya hanya ingin melakukan pekerjaan pada satu waktu'
    WHEN q.question_number = 36 AND o.option_label = 'a' THEN 'Saya berusaha Menjalin persahabatan'
    WHEN q.question_number = 36 AND o.option_label = 'b' THEN 'Saya berusaha keras menjadi yang terbaik'
    WHEN q.question_number = 37 AND o.option_label = 'a' THEN 'Saya suka mode terbaru untuk pakaian'
    WHEN q.question_number = 37 AND o.option_label = 'b' THEN 'Saya suka di beri tanggungjawab.'
    WHEN q.question_number = 38 AND o.option_label = 'a' THEN 'Saya menyukai perdebatan'
    WHEN q.question_number = 38 AND o.option_label = 'b' THEN 'Saya senang mendapat perhatian'
    WHEN q.question_number = 39 AND o.option_label = 'a' THEN 'Saya suka menyenangkan atasan'
    WHEN q.question_number = 39 AND o.option_label = 'b' THEN 'Saya tertarik menjadi bagian dalam kelompok'
    WHEN q.question_number = 40 AND o.option_label = 'a' THEN 'Saya sangat memperhatikan peraturan'
    WHEN q.question_number = 40 AND o.option_label = 'b' THEN 'Saya ingin orang mengenal saya dengan baik'
    WHEN q.question_number = 41 AND o.option_label = 'a' THEN 'Saya berusaha keras sekali'
    WHEN q.question_number = 41 AND o.option_label = 'b' THEN 'Saya sangat ramah'
    WHEN q.question_number = 42 AND o.option_label = 'a' THEN 'Orang berpendapat saya memimpin dengan baik'
    WHEN q.question_number = 42 AND o.option_label = 'b' THEN 'Saya berfikir lama dan berhati – hati'
    WHEN q.question_number = 43 AND o.option_label = 'a' THEN 'Bila ada kesempatan, saya akan memanfaatkan nya.'
    WHEN q.question_number = 43 AND o.option_label = 'b' THEN 'Saya senang menangani hal-hal kecil'
    WHEN q.question_number = 44 AND o.option_label = 'a' THEN 'Orang berpendapat bahwa saya bekerja cepat'
    WHEN q.question_number = 44 AND o.option_label = 'b' THEN 'Orang berpendapat bahwa saya rapi dan teratur'
    WHEN q.question_number = 45 AND o.option_label = 'a' THEN 'Saya senang mengikuti pertandingan dan berolahraga.'
    WHEN q.question_number = 45 AND o.option_label = 'b' THEN 'Saya memiliki kepribadian yang menyenangkan'
    WHEN q.question_number = 46 AND o.option_label = 'a' THEN 'Saya senang jika orang dekat dan bersahabat dengan saya'
    WHEN q.question_number = 46 AND o.option_label = 'b' THEN 'Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai'
    WHEN q.question_number = 47 AND o.option_label = 'a' THEN 'Saya senang bereksperimen dan mencoba hal-hal baru'
    WHEN q.question_number = 47 AND o.option_label = 'b' THEN 'Saya suka mengerjakan pekerjaan yang sulit-sulit'
    WHEN q.question_number = 48 AND o.option_label = 'a' THEN 'Saya suka diperlakukan dengan adil'
    WHEN q.question_number = 48 AND o.option_label = 'b' THEN 'Saya suka memberitahu orang lain bagaimana Melaksanakan sesuatu.'
    WHEN q.question_number = 49 AND o.option_label = 'a' THEN 'Saya suka melakukan apa yang diharapkan orang dari saya.'
    WHEN q.question_number = 49 AND o.option_label = 'b' THEN 'Saya suka jika orang perduli terhadap saya'
    WHEN q.question_number = 50 AND o.option_label = 'a' THEN 'Saya suka diterangkan tugas saya sedetail-detailnya'
    WHEN q.question_number = 50 AND o.option_label = 'b' THEN 'Saya senang berada bersama orang-orang'
    WHEN q.question_number = 51 AND o.option_label = 'a' THEN 'Saya selalu berusaha menyelesaikan pekerjaan dengan sempurna.'
    WHEN q.question_number = 51 AND o.option_label = 'b' THEN 'Orang mengatakan bahwa saya hampir-hampir tidak pernah lelah.'
    WHEN q.question_number = 52 AND o.option_label = 'a' THEN 'Saya tipe pemimpin'
    WHEN q.question_number = 52 AND o.option_label = 'b' THEN 'Saya mudah bergaul'
    WHEN q.question_number = 53 AND o.option_label = 'a' THEN 'Saya gunakan kesempatan'
    WHEN q.question_number = 53 AND o.option_label = 'b' THEN 'Saya banyak sekali berfikir'
    WHEN q.question_number = 54 AND o.option_label = 'a' THEN 'Saya bekerja dengan tempo yang tinggi dan mantap'
    WHEN q.question_number = 54 AND o.option_label = 'b' THEN 'Saya senang menangani detail suatu pekerjaan'
    WHEN q.question_number = 55 AND o.option_label = 'a' THEN 'Saya memiliki banyak tenaga untuk kegiatan dan berolah raga.'
    WHEN q.question_number = 55 AND o.option_label = 'b' THEN 'Saya mengatur dan menyimpan barang dengan teratur dan rapi.'
    WHEN q.question_number = 56 AND o.option_label = 'a' THEN 'Saya dapat bergaul baik dengan semua orang'
    WHEN q.question_number = 56 AND o.option_label = 'b' THEN 'Saya orang yang berwatak tenang'
    WHEN q.question_number = 57 AND o.option_label = 'a' THEN 'Saya ingin bertemu dengan orang-orang baru dan melakukan hal-hal baru.'
    WHEN q.question_number = 57 AND o.option_label = 'b' THEN 'Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai'
    WHEN q.question_number = 58 AND o.option_label = 'a' THEN 'Saya biasanya mempertahankan pendapat yang saya yakini.'
    WHEN q.question_number = 58 AND o.option_label = 'b' THEN 'Saya biasanya suka bekerja keras.'
    WHEN q.question_number = 59 AND o.option_label = 'a' THEN 'Saya menyambut baik saran-saran dari orang yang saya kagumi.'
    WHEN q.question_number = 59 AND o.option_label = 'b' THEN 'Saya suka bertanggung jawab terhadap orang lain'
    WHEN q.question_number = 60 AND o.option_label = 'a' THEN 'Saya membiarkan diri saya dipengaruhi dengan kuat oleh orang lain'
    WHEN q.question_number = 60 AND o.option_label = 'b' THEN 'Saya senang bila memperoleh banyak perhatian'
    WHEN q.question_number = 61 AND o.option_label = 'a' THEN 'Biasanya saya bekerja keras sekali.'
    WHEN q.question_number = 61 AND o.option_label = 'b' THEN 'Biasanya saya bekerja cepat'
    WHEN q.question_number = 62 AND o.option_label = 'a' THEN 'Apabila saya bicara, kelompok diam dan mendengarkan'
    WHEN q.question_number = 62 AND o.option_label = 'b' THEN 'Saya trampil menggunakan perkakas'
    WHEN q.question_number = 63 AND o.option_label = 'a' THEN 'Saya lambat dalam membuat persahabatan'
    WHEN q.question_number = 63 AND o.option_label = 'b' THEN 'Saya lambat dalam mengambil Keputusan'
    WHEN q.question_number = 64 AND o.option_label = 'a' THEN 'Biasanya saya makan dengan cepat'
    WHEN q.question_number = 64 AND o.option_label = 'b' THEN 'Saya suka membaca'
    WHEN q.question_number = 65 AND o.option_label = 'a' THEN 'Saya suka pekerjaan Dimana saya banyak bergerak'
    WHEN q.question_number = 65 AND o.option_label = 'b' THEN 'Saya suka pekerjaan yang harus dilaksanakan dengan hati-hati'
    WHEN q.question_number = 66 AND o.option_label = 'a' THEN 'Saya mudah membuat sebanyak mungkin teman'
    WHEN q.question_number = 66 AND o.option_label = 'b' THEN 'Saya mudah menemukan kembali barang-barang yang saya simpan'
    WHEN q.question_number = 67 AND o.option_label = 'a' THEN 'Saya membuat rencana jauh-jauh sebelumnya'
    WHEN q.question_number = 67 AND o.option_label = 'b' THEN 'Saya selalu menyenangkan'
    WHEN q.question_number = 68 AND o.option_label = 'a' THEN 'Saya menjunjung tinggi nama baik saya'
    WHEN q.question_number = 68 AND o.option_label = 'b' THEN 'Saya terus menekuni suatu masalah sampai tuntas'
    WHEN q.question_number = 69 AND o.option_label = 'a' THEN 'Saya suka menyenangkan orang-orang yang saya kagumi'
    WHEN q.question_number = 69 AND o.option_label = 'b' THEN 'Saya ingin sukses'
    WHEN q.question_number = 70 AND o.option_label = 'a' THEN 'Saya suka orang lain mengambil Keputusan untuk kelompok'
    WHEN q.question_number = 70 AND o.option_label = 'b' THEN 'Saya suka mengambil Keputusan untuk kelompok'
    WHEN q.question_number = 71 AND o.option_label = 'a' THEN 'Saya selalu berusaha keras'
    WHEN q.question_number = 71 AND o.option_label = 'b' THEN 'Saya mengambil Keputusan secara cepat dan mudah'
    WHEN q.question_number = 72 AND o.option_label = 'a' THEN 'Kelompok biasanya melakukan apa yang saya inginkan'
    WHEN q.question_number = 72 AND o.option_label = 'b' THEN 'Saya biasanya bekerja cepat-cepat'
    WHEN q.question_number = 73 AND o.option_label = 'a' THEN 'Saya sering merasa lelah'
    WHEN q.question_number = 73 AND o.option_label = 'b' THEN 'Saya lambat dalam mengabil Keputusan'
    WHEN q.question_number = 74 AND o.option_label = 'a' THEN 'Saya bekerja cepat'
    WHEN q.question_number = 74 AND o.option_label = 'b' THEN 'Saya mudah berteman'
    WHEN q.question_number = 75 AND o.option_label = 'a' THEN 'Saya biasanya mempunyai gairah dan tenaga'
    WHEN q.question_number = 75 AND o.option_label = 'b' THEN 'Saya banyak menghabiskan waktu untuk berfikir'
    WHEN q.question_number = 76 AND o.option_label = 'a' THEN 'Saya sangat ramah terhadap orang'
    WHEN q.question_number = 76 AND o.option_label = 'b' THEN 'Saya suka pekerjaan yang memerlukan ketelitian'
    WHEN q.question_number = 77 AND o.option_label = 'a' THEN 'Saya banyak berfikir dan membuat perencanaan'
    WHEN q.question_number = 77 AND o.option_label = 'b' THEN 'Saya menyimpan sesuatu pada tempatnya'
    WHEN q.question_number = 78 AND o.option_label = 'a' THEN 'Saya suka pekerjaan yang menuntut perhatian terhadap hal detail.'
    WHEN q.question_number = 78 AND o.option_label = 'b' THEN 'Saya tidak mudah marah'
    WHEN q.question_number = 79 AND o.option_label = 'a' THEN 'Saya suka menuruti orang yang saya kagumi'
    WHEN q.question_number = 79 AND o.option_label = 'b' THEN 'Saya selalu menyelesaikan pekerjaan yang saya telah saya mulai'
    WHEN q.question_number = 80 AND o.option_label = 'a' THEN 'Saya suka petunjuk – petunjuk yang jelas'
    WHEN q.question_number = 80 AND o.option_label = 'b' THEN 'Saya suka bekerja keras.'
    WHEN q.question_number = 81 AND o.option_label = 'a' THEN 'Saya mngejar apa yang saya inginkan'
    WHEN q.question_number = 81 AND o.option_label = 'b' THEN 'Saya seorang pemimpin yang baik'
    WHEN q.question_number = 82 AND o.option_label = 'a' THEN 'Saya dapat membuat orang lain bekerja keras'
    WHEN q.question_number = 82 AND o.option_label = 'b' THEN 'Saya adalah type orang yang tak kenal susah'
    WHEN q.question_number = 83 AND o.option_label = 'a' THEN 'Saya mengambil Keputusan dengan cepat'
    WHEN q.question_number = 83 AND o.option_label = 'b' THEN 'Saya bicara dengan cepat'
    WHEN q.question_number = 84 AND o.option_label = 'a' THEN 'Rasanya saya bekerja secara tergesa-gesa'
    WHEN q.question_number = 84 AND o.option_label = 'b' THEN 'Saya berolah raga secara teratur'
    WHEN q.question_number = 85 AND o.option_label = 'a' THEN 'saya tidak suka bertemu kebanyakan orang'
    WHEN q.question_number = 85 AND o.option_label = 'b' THEN 'Saya cepat merasa lelah'
    WHEN q.question_number = 86 AND o.option_label = 'a' THEN 'Saya mempunyai banyak sekali teman'
    WHEN q.question_number = 86 AND o.option_label = 'b' THEN 'Saya banyak menghabiskan waktu untuk berfikir'
    WHEN q.question_number = 87 AND o.option_label = 'a' THEN 'Saya suka bekerja dengan teori'
    WHEN q.question_number = 87 AND o.option_label = 'b' THEN 'Saya suka menangani detail suatu pekerjaan'
    WHEN q.question_number = 88 AND o.option_label = 'a' THEN 'Saya suka menangani detail suatu pekerjaan'
    WHEN q.question_number = 88 AND o.option_label = 'b' THEN 'Saya Suka mengorganisir pekerjaan saya'
    WHEN q.question_number = 89 AND o.option_label = 'a' THEN 'Saya menaruh barang pada tempatnya'
    WHEN q.question_number = 89 AND o.option_label = 'b' THEN 'Saya selalu menyenangkan'
    WHEN q.question_number = 90 AND o.option_label = 'a' THEN 'Saya suka diberitahu apa yang perlu saya kerjakan'
    WHEN q.question_number = 90 AND o.option_label = 'b' THEN 'Saya harus menyelesaikan pekerjaan yang telah saya mulai'
    ELSE o.option_text
  END,
  category_target = CASE
    WHEN q.question_number = 1  AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 1  AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 2  AND o.option_label = 'a' THEN 'A'
    WHEN q.question_number = 2  AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 3  AND o.option_label = 'a' THEN 'P'
    WHEN q.question_number = 3  AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 4  AND o.option_label = 'a' THEN 'X'
    WHEN q.question_number = 4  AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 5  AND o.option_label = 'a' THEN 'B'
    WHEN q.question_number = 5  AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 6  AND o.option_label = 'a' THEN 'O'
    WHEN q.question_number = 6  AND o.option_label = 'b' THEN 'B'
    WHEN q.question_number = 7  AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 7  AND o.option_label = 'b' THEN 'O'
    WHEN q.question_number = 8  AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 8  AND o.option_label = 'b' THEN 'Z'
    WHEN q.question_number = 9  AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 9  AND o.option_label = 'b' THEN 'K'
    WHEN q.question_number = 10 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 10 AND o.option_label = 'b' THEN 'F'
    WHEN q.question_number = 11 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 11 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 12 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 12 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 13 AND o.option_label = 'a' THEN 'P'
    WHEN q.question_number = 13 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 14 AND o.option_label = 'a' THEN 'X'
    WHEN q.question_number = 14 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 15 AND o.option_label = 'a' THEN 'B'
    WHEN q.question_number = 15 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 16 AND o.option_label = 'a' THEN 'O'
    WHEN q.question_number = 16 AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 17 AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 17 AND o.option_label = 'b' THEN 'B'
    WHEN q.question_number = 18 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 18 AND o.option_label = 'b' THEN 'O'
    WHEN q.question_number = 19 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 19 AND o.option_label = 'b' THEN 'Z'
    WHEN q.question_number = 20 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 20 AND o.option_label = 'b' THEN 'K'
    WHEN q.question_number = 21 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 21 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 22 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 22 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 23 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 23 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 24 AND o.option_label = 'a' THEN 'X'
    WHEN q.question_number = 24 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 25 AND o.option_label = 'a' THEN 'B'
    WHEN q.question_number = 25 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 26 AND o.option_label = 'a' THEN 'O'
    WHEN q.question_number = 26 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 27 AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 27 AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 28 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 28 AND o.option_label = 'b' THEN 'B'
    WHEN q.question_number = 29 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 29 AND o.option_label = 'b' THEN 'O'
    WHEN q.question_number = 30 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 30 AND o.option_label = 'b' THEN 'Z'
    WHEN q.question_number = 31 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 31 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 32 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 32 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 33 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 33 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 34 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 34 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 35 AND o.option_label = 'a' THEN 'B'
    WHEN q.question_number = 35 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 36 AND o.option_label = 'a' THEN 'O'
    WHEN q.question_number = 36 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 37 AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 37 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 38 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 38 AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 39 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 39 AND o.option_label = 'b' THEN 'B'
    WHEN q.question_number = 40 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 40 AND o.option_label = 'b' THEN 'O'
    WHEN q.question_number = 41 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 41 AND o.option_label = 'b' THEN 'S'
    WHEN q.question_number = 42 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 42 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 43 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 43 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 44 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 44 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 45 AND o.option_label = 'a' THEN 'V'
    WHEN q.question_number = 45 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 46 AND o.option_label = 'a' THEN 'O'
    WHEN q.question_number = 46 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 47 AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 47 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 48 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 48 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 49 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 49 AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 50 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 50 AND o.option_label = 'b' THEN 'B'
    WHEN q.question_number = 51 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 51 AND o.option_label = 'b' THEN 'V'
    WHEN q.question_number = 52 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 52 AND o.option_label = 'b' THEN 'S'
    WHEN q.question_number = 53 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 53 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 54 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 54 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 55 AND o.option_label = 'a' THEN 'V'
    WHEN q.question_number = 55 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 56 AND o.option_label = 'a' THEN 'S'
    WHEN q.question_number = 56 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 57 AND o.option_label = 'a' THEN 'Z'
    WHEN q.question_number = 57 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 58 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 58 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 59 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 59 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 60 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 60 AND o.option_label = 'b' THEN 'X'
    WHEN q.question_number = 61 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 61 AND o.option_label = 'b' THEN 'T'
    WHEN q.question_number = 62 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 62 AND o.option_label = 'b' THEN 'V'
    WHEN q.question_number = 63 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 63 AND o.option_label = 'b' THEN 'S'
    WHEN q.question_number = 64 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 64 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 65 AND o.option_label = 'a' THEN 'V'
    WHEN q.question_number = 65 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 66 AND o.option_label = 'a' THEN 'S'
    WHEN q.question_number = 66 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 67 AND o.option_label = 'a' THEN 'R'
    WHEN q.question_number = 67 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 68 AND o.option_label = 'a' THEN 'K'
    WHEN q.question_number = 68 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 69 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 69 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 70 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 70 AND o.option_label = 'b' THEN 'P'
    WHEN q.question_number = 71 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 71 AND o.option_label = 'b' THEN 'I'
    WHEN q.question_number = 72 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 72 AND o.option_label = 'b' THEN 'T'
    WHEN q.question_number = 73 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 73 AND o.option_label = 'b' THEN 'V'
    WHEN q.question_number = 74 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 74 AND o.option_label = 'b' THEN 'S'
    WHEN q.question_number = 75 AND o.option_label = 'a' THEN 'V'
    WHEN q.question_number = 75 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 76 AND o.option_label = 'a' THEN 'S'
    WHEN q.question_number = 76 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 77 AND o.option_label = 'a' THEN 'R'
    WHEN q.question_number = 77 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 78 AND o.option_label = 'a' THEN 'D'
    WHEN q.question_number = 78 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 79 AND o.option_label = 'a' THEN 'F'
    WHEN q.question_number = 79 AND o.option_label = 'b' THEN 'N'
    WHEN q.question_number = 80 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 80 AND o.option_label = 'b' THEN 'A'
    WHEN q.question_number = 81 AND o.option_label = 'a' THEN 'G'
    WHEN q.question_number = 81 AND o.option_label = 'b' THEN 'L'
    WHEN q.question_number = 82 AND o.option_label = 'a' THEN 'L'
    WHEN q.question_number = 82 AND o.option_label = 'b' THEN 'I'
    WHEN q.question_number = 83 AND o.option_label = 'a' THEN 'I'
    WHEN q.question_number = 83 AND o.option_label = 'b' THEN 'T'
    WHEN q.question_number = 84 AND o.option_label = 'a' THEN 'T'
    WHEN q.question_number = 84 AND o.option_label = 'b' THEN 'V'
    WHEN q.question_number = 85 AND o.option_label = 'a' THEN 'V'
    WHEN q.question_number = 85 AND o.option_label = 'b' THEN 'S'
    WHEN q.question_number = 86 AND o.option_label = 'a' THEN 'S'
    WHEN q.question_number = 86 AND o.option_label = 'b' THEN 'R'
    WHEN q.question_number = 87 AND o.option_label = 'a' THEN 'R'
    WHEN q.question_number = 87 AND o.option_label = 'b' THEN 'D'
    WHEN q.question_number = 88 AND o.option_label = 'a' THEN 'D'
    WHEN q.question_number = 88 AND o.option_label = 'b' THEN 'C'
    WHEN q.question_number = 89 AND o.option_label = 'a' THEN 'C'
    WHEN q.question_number = 89 AND o.option_label = 'b' THEN 'E'
    WHEN q.question_number = 90 AND o.option_label = 'a' THEN 'W'
    WHEN q.question_number = 90 AND o.option_label = 'b' THEN 'N'
    ELSE o.category_target
  END
FROM test_questions q, pap
WHERE o.question_id = q.id
  AND q.instrument_id = pap.id;

-- Verify the update
SELECT 
  q.question_number,
  q.question_text,
  o.option_label,
  o.option_text,
  o.category_target
FROM test_questions q
JOIN test_question_options o ON o.question_id = q.id
JOIN test_instruments ti ON q.instrument_id = ti.id
WHERE ti.name ILIKE '%papikostik%'
ORDER BY q.question_number, o.option_label
LIMIT 10;
