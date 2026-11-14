// Carer compliance documents against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ExpiryReading } from "./expiryReader";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("compliance (scratch database)", () => {
  let c: typeof import("./data");
  let sql: typeof import("@/lib/db").sql;
  let carer: string;
  let admin: string;
  let ids: Record<string, string> = {};
  const today = "2026-11-15";
  const png = { name: "cert.png", type: "image/png", bytes: Buffer.from("fake") };
  const reading = (o: Partial<ExpiryReading>): ExpiryReading => ({
    success: true, needsReview: false, reason: null, mismatchReason: null, documentType: null, expiryDate: null,
    expirySource: "printed", issueDate: null, matchedQualification: null, confidence: "high", warning: null, ...o,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ sql } = await import("@/lib/db"));
    c = await import("./data");
    const [u] = await sql<{ id: string }[]>`
      insert into app.users (first_name, last_name, email, account_type, active) values ('Cleo', 'Compliance', 'cleo@example.com', 'carer', true) returning id`;
    carer = u.id;
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.users union all select bubble_id, id from app.ndis_price_items
      union all select bubble_id, id from app.locations union all select bubble_id, id from app.residential_prices`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    admin = ids.ADM;
  });
  afterAll(async () => { await sql?.end(); });

  it("starts with everything missing", async () => {
    const docs = await c.carerDocs(carer, today);
    expect(docs.every((d) => d.status === "missing")).toBe(true);
    expect(await c.attentionCount(carer, today)).toBe(docs.length);
  });

  it("keeps an upload and records the expiry read from it", async () => {
    const r = await c.uploadDoc(carer, "cpr", png, carer, today, async () => reading({ expiryDate: "2027-10-08" }));
    expect(r).toMatchObject({ status: "ok", expiry: "2027-10-08" });
    const cpr = (await c.carerDocs(carer, today)).find((d) => d.def.key === "cpr")!;
    expect(cpr.files).toHaveLength(1);
    const fileId = cpr.files[0].replace("/files/", "");
    expect((await c.complianceFile(fileId, { id: carer, role: "carer" }))?.bytes.toString()).toBe("fake");
    expect(await c.complianceFile(fileId, { id: ids.U1, role: "carer" })).toBeNull();
    expect(await c.complianceFile(fileId, { id: admin, role: "admin" })).not.toBeNull();
  });

  it("leaves a document it can't read for the office, and marks a lapsed one expired", async () => {
    let r = await c.uploadDoc(carer, "first_aid", png, carer, today, async () => reading({ success: false, needsReview: true, reason: "document_type_mismatch", mismatchReason: "A passport" }));
    expect(r).toMatchObject({ status: "check", expiry: null });
    r = await c.uploadDoc(carer, "first_aid", png, carer, today, async () => reading({ success: false, needsReview: true, reason: "expired", expiryDate: "2026-10-01" }));
    expect(r).toMatchObject({ status: "expired", expiry: "2026-10-01" });
    await expect(c.uploadDoc(carer, "ndis_screening", png, carer, today)).rejects.toThrow("can't be uploaded");
    await expect(c.uploadDoc(carer, "cpr", { ...png, type: "text/html" }, carer, today)).rejects.toThrow("photo or a PDF");
  });

  it("adds flu records to the list and keeps typed details when a new file comes in", async () => {
    await c.uploadDoc(carer, "flu", png, carer, today, async () => reading({ expiryDate: "2027-04-01" }));
    await c.uploadDoc(carer, "flu", png, carer, today, async () => reading({ expiryDate: "2027-05-01" }));
    const flu = (await c.carerDocs(carer, today)).find((d) => d.def.key === "flu")!;
    expect(flu.files).toHaveLength(2);
    expect(flu.expiry).toBe("2027-05-01");
    await c.setDetails(carer, "police", carer, { number: "NPC-123" }, today);
    await c.uploadDoc(carer, "police", png, carer, today, async () => reading({ expiryDate: "2029-01-01" }));
    const police = (await c.carerDocs(carer, today)).find((d) => d.def.key === "police")!;
    expect(police).toMatchObject({ number: "NPC-123", expiry: "2029-01-01", status: "ok" });
  });

  it("takes a typed NDIS screening ID and expiry", async () => {
    await c.setDetails(carer, "ndis_screening", carer, { number: " 4-ABC ", expiry: "2026-12-01" }, today);
    const s = (await c.carerDocs(carer, today)).find((d) => d.def.key === "ndis_screening")!;
    expect(s).toMatchObject({ number: "4-ABC", expiry: "2026-12-01", status: "soon" });
    await expect(c.setDetails(carer, "ndis_screening", carer, { expiry: "soon" }, today)).rejects.toThrow("valid date");
  });

  it("warns on the roster about expired documents (NDIS screening only for NDIS shifts)", async () => {
    expect(await c.rosterProblems(carer, "2026-12-05", false)).toEqual(["First aid expired 2026-10-01"]);
    expect(await c.rosterProblems(carer, "2026-12-05", true)).toEqual(["First aid expired 2026-10-01", "NDIS worker screening expired 2026-12-01"]);
    const roster = await import("@/lib/roster/mutate");
    const r = await roster.createShifts({ kind: "residential", day: "2026-12-05", start: "07:00", end: "15:00", hours: "", carer, participant: null,
      location: ids.LOC1, priceItem: ids.RP, role: "en", notes: "", supervisor: "", repeatUntil: null }, null);
    expect(r.warnings).toContain("Check this carer's documents: First aid expired 2026-10-01.");
    await roster.deleteShift(r.ids[0]);
  });

  it("shows the office table and emails each expiring document once", async () => {
    const row = (await c.complianceTable(today)).find((r) => r.id === carer)!;
    expect(row.statuses).toMatchObject({ cpr: "ok", first_aid: "expired", flu: "ok", ndis_screening: "soon", id: "missing" });
    const soon = (await c.expiringSoon("2026-11-28")).filter((i) => i.carer === "Cleo Compliance");
    expect(soon.map((i) => [i.doc, i.expiry])).toEqual([["ndis_screening", "2026-12-01"]]);
    await c.markAlerted(soon);
    expect((await c.expiringSoon("2026-11-28")).filter((i) => i.carer === "Cleo Compliance")).toEqual([]);
  });
});
