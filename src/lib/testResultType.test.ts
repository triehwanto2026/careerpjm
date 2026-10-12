import { describe, expect, it } from "vitest";
import { isKraepelinResult } from "./testResultType";

describe("Kraepelin result identification", () => {
  it("does not mistake Aptitude answer accuracy for Kraepelin", () => {
    expect(isKraepelinResult({ test_name: "Aptitude Test", categories: { accuracy: 28, correct_answers: 17, Verbal: 0 } })).toBe(false);
  });

  it("prioritizes the Aptitude name even with legacy Kraepelin metrics", () => {
    expect(isKraepelinResult({ test_name: "APTITUDE TEST", categories: { speed: 50, accuracy: 80, stability: 70, work_capacity: 60 } })).toBe(false);
  });

  it("recognizes named Kraepelin tests, including Kraepelin 2", () => {
    expect(isKraepelinResult({ test_name: "Kraepelin 2" })).toBe(true);
  });

  it("recognizes a complete legacy work-performance profile", () => {
    expect(isKraepelinResult({ categories: { speed: 50, accuracy: 80, stability: 70, work_capacity: 60 } })).toBe(true);
  });

  it("rejects isolated accuracy and missing categories", () => {
    expect(isKraepelinResult({ test_name: "Tes Kemampuan", categories: { accuracy: 80 } })).toBe(false);
    expect(isKraepelinResult({})).toBe(false);
  });
});