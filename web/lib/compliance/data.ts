// Carer compliance documents: what is on file, uploads, and expiry checks.
import { sql } from "@/lib/db";
import { fromDay } from "@/lib/roster/queries";
import { ACCOUNT_DOCS, DOCS, docDef, statusOf, type AccountDocKey, type DocDef, type DocKey, type Status } from "./docs";
import { readExpiry, type ExpiryReading } from "./expiryReader";

type Tx = typeof sql;
export class DocError extends Error {}
export const MAX_DOC_BYTES = 3.5 * 1024 * 1024;
export const DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const id = (c: string) => sql(c);
const melb = (c: string) => sql.unsafe(`to_char(${c} at time zone 'Australia/Melbourne', 'YYYY-MM-DD')`);

export type DocRecord = { record: string | null; has_record: boolean; has_file: boolean; files: string[]; expiry: string | null; number: string | null; extra: Record<string, unknown> };
export type DocState = DocRecord & { def: DocDef; status: Status };

/** The carer's latest record of one document. */
async function current(d: DocDef, carer: string, tx: Tx = sql): Promise<DocRecord> {
  const plain = d.fileCols.filter((c) => !c.endsWith("[]"));
  const lists = d.fileCols.filter((c) => c.endsWith("[]")).map((c) => c.slice(0, -2));
  const files = sql.unsafe(
    [`array_remove(array[${plain.map((c) => `nullif(t.${c}, '')`).join(", ")}]::text[], null)`, ...lists.map((c) => `coalesce(t.${c}, '{}')`)].join(" || "),
  );
  const [r] = await tx<{ record: string; files: string[]; expiry: string | null; number: string | null; extra: Record<string, unknown> }[]>`
    select t.id as record, ${files} as files,
           ${d.expiryCol ? melb(`t.${d.expiryCol}`) : sql`null`} as expiry,
           ${d.numberCol ? sql`t.${id(d.numberCol)}` : sql`null`} as number,
           to_jsonb(t) - 'id' - 'bubble_id' - 'created_at' - 'updated_at' - 'created_by' - 'carer' as extra
      from app.${id(d.table)} t where t.carer = ${carer} order by t.created_at desc limit 1`;
  if (!r) return { record: null, has_record: false, has_file: false, files: [], expiry: null, number: null, extra: {} };
  const list = (r.files ?? []).filter(Boolean);
  return { ...r, has_record: true, has_file: list.length > 0, files: list };
}

/** The documents for one Account section, in the order given (office documents and the Account-only parts). */
export async function accountDocs(carer: string, keys: (DocKey | AccountDocKey)[], today: string): Promise<DocState[]> {
  const one = async (k: DocKey | AccountDocKey): Promise<DocState | null> => {
    const def = docDef(k);
    if (!def) return null;
    if (def.key === "resume") {
      const [u] = await sql<{ resume: string | null }[]>`select nullif(resume, '') as resume from app.users where id = ${carer}`;
      const files = u?.resume ? [u.resume] : [];
      const r: DocRecord = { record: carer, has_record: true, has_file: files.length > 0, files, expiry: null, number: null, extra: {} };
      return { ...r, def, status: statusOf(def, r, today) };
    }
    const r = await current(def, carer);
    return { ...r, def, status: statusOf(def, r, today) };
  };
  return (await Promise.all(keys.map(one))).filter((x): x is DocState => x !== null);
}

export async function carerDocs(carer: string, today: string): Promise<DocState[]> {
  const out: DocState[] = [];
  for (const def of DOCS) {
    const r = await current(def, carer);
    out.push({ ...r, def, status: statusOf(def, r, today) });
  }
  return out;
}

/** A new record for each change, carrying over the details of the last one, so history is kept. */
async function newRecord(tx: Tx, d: DocDef, carer: string, by: string | null, prev: DocRecord, set: Record<string, unknown>) {
  const carry = Object.fromEntries(Object.entries(prev.extra).filter(([k]) => !(k in set)));
  const row: Record<string, unknown> = { ...carry, ...set, carer, created_by: by };
  const cols = Object.keys(row);
  const [r] = await tx<{ id: string }[]>`
    insert into app.${id(d.table)} ${sql(row as never, cols as never)} returning id`;
  return r.id;
}

export type UploadResult = { status: Status; expiry: string | null; reading: ExpiryReading | null; fileId: string };

