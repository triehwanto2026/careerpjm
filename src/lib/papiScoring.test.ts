import { describe, expect, it } from "vitest";
import { buildPapiInterpretation, getPapiRows, PAPI_WHEEL_ORDER, validatePapiProfile } from "./papiScoring";

const sample = { N: 6, G: 5, A: 6, L: 8, P: 4, I: 4, T: 2, V: 3, S: 2, B: 0, O: 4, X: 4, C: 6, D: 4, R: 7, Z: 7, E: 4, K: 3, F: 5, W: 6 };

describe("PAPI Kostick scoring", () => {
  it("keeps the table and wheel in the same canonical order", () => {
    expect(getPapiRows(sample).map((row) => row.code)).toEqual([...PAPI_WHEEL_ORDER]);
  });

  it("accepts a complete 90-response profile", () => {
    expect(validatePapiProfile(sample)).toEqual({ valid: true, total: 90, invalidCodes: [] });
  });

  it("uses the correct meaning for D and L", () => {
    const rows = getPapiRows(sample);
    expect(rows.find((row) => row.code === "D")?.label).toContain("Details");
    expect(rows.find((row) => row.code === "L")?.label).toBe("Leadership Role");
  });

  it("warns instead of interpreting an invalid profile as valid", () => {
    expect(buildPapiInterpretation({ ...sample, N: 5 })).toContain("PERINGATAN VALIDITAS SKOR");
  });
});
