import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CandidateTestResultView from "@/components/admin/CandidateTestResultView";
import { generatePrintHTML, type PrintResult } from "@/utils/printUtils";

const result: PrintResult = {
  id: "aptitude-regression",
  candidate_name: "Test Candidate",
  test_name: "Aptitude Test",
  score: 75,
  total_questions: 60,
  answered_questions: 60,
  categories: { accuracy: 28, correct_answers: 17, Verbal: 0, Numerical: 0, Logic: 0, Classification: 0, Pattern: 0, Abstract: 0 },
  status: "failed",
  interpretation: "Hasil Aptitude Test menunjukkan 17 jawaban benar dari 60 soal.",
  completed_at: "2026-10-12T01:00:00Z",
};

describe("Aptitude result presentation", () => {
  it("keeps the Aptitude interpretation and excludes Kraepelin dimensions in print", () => {
    const html = generatePrintHTML(result);
    expect(html).toContain(result.interpretation);
    expect(html).not.toContain("Tempo kerja hitung");
    expect(html).not.toContain("Konsistensi antar kolom");
    expect(html).not.toContain("Kapasitas Kerja");
  });

  it("renders Aptitude rather than a Kraepelin profile in candidate details", () => {
    const html = renderToStaticMarkup(<CandidateTestResultView result={result} answers={[]} />);
    expect(html).toContain(result.interpretation);
    expect(html).toContain("Skor Aptitude");
    expect(html).not.toContain("Kapasitas Kerja");
    expect(html).not.toContain("Kraepelin");
  });
});