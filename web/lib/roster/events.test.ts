import { describe, expect, it } from "vitest";
import { checkEvent } from "./events";

const base = { participant: "p", details: "Physio", day: "2026-11-20", time: "13:30", where: "", repeatUntil: null };

describe("checkEvent", () => {
  it("stores the time like Bubble does", () => {
    expect(checkEvent(base)).toBe("1330");
    expect(checkEvent({ ...base, time: "9:05" })).toBe("0905");
  });
  it("rejects missing or bad fields", () => {
    expect(() => checkEvent({ ...base, participant: "" })).toThrow();
    expect(() => checkEvent({ ...base, time: "1pm" })).toThrow();
    expect(() => checkEvent({ ...base, repeatUntil: "2026-11-01" })).toThrow();
  });
});
