import { describe, expect, it } from "vitest";
import { bubbleUuid } from "./write";

describe("bubbleUuid", () => {
  it("matches Postgres md5(bubble_id)::uuid", () => {
    // select md5('1794603346846x903732336562981900')::uuid
    expect(bubbleUuid("1794603346846x903732336562981900")).toBe("02298151-47de-e6fe-57f6-26232c95763b");
  });
});
