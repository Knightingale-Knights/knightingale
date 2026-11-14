import { describe, expect, it } from "vitest";
import { addDays, clashes, clockLabel, hoursBetween, parseClock, price, slotsFor, weekStart, weeklyDates } from "./rules";

describe("times", () => {
  it("parses the ways people type times", () => {
    expect(parseClock("9:30")).toBe(930);
    expect(parseClock("09:30")).toBe(930);
    expect(parseClock("930")).toBe(930);
    expect(parseClock("1430")).toBe(1430);
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("9:75")).toBeNull();
    expect(parseClock("")).toBeNull();
    expect(clockLabel(930)).toBe("09:30");
  });
  it("counts hours, including past midnight", () => {
    expect(hoursBetween(930, 1430)).toBe(5);
    expect(hoursBetween(2200, 715)).toBe(9.25);
    expect(hoursBetween(700, 1515)).toBe(8.25);
  });
});

describe("pricing", () => {
  it("multiplies hours by the price item, like Bubble", () => {
    expect(price(5, { rate: 73.58, hourly_revenue: 28.78, carer_pay: 40 })).toEqual({ rate: 73.58, fee: 367.9, revenue: 143.9, wage: 200 });
    expect(price(2.5, { rate: null, hourly_revenue: null, carer_pay: null })).toEqual({ rate: 0, fee: 0, revenue: 0, wage: 0 });
  });
});

describe("availability slots", () => {
  it("matches shifts to every slot they overlap", () => {
    expect(slotsFor(700, 1500)).toEqual(["0600___1400", "night__2200___0715_"]);
    expect(slotsFor(800, 1200)).toEqual(["0600___1400"]);
    expect(slotsFor(1500, 1900)).toEqual(["night__2200___0715_"]);
    expect(slotsFor(2200, 700)).toEqual(["night__11pm___7am_"]); // slots are per day; the next morning is the next day's
    expect(slotsFor(100, 500)).toEqual(["night__11pm___7am_"]);
  });
});

describe("clashes", () => {
  const b = (day: string, s: number, e: number) => ({ id: "x", day, start_time: s, end_time: e });
  it("finds overlaps on the same day", () => {
    expect(clashes(b("2026-11-16", 900, 1300), b("2026-11-16", 1200, 1600))).toBe(true);
    expect(clashes(b("2026-11-16", 900, 1200), b("2026-11-16", 1200, 1600))).toBe(false);
  });
  it("finds an overnight shift running into the next morning", () => {
    expect(clashes(b("2026-11-16", 2200, 700), b("2026-11-17", 600, 1400))).toBe(true);
    expect(clashes(b("2026-11-17", 600, 1400), b("2026-11-16", 2200, 700))).toBe(true);
    expect(clashes(b("2026-11-16", 2200, 600), b("2026-11-17", 600, 1400))).toBe(false);
  });
});

describe("dates", () => {
  it("repeats weekly up to the end date", () => {
    expect(weeklyDates("2026-11-16", "2026-12-07")).toEqual(["2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07"]);
    expect(weeklyDates("2026-11-16", null)).toEqual(["2026-11-16"]);
    expect(weeklyDates("2026-11-16", "2027-12-01", 3)).toHaveLength(3);
  });
  it("finds the Monday of a week", () => {
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday
    expect(weekStart("2026-11-16")).toBe("2026-11-16"); // Monday
    expect(addDays("2026-11-30", 2)).toBe("2026-12-02");
  });
});
