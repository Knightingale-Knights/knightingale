import { describe, expect, it } from "vitest";
import {
  auDate, clock, dueDate, feeMismatches, isoDate, lineDate, ndiaCsvRows, residentialLineItems,
  roleLabel, toCsv, totals, travelItemFor, travelItemOptions, travelItems, wintringhamRows, type ShiftRow, type TravelRow,
} from "./rules";

const shift = (o: Partial<ShiftRow> = {}): ShiftRow => ({
  id: "s1", bubble_id: "b1",
  // 2026-09-17 14:00 UTC is midnight on Fri 18 Sep in Melbourne, how Bubble stores dates.
  date: new Date("2026-09-17T14:00:00Z"),
  start_time: 930, end_time: 1430, hours: 5, rate: 73.58, fee: 367.9, roles: ["dsw"],
  carer_first: "Ann", carer_last: "Lee", ndis_item_no: "01_011_0107_1_1", ndis_item_name: "Self care",
  ndis_item_price: 73.58, registration: "4053437425", gst_code: "P2", abn: "50405424095",
  participant_ndis_number: "432197636", location_name: "Williamstown", late: false, ...o,
});
const travel = (o: Partial<TravelRow> = {}): TravelRow => ({
  id: "t1", bubble_id: "tb1", date: new Date("2026-09-17T14:00:00Z"), carer_first: "Ann", distance: 12.5, ...o,
});

describe("dates and labels", () => {
  it("formats in Melbourne time", () => {
    expect(lineDate(shift().date)).toBe("Fri, Sep 18th");
    expect(lineDate(shift().date, true)).toBe("Fri, September 18th");
    expect(auDate(shift().date)).toBe("18/09/2026");
    expect(isoDate(shift().date)).toBe("2026-09-18");
    expect(auDate("2026-11-30")).toBe("30/11/2026");
  });
  it("handles ordinals", () => {
    expect(lineDate(new Date("2026-09-01T00:00:00Z"))).toMatch(/1st$/);
    expect(lineDate(new Date("2026-09-11T00:00:00Z"))).toMatch(/11th$/);
    expect(lineDate(new Date("2026-09-22T00:00:00Z"))).toMatch(/22nd$/);
  });
  it("formats Bubble clock numbers and roles", () => {
    expect(clock(930)).toBe("09:30");
    expect(clock(1430)).toBe("14:30");
    expect(clock(0)).toBe("00:00");
    expect(roleLabel(["dsw"])).toBe("DSW");
    expect(roleLabel(["cleaner"])).toBe("CL");
    expect(roleLabel(null)).toBe("");
  });
  it("computes due dates", () => {
    expect(dueDate("2026-11-30", "14 days")).toBe("2026-12-14");
    expect(dueDate("2026-11-30", "7")).toBe("2026-12-07");
  });
});

describe("totals", () => {
  it("adds 10% GST to residential invoices only", () => {
    const s = [shift(), shift({ id: "s2", hours: 8, rate: 60 })];
    expect(totals("residential", s)).toEqual({ shiftTotal: 847.9, travelTotal: 0, subtotal: 847.9, gst: 84.79, amount: 932.69 });
    expect(totals("ndis", s).gst).toBe(0);
  });
  it("adds travel at $1/km for NDIS and NDIA, never residential", () => {
    expect(totals("ndis", [shift()], [travel()]).amount).toBe(380.4);
    expect(totals("ndia", [shift()], [travel()]).travelTotal).toBe(12.5);
    expect(totals("residential", [shift()], [travel()]).travelTotal).toBe(0);
  });
  it("treats missing numbers as zero", () => {
    expect(totals("ndis", [shift({ hours: null, rate: null })]).amount).toBe(0);
  });
  it("flags shifts whose stored fee disagrees with hours x rate", () => {
    expect(feeMismatches([shift(), shift({ id: "x", fee: 300 })]).map((s) => s.id)).toEqual(["x"]);
  });
});

describe("line items and CSVs", () => {
  it("builds residential lines", () => {
    expect(residentialLineItems([shift()])[0]).toEqual({
      date: "Fri, Sep 18th", shift: "09:30 - 14:30", carer: "Ann Lee", role: "DSW", hours: 5, rate: 73.58,
    });
  });
  it("builds travel lines", () => {
    expect(travelItems([travel()], [], "04_590_0125_6_1")[0]).toMatchObject({
      ndis_item: "04_590_0125_6_1", ndis_description: "Activity Based Transport", distance: 12.5, rate: 1,
    });
  });
  it("offers only the travel item matching the shifts' 01/04 category", () => {
    expect(travelItemOptions([{ ndis_item_no: "01_011_0107_1_1" }]).map((o) => o.no)).toEqual(["01_799_0107_1_1"]);
    expect(travelItemOptions([{ ndis_item_no: "04_104_0125_6_1" }]).map((o) => o.no)).toEqual(["04_590_0125_6_1"]);
    expect(travelItemOptions([{ ndis_item_no: null }])).toHaveLength(2);
    expect(travelItemOptions([{ ndis_item_no: "01_011_0107_1_1" }, { ndis_item_no: "04_104_0125_6_1" }])).toHaveLength(2);
  });
  it("matches each travel log to its own shift, then same-day shifts, then the invoice", () => {
    const d1 = new Date("2026-09-18T00:00:00Z"), d2 = new Date("2026-09-19T00:00:00Z");
    const mixed = [{ ndis_item_no: "01_011_0107_1_1", date: d1 }, { ndis_item_no: "04_104_0125_6_1", date: d2 }];
    expect(travelItemFor(travel({ date: d1 }), mixed)?.no).toBe("01_799_0107_1_1");
    expect(travelItemFor(travel({ date: d2 }), mixed)?.no).toBe("04_590_0125_6_1");
    expect(travelItemFor(travel({ date: d1, shift_item_no: "04_104_0125_6_1" }), mixed)?.no).toBe("04_590_0125_6_1");
    expect(travelItemFor(travel({ date: new Date("2026-09-25T00:00:00Z") }), mixed)).toBeNull();
    expect(travelItemFor(travel({ date: new Date("2026-09-25T00:00:00Z") }), [mixed[0]])?.no).toBe("01_799_0107_1_1");
    const items = travelItems([travel({ date: d1 }), travel({ date: d2 })], mixed, "");
    expect(items.map((i) => i.ndis_item)).toEqual(["01_799_0107_1_1", "04_590_0125_6_1"]);
  });
  it("uses the invoice number as the NDIA claim reference", () => {
    const r = ndiaCsvRows([shift()], "1201")[0];
    expect(r).toMatchObject({ ClaimReference: "1201", SupportsDeliveredFrom: "2026-09-18", UnitPrice: 73.58, Hours: 5, Quantity: "" });
  });
  it("builds Wintringham rows", () => {
    const r = wintringhamRows([{ ...shift(), invoice_number: "1133", invoice_period_ending: new Date("2026-09-20T14:00:00Z"), invoice_amount: 1000 }])[0];
    expect(r).toMatchObject({ "Invoice Number": "1133", "Invoice date": "21/09/2026", "Start Time": "09:30", "Shift Amount": "367.90" });
  });
  it("escapes CSV values and adds a BOM", () => {
    const csv = toCsv(["a", "b"], [{ a: 'x,"y"', b: 2 }]);
    expect(csv).toBe('﻿a,b\r\n"x,""y""",2\r\n');
  });
});