/** Keeps the file, reads its expiry where that can be done, and records it as the carer's current document. */
export async function uploadDoc(
  carer: string, key: DocKey | AccountDocKey, file: { name: string; type: string; bytes: Buffer }, by: string, today: string,
  read: typeof readExpiry = readExpiry,
): Promise<UploadResult> {
  const d = docDef(key);
  if (!d || !d.uploadCol || d.table === "users") throw new DocError("That document can't be uploaded.");
  if (!DOC_TYPES.includes(file.type)) throw new DocError("Upload a photo or a PDF.");
  if (!file.bytes.length) throw new DocError("That file is empty.");
  if (file.bytes.length > MAX_DOC_BYTES) throw new DocError("That file is too big. Please take a photo instead.");
  const reading = d.ai ? await read(file.bytes, file.type, d.ai.label, d.ai.fallbackMonths, today, d.ai.fromIssueOnly ?? false, d.numberLabel) : null;
  if (d.mustMatch && reading?.reason === "document_type_mismatch") {
    throw new DocError(`This doesn't look like the right document${reading.mismatchReason ? ` (${reading.mismatchReason.replace(/\.$/, "")})` : ""}. Please upload ${d.mustMatch}.`);
  }
  const name = (file.name || d.label).replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const prev = await current(d, carer, tx);
    const [f] = await tx<{ id: string }[]>`
      insert into app.compliance_files (carer, doc, file_name, mime, bytes, reading, uploaded_by)
      values (${carer}, ${key}, ${name}, ${file.type}, ${file.bytes}, ${reading ? sql.json(reading as never) : null}, ${by}) returning id`;
    const link = `/files/${f.id}`;
    const set: Record<string, unknown> = {};
    set[d.uploadCol!] = d.uploadIsArray ? [...(Array.isArray(prev.extra[d.uploadCol!]) ? (prev.extra[d.uploadCol!] as string[]) : []), link] : link;
    // A new file's expiry is read from it. If it can't be read, a still-current expiry already on file is kept
    // (e.g. the carer typed it in just before uploading); an expired one is cleared for the office to check.
    if (d.expiryCol) {
      const read = reading?.expiryDate && (reading.success || reading.reason === "expired") ? reading.expiryDate : null;
      set[d.expiryCol] = read ? await dayValue(tx, read) : prev.expiry && prev.expiry >= today ? prev.extra[d.expiryCol] : null;
    }
    // The number printed on the document (WWCC card number, police check reference, AHPRA number) goes into its field.
    if (d.numberCol && reading?.documentNumber && reading.reason !== "document_type_mismatch") set[d.numberCol] = reading.documentNumber;
    await newRecord(tx, d, carer, by, prev, set);
    const now = await current(d, carer, tx);
    return { status: statusOf(d, now, today), expiry: now.expiry, reading, fileId: f.id };
  });
}

const dayValue = async (tx: Tx, day: string) => (await tx<{ v: Date }[]>`select ${fromDay(day)} as v`)[0].v;

/** Takes a wrong document off the carer for good, so it shows as Missing and they're asked to upload it again.
 *  The file is wiped from every record in the history (and deleted, if it was uploaded to the new app). */
/** `only`: remove just these files (e.g. one wrong certificate among several), leaving the expiry and number. */
export async function removeDoc(carer: string, key: DocKey | AccountDocKey, only?: string[]) {
  const d = docDef(key);
  if (!d || !d.uploadCol || d.table === "users") throw new DocError("That document can't be removed.");
  await sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const prev = await current(d, carer, tx);
    if (!prev.record) return;
    const links = only ? prev.files.filter((f) => only.includes(f)) : prev.files;
    if (only && !links.length) return;
    const t = `app.${d.table}`;
    if (links.length) {
      for (const c of d.fileCols) {
        const col = c.replace("[]", "");
        if (c.endsWith("[]")) {
          await tx`update ${sql(t)} set ${sql(col)} = nullif(array(select x from unnest(${sql(col)}) x where x <> all(${links}::text[])), '{}')
                    where carer = ${carer} and ${sql(col)} && ${links}::text[]`;
        } else {
          await tx`update ${sql(t)} set ${sql(col)} = null where carer = ${carer} and ${sql(col)} = any(${links}::text[])`;
        }
      }
      const own = links.map((l) => l.match(/^\/files\/([0-9a-f-]{36})$/i)?.[1]).filter(Boolean) as string[];
      if (own.length) await tx`delete from app.compliance_files where id = any(${own}::uuid[]) and carer = ${carer}`;
    }
    const clear: Record<string, null> = {};
    if (d.expiryCol) clear[d.expiryCol] = null;
    if (d.numberCol) clear[d.numberCol] = null;
    if (!only && Object.keys(clear).length) await tx`update ${sql(t)} set ${sql(clear)}, updated_at = now() where id = ${prev.record}`;
  });
}

