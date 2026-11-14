// Participant group chats against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("group chats (scratch database)", () => {
  let c: typeof import("./data");
  let sql: typeof import("@/lib/db").sql;
  let ids: Record<string, string> = {};
  type Who = { id: string; name: string; role: "admin" | "carer" };
  let ann: Who, other: Who, admin: Who;
  const t = (iso: string) => new Date(iso);

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ sql } = await import("@/lib/db"));
    c = await import("./data");
    const roster = await import("@/lib/roster/mutate");
    const rows = await sql<{ bubble_id: string; id: string }[]>`
      select bubble_id, id from app.users union all select bubble_id, id from app.ndis_price_items`;
    ids = Object.fromEntries(rows.map((r) => [r.bubble_id, r.id]));
    ann = { id: ids.U1, name: "Ann Lee", role: "carer" };
    other = { id: ids.U2, name: "Bo Carer", role: "carer" };
    admin = { id: ids.U2, name: "Paul Djite", role: "admin" };
    await roster.createShifts({ day: "2027-01-20", start: "09:00", end: "13:00", hours: "", carer: ids.U1, notes: "", supervisor: "", repeatUntil: null,
      kind: "ndis", participant: ids.P1, location: null, priceItem: ids.NP, role: "dsw" }, null);
  });
  afterAll(async () => { await sql?.end(); });

  it("lets a carer see only participants they have shifts with", async () => {
    expect(await c.canSee(ann, ids.P1, t("2027-01-05T00:00:00Z"))).toBe(true);
    expect(await c.canSee(other, ids.P1, t("2027-01-05T00:00:00Z"))).toBe(false);
    expect(await c.canSee(ann, ids.P1, t("2027-03-30T00:00:00Z"))).toBe(false); // more than 30 days after the shift
    await expect(c.postMessage(other, ids.P1, "hi", t("2027-01-05T00:00:00Z"))).rejects.toThrow("can't post");
    expect(await c.openChat(other, ids.P1, t("2027-01-05T00:00:00Z"))).toBeNull();
  });

  it("posts with the sender's first name and makes one chat per participant", async () => {
    await c.postMessage(ann, ids.P1, "  Margaret had a great morning.  ", t("2027-01-05T01:00:00Z"));
    await c.postMessage(ann, ids.P1, "She ate all her lunch.", t("2027-01-05T01:01:00Z"));
    const [n] = await sql<{ n: number }[]>`select count(*)::int as n from app.group_chats where participant = ${ids.P1}`;
    expect(n.n).toBe(1);
    const chat = (await c.openChat(ann, ids.P1, t("2027-01-05T01:02:00Z")))!;
    expect(chat.name).toBe(chat.name.split(" ")[0]); // carers see the first name only
    expect(chat.messages.map((m) => [m.sender, m.content, m.mine])).toEqual([
      ["Ann", "Margaret had a great morning.", true],
      ["Ann", "She ate all her lunch.", true],
    ]);
  });

  it("counts unread messages from others until the chat is opened", async () => {
    const now = t("2027-01-05T02:00:00Z");
    expect(await c.unreadTotal(ann, now)).toBe(0);
    expect(await c.unreadTotal(admin, now)).toBe(2);
    const opened = (await c.openChat(admin, ids.P1, t("2027-01-05T02:01:00Z")))!;
    expect(opened.messages.every((m) => !m.mine)).toBe(true);
    expect(await c.unreadTotal(admin, now)).toBe(0);
    await c.postMessage(admin, ids.P1, "Thanks Ann!", t("2027-01-05T02:05:00Z"));
    const list = await c.chatList(ann, now);
    expect(list.find((x) => x.participant === ids.P1)).toMatchObject({ unread: 1, last_text: "Thanks Ann!" });
  });

  it("rejects empty and over-long messages", async () => {
    await expect(c.postMessage(ann, ids.P1, "   ")).rejects.toThrow("Write a message");
    await expect(c.postMessage(ann, ids.P1, "x".repeat(c.MAX_MESSAGE + 1), t("2027-01-05T03:00:00Z"))).rejects.toThrow("up to");
  });
});
