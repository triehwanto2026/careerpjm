import { describe, expect, it } from "vitest";
import { getAptitudeFallbackImage } from "./aptitudeImageFallback";

const question = {
  question_number: 3,
  question_text: "Pilih jawaban yang paling sesuai",
  category: "Logic",
};

describe("Aptitude image fallback", () => {
  it("shows fallback images for configured Aptitude questions", () => {
    expect(getAptitudeFallbackImage(question, "Aptitude Test")).toMatch(/^data:image\/svg\+xml/);
  });

  it.each(["Kraepelin", "MSDT", "Personality Plus", "DISC", "IST", "MBTI", "PAPIKOSTIK", "CFIT"])(
    "does not leak Aptitude images into %s",
    (testName) => {
      expect(getAptitudeFallbackImage(question, testName)).toBeNull();
    },
  );
});
