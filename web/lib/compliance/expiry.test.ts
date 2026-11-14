import { describe, expect, it } from "vitest";
import { decide } from "./expiryReader";
import { DOCS, statusOf } from "./docs";

const base = { is_expected_document_type: true, confidence: "high", nrt_logo_visible: true };

describe("decide (same rules as the onboarding endpoint)", () => {
  it("trusts a printed date only when its year is in the quoted line", () => {
    expect(decide({ ...base, expiry_date: "2027-10-08", matched_qualification: "HLTAID009 - CPR - 08/10/2027" }, 12, "2026-11-15"))
      .toMatchObject({ success: true, expiryDate: "2027-10-08", expirySource: "printed" });
    expect(decide({ ...base, expiry_date: "2027-10-08", matched_qualification: "HLTAID009 - CPR", issue_date: null }, 12, "2026-11-15"))
      .toMatchObject({ success: false, expiryDate: null, warning: expect.stringContaining("not trusted") });
  });
  it("works out the expiry from the issue date and the renewal period in code", () => {
    expect(decide({ ...base, expiry_date: null, issue_date: "2026-03-31", matched_qualification: "x" }, 12, "2026-11-15"))
      .toMatchObject({ success: true, expiryDate: "2027-03-31", expirySource: "calculated_from_issue_date" });
  });
  it("flags expired, wrong and unclear documents", () => {
    expect(decide({ ...base, expiry_date: "2026-01-02", matched_qualification: "2026" }, 12, "2026-11-15")).toMatchObject({ reason: "expired", expiryDate: "2026-01-02" });
    expect(decide({ ...base, is_expected_document_type: false, mismatch_reason: "A driver licence", expiry_date: null }, 12, "2026-11-15"))
      .toMatchObject({ reason: "document_type_mismatch", mismatchReason: "A driver licence", expiryDate: null });
    expect(decide({ ...base, confidence: "low", expiry_date: "2027-10-08", matched_qualification: "2027" }, 12, "2026-11-15")).toMatchObject({ success: false, needsReview: true });
  });
});

describe("statusOf", () => {
  const cpr = DOCS.find((d) => d.key === "cpr")!;
  const ndis = DOCS.find((d) => d.key === "ndis_screening")!;
  const id = DOCS.find((d) => d.key === "id")!;
  it("covers missing, check, expired, soon and ok", () => {
    expect(statusOf(cpr, undefined, "2026-11-15")).toBe("missing");
    expect(statusOf(cpr, { has_file: true, has_record: true, expiry: null, number: null }, "2026-11-15")).toBe("check");
    expect(statusOf(cpr, { has_file: true, has_record: true, expiry: "2026-11-14", number: null }, "2026-11-15")).toBe("expired");
    expect(statusOf(cpr, { has_file: true, has_record: true, expiry: "2026-12-10", number: null }, "2026-11-15")).toBe("soon");
    expect(statusOf(cpr, { has_file: true, has_record: true, expiry: "2027-12-10", number: null }, "2026-11-15")).toBe("ok");
    expect(statusOf(ndis, { has_file: false, has_record: true, expiry: "2030-01-01", number: "123" }, "2026-11-15")).toBe("ok");
    expect(statusOf(id, { has_file: true, has_record: true, expiry: null, number: null }, "2026-11-15")).toBe("ok");
  });
});
