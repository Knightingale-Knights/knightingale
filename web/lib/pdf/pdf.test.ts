import { describe, expect, it } from "vitest";
import { ndisPdf, residentialPdf } from "./index";
import { ndisShiftItems, residentialLineItems, travelItems, type ShiftRow } from "@/lib/invoicing/rules";
import { writeFileSync } from "node:fs";

const s = (o: Partial<ShiftRow>): ShiftRow => ({
  id: "1", bubble_id: null, date: new Date("2026-11-02T13:00:00Z"), start_time: 700, end_time: 1500, hours: 8, rate: 62.5,
  fee: 500, roles: ["en"], carer_first: "Sample", carer_last: "Carer", ndis_item_no: "01_011_0107_1_1",
  ndis_item_name: "Assistance with self-care", ndis_item_price: 62.5, registration: null, gst_code: "P2", abn: null,
  participant_ndis_number: null, location_name: "Sample site", late: false, ...o,
});
const common = { invoice_number: "9999", period_ending: "08/11/2026", invoice_date: "09/11/2026", payment_terms: "14 days", due_date: "23/11/2026", location_address: "1 Sample St, Melbourne VIC 3000" };

describe("pdf", () => {
  it("renders both designs", async () => {
    const shifts = [s({}), s({ id: "2", date: new Date("2026-11-03T13:00:00Z"), roles: ["pca"] })];
    const r = await residentialPdf({ ...common, location_name: "Sample site", line_items: residentialLineItems(shifts) });
    const n = await ndisPdf({ ...common, participant: "Sample", ndis_number: "000000000", location_name: "Sample plan manager",
      shift_items: ndisShiftItems(shifts), travel_items: travelItems([{ id: "t", bubble_id: null, date: shifts[0].date, carer_first: "Sample", distance: 14 }], shifts, "04_590_0125_6_1") });
    expect(Buffer.from(r, "base64").subarray(0, 4).toString()).toBe("%PDF");
    expect(Buffer.from(n, "base64").subarray(0, 4).toString()).toBe("%PDF");
    if (process.env.WRITE_PDFS) { writeFileSync("/tmp/res.pdf", Buffer.from(r, "base64")); writeFileSync("/tmp/ndis.pdf", Buffer.from(n, "base64")); }
  });
});
