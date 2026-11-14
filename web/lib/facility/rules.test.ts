import { describe, expect, it } from "vitest";
import { BookingError, bookingDay, bookingTexts, validateBooking } from "./rules";

describe("validateBooking", () => {
  const ok = { day: "2026-11-20", start: "07:00", end: "15:00", role: "en", notes: " Report to Jo " };
  it("accepts a booking and trims the notes", () => {
    expect(validateBooking(ok, "2026-11-15")).toEqual({ start: 700, end: 1500, role: "en", notes: "Report to Jo" });
  });
  it("rejects past dates, bad times and unknown carer types", () => {
    expect(() => validateBooking({ ...ok, day: "2026-11-14" }, "2026-11-15")).toThrow(BookingError);
    expect(() => validateBooking({ ...ok, end: "07:00" }, "2026-11-15")).toThrow("different");
    expect(() => validateBooking({ ...ok, start: "" }, "2026-11-15")).toThrow("times");
    expect(() => validateBooking({ ...ok, role: "admin" }, "2026-11-15")).toThrow("type of carer");
  });
});

describe("texts", () => {
  it("formats the day as Bubble did", () => {
    expect(bookingDay("2026-11-16")).toBe("Mon, Nov 16th");
    expect(bookingDay("2026-11-21")).toBe("Sat, Nov 21st");
    expect(bookingDay("2026-11-12")).toBe("Thu, Nov 12th");
  });
  it("keeps both texts to one plain SMS segment", () => {
    const t = bookingTexts({ day: "2026-11-16", start: 700, end: 1500, role: "en", facility: "Port Melbourne", bookedBy: "Theo Smith" });
    expect(t.ack).toBe("We've received your request to fill a 0700 - 1500 shift on Mon, Nov 16th. Available ENs have been notified. Sit tight, we're on it!");
    expect(t.alert).toBe("Port Melbourne needs an EN for a 0700 - 1500 shift on Mon, Nov 16th. Booked by Theo Smith.");
    const long = bookingTexts({ day: "2026-11-16", start: 700, end: 1500, role: "student_nurse", facility: "Brotherhood of St Laurence Fitzroy Site", bookedBy: "Jaspreet Kaur-Singh Example" });
    for (const m of [t.ack, t.alert, long.ack, long.alert]) {
      expect(m.length).toBeLessThanOrEqual(160);
      expect(/^[\x20-\x7e]*$/.test(m)).toBe(true);
    }
    expect(long.alert).toContain("needs a Student nurse");
  });
});
