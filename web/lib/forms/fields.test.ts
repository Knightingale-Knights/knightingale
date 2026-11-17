import { expect, it } from "vitest";
import { melbMidnight } from "@/lib/forms/fields";
it("melbourne midnight", () => {
  expect(melbMidnight("2026-11-17").toISOString()).toBe("2026-11-16T13:00:00.000Z");
  expect(melbMidnight("2026-07-17").toISOString()).toBe("2026-07-16T14:00:00.000Z");
});
