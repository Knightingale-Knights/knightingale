import { describe, expect, it } from "vitest";
import { poolerUrl } from "./db";

describe("poolerUrl", () => {
  it("moves the Supabase session pooler to the transaction pooler", () => {
    expect(poolerUrl("postgres://u:p@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres")).toBe("postgres://u:p@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres");
    expect(poolerUrl("postgres://u:p@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres")).toBe("postgres://u:p@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres");
    expect(poolerUrl("postgres://postgres@127.0.0.1:5432/postgres")).toBe("postgres://postgres@127.0.0.1:5432/postgres");
  });
});
