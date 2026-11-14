// Carer sign-up against a scratch database. Runs only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("carer sign-up (scratch database)", () => {
  let o: typeof import("./data");
  let c: typeof import("@/lib/compliance/data");
  let sql: typeof import("@/lib/db").sql;
  let id: string;
  const today = "2026-11-15";
  const sent: { TemplateId: number; To: string; Cc?: string }[] = [];
  const fetchSpy = vi.fn(async (_u: string, opts: { body: string }) => {
    sent.push(JSON.parse(opts.body));
    return new Response("{}", { status: 200 });
  });
  const png = { name: "me.png", type: "image/png", bytes: Buffer.from("img") };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.POSTMARK_TOKEN = "test";
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal("fetch", fetchSpy);
    ({ sql } = await import("@/lib/db"));
    o = await import("./data");
    c = await import("@/lib/compliance/data");
    await sql`insert into app.users (first_name, account_type, phone_number, email) values ('Taken', 'carer', '0400 111 222', 'taken@example.com')`;
  });
  afterAll(async () => { vi.unstubAllGlobals(); await sql?.end(); });

  it("starts an application once per email", async () => {
    const a = await o.ensureApplicant(" New.Carer@Example.com ", null);
    expect(a.created).toBe(true);
    id = a.id;
    expect((await o.ensureApplicant("new.carer@example.com", null)).id).toBe(id);
    const [u] = await sql`select account_type, active, account_status from app.users where id = ${id}`;
    expect(u).toEqual({ account_type: "carer", active: false, account_status: false });
    expect((await o.progress(id, today)).missing).toContain("your CPR certificate");
  });

  it("saves details, refusing a mobile number that's already registered", async () => {
    const d = { first: " Nina ", last: "New", phone: "0400 111 222", dob: "1990-05-04", address: "1 Sample St, Melbourne VIC" };
    await expect(o.saveDetails(id, d, today)).rejects.toThrow("already registered");
    await expect(o.saveDetails(id, { ...d, phone: "0499 000 999", dob: "2015-01-01" }, today)).rejects.toThrow("date of birth");
    expect(await o.saveDetails(id, { ...d, phone: "+61499000999" }, today)).toEqual({ firstTime: true });
    const a = (await o.applicant(id))!;
    expect(a).toMatchObject({ first_name: "Nina", phone: "0499000999", dob: "1990-05-04", address: "1 Sample St, Melbourne VIC" });
    expect((await o.saveDetails(id, { ...d, phone: "0499000999" }, today)).firstTime).toBe(false);
  });

  it("saves the role: student nurses also get PCA and DSW, nurses need AHPRA", async () => {
    await expect(o.saveRole(id, { roles: ["en"], skill: "en_degree", ahpraNumber: "123", ahpraExpiry: "2027-05-31" }, today)).rejects.toThrow("AHPRA");
    expect(await o.saveRole(id, { roles: ["student_nurse"], skill: "student_nurse", ahpraNumber: "", ahpraExpiry: "" }, today)).toEqual(["student_nurse", "pca", "dsw"]);
    await o.saveRole(id, { roles: ["en", "bogus"], skill: "en_degree", ahpraNumber: "nmw0001234567", ahpraExpiry: "2027-05-31" }, today);
    const [q] = await sql`select role, qualifications, registration_number from app.qualifications where carer = ${id} order by created_at desc limit 1`;
    expect(q).toEqual({ role: ["en"], qualifications: ["en_degree"], registration_number: "NMW0001234567" });
  });

  it("can't be submitted until NDIS screening, a photo and CPR are in", async () => {
    await expect(o.submitApplication(id, today)).rejects.toThrow(/NDIS worker screening.*CPR.*profile photo/);
    await o.saveScreening(id, "4-1234567", "2030-01-01", today);
    await o.uploadProfileFile(id, "photo", png);
    await expect(o.uploadProfileFile(id, "photo", { ...png, type: "application/pdf" })).rejects.toThrow("photo");
    await c.uploadDoc(id, "cpr", png, id, today, async () => null);
    const p = await o.progress(id, today);
    expect(p).toMatchObject({ details: true, role: true, screening: true, missing: [] });
    expect(p.documents).toBe(false); // first aid, police, WWCC and flu can follow later
  });

  it("submits: the carer becomes active and waits for approval; the office can approve", async () => {
    await o.submitApplication(id, today);
    const [u] = await sql`select active, account_status, notification, profile_photo like '/files/%' as photo from app.users where id = ${id}`;
    expect(u).toEqual({ active: true, account_status: false, notification: true, photo: true });
    expect(sent.at(-1)).toMatchObject({ TemplateId: o.NEW_SIGNUP_TEMPLATE, To: "new.carer@example.com", Cc: "care@knightingale.com.au" });
    const list = await o.applications();
    expect(list.find((a) => a.id === id)).toMatchObject({ submitted: true, name: "Nina New" });
    await o.approve(id);
    const [v] = await sql`select active, account_status from app.users where id = ${id}`;
    expect(v).toEqual({ active: true, account_status: true });
    expect((await o.applications()).some((a) => a.id === id)).toBe(false);
  });
});
