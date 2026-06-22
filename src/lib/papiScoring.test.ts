import { describe, expect, it } from "vitest";
import { buildPapiInterpretation, getPapiRows, PAPI_WHEEL_ORDER, validatePapiProfile } from "./papiScoring";

const sample = { N: 8, G: 6, A: 7, L: 5, P: 4, I: 4, T: 2, V: 3, S: 2, B: 0, O: 4, X: 4, C: 6, D: 4, R: 5, Z: 5, E: 5, K: 3, F: 6, W: 7 };

describe("PAPI Kostick scoring", () => {
  it("keeps the table and wheel in the same canonical order", () => {
    expect(getPapiRows(sample).map((row) => row.code)).toEqual([...PAPI_WHEEL_ORDER]);
  });

  it("accepts a complete 90-response profile", () => {
    const result = validatePapiProfile(sample);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(90);
  });

  it("uses the correct meaning for D and L", () => {
    const rows = getPapiRows(sample);
    expect(rows.find((row) => row.code === "D")?.label).toContain("Details");
    expect(rows.find((row) => row.code === "L")?.label).toBe("Leadership Role");
  });

  it("shows error interpretation for invalid profile", () => {
    const interpretation = buildPapiInterpretation({ ...sample, N: 5 });
    expect(interpretation).toContain("STATUS VALIDASI: INVALID");
    expect(interpretation).toContain("Interpretasi tidak ditampilkan");
  });
});
