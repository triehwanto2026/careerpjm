-- Reseed APTITUDE TEST from the user-provided 60-question attachment.
-- Image-based questions are inserted with textual placeholders so admins can
-- attach/generate the exact figures from Question Builder afterward.

DO $$
DECLARE
  aptitude_id UUID;
  q JSONB;
  opt JSONB;
  qid UUID;
  correct_label TEXT;
  questions JSONB := $json$
[
  {"n":1,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"B","options":[["A","Gajah"],["B","Ulat"],["C","Kerbau"],["D","Kucing"],["E","Singa"]]},
  {"n":2,"cat":"Verbal","text":"Jika Anda mengatur ulang kata-kata \"LINKECI\", maka Anda akan mendapat nama sebuah:","answer":"E","options":[["A","Lautan"],["B","Negara"],["C","Provinsi"],["D","Kota"],["E","Hewan"]]},
  {"n":3,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut? Jika bentuk pertama adalah bentuk kedua, maka bentuk ketiga adalah ...","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":4,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"C","options":[["A","Kentang"],["B","Jagung"],["C","Apel"],["D","Wortel"],["E","Kacang"]]},
  {"n":5,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":6,"cat":"Numerical","text":"Saat ini John berumur 12 tahun, yaitu 3 kali lebih tua dari adiknya. Berapa umur John saat umurnya 2 kali lebih tua dari umur adiknya?","answer":"B","options":[["A","15"],["B","16"],["C","18"],["D","20"],["E","21"]]},
  {"n":7,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"Kakak Laki-Laki\" itu \"Kakak Perempuan\", maka \"Keponakan Perempuan\" adalah:","answer":"E","options":[["A","Ibu"],["B","Anak Perempuan"],["C","Bibi"],["D","Paman"],["E","Keponakan Laki-laki"]]},
  {"n":8,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","A"],["B","Z"],["C","F"],["D","N"],["E","E"]]},
  {"n":9,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut. Jika \"Susu\" itu \"Gelas\", maka \"Surat\" itu:","answer":"C","options":[["A","Stempel"],["B","Ballpoin"],["C","Amplop"],["D","Buku"],["E","Kiriman"]]},
  {"n":10,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":11,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"HIDUP\" itu \"PUDIH\" maka 5232 adalah:","answer":"C","options":[["A","2523"],["B","3252"],["C","2325"],["D","3225"],["E","5223"]]},
  {"n":12,"cat":"Logic","text":"Jika beberapa Smaugs adalah Thors dan beberapa Thors adalah Thrains, maka beberapa Smaugs pasti adalah Thrains. Pernyataan ini adalah:","answer":"B","options":[["A","Benar"],["B","Salah"],["C","Tidak keduanya"]]},
  {"n":13,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":14,"cat":"Verbal","text":"Mana dari ke-5 kata yang paling melengkapi kalimat tersebut? Jika \"Pohon\" itu \"Tanah\" maka \"Cerobong Asap\" itu:","answer":"E","options":[["A","Asap"],["B","Batu bata"],["C","Langit"],["D","Garasi"],["E","Rumah"]]},
  {"n":15,"cat":"Numerical","text":"Mana dari angka-angka ini yang TIDAK masuk ke dalam urutan di bawah ini? 9 - 7 - 8 - 6 - 7 - 5 - 6 - 3","answer":"A","options":[["A","3"],["B","7"],["C","8"],["D","5"],["E","6"]]},
  {"n":16,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"D","options":[["A","Sentuh"],["B","Rasa"],["C","Dengar"],["D","Senyum"],["E","Lihat"]]},
  {"n":17,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":18,"cat":"Logic","text":"Jack lebih tinggi dari Peter, dan Bill lebih pendek dari Jack. Mana kalimat yang paling akurat?","answer":"D","options":[["A","Bill lebih tinggi dari Peter"],["B","Bill lebih pendek dari Peter"],["C","Bill sama tingginya dengan Peter"],["D","Mustahil untuk mengetahui apakah Bill or Peter yang lebih tinggi"]]},
  {"n":19,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"D","options":[["A","Kaus kaki"],["B","Baju"],["C","Sepatu"],["D","Dompet"],["E","Topi"]]},
  {"n":20,"cat":"Pattern","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"CAACCAC\" adalah \"3113313\" maka \"CACAACAC\" adalah:","answer":"E","options":[["A","13133131"],["B","13133313"],["C","31311131"],["D","31311313"],["E","31313113"]]},
  {"n":21,"cat":"Verbal","text":"Jika Anda mengatur ulang kata \"RAPIS\", maka Anda akan mendapat nama sebuah:","answer":"D","options":[["A","Lautan"],["B","Negara"],["C","Provinsi"],["D","Kota"],["E","Hewan"]]},
  {"n":22,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":23,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"Peluru\" adalah \"Senjata\" maka \"Bola Api\" adalah:","answer":"","options":[["A","Pentungan"],["B","Ketapel"],["C","Meriam"],["D","Pelempar"],["E","Jepretan"]]},
  {"n":24,"cat":"Logic","text":"Jika beberapa Bifurs adalah Bofurs dan semua Gloins adalah Bofurs, maka beberapa Bifurs pasti adalah Gloins. Pernyataan ini adalah:","answer":"B","options":[["A","Benar"],["B","Salah"],["C","Tidak keduanya"]]},
  {"n":25,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","A1"],["B","E6"],["C","D4"],["D","B2"],["E","C3"]]},
  {"n":26,"cat":"Pattern","text":"Mana dari angka/huruf ini yang TIDAK masuk ke dalam urutan di bawah ini? A - D - G - I - J - M - P - S","answer":"B","options":[["A","D"],["B","I"],["C","J"],["D","M"],["E","S"]]},
  {"n":27,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":28,"cat":"Numerical","text":"Harga sebuah baju di-discount 20% untuk sebuah acara tahunan. Berapa % baju tersebut harus dinaikkan dari harga discount tersebut, sehingga harga baju tersebut menjadi sama dengan awalnya?","answer":"C","options":[["A","15%"],["B","20%"],["C","25%"],["D","30%"],["E","40%"]]},
  {"n":29,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"C","options":[["A","Tembaga"],["B","Besi"],["C","Kuningan"],["D","Emas"],["E","Timah"]]},
  {"n":30,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":31,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"D","options":[["A","Botol"],["B","Cangkir"],["C","Bak"],["D","Terowongan"],["E","Mangkuk"]]},
  {"n":32,"cat":"Numerical","text":"Mary memiliki beberapa kue. Setelah makan 1 kue, Mary memberikan 1/2 dari sisanya untuk adiknya. Setelah makan 1 kue lagi, Mary memberikan 1/2 dari sisanya untuk adiknya. Mary sekarang hanya memiliki 5 kue. Berapakah jumlah awal kue yang dimiliki Mary?","answer":"C","options":[["A","11"],["B","22"],["C","23"],["D","45"],["E","46"]]},
  {"n":33,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"B","options":[["A","Terigu"],["B","Jerami"],["C","Gandum"],["D","Bubur"],["E","Beras"]]},
  {"n":34,"cat":"Numerical","text":"Mana dari angka-angka ini yang TIDAK masuk ke dalam urutan di bawah ini? 2 - 3 - 6 - 7 - 8 - 14 - 15 - 30","answer":"C","options":[["A","Tiga"],["B","Tujuh"],["C","Delapan"],["D","Lima belas"],["E","Tiga puluh"]]},
  {"n":35,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":36,"cat":"Logic","text":"Sebuah pesawat ruang angkasa menerima 3 pesan dalam bahasa asing: \"Elros Aldarion Elendil\" berarti \"Bahaya Ledakan Roket\"; \"Edain Mnyatur Elros\" berarti \"Bahaya Kebakaran Pesawat Ruang Angkasa\"; dan \"Aldarion Gimilizor Gondor\" berarti \"Ledakan Gas Yang Buruk\". Apakah arti dari \"Elendil\"?","answer":"D","options":[["A","Bahaya"],["B","Ledakan"],["C","Bukan apa-apa"],["D","Roket"],["E","Gas"]]},
  {"n":37,"cat":"Classification","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Sapu"],["B","Pisau"],["C","Sendok"],["D","Sekop"],["E","Spatula kayu"]]},
  {"n":38,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"GESPER\" adalah \"Kepala Gesper\", maka \"SEPATU\" adalah:","answer":"D","options":[["A","Kaos Kaki"],["B","Tumit"],["C","Kaki"],["D","Tali Sepatu"],["E","Sol Sepatu"]]},
  {"n":39,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":40,"cat":"Numerical","text":"John menerima USD 0.41 sebagai kembalian dari pembeliannya di apotik. Jika Jhon menerima 6 koin, maka ketiga dari koin-koin tersebut harusnya:","answer":"C","options":[["A","Satu Sen"],["B","Lima sen"],["C","Sepuluh sen"],["D","Seperempat dollar"],["E","Setengah dollar"]]},
  {"n":41,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":42,"cat":"Verbal","text":"Jika Anda mengatur ulang kata-kata \"RMANJE\", maka Anda akan mendapat nama sebuah:","answer":"B","options":[["A","Lautan"],["B","Negara"],["C","Provinsi"],["D","Kota"],["E","Hewan"]]},
  {"n":43,"cat":"Abstract","text":"[Soal gambar] Which one of the five designs makes the best comparison? Jika tangan adalah sarung tangan, maka kaki/telapak kaki adalah:","answer":"E","options":[["A","Bola benang"],["B","Bangku"],["C","Wajah"],["D","Topi"],["E","Sepatu"]]},
  {"n":44,"cat":"Logic","text":"Jika semua Wargs adalah Twerps dan tidak ada Twerps yang merupakan Gollums maka tidak ada Gollums yang pasti adalah Wargs. Pernyataan ini adalah:","answer":"A","options":[["A","Benar"],["B","Salah"],["C","Tidak Keduanya"]]},
  {"n":45,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"B","options":[["A","Kuda"],["B","Kanguru"],["C","Zebra"],["D","Rusa"],["E","Keledai"]]},
  {"n":46,"cat":"Abstract","text":"[Soal gambar] Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar-gambar ini?","answer":"","options":[["A","AB/DC"],["B","EF/HG"],["C","IJ/LK"],["D","MN/OP"],["E","QR/TS"]]},
  {"n":47,"cat":"Verbal","text":"Mana dari ke-5 kata ini yang paling melengkapi kalimat tersebut? Jika \"Jari\" adalah \"Tangan\" maka \"Daun\" adalah:","answer":"D","options":[["A","Pohon"],["B","Cabang"],["C","Bunga"],["D","Ranting"],["E","Kulit Kayu"]]},
  {"n":48,"cat":"Numerical","text":"Ibunya John mengirimkannya ke toko untuk membeli 9 kotak besar jeruk. John hanya dapat membawa 2 kotak dalam sekali jalan. Berapa kali ia harus bolak-balik ke toko?","answer":"C","options":[["A","4"],["B","4 1/2"],["C","5"],["D","1/2"],["E","6"]]},
  {"n":49,"cat":"Abstract","text":"[Soal gambar] Mana dari gambar ini yang TIDAK sesuai dengan urutan gambar-gambar ini?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":50,"cat":"Verbal","text":"Mana dari ke-5 ini yang paling melengkapi kalimat tersebut? Jika \"Kaki\" adalah \"Lutut\", maka \"Tangan\" adalah:","answer":"B","options":[["A","Jari"],["B","Sikut"],["C","Tumit"],["D","Kaki"],["E","Lengan"]]},
  {"n":51,"cat":"Abstract","text":"[Soal gambar] Mana gambar yang paling mengikuti logika dari diagram di bawah ini?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"]]},
  {"n":52,"cat":"Numerical","text":"Mary ada di peringkat ke-13 dari yang terbaik dan juga peringkat ke-13 dari yang terburuk dalam lomba mengeja kata. Ada berapa peserta dalam lomba mengeja kata tersebut?","answer":"B","options":[["A","13"],["B","25"],["C","26"],["D","27"],["E","28"]]},
  {"n":53,"cat":"Verbal","text":"Mana dari ke-5 ini yang paling melengkapi kalimat tersebut? Jika \"Air\" adalah \"Es Batu\", maka \"Susu\" adalah:","answer":"B","options":[["A","Madu"],["B","Keju"],["C","Sereal"],["D","Kopi"],["E","Kue"]]},
  {"n":54,"cat":"Numerical","text":"Mana dari angka ini yang TIDAK sesuai dengan urutan angka-angka ini? 1 - 2 - 5 - 10 - 13 - 26 - 29 - 48","answer":"H","options":[["A","1"],["B","2"],["C","5"],["D","10"],["E","13"],["F","26"],["G","29"],["H","48"]]},
  {"n":55,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"","options":[["A","Sayap"],["B","Iga"],["C","Salmon"],["D","Ayam"],["E","Sapi"]]},
  {"n":56,"cat":"Logic","text":"Jika semua Fleeps adalah Sloops dan semua Sloops adalah Loopies, maka semua Fleeps adalah pasti Loopies. Pernyataan ini adalah:","answer":"A","options":[["A","Benar"],["B","Salah"],["C","Tidak Keduanya"]]},
  {"n":57,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":58,"cat":"Classification","text":"Mana dari ke-5 ini yang paling TIDAK mirip dengan 4 yang lain?","answer":"C","options":[["A","Sentimeter"],["B","Kilometer"],["C","Hektar"],["D","Meter"],["E","Kaki"]]},
  {"n":59,"cat":"Abstract","text":"[Soal gambar] Mana dari ke-5 gambar ini yang paling melengkapi kalimat gambar tersebut?","answer":"","options":[["A","Gambar A"],["B","Gambar B"],["C","Gambar C"],["D","Gambar D"],["E","Gambar E"]]},
  {"n":60,"cat":"Numerical","text":"Seekor ikan mempunyai kepala sepanjang 9mm. Buntutnya sama panjangnya dengan ukuran kepalanya ditambah setengah kali ukuran badannya. Ukuran badannya adalah sama dengan ukuran kepala ditambah ukuran buntutnya. Berapa panjang ikan tersebut?","answer":"D","options":[["A","27mm"],["B","54mm"],["C","63mm"],["D","72mm"],["E","81mm"]]}
]
$json$::JSONB;
BEGIN
  SELECT id INTO aptitude_id
  FROM public.test_instruments
  WHERE name ILIKE '%APTITUDE%'
  ORDER BY created_at
  LIMIT 1;

  IF aptitude_id IS NULL THEN
    INSERT INTO public.test_instruments (
      name, name_en, description, category, scoring_method,
      target_audience, norm_reference, question_count, duration_minutes, is_active
    )
    VALUES (
      'APTITUDE TEST',
      'Aptitude Test',
      'Tes kemampuan kognitif umum 60 soal berdasarkan lampiran user. Mengukur verbal, numerik, logika, klasifikasi, dan penalaran gambar.',
      'Aptitude',
      'correct_only',
      'Kandidat/Pelamar kerja',
      'User provided aptitude attachment',
      60,
      60,
      true
    )
    RETURNING id INTO aptitude_id;
  ELSE
    UPDATE public.test_instruments
    SET name = 'APTITUDE TEST',
        name_en = 'Aptitude Test',
        description = 'Tes kemampuan kognitif umum 60 soal berdasarkan lampiran user. Mengukur verbal, numerik, logika, klasifikasi, dan penalaran gambar.',
        category = 'Aptitude',
        scoring_method = 'correct_only',
        target_audience = 'Kandidat/Pelamar kerja',
        norm_reference = 'User provided aptitude attachment',
        question_count = 60,
        duration_minutes = 60,
        is_active = true,
        updated_at = now()
    WHERE id = aptitude_id;

    DELETE FROM public.test_question_options
    WHERE question_id IN (SELECT id FROM public.test_questions WHERE instrument_id = aptitude_id);
    DELETE FROM public.test_questions WHERE instrument_id = aptitude_id;
  END IF;

  FOR q IN SELECT * FROM jsonb_array_elements(questions)
  LOOP
    correct_label := COALESCE(q->>'answer', '');

    INSERT INTO public.test_questions (
      instrument_id, question_number, question_text, question_text_en,
      category, question_type, scoring_rule
    )
    VALUES (
      aptitude_id,
      (q->>'n')::INT,
      q->>'text',
      NULL,
      q->>'cat',
      'single_choice',
      'correct_only'
    )
    RETURNING id INTO qid;

    FOR opt IN SELECT * FROM jsonb_array_elements(q->'options')
    LOOP
      INSERT INTO public.test_question_options (
        question_id, option_label, option_text, option_text_en,
        score_value, category_target, is_correct, display_order
      )
      VALUES (
        qid,
        opt->>0,
        opt->>1,
        NULL,
        CASE WHEN correct_label <> '' AND opt->>0 = correct_label THEN 1 ELSE 0 END,
        q->>'cat',
        CASE WHEN correct_label <> '' AND opt->>0 = correct_label THEN true ELSE false END,
        ascii(opt->>0) - ascii('A')
      );
    END LOOP;
  END LOOP;
END $$;
