// Weekly roster email against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { nextMonday, weekRangeText } from "./week";

const url = process.env.TEST_DATABASE_URL;

describe("week helpers", () => {
  it("picks the coming Monday, or the one after on a Monday", () => {
    expect(nextMonday("2026-11-15")).toBe("2026-11-16"); // Sunday
    expect(nextMonday("2026-11-16")).toBe("2026-11-23"); // Monday
    expect(nextMonday("2026-11-20")).toBe("2026-11-23");
    expect(weekRangeText("2026-11-16")).toBe("Monday 16 Nov to Sunday 22 Nov");
  });
});

describe.skipIf(!url)("weekly roster (scratch database)", () => {
  let w: typeof import("./weekly");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  const fetchSpy = vi.fn(async (_u: string, _o: { body: string }) => new Response(JSON.stringify({ MessageID: "m1" }), { status: 200 }));

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.POSTMARK_TOKEN = "test";
    ({ sql } = await import("@/lib/db"));
    w = await import("./weekly");
    const rows = await sql<{ bubble_id: string; id: string }[]>`select bubble_id, id from app.users union all select bubble_id, id from app.ndis_price_items`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    const roster = await import("@/lib/roster/mutate");
    const common = { kind: "ndis" as const, participant: ids.P1, location: null, priceItem: ids.NP, role: "dsw", hours: "", notes: "", supervisor: "", repeatUntil: null };
    await roster.createShifts({ ...common, day: "2028-03-07", start: "09:30", end: "14:30", carer: ids.U1 }, null);
    await roster.createShifts({ ...common, day: "2028-03-09", start: "16:00", end: "20:00", carer: null }, null);
    const c = await roster.createShifts({ ...common, day: "2028-03-10", start: "09:00", end: "10:00", carer: ids.U1 }, null);
    await roster.setCancelled(c.ids[0], true);
    await sql`update app.users set coordinator_2 = ${ids.ADM} where id = ${ids.P1}`;
  });
  afterAll(async () => { await sql?.end(); });

  it("lists the week's shifts (not cancelled ones) with the Roster repo's stats", async () => {
    const r = (await w.weeklyRoster(ids.P1, "2028-03-06"))!;
    expect(r.shifts.map((s) => [s.weekday, s.dayMonth, s.timeRange, s.carer, s.hours])).toEqual([
      ["Tuesday", "7 Mar", "9:30 am to 2:30 pm", "Ann Lee", 5],
      ["Thursday", "9 Mar", "4:00 to 8:00 pm", null, 4],
    ]);
    expect(r.stats).toEqual({ totalHoursText: "9", shiftCount: 2, carerCount: 1 });
  });

  it("emails the coordinator the HTML roster with the PDF attached", async () => {
    vi.stubGlobal("fetch", fetchSpy);
    const r = await w.sendWeeklyRoster(ids.P1, "2028-03-06");
    vi.unstubAllGlobals();
    expect(r).toMatchObject({ to: "admin@example.com", shifts: 2 });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.Subject).toBe("Weekly roster — Sam Day — 6 Mar to 12 Mar");
    expect(body.HtmlBody).toContain("TBC");
    expect(body.Attachments[0]).toMatchObject({ Name: "Knightingale_Roster_Sam-Day_2028-03-06.pdf", ContentType: "application/pdf" });
    expect(Buffer.from(body.Attachments[0].Content, "base64").subarray(0, 4).toString()).toBe("%PDF");
  });
});