/** Number and (for documents with no file to read) expiry, typed in by the carer or the office. */
export async function setDetails(carer: string, key: DocKey | AccountDocKey, by: string, v: { number?: string; expiry?: string }, today: string) {
  const d = docDef(key);
  if (!d) throw new DocError("Unknown document.");
  const set: Record<string, unknown> = {};
  if (d.numberCol && v.number !== undefined) {
    const n = v.number.trim();
    if (n.length > 60) throw new DocError("That number is too long.");
    set[d.numberCol] = n || null;
  }
  if (d.expiryCol && v.expiry !== undefined) {
    if (v.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(v.expiry)) throw new DocError("Choose a valid date.");
    if (v.expiry && v.expiry < "2000-01-01") throw new DocError("Choose a valid date.");
    set[d.expiryCol] = v.expiry ? await dayValue(sql, v.expiry) : null;
  }
  if (!Object.keys(set).length) return;
  await sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    await newRecord(tx, d, carer, by, await current(d, carer, tx), set);
  });
  return statusOf(d, await current(d, carer), today);
}

/** Expired and expiring documents for one carer (for the badge on their Documents tab). */
export async function attentionCount(carer: string, today: string) {
  return (await carerDocs(carer, today)).filter((x) => x.status === "expired" || x.status === "soon" || x.status === "missing").length;
}

/** For the file route: a new-app upload, if this person may see it (the carer, or staff). */
export async function complianceFile(fileId: string, viewer: { id: string; role: string }) {
  const [f] = await sql<{ file_name: string; mime: string; bytes: Buffer; carer: string }[]>`
    select file_name, mime, bytes, carer from app.compliance_files where id = ${fileId}`;
  if (!f) return null;
  if (viewer.role !== "admin" && f.carer !== viewer.id) return null;
  return f;
}

// ---- office views -------------------------------------------------------------

export type CarerRow = {
  id: string; name: string; phone: string | null; photo: string | null; roles: string[] | null;
  statuses: Record<DocKey, Status>; expiries: Record<DocKey, string | null>;
  /** DSWs only (they may drive participants): null for everyone else; "none" when they said they have no insurance. */
  insurance: { status: Status | "none"; expiry: string | null } | null;
};

