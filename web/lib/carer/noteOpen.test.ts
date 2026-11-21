import { describe, expect, it } from "vitest";
import { noteOpen } from "./rules";

describe("noteOpen", () => {
  const day = { day: "2026-11-18", end_at: new Date("2026-11-18T06:00:00Z") }; // ends 5pm Melbourne
  const night = { day: "2026-11-18", end_at: new Date("2026-11-18T20:15:00Z") }; // ends 7:15am next day Melbourne
  it("is closed before the day", () => expect(noteOpen(day, new Date("2026-11-17T10:00:00Z"))).toBe(false)); // 9pm 17th
  it("is open on the day", () => expect(noteOpen(day, new Date("2026-11-18T10:00:00Z"))).toBe(true)); // 9pm
  it("is open the next day", () => expect(noteOpen(day, new Date("2026-11-19T12:00:00Z"))).toBe(true)); // 11pm 19th
  it("closes the day after that", () => expect(noteOpen(day, new Date("2026-11-19T14:00:00Z"))).toBe(false)); // 1am 20th
  it("stays open the day after an overnight shift ends", () => expect(noteOpen(night, new Date("2026-11-20T02:00:00Z"))).toBe(true)); // 1pm 20th
  it("closes two days after an overnight shift ends", () => expect(noteOpen(night, new Date("2026-11-20T14:00:00Z"))).toBe(false)); // 1am 21st
});
