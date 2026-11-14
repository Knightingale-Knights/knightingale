import { describe, expect, it } from "vitest";
import { CheckError, assertCanCheck, formatNoteField, haversineM, parseModelJson } from "./rules";

const home = { lat: -37.8548796, lng: 144.8790851 }; // 2 Wintringham Rd, Williamstown
const start = new Date("2026-11-16T20:00:00Z"); // 7am Melbourne
const end = new Date("2026-11-17T04:00:00Z");
const shift = (o = {}) => ({ start_at: start, end_at: end, cancelled: false, attend_start: null, attend_end: null, address: home, ...o });
const here = { ...home, accuracy: 20 };
const at = (d: Date, mins: number) => d.getTime() + mins * 60_000;

describe("distance", () => {
  it("measures metres", () => {
    expect(Math.round(haversineM(home.lat, home.lng, home.lat + 0.0045, home.lng))).toBe(500);
  });
});

describe("check in and out", () => {
  it("allows checking in nearby, from 2h before to 6h after the start", () => {
    expect(assertCanCheck("in", shift(), here, at(start, -30))).toBe(0);
    expect(() => assertCanCheck("in", shift(), here, at(start, -121))).toThrow(/too early/);
    expect(() => assertCanCheck("in", shift(), here, at(start, 361))).toThrow(/too late/);
  });
  it("refuses when too far away or the location is imprecise", () => {
    expect(() => assertCanCheck("in", shift(), { lat: home.lat + 0.01, lng: home.lng, accuracy: 10 }, at(start, 0))).toThrow(/about 1112 m/);
    expect(() => assertCanCheck("in", shift(), { ...here, accuracy: 900 }, at(start, 0))).toThrow(/precise location/);
    expect(() => assertCanCheck("in", shift({ address: null }), here, at(start, 0))).toThrow(/no mapped address/);
  });
  it("needs a check-in before a check-out, and only once each", () => {
    expect(() => assertCanCheck("out", shift(), here, at(end, 0))).toThrow(/Check in first/);
    expect(assertCanCheck("out", shift({ attend_start: start }), here, at(end, 5))).toBe(0);
    expect(() => assertCanCheck("in", shift({ attend_start: start }), here, at(start, 0))).toThrow(/already checked in/);
    expect(() => assertCanCheck("out", shift({ attend_start: start, attend_end: end }), here, at(end, 0))).toThrow(/already checked out/);
    expect(() => assertCanCheck("out", shift({ attend_start: start }), here, at(end, 24 * 60 + 1))).toThrow(/too late/);
  });
  it("refuses cancelled shifts", () => {
    expect(() => assertCanCheck("in", shift({ cancelled: true }), here, at(start, 0))).toThrow(CheckError);
  });
});

describe("progress note fields", () => {
  it("formats bullets and blanks", () => {
    expect(formatNoteField("washed dishes\n- vacuumed")).toBe("• washed dishes\n• vacuumed");
    expect(formatNoteField("  ")).toBe("Not on this shift");
    expect(formatNoteField("not on this shift")).toBe("Not on this shift");
    expect(formatNoteField(null)).toBe("Not on this shift");
  });
  it("reads model JSON even with fences", () => {
    expect(parseModelJson('```json\n{"a":"b"}\n```')).toEqual({ a: "b" });
    expect(parseModelJson('Here: {"a":1} done')).toEqual({ a: 1 });
    expect(parseModelJson("nope")).toBeNull();
  });
});
