// Roster changes against a scratch database seeded through the sync.
// Runs only when TEST_DATABASE_URL is set. The roster makes no outside calls.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("roster (scratch database)", () => {
  let m: typeof import("./mutate");
  let q: typeof import("./queries");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  const fetchSpy = vi.fn();

  const slots = async (carer: string) =>
    Object.fromEntries((await sql<{ shift: string; accepted: string; available: boolean }[]>`
      select shift, accepted, available from app.availability where carer = ${carer}`).map((r) => [r.shift, `${r.accepted}/${r.available}`]));

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    vi.stubGlobal("fetch", fetchSpy);
    ({ sql } = await import("@/lib/db"));
    m = await import("./mutate");
    q = await import("./queries");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.locations union all select bubble_id, id from app.users
      union all select bubble_id, id from app.ndis_price_items union all select bubble_id, id from app.residential_prices`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
  });
  afterAll(async () => {
    expect(fetchSpy).not.toHaveBeenCalled();
    await sql?.end();
  });

  const base = () => ({
    kind: "residential" as const, day: "2026-11-16", start: "07:00", end: "15:00", hours: "", carer: ids.U1,
    participant: null, location: ids.LOC1, priceItem: ids.RP, role: "en", notes: "", supervisor: "", repeatUntil: null,
  });

  it("creates a residential shift with Bubble's pricing and takes the carer's slots", async () => {
    const r = await m.createShifts({ ...base(), repeatUntil: "2026-11-23" }, ids.ADM);
    expect(r.ids).toHaveLength(2);
    expect(r.warnings).toEqual([]);
    const [s] = await sql`select hours, rate, fee, revenue, wage, roles, address->>'address' as address, recurring,
                                 to_char(date at time zone 'Australia/Melbourne', 'YYYY-MM-DD') as day
                            from app.shifts where id = ${r.ids[0]}`;
    expect(s).toMatchObject({ hours: 8, rate: 60, fee: 480, revenue: 160, wage: 280, roles: ["en"], day: "2026-11-16",
      address: "2 Wintringham Rd, Williamstown VIC 3016", recurring: "weekly until 2026-11-23" });
    expect(await slots(ids.U1)).toEqual({ "0600___1400": "YES/false", "night__2200___0715_": "YES/false", "night__11pm___7am_": "pending/true" });
  });

  it("warns about a double booking but still saves", async () => {
    const r = await m.createShifts({ ...base(), start: "14:00", end: "18:00" }, null);
    expect(r.warnings[0]).toMatch(/already has a shift overlapping/);
    await m.deleteShift(r.ids[0]);
  });

  it("frees the old carer's slots when the carer changes, and on cancel", async () => {
    const week = await q.weekShifts("2026-11-16", { carer: ids.U1 });
    const shift = week.find((s) => s.day === "2026-11-16")!;
    await m.updateShift(shift.id, { ...base(), carer: ids.U2 });
    expect(Object.values(await slots(ids.U1)).every((v) => v === "pending/true")).toBe(true);
    await m.updateShift(shift.id, base());
    expect((await slots(ids.U1))["0600___1400"]).toBe("YES/false");
    await m.setCancelled(shift.id, true);
    expect((await slots(ids.U1))["0600___1400"]).toBe("pending/true");
    await m.setCancelled(shift.id, false);
    expect((await slots(ids.U1))["0600___1400"]).toBe("YES/false");
  });

  it("creates NDIS shifts from the participant, and lists who's free", async () => {
    const r = await m.createShifts({ ...base(), kind: "ndis", participant: ids.P1, location: null, priceItem: ids.NP,
      carer: null, role: "dsw", day: "2026-11-17", start: "9:30", end: "1430" }, null);
    const [s] = await sql`select fee, wage, revenue, participant, location, ndis_pricing from app.shifts where id = ${r.ids[0]}`;
    expect(s).toMatchObject({ fee: 367.9, wage: 200, revenue: 143.9, participant: ids.P1, location: null, ndis_pricing: ids.NP });
    const week = await q.weekShifts("2026-11-16", { participant: ids.P1 });
    expect(week.map((w) => [w.day, w.kind, w.carer])).toEqual([["2026-11-17", "ndis", null]]);
    const free = await q.availableOn("2026-11-16");
    expect(free.map((f) => f.name)).toEqual(["Ann Lee"]);
    expect(free[0].slots).toEqual(["night__11pm___7am_"]);
  });

  it("copies a shift and records overnight attendance", async () => {
    const [src] = await q.weekShifts("2026-11-16", { participant: ids.P1 });
    const r = await m.copyShift(src.id, ["2026-11-18", "2026-11-19"], null);
    expect(r.ids).toHaveLength(2);
    await m.markAttended(r.ids[0], "22:00", "06:30");
    const [a] = await sql`select attended,
        to_char(attend_start at time zone 'Australia/Melbourne', 'YYYY-MM-DD HH24:MI') as s,
        to_char(attend_end at time zone 'Australia/Melbourne', 'YYYY-MM-DD HH24:MI') as e
      from app.shifts where id = ${r.ids[0]}`;
    expect(a).toEqual({ attended: true, s: "2026-11-18 22:00", e: "2026-11-19 06:30" });
  });

  it("lets staff change invoiced shifts but not delete them, and refuses to delete ones with progress notes", async () => {
    const [inv] = await sql`select id from app.shifts where bubble_id = 'R5'`; // invoiced in Bubble
    await m.setCancelled(inv.id, true);
    await m.setCancelled(inv.id, false);
    await expect(m.deleteShift(inv.id)).rejects.toThrow(/on an invoice/);
    const [s] = await q.weekShifts("2026-11-16", { participant: ids.P1 });
    await sql`insert into app.progress_notes (shift, summary) values (${s.id}, 'note')`;
    await expect(m.deleteShift(s.id)).rejects.toThrow(/progress note/);
  });

  it("rejects bad input", async () => {
    await expect(m.createShifts({ ...base(), start: "25:00" }, null)).rejects.toThrow(/start and end/);
    await expect(m.createShifts({ ...base(), location: null }, null)).rejects.toThrow(/location/);
    await expect(m.createShifts({ ...base(), role: "x; drop" }, null)).rejects.toThrow(/role/);
  });
});
