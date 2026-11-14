// Travel logs and receipts against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("travel and receipts (scratch database)", () => {
  let t: typeof import("./travel");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  let ndis: string;
  let res: string;
  const during = new Date("2027-02-10T00:00:00Z"); // 11am Melbourne, during the 9am to 1pm shift
  const km = async () => 12.34;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ sql } = await import("@/lib/db"));
    t = await import("./travel");
    const roster = await import("@/lib/roster/mutate");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.users union all select bubble_id, id from app.ndis_price_items
      union all select bubble_id, id from app.locations union all select bubble_id, id from app.residential_prices`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    const common = { day: "2027-02-10", start: "09:00", end: "13:00", hours: "", carer: ids.U1, notes: "", supervisor: "", repeatUntil: null };
    ndis = (await roster.createShifts({ ...common, kind: "ndis", participant: ids.P1, location: null, priceItem: ids.NP, role: "dsw" }, null)).ids[0];
    res = (await roster.createShifts({ ...common, kind: "residential", participant: null, location: ids.LOC1, priceItem: ids.RP, role: "en", start: "15:00", end: "19:00" }, null)).ids[0];
  });
  afterAll(async () => { await sql?.end(); });

  it("logs travel with the driving distance, for the shift's participant, ready to invoice", async () => {
    const r = await t.addTravel(ids.U1, ndis, " 1 Home St, Footscray ", "1 Sample St, Melbourne", during, km);
    expect(r.km).toBe(12.34);
    const [l] = await sql`select carer, participant, shift, distance, log_type, invoiced, start_location->>'address' as a from app.shift_logs where id = ${r.id}`;
    expect(l).toMatchObject({ carer: ids.U1, participant: ids.P1, shift: ndis, distance: 12.34, log_type: "travel", invoiced: false, a: "1 Home St, Footscray" });
    const [u] = await sql`select count(*)::int as n from app.uninvoiced_travel where id = ${r.id}`;
    expect(u.n).toBe(1);
    expect((await t.shiftTravel(ndis)).map((x) => x.km)).toEqual([12.34]);
  });

  it("refuses other carers, aged care shifts, and silly distances", async () => {
    await expect(t.addTravel(ids.U2, ndis, "aaa", "bbb", during, km)).rejects.toThrow("couldn't find");
    await expect(t.addTravel(ids.U1, res, "aaa", "bbb", during, km)).rejects.toThrow("NDIS");
    await expect(t.addTravel(ids.U1, ndis, "aaa", "bbb", during, async () => 900)).rejects.toThrow("over 500");
    await expect(t.addTravel(ids.U1, ndis, "aaa", "bbb", new Date("2027-03-10T00:00:00Z"), km)).rejects.toThrow("too late");
  });

  it("lets the carer remove travel until it is invoiced", async () => {
    const r = await t.addTravel(ids.U1, ndis, "Here St", "There St", during, km);
    await expect(t.removeTravel(ids.U2, r.id)).rejects.toThrow("couldn't find");
    await t.removeTravel(ids.U1, r.id);
    const [l] = await sql`select count(*)::int as n from app.shift_logs where id = ${r.id}`;
    expect(l.n).toBe(0);
  });

  it("keeps receipts, adds read totals to the shift, and leaves unclear ones for the office", async () => {
    const png = { name: "lunch.png", type: "image/png", bytes: Buffer.from("fake image") };
    await t.addReceipt(ids.U1, ndis, png, during, async () => ({ total: 18.5, merchant: "Cafe", needsReview: false, reason: null }));
    await t.addReceipt(ids.U1, ndis, png, during, async () => ({ total: 4, merchant: null, needsReview: true, reason: "low_confidence" }));
    await t.addReceipt(ids.U1, ndis, png, during, async () => null); // no API key
    const r = await t.shiftReceipts(ndis);
    expect(r.total).toBe(18.5);
    expect(r.files.map((f) => [f.total, f.needs_review])).toEqual([[18.5, false], [4, true], [null, true]]);
    const f = await t.receiptFile(r.files[0].id, { id: ids.U1, role: "carer" });
    expect(f?.bytes.toString()).toBe("fake image");
    expect(await t.receiptFile(r.files[0].id, { id: ids.U2, role: "carer" })).toBeNull();
    expect(await t.receiptFile(r.files[0].id, { id: ids.U2, role: "admin" })).not.toBeNull();
    await expect(t.addReceipt(ids.U1, ndis, { ...png, type: "text/html" }, during)).rejects.toThrow("photo or a PDF");
  });
});
