const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://rtmvpzehbvyzrqggurzz.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

async function checkPapiScoring() {
  console.log("\n=== PENGECEKAN PAPI KOSTICK SCORING ===\n");

  // 1. Cek mapping di database
  console.log("1. CEK MAPPING KATEGORI PAPI DI DATABASE");
  console.log("-".repeat(60));

  const { data: papiInst } = await supabase
    .from("test_instruments")
    .select("id, name")
    .ilike("name", "%papikostik%")
    .limit(1)
    .single();

  if (!papiInst) {
    console.log("❌ Instrumen PAPI tidak ditemukan");
    return;
  }

  console.log(`✓ Instrumen PAPI ditemukan: ${papiInst.name} (ID: ${papiInst.id})`);

  // Cek jumlah soal
  const { count: questionCount } = await supabase
    .from("test_questions")
    .select("id", { count: "exact" })
    .eq("instrument_id", papiInst.id);

  console.log(`✓ Total soal: ${questionCount}`);

  // Cek mapping per soal
  const { data: mappings } = await supabase
    .from("test_question_options")
    .select(
      `
      question_id,
      option_label,
      category_target,
      test_questions!inner(question_number)
    `,
    )
    .eq("test_questions.instrument_id", papiInst.id)
    .order("test_questions.question_number");

  if (mappings && mappings.length > 0) {
    console.log(`\n✓ Ditemukan ${mappings.length} option mappings (seharusnya 180 = 90 soal × 2 opsi)`);

    // Periksa distribusi kategori
    const categoryCount = {};
    mappings.forEach((m) => {
      const cat = m.category_target?.trim() || "NULL";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    console.log("\nDistribusi kategori (setiap kategori seharusnya muncul 9x = 90 soal ÷ 20 kategori):");
    const expectedCats = [
      "N",
      "G",
      "A",
      "L",
      "P",
      "I",
      "T",
      "V",
      "X",
      "S",
      "B",
      "O",
      "R",
      "D",
      "C",
      "Z",
      "E",
      "K",
      "F",
      "W",
    ];
    expectedCats.forEach((cat) => {
      const count = categoryCount[cat] || 0;
      const status = count === 9 ? "✓" : "❌";
      console.log(`  ${status} ${cat}: ${count}`);
    });

    // Cek mapping untuk soal tertentu
    console.log("\nCek mapping soal 1-10 (format: Soal A|B):");
    const first10 = mappings.filter(
      (m) => m.test_questions.question_number <= 10,
    );
    const byQuestion = {};
    first10.forEach((m) => {
      const qNum = m.test_questions.question_number;
      const label = m.option_label.toUpperCase();
      if (!byQuestion[qNum]) byQuestion[qNum] = {};
      byQuestion[qNum][label] = m.category_target?.trim() || "NULL";
    });

    Object.keys(byQuestion).sort((a, b) => Number(a) - Number(b)).forEach((qNum) => {
      const mapping = byQuestion[qNum];
      const format = `${mapping.A || "?"}|${mapping.B || "?"}`;
      console.log(`  Q${String(qNum).padStart(2, "0")}: ${format}`);
    });
  }

  // 2. Cek hasil test yang INVALID
  console.log("\n\n2. CEK HASIL TEST YANG INVALID (total skor tidak = 90)");
  console.log("-".repeat(60));

  const { data: invalidResults } = await supabase
    .from("test_results")
    .select("id, candidate_id, test_name, categories, total_questions")
    .eq("test_name", "PAPIKOSTIK")
    .order("created_at", { ascending: false })
    .limit(10);

  if (invalidResults && invalidResults.length > 0) {
    console.log(`\nDitemukan ${invalidResults.length} hasil test PAPI terbaru:`);

    invalidResults.forEach((result, idx) => {
      const cats = result.categories || {};
      const total = Object.values(cats).reduce((sum, v) => sum + (Number(v) || 0), 0);
      const status = total === 90 ? "✓ VALID" : "❌ INVALID";

      console.log(
        `\n${idx + 1}. Result ID: ${result.id.substring(0, 8)}... (Total: ${total}/90) ${status}`,
      );

      if (total !== 90) {
        console.log("   Dimensi skor:");
        Object.entries(cats)
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
          .forEach(([dim, score]) => {
            const val = Number(score) || 0;
            console.log(`     ${dim}: ${val}`);
          });

        // Periksa dimensi yang melebihi max
        const maxScores = {
          N: 9, E: 9, F: 9, W: 9,
          G: 9, A: 9, L: 9, P: 9, I: 9, T: 9, V: 9, X: 9, S: 9, B: 9,
          O: 9, R: 9, D: 9, C: 9, Z: 9, K: 9,
        };

        const exceeded = Object.entries(cats)
          .filter(([dim, score]) => (Number(score) || 0) > (maxScores[dim] || 9))
          .map(
            ([dim, score]) => `${dim}: ${Number(score) || 0}/${maxScores[dim] || 9}`,
          );

        if (exceeded.length > 0) {
          console.log(`   ⚠️  MELEBIHI MAKSIMUM: ${exceeded.join(", ")}`);
        }
      }
    });
  }

  // 3. Cek jawaban untuk result yang invalid
  console.log("\n\n3. ANALISIS DETAIL JAWABAN UNTUK RESULT INVALID");
  console.log("-".repeat(60));

  if (invalidResults && invalidResults[0]) {
    const firstInvalid = invalidResults[0];
    const total = Object.values(firstInvalid.categories || {}).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0,
    );

    if (total !== 90) {
      console.log(
        `\nMenganalisis Result: ${firstInvalid.id.substring(0, 8)}... (Total: ${total}/90)`,
      );

      // Ambil jawaban dan soal
      const { data: answers } = await supabase
        .from("test_answers")
        .select(
          `
          id,
          question_id,
          selected_option_id,
          test_questions!inner(question_number),
          test_question_options!inner(option_label, category_target)
        `,
        )
        .eq("test_result_id", firstInvalid.id)
        .order("test_questions.question_number");

      if (answers && answers.length > 0) {
        console.log(`\nTotal jawaban tersimpan: ${answers.length}`);

        // Hitung score secara manual
        const manualScore = {};
        const allDims = new Set();
        answers.forEach((ans) => {
          const cat = ans.test_question_options.category_target?.trim() || "NULL";
          allDims.add(cat);
          manualScore[cat] = (manualScore[cat] || 0) + 1;
        });

        const manualTotal = Object.values(manualScore).reduce((sum, v) => sum + (Number(v) || 0), 0);
        console.log(`Total skor (manual count): ${manualTotal}`);
        console.log(`Total skor (dari DB): ${total}`);

        if (manualTotal !== total) {
          console.log(
            "⚠️  PERBEDAAN! Ada indikasi duplikasi atau error di scoring logic",
          );
        }

        // Tampilkan scoring breakdown
        console.log("\nManual scoring breakdown (dari jawaban yang tersimpan):");
        ["N", "G", "A", "L", "P", "I", "T", "V", "X", "S", "B", "O", "R", "D", "C", "Z", "E", "K", "F", "W"]
          .forEach((dim) => {
            const manualVal = manualScore[dim] || 0;
            const dbVal = firstInvalid.categories[dim] || 0;
            const status = manualVal === dbVal ? "✓" : "❌ MISMATCH";
            console.log(
              `  ${dim}: manual=${manualVal}, db=${dbVal} ${status}`,
            );
          });

        // Cek duplikasi jawaban
        console.log("\nCek duplikasi jawaban:");
        const questionAnswerCount = {};
        answers.forEach((ans) => {
          const qNum = ans.test_questions.question_number;
          questionAnswerCount[qNum] = (questionAnswerCount[qNum] || 0) + 1;
        });

        const duplicates = Object.entries(questionAnswerCount)
          .filter(([, count]) => count > 1);

        if (duplicates.length > 0) {
          console.log(
            `⚠️  DITEMUKAN DUPLIKASI: ${duplicates.length} soal yang dijawab lebih dari 1x`,
          );
          duplicates.slice(0, 10).forEach(([qNum, count]) => {
            console.log(`  Q${qNum}: ${count} jawaban`);
          });
        } else {
          console.log("✓ Tidak ada duplikasi jawaban");
        }

        // Cek soal yang tidak dijawab
        console.log(`\n✓ Soal yang dijawab: ${answers.length}/90`);
        if (answers.length < 90) {
          console.log(`⚠️  ${90 - answers.length} soal tidak dijawab`);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

checkPapiScoring().catch(console.error);
