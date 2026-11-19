import { describe, expect, it } from "vitest";
import { fyStart, longestWeekRun } from "./stats";

describe("carer stats helpers", () => {
  it("finds the start of the financial year", () => {
    expect(fyStart("2026-11-19")).toBe("2026-07-01");
    expect(fyStart("2026-06-30")).toBe("2025-07-01");
    expect(fyStart("2026-07-01")).toBe("2026-07-01");
  });
  it("counts the longest run of weeks in a row", () => {
    expect(longestWeekRun([])).toBe(0);
    expect(longestWeekRun(["2026-11-02"])).toBe(1);
    expect(longestWeekRun(["2026-10-05", "2026-10-12", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16"])).toBe(4);
    expect(longestWeekRun(["2026-11-16", "2026-11-09", "2026-11-09"])).toBe(2);
  });
});
