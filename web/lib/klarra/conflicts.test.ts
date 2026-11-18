import { describe, expect, it } from "vitest";
import { clock, conflicts, gaps, span, toSlots, PLACEHOLDER_CARER, type Slot } from "./conflicts";

const s = (id: string, day: string, start: number, end: number, carer: string | null = "c1"): Slot => ({ id, day, start, end, carer, who: "p" });

describe("shift conflicts", () => {
  it("finds overlapping shifts for the same carer", () => {
    expect(conflicts([s("a", "2026-11-23", 900, 1300), s("b", "2026-11-23", 1200, 1500)]).map(([x, y]) => [x.id, y.id])).toEqual([["a", "b"]]);
  });
  it("allows back to back shifts", () => {
    expect(conflicts([s("a", "2026-11-23", 900, 1300), s("b", "2026-11-23", 1300, 1500)])).toEqual([]);
  });
  it("ignores different carers and shifts with no carer", () => {
    expect(conflicts([s("a", "2026-11-23", 900, 1300), s("b", "2026-11-23", 1000, 1200, "c2"), s("c", "2026-11-23", 1000, 1200, null)])).toEqual([]);
  });
  it("handles overnight shifts and Bubble's 2400+ times", () => {
    expect(span(s("a", "2026-11-23", 2230, 2430))[1] - span(s("a", "2026-11-23", 2230, 2430))[0]).toBe(120);
    expect(conflicts([s("a", "2026-11-23", 2200, 700), s("b", "2026-11-24", 600, 1000)]).length).toBe(1);
    expect(conflicts([s("a", "2026-11-23", 2230, 2430), s("b", "2026-11-24", 30, 300)])).toEqual([]);
    expect(clock(2430)).toBe("00:30");
  });
  it("finds every overlapping pair in a busy day", () => {
    expect(conflicts([s("a", "2026-11-23", 800, 1700), s("b", "2026-11-23", 900, 1000), s("c", "2026-11-23", 1100, 1200)]).length).toBe(2);
  });
  it("treats Bubble's placeholder carer as a gap and skips cancelled shifts", () => {
    const slots = toSlots([
      { _id: "a", date: "2026-11-22T13:00:00.000Z", "start time": 900, "end time": 1300, carer: PLACEHOLDER_CARER, participant: "p" },
      { _id: "b", date: "2026-11-22T13:00:00.000Z", "start time": 900, "end time": 1300, carer: "c1", cancelled: true },
    ]);
    expect(slots.map((x) => [x.id, x.day, x.carer])).toEqual([["a", "2026-11-23", null]]);
    expect(gaps(slots).map((x) => x.id)).toEqual(["a"]);
  });
});
