import { describe, expect, it } from "vitest";
import { buildMessage, isOneSegment, jobsFor, melbAt, normalizePhone, phoneVariants, signLink, verifyLink, linkExpired } from "./rules";

const id = "3f2b8c1e-9d4a-4b6e-8f00-12ab34cd56ef";
const base = "https://app.knightingale.com.au/c/";

describe("melbAt", () => {
  it("handles summer, winter and the daylight saving change", () => {
    expect(new Date(melbAt("2026-12-16", 22, 0)).toISOString()).toBe("2026-12-16T11:00:00.000Z");
    expect(new Date(melbAt("2026-07-01", 22, 0)).toISOString()).toBe("2026-07-01T12:00:00.000Z");
    expect(new Date(melbAt("2026-10-03", 10, 0, 1)).toISOString()).toBe("2026-10-03T23:00:00.000Z");
  });
});

describe("jobsFor", () => {
  const start = melbAt("2026-12-16", 16, 0);
  const end = melbAt("2026-12-16", 20, 0);
  it("gives check in, check out and the progress note reminders (10am paused)", () => {
    const jobs = jobsFor("2026-12-16", start, end);
    expect(jobs.map((j) => j.kind)).toEqual(["checkin", "checkout", "notes_1", "notes_3"]);
    expect(jobs[0].at).toBe(start - 15 * 60_000);
    expect(jobsFor("2026-12-16", start, end, true).map((j) => j.kind)).toContain("notes_2");
  });
  it("skips the 10pm reminder when the shift ends less than 30 minutes before it", () => {
    expect(jobsFor("2026-12-16", start, melbAt("2026-12-16", 21, 45)).map((j) => j.kind)).not.toContain("notes_1");
  });
});

describe("links", () => {
  it("signs a 32 character token and reads it back", () => {
    const t = signLink("s3cret", id, "in");
    expect(t).toHaveLength(32);
    expect(verifyLink("s3cret", t)).toEqual({ shiftId: id, kind: "in" });
    expect(verifyLink("s3cret", signLink("s3cret", id, "out"))?.kind).toBe("out");
  });
  it("rejects a changed token or the wrong secret", () => {
    const t = signLink("s3cret", id, "in");
    expect(verifyLink("other", t)).toBeNull();
    expect(verifyLink("s3cret", "o" + t.slice(1))).toBeNull();
    expect(verifyLink("s3cret", "junk")).toBeNull();
  });
  it("expires 6h after the start (in) or 24h after the end (out)", () => {
    expect(linkExpired("in", 0, 3_600_000, 6 * 3_600_000)).toBe(false);
    expect(linkExpired("in", 0, 3_600_000, 6 * 3_600_000 + 1)).toBe(true);
    expect(linkExpired("out", 0, 3_600_000, 25 * 3_600_000 + 1)).toBe(true);
  });
});

describe("messages", () => {
  const link = base + signLink("s", id, "in");
  const ctx = { firstName: "Christopher Smith", participant: "Alexandrina Jones", place: "Wintringham Port Melbourne", start: melbAt("2026-12-16", 9, 30), end: melbAt("2026-12-16", 14, 30), link };
  it("matches CarerTexts wording and fits one SMS segment", () => {
    const all = [
      buildMessage("checkin", { ...ctx, track: "ndis" }),
      buildMessage("checkout", { ...ctx, track: "ndis" }),
      buildMessage("notes_1", { ...ctx, track: "ndis" }),
      buildMessage("notes_3", { ...ctx, track: "ndis" }),
      buildMessage("checkin", { ...ctx, track: "residential" }),
      buildMessage("checkout", { ...ctx, track: "residential" }),
    ];
    expect(all[0]).toBe(`Hi Christopher, have a great time with Alexandrina! Check in when you arrive: ${link}`);
    expect(all[2]).toBe("Hi Christopher, a gentle reminder you haven't submitted a progress note for your 0930 - 1430 shift with Alexandrina today.");
    expect(all[3]).toContain("yesterday");
    for (const m of all) expect(isOneSegment(m!), m!).toBe(true);
    expect(all[5]).toBe(`Hi Christopher, please check out of Wintringham Port Melbourne here: ${link}`);
    const short = buildMessage("checkout", { ...ctx, firstName: "Ann", place: "Hostel", track: "residential" });
    expect(short).toBe(`Hi Ann, hope your shift at Hostel went well. Please check out here: ${link}`);
  });
  it("sends aged care carers no progress note reminders", () => {
    expect(buildMessage("notes_1", { ...ctx, track: "residential" })).toBeNull();
  });
});

describe("phones", () => {
  it("normalises Australian numbers and lists the ways they may be typed", () => {
    expect(normalizePhone("0412 345 678")).toBe("+61412345678");
    expect(normalizePhone("61412345678")).toBe("+61412345678");
    expect(normalizePhone("hello")).toBeNull();
    expect(phoneVariants("+61412345678").sort()).toEqual(["+61412345678", "0412345678", "412345678", "61412345678"].sort());
  });
});