/** Every active carer with the status of each document. */
export async function complianceTable(today: string): Promise<CarerRow[]> {
  const carers = await sql<{ id: string; name: string; phone: string | null; photo: string | null; roles: string[] | null }[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name, phone_number as phone, nullif(profile_photo, '') as photo, roles
      from app.users where account_type = 'carer' and active order by first_name, last_name`;
  const rows = new Map(carers.map((c) => [c.id, { ...c, statuses: {} as Record<DocKey, Status>, expiries: {} as Record<DocKey, string | null>, insurance: null as CarerRow["insurance"] }]));
  for (const d of DOCS) {
    const fileTest = d.fileCols.length
      ? sql.unsafe(d.fileCols.map((c) => c.replace("[]", "")).map((c) => `(t.${c} is not null and t.${c}::text not in ('', '{}'))`).join(" or "))
      : sql`false`;
    const recs = await sql<{ carer: string; has_file: boolean; expiry: string | null; number: string | null }[]>`
      select distinct on (t.carer) t.carer, (${fileTest}) as has_file,
             ${d.expiryCol ? melb(`t.${d.expiryCol}`) : sql`null`} as expiry,
             ${d.numberCol ? sql`t.${id(d.numberCol)}` : sql`null`} as number
        from app.${id(d.table)} t join app.users u on u.id = t.carer and u.account_type = 'carer' and u.active
       order by t.carer, t.created_at desc`;
    const by = new Map(recs.map((r) => [r.carer, r]));
    for (const [cid, row] of rows) {
      const r = by.get(cid);
      row.statuses[d.key] = statusOf(d, r ? { ...r, has_record: true } : undefined, today);
      row.expiries[d.key] = r?.expiry ?? null;
    }
  }
  // Insurance, for DSWs.
  const ins = ACCOUNT_DOCS.find((d) => d.key === "insurance")!;
  const insRecs = await sql<{ carer: string; has_file: boolean; expiry: string | null; no_insurance: boolean }[]>`
    select u.id as carer, coalesce(u.no_insurance, false) as no_insurance,
           coalesce(x.has_file, false) as has_file, x.expiry
      from app.users u
      left join lateral (
        select (t.insurance is not null and t.insurance <> '') as has_file, ${melb("t.insurance_expiry")} as expiry
          from app.identity_documents t where t.carer = u.id
         order by (t.insurance is not null and t.insurance <> '') desc, t.created_at desc limit 1) x on true
     where u.account_type = 'carer' and u.active and 'dsw' = any(u.roles)`;
  for (const r of insRecs) {
    const row = rows.get(r.carer);
    if (!row) continue;
    row.insurance = r.no_insurance && !r.has_file
      ? { status: "none", expiry: null }
      : { status: statusOf(ins, { has_file: r.has_file, has_record: r.has_file, expiry: r.expiry, number: null }, today), expiry: r.expiry };
  }
  return [...rows.values()];
}

/** Expired documents that matter for a shift on this day (roster warning). */
export async function rosterProblems(carer: string, day: string, ndis: boolean, tx: Tx = sql) {
  const out: string[] = [];
  for (const d of DOCS) {
    if (!d.roster || !d.expiryCol || (d.roster === "ndis" && !ndis)) continue;
    const r = await current(d, carer, tx);
    if (r.expiry && r.expiry < day) out.push(`${d.label} expired ${r.expiry}`);
  }
  return out;
}

export type ExpiryAlert = { doc: DocKey; label: string; record: string; carer: string; carer_id: string; email: string | null; first: string | null; expiry: string };

export type AlertKind = "soon" | "expired" | "carer" | "carer_expired";

/** Active carers' latest documents that haven't been emailed about yet: "soon" expire in the next 7 days (office email),
 *  "carer" in the next 14 (the carer's own heads-up), "expired" and "carer_expired" already have. */
export async function expiryAlerts(today: string, kind: AlertKind, days = kind === "carer" ? 14 : 7) {
  const found: ExpiryAlert[] = [];
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days);
  const range = kind === "expired" || kind === "carer_expired"
    ? sql`x.e < ${fromDay(today)}`
    : sql`x.e >= ${fromDay(today)} and x.e < ${fromDay(end.toISOString().slice(0, 10))}`;
  for (const d of DOCS) {
    if (!d.expiryCol) continue;
    const rows = await sql<{ record: string; carer: string; carer_id: string; email: string | null; first: string | null; expiry: string }[]>`
      select x.id as record, trim(concat_ws(' ', u.first_name, u.last_name)) as carer, u.id as carer_id,
             nullif(trim(u.email), '') as email, nullif(trim(u.first_name), '') as first, ${melb("x.e")} as expiry
        from (select distinct on (t.carer) t.id, t.carer, t.${id(d.expiryCol)} as e from app.${id(d.table)} t order by t.carer, t.created_at desc) x
        join app.users u on u.id = x.carer and u.account_type = 'carer'
         and coalesce(u.active, false) and coalesce(u.account_status, false)
       where ${range}
         and not exists (select 1 from app.compliance_alerts a where a.doc = ${d.key} and a.record = x.id
                           and a.expiry = (x.e at time zone 'Australia/Melbourne')::date and a.kind = ${kind})
       order by x.e`;
    for (const r of rows) found.push({ doc: d.key, label: d.label, ...r });
  }
  return found;
}

/** Documents expiring in the next 7 days that haven't been emailed about yet (Bubble's daily expiry email). */
export const expiringSoon = (today: string, days = 7) => expiryAlerts(today, "soon", days);

export async function markAlerted(items: { doc: string; record: string; expiry: string }[], kind: AlertKind = "soon") {
  for (const i of items) await sql`insert into app.compliance_alerts (doc, record, expiry, kind) values (${i.doc}, ${i.record}, ${i.expiry}::date, ${kind}) on conflict do nothing`;
}

/**
 * Whether the office should hear about this upload: only an active carer renewing a document that has
 * expired or expires within 14 days. Uploads while signing up (or for new documents) send nothing.
 * Call before saving the new upload.
 */
export async function isRenewal(carer: string, key: string, today: string, withinDays = 14): Promise<boolean> {
  const d = DOCS.find((x) => x.key === key);
  if (!d?.expiryCol) return false;
  const [r] = await sql<{ active: boolean; expiry: string | null }[]>`
    select coalesce(u.active, false) as active,
           (select ${melb(`t.${d.expiryCol}`)} from app.${id(d.table)} t where t.carer = u.id order by t.created_at desc limit 1) as expiry
      from app.users u where u.id = ${carer}`;
  if (!r?.active || !r.expiry) return false;
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + withinDays);
  return r.expiry <= limit.toISOString().slice(0, 10);
}
