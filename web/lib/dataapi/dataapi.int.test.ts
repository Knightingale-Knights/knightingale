// The Bubble-compatible Data API and Klarra pushes, against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Bubble-compatible Data API (scratch database)", () => {
  let sql: typeof import("@/lib/db").sql;
  let list: typeof import("@/app/api/1.1/obj/[type]/route");
  let one: typeof import("@/app/api/1.1/obj/[type]/[id]/route");
  const H = { authorization: "Bearer test-token" };
  const get = async (path: string, headers: Record<string, string> = H) => {
    const [type, id] = path.split("?")[0].split("/");
    const req = new Request(`http://x/api/1.1/obj/${path}`, { headers });
    return id ? one.GET(req, { params: Promise.resolve({ type, id }) }) : list.GET(req, { params: Promise.resolve({ type }) });
  };
  const q = (type: string, constraints: unknown[], extra = "") => `${type}?constraints=${encodeURIComponent(JSON.stringify(constraints))}${extra}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.DATA_API_TOKENS = "other, test-token";
    ({ sql } = await import("@/lib/db"));
    list = await import("@/app/api/1.1/obj/[type]/route");
    one = await import("@/app/api/1.1/obj/[type]/[id]/route");
  });
  afterAll(async () => { vi.unstubAllGlobals(); delete process.env.KLARRA_SYNC_URL; await sql?.end(); });

  it("needs the API token", async () => {
    expect((await get("user", {})).status).toBe(401);
    expect((await get("user", { authorization: "Bearer nope" })).status).toBe(401);
    expect((await get("nothing", H)).status).toBe(404);
  });

  it("searches like Bubble: display names, Bubble ids, option labels and dates", async () => {
    const r = await get(q("user", [{ key: "account type", constraint_type: "equals", value: "carer" }, { key: "first name", constraint_type: "equals", value: "Ann" }]));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.response.results[0]).toMatchObject({ _id: "U1", "first name": "Ann", "account type": "carer", authentication: { email: { email: "ann@example.com" } } });
    expect(j.response.results[0]["Created Date"]).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const s = await (await get(q("shift", [
      { key: "carer", constraint_type: "equals", value: "U1" },
      { key: "date", constraint_type: "greater than", value: "2026-11-01T00:00:00Z" },
      { key: "date", constraint_type: "less than", value: "2026-11-06T00:00:00Z" },
      { key: "location", constraint_type: "is_not_empty" },
    ], "&sort_field=date&limit=1"))).json();
    expect(s.response.results.length).toBe(1);
    expect(s.response.results[0]).toMatchObject({ carer: "U1", location: "LOC1", roles: ["EN"], "start time": 700 });
    expect(s.response.remaining).toBeGreaterThan(0);
    const page2 = await (await get(q("shift", [{ key: "carer", constraint_type: "equals", value: "U1" }], "&sort_field=date&limit=2&cursor=2"))).json();
    expect(page2.response.cursor).toBe(2);

    const byId = await (await get("shift/R1")).json();
    expect(byId.response).toMatchObject({ _id: "R1", carer: "U1" });
    expect((await get("ndis quarter?limit=5")).status).toBe(200);
    expect((await get("location1/LOC1")).status).toBe(200);
    expect((await get(q("shift", [{ key: "bogus", constraint_type: "equals", value: 1 }]))).status).toBe(400);
  });

  it("creates, edits and deletes, accepting Bubble ids and returning app ids for new records", async () => {
    const create = await list.POST(new Request("http://x/api/1.1/obj/shift", {
      method: "POST", headers: { ...H, "content-type": "application/json" },
      body: JSON.stringify({ carer: "U1", participant: "P1", date: "2027-05-03T14:00:00.000Z", "start time": 900, "end time": 1300, roles: ["EN"], hours: 4 }),
    }), { params: Promise.resolve({ type: "shift" }) });
    expect(create.status).toBe(201);
    const { id } = await create.json();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const [row] = await sql`select carer, participant, roles, start_time from app.shifts where id = ${id}`;
    const [u1] = await sql`select id from app.users where bubble_id = 'U1'`;
    expect(row).toMatchObject({ carer: u1.id, roles: ["en"], start_time: 900 });
    expect((await (await get(`shift/${id}`)).json()).response).toMatchObject({ _id: id, carer: "U1", participant: "P1", roles: ["EN"] });

    const patch = await one.PATCH(new Request(`http://x/api/1.1/obj/availability/A1`, {
      method: "PATCH", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify({ available: false }),
    }), { params: Promise.resolve({ type: "availability", id: "A1" }) });
    expect(patch.status).toBe(204);
    const [a] = await sql`select available from app.availability where bubble_id = 'A1'`;
    expect(a.available).toBe(false);
    await sql`update app.availability set available = true where bubble_id = 'A1'`;

    const bad = await list.POST(new Request("http://x/api/1.1/obj/shift", { method: "POST", headers: H, body: JSON.stringify({ nope: 1 }) }), { params: Promise.resolve({ type: "shift" }) });
    expect(bad.status).toBe(400);

    const del = await one.DELETE(new Request(`http://x/api/1.1/obj/shift/${id}`, { method: "DELETE", headers: H }), { params: Promise.resolve({ type: "shift", id }) });
    expect(del.status).toBe(204);
    expect((await get(`shift/${id}`)).status).toBe(404);
  });

  it("tells Klarra about NDIS shifts in Bubble's Shift Sync format, only once switched on", async () => {
    const push = await import("@/lib/klarra/push");
    const calls: { url: string; body: URLSearchParams }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, o: { body: URLSearchParams }) => { calls.push({ url: u, body: o.body }); return new Response("ok"); }));
    const [n1] = await sql`select id from app.shifts where bubble_id = 'N1'`;
    await push.pushShifts([n1.id]);
    expect(calls).toHaveLength(0); // KLARRA_SYNC_URL not set
    process.env.KLARRA_SYNC_URL = "https://klarra.example/";
    await push.pushShifts([n1.id]);
    expect(calls[0].url).toBe("https://klarra.example/shift-sync");
    expect(Object.fromEntries(calls[0].body)).toMatchObject({ shift_bubble_id: "N1", nurse_bubble_id: "U1", participant_bubble_id: "P1", date: "2026-11-04", start_time: "930", end_time: "1430", status: "confirmed", recurring: "no" });
    const told = await push.prepareDelete(n1.id);
    await told();
    expect(calls[1].url).toBe("https://klarra.example/shift-delete");
    expect(calls[1].body.get("shift_bubble_id")).toBe("N1");
  });
});
