import { describe, expect, it } from "vitest";
import { validTfn } from "./money";

describe("validTfn", () => {
  it("accepts the ATO sample TFN", () => expect(validTfn("123456782")).toBe(true));
  it("rejects a wrong check digit", () => expect(validTfn("123456789")).toBe(false));
  it("accepts 8-digit TFNs", () => expect(validTfn("12345678")).toBe(true));
  it("rejects letters", () => expect(validTfn("12345678a")).toBe(false));
});
