// Facility bookings against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("facility bookings (scratch database)", () => {
  let f: typeof import("./data");
  let sql: typeof import("@/lib/db").sql;
  let user: { id: string; name: string; phone: string | null };
  let ids: Record<string, string> = {};
  const sent: { to: string; body: string }[] = [];
  const send = vi.fn(async (to: string, body: string) => { sent.push({ to, body }); return { dryRun: true, sid: null }; });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.BOOKING_ALERT_TO = "0426 512 584";
    ({ sql } = await import("@/lib/db"));
    f = await import("./data");
    // Two sites; Bubble lists Zeta first, so Zeta is the facility even though Alpha sorts first by name.
    for (const [bid, name] of [["LOCZ", "Zeta Lodge"], ["LOCA", "Alpha House"]]) {
      await sql`insert into app.locations (id, bubble_id, name, address) values (md5(${bid})::uuid, ${bid}, ${name}, ${sql.json({ address: `1 ${name} St`, lat: -37.8, lng: 144.9 })})`;
    }
    const [u] = await sql<{ id: string }[]>`
      insert into app.users (id, bubble_id, first_name, last_name, email, account_type, phone_number)
      values (md5('FAC1')::uuid, 'FAC1', 'Theo', 'Smith', 'theo@example.com', 'location', '0412 000 111') returning id`;
    await sql`insert into app.users_locations (users_id, locations_id) values (${u.id}, md5('LOCA')::uuid), (${u.id}, md5('LOCZ')::uuid)`;
    await sql`insert into sync.bubble_raw (bubble_id, type, data) values ('FAC1', 'user', ${sql.json({ locations: ["LOCZ", "LOCA"] })})`;
    user = { id: u.id, name: "Theo Smith", phone: "0412 000 111" };
    const rows = await sql<{ bubble_id: string; id: string }[]>`select bubble_id, id from app.locations`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
  });
  afterAll(async () => { await sql?.end(); });

  it("uses the first location in the user's field", async () => {
    expect((await f.facilityFor(user.id))?.name).toBe("Zeta Lodge");
  });

  it("books an unfilled shift at the facility and texts the facility and the office", async () => {
    const id = await f.bookShift(user, { day: "2026-12-03", start: "07:00", end: "15:00", role: "pca", notes: "Ask for Jo" }, "2026-11-15", send);
    const [s] = await sql`select location, carer, roles, start_time, end_time, hours, notes, booked_by, accepted, cancelled, created_by, address from app.shifts where id = ${id}`;
    expect(s).toMatchObject({ location: ids.LOCZ, carer: null, roles: ["pca"], start_time: 700, end_time: 1500, hours: 8, notes: "Ask for Jo", booked_by: "Theo Smith", accepted: false, cancelled: false, created_by: user.id });
    expect(s.address.address).toBe("1 Zeta Lodge St");
    const [r] = await sql`select count(*)::int as n from app.users_shifts_requested where users_id = ${user.id} and shifts_id = ${id}`;
    expect(r.n).toBe(1);
    expect(sent).toEqual([
      { to: "+61412000111", body: "We've received your request to fill a 0700 - 1500 shift on Thu, Dec 3rd. Available PCAs have been notified. Sit tight, we're on it!" },
      { to: "+61426512584", body: "Zeta Lodge needs a PCA for a 0700 - 1500 shift on Thu, Dec 3rd. Booked by Theo Smith." },
    ]);
    const log = await sql`select kind, status from app.text_log where shift = ${id} order by id`;
    expect(log.map((x) => [x.kind, x.status])).toEqual([["booking_ack", "dry_run"], ["booking_alert", "dry_run"]]);
  });

  it("lists the facility's shifts with their status, and the roster shows who requested it", async () => {
    const list = await f.facilityShifts(ids.LOCZ, "2026-11-15");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ day: "2026-12-03", carer_first: null, cancelled: false });
    const { weekShifts } = await import("@/lib/roster/queries");
    const week = await weekShifts("2026-11-30", { location: ids.LOCZ });
    expect(week[0].requested_by).toBe("Theo Smith");
  });

  it("rejects bookings for users with no facility", async () => {
    const [u] = await sql<{ id: string }[]>`insert into app.users (first_name, account_type) values ('Nobody', 'location') returning id`;
    await expect(f.bookShift({ id: u.id, name: "Nobody", phone: null }, { day: "2026-12-03", start: "07:00", end: "15:00", role: "en", notes: "" }, "2026-11-15", send))
      .rejects.toThrow("isn't linked");
  });
});
