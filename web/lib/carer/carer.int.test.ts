// Carer actions against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("carer (scratch database)", () => {
  let c: typeof import("./data");
  let roster: typeof import("@/lib/roster/mutate");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  const fetchSpy = vi.fn();
  let resShift: string;
  let ndisShift: string;
  const williamstown = { lat: -37.8548796, lng: 144.8790851, accuracy: 15 };
  const melbourne = { lat: -37.81, lng: 144.96, accuracy: 15 };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal("fetch", fetchSpy);
    ({ sql } = await import("@/lib/db"));
    c = await import("./data");
    roster = await import("@/lib/roster/mutate");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.locations union all select bubble_id, id from app.users
      union all select bubble_id, id from app.ndis_price_items union all select bubble_id, id from app.residential_prices`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    const common = { day: "2026-11-24", start: "07:00", end: "15:00", hours: "", carer: ids.U1, notes: "", supervisor: "", repeatUntil: null };
    resShift = (await roster.createShifts({ ...common, kind: "residential", participant: null, location: ids.LOC1, priceItem: ids.RP, role: "en" }, null)).ids[0];
    ndisShift = (await roster.createShifts({ ...common, kind: "ndis", participant: ids.P1, location: null, priceItem: ids.NP, role: "dsw", start: "16:00", end: "20:00" }, null)).ids[0];
  });
  afterAll(async () => {
    expect(fetchSpy).not.toHaveBeenCalled(); // no API key set, so no AI call
    await sql?.end();
  });

  // 7am on 24 Nov in Melbourne (daylight saving, UTC+11) is 20:00 UTC on the 23rd.
  const t = (iso: string) => new Date(iso);

  it("lists only the carer's own shifts, with real start and end times", async () => {
    const mine = await c.myShifts(ids.U1, "2026-11-20");
    expect(mine.map((s) => s.id)).toEqual(expect.arrayContaining([resShift, ndisShift]));
    const r = mine.find((s) => s.id === resShift)!;
    expect(r.start_at!.toISOString()).toBe("2026-11-23T20:00:00.000Z");
    expect(r.end_at!.toISOString()).toBe("2026-11-24T04:00:00.000Z");
    expect(r.place).toBe("Williamstown");
    expect(await c.myShift(ids.U2, resShift)).toBeNull();
  });

  it("checks in near the address; aged care auto checks out at the scheduled end", async () => {
    await expect(c.checkIn(ids.U1, resShift, melbourne, t("2026-11-23T20:05:00Z"))).rejects.toThrow(/m from the shift address/);
    await expect(c.checkIn(ids.U2, resShift, williamstown, t("2026-11-23T20:05:00Z"))).rejects.toThrow(/couldn't find/);
    const r = await c.checkIn(ids.U1, resShift, williamstown, t("2026-11-23T20:05:00Z"));
    expect(r.autoCheckedOut).toBe(true);
    const [s] = await sql`select attended, attend_start, attend_end from app.shifts where id = ${resShift}`;
    expect(s.attended).toBe(true);
    expect(s.attend_start.toISOString()).toBe("2026-11-23T20:05:00.000Z");
    expect(s.attend_end.toISOString()).toBe("2026-11-24T04:00:00.000Z");
    await expect(c.checkIn(ids.U1, resShift, williamstown, t("2026-11-23T20:06:00Z"))).rejects.toThrow(/already checked in/);
  });

  it("NDIS check out uses the actual time", async () => {
    await c.checkIn(ids.U1, ndisShift, melbourne, t("2026-11-24T05:00:00Z"));
    await c.checkOut(ids.U1, ndisShift, melbourne, t("2026-11-24T09:10:00Z"));
    const [s] = await sql`select attend_end from app.shifts where id = ${ndisShift}`;
    expect(s.attend_end.toISOString()).toBe("2026-11-24T09:10:00.000Z");
  });

  it("ticks and unticks availability, but never a booked slot", async () => {
    const me = { id: ids.U1, name: "Ann Lee", phone: null, roles: ["en"] };
    await c.setAvailability(me, "2026-11-25", "0600___1400", true, "2026-11-20");
    await c.setAvailability(me, "2026-11-25", "0600___1400", true, "2026-11-20"); // no duplicate
    let slots = await c.myAvailability(ids.U1, "2026-11-25", 1);
    expect(slots).toEqual([{ day: "2026-11-25", slot: "0600___1400", available: true, booked: false }]);
    await c.setAvailability(me, "2026-11-25", "0600___1400", false, "2026-11-20");
    expect(await c.myAvailability(ids.U1, "2026-11-25", 1)).toEqual([]);
    await expect(c.setAvailability(me, "2026-11-19", "0600___1400", true, "2026-11-20")).rejects.toThrow(/today or a later day/);
    await sql`update app.availability set accepted = 'YES' where carer = ${ids.U1} and shift = 'night__11pm___7am_'`;
    await expect(c.setAvailability(me, "2026-11-16", "night__11pm___7am_", false, "2026-11-16")).rejects.toThrow(/already booked/);
  });

  it("submits one progress note for an NDIS shift only", async () => {
    await expect(c.submitNote(ids.U1, resShift, "A long enough summary of the shift.")).rejects.toThrow(/only needed for NDIS/);
    await expect(c.submitNote(ids.U2, ndisShift, "A long enough summary of the shift.")).rejects.toThrow(/couldn't find/);
    await expect(c.submitNote(ids.U1, ndisShift, "too short")).rejects.toThrow(/a little more/);
    const r = await c.submitNote(ids.U1, ndisShift, "Sam had lunch, we went for a walk and he was cheerful.");
    expect(r.filled).toBe(false);
    const [n] = await sql`select n.summary, n.submit, n.participant, s.progress_note from app.progress_notes n join app.shifts s on s.id = n.shift where n.id = ${r.noteId}`;
    expect(n).toMatchObject({ submit: true, participant: ids.P1, progress_note: r.noteId });
    await expect(c.submitNote(ids.U1, ndisShift, "Sam had lunch, we went for a walk again.")).rejects.toThrow(/already been submitted/);
  });
});
