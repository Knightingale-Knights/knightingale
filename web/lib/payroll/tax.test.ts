import { describe, expect, it } from "vitest";
import { periodTax, residencyKind, thresholdFromPast, weeklyTax } from "./tax";

const resident = (threshold: boolean, studyLoan = false) => ({ kind: "resident" as const, threshold, studyLoan });

describe("PAYG withholding 2026-27", () => {
  it("matches the ATO weekly tax table", () => {
    expect(weeklyTax(1000, resident(true))).toBe(138);
    expect(weeklyTax(1000, resident(false))).toBe(249);
    expect(weeklyTax(1100, resident(true))).toBe(170);
    expect(weeklyTax(1100, resident(false))).toBe(281);
    expect(weeklyTax(361, resident(true))).toBe(0);
    expect(weeklyTax(25, resident(false))).toBe(4);
    expect(weeklyTax(50, resident(false))).toBe(7);
    expect(weeklyTax(75, resident(false))).toBe(11);
  });
  it("ignores cents in the earnings", () => {
    expect(weeklyTax(1000.85, resident(true))).toBe(weeklyTax(1000, resident(true)));
  });
  it("adds the study loan component", () => {
    expect(weeklyTax(1000, resident(true, true))).toBe(138);
    expect(weeklyTax(1500, resident(true, true))).toBe(weeklyTax(1500, resident(true)) + Math.round(0.15 * 1500.99 - 200.5615));
  });
  it("uses foreign resident, working holiday maker and no-TFN rates", () => {
    expect(weeklyTax(1000, { kind: "foreign", threshold: false, studyLoan: false })).toBe(300);
    expect(weeklyTax(1000, { kind: "whm", threshold: false, studyLoan: false })).toBe(150);
    expect(weeklyTax(1000.6, { kind: "no_tfn", threshold: false, studyLoan: false })).toBe(470);
  });
  it("works a fortnight out per week", () => {
    expect(periodTax(2000, 14, resident(true))).toBe(276);
    expect(periodTax(1000, 7, resident(true))).toBe(138);
  });
  it("reads residency and guesses the threshold from a past pay", () => {
    expect(residencyKind("An Australian resident for tax purposes", "123456782")).toBe("resident");
    expect(residencyKind("Foreign resident for tax purposes", "123456782")).toBe("foreign");
    expect(residencyKind("A Working Holiday Maker", "123456782")).toBe("whm");
    expect(residencyKind("An Australian resident for tax purposes", "")).toBe("no_tfn");
    expect(thresholdFromPast(1000, 138, 7, false)).toBe(true);
    expect(thresholdFromPast(1000, 249, 7, false)).toBe(false);
  });
});
