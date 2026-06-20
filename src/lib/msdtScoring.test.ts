import { describe, expect, it } from "vitest";
import { buildMsdtInterpretation, getMsdtRows, MSDT_STYLE_MAX } from "./msdtScoring";

describe("MSDT scoring", () => {
  it("normalizes every style against its own available items", () => {
    const categories = Object.fromEntries(
      Object.entries(MSDT_STYLE_MAX).map(([style, max]) => [style, Math.round(max / 2)]),
    );
    const rows = getMsdtRows(categories);
    rows.forEach((row) => {
      expect(row.pct).toBeGreaterThanOrEqual(44);
      expect(row.pct).toBeLessThanOrEqual(56);
    });
  });

  it("selects the dominant style using normalized percentage", () => {
    const interpretation = buildMsdtInterpretation({
      Democratic: 9,
      Executive: 8,
      Autocratic: 8,
      Bureaucratic: 10,
      Developer: 7,
      "Human Relations": 6,
      Compromiser: 10,
      "Laissez Faire": 6,
    }, 64, 64);
    expect(interpretation).toContain("Demokratis / Partisipatif (9/10; 90%; Dominan)");
  });

  it("warns when the selected category total is inconsistent", () => {
    expect(buildMsdtInterpretation({ Democratic: 4 }, 64, 64)).toContain("PERINGATAN VALIDITAS");
  });
});
