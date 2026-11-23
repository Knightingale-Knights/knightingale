// Carer texts against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("carer texts (scratch database)", () => {
  let t: typeof import("./data");
  let rules: typeof import("./rules");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  let ndis: string;
  let res: string;
  const sent: { to: string; body: string }[] = [];
  const send = vi.fn(async (to: string, body: string) => { sent.push({ to, body }); return { dryRun: false, sid: "SM" + sent.length }; });
  const log = async (shift: string) =>
    sql<{ kind: string; status: string; phone: string; body: string }[]>`select kind, status, phone, body from app.text_log where shift = ${shift} order by id`;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.LINK_SECRET = "test-secret";
    process.env.PUBLIC_BASE_URL = "https://app.example.com";
    delete process.env.ONLY_PHONE;
    ({ sql } = await import("@/lib/db"));
    t = await import("./data");
    rules = await import("./rules");
    const roster = await import("@/lib/roster/mutate");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.locations union all select bubble_id, id from app.users
      union all select bubble_id, id from app.ndis_price_items union all select bubble_id, id from app.residential_prices`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    await sql`update app.users set phone_number = '0412 345 678' where id = ${ids.U1}`;
    const common = { day: "2026-12-16", start: "07:00", end: "15:00", hours: "", carer: ids.U1, notes: "", supervisor: "", repeatUntil: null };
    res = (await roster.createShifts({ ...common, kind: "residential", participant: null, location: ids.LOC1, priceItem: ids.RP, role: "en" }, null)).ids[0];
    ndis = (await roster.createShifts({ ...common, kind: "ndis", participant: ids.P1, location: null, priceItem: ids.NP, role: "dsw", start: "16:00", end: "20:00" }, null)).ids[0];
  });
  afterAll(async () => { await sql?.end(); });

  const at = (iso: string) => new Date(iso);

  it("sends the aged care check-in text 15 minutes before the start, once", async () => {
    await t.runTexts(at("2026-12-15T19:50:00Z"), send); // 6:50am Melbourne
    await t.runTexts(at("2026-12-15T19:55:00Z"), send);
    const rows = await log(res);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "checkin", status: "sent", phone: "+61412345678" });
    expect(rows[0].body).toMatch(/^Hi Ann, have a great time at .+! Check in when you arrive: https:\/\/app\.example\.com\/c\/i/);
    expect(rules.isOneSegment(rows[0].body)).toBe(true);
  });

  it("never sends aged care check-out or progress note texts", async () => {
    await t.runTexts(at("2026-12-16T04:05:00Z"), send); // 3:05pm, after the 3pm end
    await t.runTexts(at("2026-12-16T11:05:00Z"), send); // 10:05pm
    expect((await log(res)).map((r) => r.kind)).toEqual(["checkin"]);
  });

  it("answers Klarra with the right link for the shift the carer is on", async () => {
    const r = await t.linkReply("+61412345678", "auto", at("2026-12-16T04:50:00Z")); // 3:50pm, NDIS shift starts at 4
    expect(r).toMatchObject({ found: true, shiftId: ndis });
    expect(r.message).toMatch(/^Hi Ann, here is your check in link: https:\/\/app\.example\.com\/c\/i/);
    const token = r.message.split("/c/")[1];
    expect(rules.verifyLink("test-secret", token)).toEqual({ shiftId: ndis, kind: "in" });
    expect((await t.linkReply("0499 999 999", "auto", at("2026-12-16T04:50:00Z"))).found).toBe(false);
  });

  it("sends each NDIS text once, and stops note reminders once a note is in", async () => {
    await t.runTexts(at("2026-12-16T04:50:00Z"), send);
    await sql`update app.shifts set attend_start = ${at("2026-12-16T05:02:00Z")} where id = ${ndis}`;
    const after = await t.linkReply("0412345678", "auto", at("2026-12-16T06:00:00Z"));
    expect(after.message).toContain("check out link");
    expect((await t.linkReply("0412345678", "checkin", at("2026-12-16T06:00:00Z"))).message).toBe(t.ALREADY_IN);

    await t.runTexts(at("2026-12-16T09:01:00Z"), send); // 8:01pm, check out text
    await sql`update app.shifts set attend_end = ${at("2026-12-16T09:29:00Z")} where id = ${ndis}`;
    expect((await t.linkReply("0412345678", "checkout", at("2026-12-16T09:40:00Z"))).message).toBe("Hi Ann, you checked out at 8:29pm.");
    expect((await t.linkReply("0412345678", "auto", at("2026-12-16T09:40:00Z"))).message).toBe("Hi Ann, you checked out at 8:29pm.");
    await t.runTexts(at("2026-12-16T11:01:00Z"), send); // 10:01pm, first note reminder
    await sql`insert into app.progress_notes (id, shift, submit) values (gen_random_uuid(), ${ndis}, true)`;
    await t.runTexts(at("2026-12-17T09:01:00Z"), send); // 8:01pm next day: note is in, so nothing
    const rows = await log(ndis);
    expect(rows.map((r) => r.kind).sort()).toEqual(["checkin", "checkout", "notes_1"]);
    const note = rows.find((r) => r.kind === "notes_1")!;
    expect(note.body).toBe("Hi Ann, a gentle reminder you haven't submitted a progress note for your 1600 - 2000 shift with " + note.body.split(" with ")[1]);
    expect(note.body.endsWith(" today.")).toBe(true);
  });

  it("skips the check-out text when the carer has already checked out", async () => {
    await sql`delete from app.text_log where shift = ${ndis} and kind = 'checkout'`;
    await sql`update app.shifts set attend_end = ${at("2026-12-16T08:55:00Z")} where id = ${ndis}`;
    await t.runTexts(at("2026-12-16T09:30:00Z"), send);
    expect((await log(ndis)).map((r) => r.kind)).not.toContain("checkout");
  });

  it("logs a failed send and does not retry it", async () => {
    await sql`delete from app.text_log where shift = ${res}`;
    const boom = vi.fn(async () => { throw new Error("Twilio 400: bad number"); });
    await t.runTexts(at("2026-12-15T19:50:00Z"), boom);
    await t.runTexts(at("2026-12-15T19:51:00Z"), boom);
    expect(boom).toHaveBeenCalledTimes(1);
    expect((await log(res))[0]).toMatchObject({ status: "failed" });
  });
});
