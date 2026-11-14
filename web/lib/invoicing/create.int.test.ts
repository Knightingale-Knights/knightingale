// End-to-end invoicing against a scratch database seeded through the sync.
// Runs only when TEST_DATABASE_URL is set. Email is faked; the app makes no other outside calls.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const calls: { url: string; method: string; body: any }[] = [];

describe.skipIf(!url)("invoicing (scratch database)", () => {
  let mod: typeof import("./create");
  let q: typeof import("./queries");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.POSTMARK_TOKEN = "test";
    vi.stubGlobal("fetch", async (u: string, init: RequestInit) => {
      calls.push({ url: String(u), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ MessageID: "m1" }), { status: 200 });
    });
    ({ sql } = await import("@/lib/db"));
    mod = await import("./create");
    q = await import("./queries");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.locations union all select bubble_id, id from app.users`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
  });
  afterAll(async () => { await sql?.end(); });

  it("bills the right residential shifts, including late ones", async () => {
    const shifts = await q.billableShifts("residential", ids.LOC1, "2026-11-10");
    expect(shifts.map((s) => s.bubble_id).sort()).toEqual(["R1", "R2", "R3"]);
    expect(shifts.find((s) => s.bubble_id === "R1")!.late).toBe(true);
    expect(await q.nextInvoiceNumber()).toBe("1134");
  });

  it("creates and emails a residential invoice, calling nothing but Postmark", async () => {
    const shifts = await q.billableShifts("residential", ids.LOC1, "2026-11-10");
    calls.length = 0;
    const r = await mod.createInvoice({
      kind: "residential", target: ids.LOC1, through: "2026-11-10", invoiceNumber: "1134", invoiceDate: "2026-11-11",
      paymentTerms: "14 days", sendTo: "care@example.com", travelItemNo: "", travelItemDescription: "",
      expectedShiftIds: shifts.map((s) => s.id), createdBy: ids.ADM,
    });
    expect(r.warnings).toEqual([]);
    expect(r.shifts).toBe(3);
    expect(r.amount).toBe(1584); // 3 x 8h x $60 = 1440, plus 10% GST
    const [inv] = await sql`select * from app.invoices where id = ${r.invoiceId}`;
    expect(inv).toMatchObject({ kind: "residential", state: "issued", created_in_app: true, invoice_number: "1134", gst: 144, emailed_to: "care@example.com" });
    expect(inv.emailed_at).not.toBeNull();
    const [f] = await sql`select length(pdf) as n from app.invoice_files where invoice_id = ${r.invoiceId}`;
    expect(Number(f.n)).toBeGreaterThan(1000);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("api.postmarkapp.com");
    expect(calls[0].body).toMatchObject({ To: "care@example.com", TemplateAlias: "invoice" });
    expect(calls[0].body.Attachments[0].Name).toBe("Williamstown - Invoice 1134.pdf");
    expect(await q.billableShifts("residential", ids.LOC1, "2026-11-10")).toEqual([]);
  });

  it("refuses a reused number or a stale selection", async () => {
    const base = {
      kind: "ndis" as const, target: ids.P1, through: "2026-11-10", invoiceDate: "2026-11-11", paymentTerms: "7",
      sendTo: "pm@example.com", travelItemNo: "04_590", travelItemDescription: "Travel", createdBy: null,
    };
    await expect(mod.createInvoice({ ...base, invoiceNumber: "1134", expectedShiftIds: [] })).rejects.toThrow(/already used/);
    await expect(mod.createInvoice({ ...base, invoiceNumber: "1135", expectedShiftIds: [] })).rejects.toThrow(/changed since/);
  });

  it("creates an NDIS invoice with travel", async () => {
    const shifts = await q.billableShifts("ndis", ids.P1, "2026-11-10");
    calls.length = 0;
    const r = await mod.createInvoice({
      kind: "ndis", target: ids.P1, through: "2026-11-10", invoiceNumber: "1135", invoiceDate: "2026-11-11", paymentTerms: "7 days",
      sendTo: "pm@example.com", travelItemNo: "04_590", travelItemDescription: "Travel",
      expectedShiftIds: shifts.map((s) => s.id), createdBy: null,
    });
    expect(r).toMatchObject({ shifts: 1, travel: 1, amount: 380.4, warnings: [] }); // 5 x 73.58 + 12.5 km
    // The invoice, then next week's roster to the coordinator (or the participant when there is none), as Bubble did.
    expect(calls.map((c) => new URL(c.url).host)).toEqual(["api.postmarkapp.com", "api.postmarkapp.com"]);
    expect(calls[1].body.Subject).toMatch(/^Weekly roster — Sam Day — /);
    const [inv] = await sql`select due_date::text as due, gst, participant from app.invoices where id = ${r.invoiceId}`;
    expect(inv).toMatchObject({ due: "2026-11-18", gst: 0, participant: ids.P1 });
    expect(await q.billableTravel(ids.P1, "2026-11-10")).toEqual([]);
  });

  it("sends billed residential shifts to Wintringham once", async () => {
    const w = await import("./wintringham");
    calls.length = 0;
    expect(await w.sendWintringhamCsv("wintringham@example.com")).toEqual({ rows: 3 });
    expect(calls).toHaveLength(1);
    const csv = Buffer.from(calls[0].body.Attachments[0].Content, "base64").toString("utf8");
    expect(csv.split("\r\n")[1]).toMatch(/^Williamstown,1134,10\/11\/2026,Ann,EN,/);
    await expect(w.sendWintringhamCsv("wintringham@example.com")).rejects.toThrow(/No billed shifts/);
  });
});
