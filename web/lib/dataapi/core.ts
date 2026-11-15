// A Bubble-compatible Data API over the app's tables, so Klarra and the other tools that call
// https://knightingale.com.au/api/1.1/obj/... keep working unchanged once the domain moves to this app.
import { sql } from "@/lib/db";
import { fieldFor, joinFor, type Field, type Join, type TypeDef } from "./map";

type Tx = typeof sql;
type Row = Record<string, unknown>;
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPECIAL = new Set(["_id", "Created Date", "Modified Date", "Created By", "Slug", "authentication", "user_signed_up"]);

/** A Bubble id ("1714536331477x2184...") maps to the app id the sync gave it; app-made rows already use their uuid. */
export const appId = (v: string) => (UUID.test(v) ? v.toLowerCase() : null);
async function idFor(v: unknown, tx: Tx = sql): Promise<string | null> {
  if (typeof v !== "string" || !v) return null;
  if (UUID.test(v)) return v.toLowerCase();
  const [r] = await tx<{ id: string }[]>`select md5(${v})::uuid as id`;
  return r.id;
}

// ---- options ----------------------------------------------------------------
let options: { set_key: string; value: string; display: string }[] | null = null;
async function opts() {
  options ??= await sql<{ set_key: string; value: string; display: string }[]>`select set_key, value, display from app.option_values`;
  return options;
}
const toDisplay = (all: NonNullable<typeof options>, set: string, v: unknown) =>
  typeof v === "string" ? all.find((o) => o.set_key === set && o.value === v)?.display ?? v : v;
const toValue = (all: NonNullable<typeof options>, set: string, v: unknown) =>
  typeof v === "string" ? all.find((o) => o.set_key === set && (o.display === v || o.display.toLowerCase() === v.toLowerCase()))?.value ?? v : v;

// ---- rows out (Bubble's shape) ------------------------------------------------
async function bubbleIds(table: string, ids: string[], tx: Tx) {
  if (!ids.length) return new Map<string, string>();
  const rows = await tx<{ id: string; bubble_id: string | null }[]>`select id, bubble_id from app.${sql(table)} where id = any(${ids}::uuid[])`;
  return new Map(rows.map((r) => [r.id, r.bubble_id ?? r.id]));
}

async function shape(t: TypeDef, rows: Row[], tx: Tx = sql) {
  if (!rows.length) return [];
  const all = await opts();
  // Every referenced id, by table, in one query per table.
  const want = new Map<string, Set<string>>();
  const add = (table: string | undefined, id: unknown) => {
    if (!table || typeof id !== "string") return;
    (want.get(table) ?? want.set(table, new Set()).get(table)!).add(id);
  };
  for (const r of rows) {
    add("users", r.created_by);
    for (const f of t.fields) if (f.kind === "ref") add(f.target, r[f.column]);
  }
  const joinRows = new Map<string, { owner: string; target: string }[]>();
  for (const j of t.joins) {
    const jr = await tx<{ owner: string; target: string }[]>`
      select ${sql(j.ownerCol)} as owner, ${sql(j.targetCol)} as target from app.${sql(j.table)} where ${sql(j.ownerCol)} = any(${rows.map((r) => r.id as string)}::uuid[])`;
    joinRows.set(j.table, jr);
    for (const x of jr) add(j.target, x.target);
  }
  const ids = new Map<string, Map<string, string>>();
  for (const [table, set] of want) ids.set(table, await bubbleIds(table, [...set], tx));
  const ref = (table: string | undefined, id: unknown) => (table && typeof id === "string" ? ids.get(table)?.get(id) ?? id : undefined);

  return rows.map((r) => {
    const o: Row = { _id: (r.bubble_id as string | null) ?? r.id };
    for (const f of t.fields) {
      let v = r[f.column];
      if (v == null || (Array.isArray(v) && !v.length)) continue;
      if (f.kind === "date") v = (v as Date).toISOString();
      else if (f.kind === "dateList") v = (v as Date[]).map((d) => new Date(d).toISOString());
      else if (f.kind === "ref") v = ref(f.target, v);
      else if (f.kind === "option") v = toDisplay(all, f.optionSet!, v);
      else if (f.kind === "optionList") v = (v as string[]).map((x) => toDisplay(all, f.optionSet!, x));
      o[f.display] = v;
    }
    for (const j of t.joins) {
      const list = (joinRows.get(j.table) ?? []).filter((x) => x.owner === r.id).map((x) => ref(j.target, x.target));
      if (list.length) o[j.display] = list;
    }
    o["Created Date"] = (r.created_at as Date).toISOString();
    o["Modified Date"] = (r.updated_at as Date).toISOString();
    if (r.created_by) o["Created By"] = ref("users", r.created_by);
    if (t.table === "users" && r.email) o.authentication = { email: { email: r.email, email_confirmed: true } };
    return o;
  });
}

// ---- values in (from Bubble's shape) ------------------------------------------
async function valueIn(f: Field, v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const all = await opts();
  switch (f.kind) {
    case "number": { const n = Number(v); if (!Number.isFinite(n)) throw new ApiError(400, "INVALID_DATA", `${f.display} must be a number`); return n; }
    case "boolean": return v === true || v === "true" || v === "yes";
    case "date": { const d = new Date(v as string | number); if (Number.isNaN(d.getTime())) throw new ApiError(400, "INVALID_DATA", `${f.display} must be a date`); return d; }
    case "dateList": return (Array.isArray(v) ? v : [v]).map((x) => new Date(x as string));
    case "ref": return idFor(v);
    case "option": return toValue(all, f.optionSet!, v);
    case "optionList": return (Array.isArray(v) ? v : [v]).map((x) => toValue(all, f.optionSet!, x));
    case "list": return Array.isArray(v) ? v.map(String) : [String(v)];
    case "address": return typeof v === "object" ? v : { address: String(v) };
    default: return typeof v === "string" ? v : String(v);
  }
}

async function rowIn(t: TypeDef, body: Row) {
  const row: Row = {};
  const joins: { j: Join; ids: string[] }[] = [];
  for (const [k, v] of Object.entries(body)) {
    if (SPECIAL.has(k)) continue;
    const f = fieldFor(t, k);
    if (f) { row[f.column] = await valueIn(f, v); continue; }
    const j = joinFor(t, k);
    if (j) { joins.push({ j, ids: (await Promise.all((Array.isArray(v) ? v : v ? [v] : []).map((x) => idFor(x)))).filter((x): x is string => Boolean(x)) }); continue; }
    if (t.table === "users" && k === "email") { row.email = String(v).toLowerCase(); continue; }
    throw new ApiError(400, "INVALID_DATA", `Unrecognized field: ${k}`);
  }
  return { row, joins };
}

async function writeJoins(tx: Tx, id: string, joins: { j: Join; ids: string[] }[]) {
  for (const { j, ids } of joins) {
    await tx`delete from app.${sql(j.table)} where ${sql(j.ownerCol)} = ${id}`;
    for (const target of ids) {
      await tx`insert into app.${sql(j.table)} (${sql(j.ownerCol)}, ${sql(j.targetCol)})
               select ${id}, ${target} where exists (select 1 from app.${sql(j.target)} where id = ${target}) on conflict do nothing`;
    }
  }
}

// ---- searches -----------------------------------------------------------------
export type Constraint = { key: string; constraint_type: string; value?: unknown };

async function where(t: TypeDef, cs: Constraint[]) {
  const parts = [sql`true`];
  for (const c of cs) {
    const type = String(c.constraint_type ?? "").toLowerCase().replace(/_/g, " ").trim();
    const key = String(c.key ?? "");
    // Built-in fields
    if (key === "_id") {
      const ids = (Array.isArray(c.value) ? c.value : [c.value]).map(String);
      const conds = sql`(t.bubble_id = any(${ids}) or t.id::text = any(${ids.map((x) => x.toLowerCase())}))`;
      parts.push(type === "not equal" || type === "not in" ? sql`not ${conds}` : conds);
      continue;
    }
    const builtin = key === "Created Date" ? "created_at" : key === "Modified Date" ? "updated_at" : key === "Created By" ? "created_by" : t.table === "users" && key === "email" ? "email" : null;
    const f: Field | null = builtin
      ? { display: key, column: builtin, kind: builtin === "created_by" ? "ref" : builtin === "email" ? "text" : "date", target: "users" }
      : fieldFor(t, key);
    const j = f ? null : joinFor(t, key);
    if (!f && !j) throw new ApiError(400, "INVALID_DATA", `Unrecognized field: ${key}`);

    if (j) {
      const target = await idFor(c.value);
      const has = sql`exists (select 1 from app.${sql(j.table)} x where x.${sql(j.ownerCol)} = t.id and x.${sql(j.targetCol)} = ${target})`;
      const any = sql`exists (select 1 from app.${sql(j.table)} x where x.${sql(j.ownerCol)} = t.id)`;
      if (type === "contains" || type === "equals") parts.push(has);
      else if (type === "not contains" || type === "doesn't contain" || type === "not equal") parts.push(sql`not ${has}`);
      else if (type === "is empty" || type === "empty") parts.push(sql`not ${any}`);
      else if (type === "is not empty" || type === "not empty") parts.push(any);
      else throw new ApiError(400, "INVALID_DATA", `Unsupported constraint on a list: ${c.constraint_type}`);
      continue;
    }
    const col = sql`t.${sql(f!.column)}`;
    const isList = f!.kind === "list" || f!.kind === "optionList" || f!.kind === "dateList";
    switch (type) {
      case "is empty": case "empty":
        parts.push(isList ? sql`coalesce(cardinality(${col}), 0) = 0` : sql`${col} is null`); break;
      case "is not empty": case "not empty":
        parts.push(isList ? sql`coalesce(cardinality(${col}), 0) > 0` : sql`${col} is not null`); break;
      case "equals": {
        const v = await valueIn(f!, c.value);
        if (v === null) parts.push(sql`${col} is null`);
        else if (f!.kind === "address") parts.push(sql`${col}->>'address' = ${(v as { address: string }).address}`);
        else if (isList) parts.push(sql`${(Array.isArray(v) ? v[0] : v) as string} = any(${col})`);
        else if (f!.kind === "text") parts.push(sql`${col} = ${v as string}`);
        else parts.push(sql`${col} = ${v as never}`);
        break;
      }
      case "not equal": {
        const v = await valueIn(f!, c.value);
        parts.push(v === null ? sql`${col} is not null` : sql`${col} is distinct from ${v as never}`);
        break;
      }
      case "greater than": case "less than": case "greater than or equal": case "less than or equal": {
        const v = await valueIn(f!, c.value);
        const op = { "greater than": ">", "less than": "<", "greater than or equal": ">=", "less than or equal": "<=" }[type]!;
        parts.push(sql`${col} ${sql.unsafe(op)} ${v as never}`);
        break;
      }
      case "text contains": case "not text contains": {
        const like = sql`${col}::text ilike ${"%" + String(c.value ?? "").replace(/[%_\\]/g, (m) => "\\" + m) + "%"}`;
        parts.push(type === "text contains" ? like : sql`not coalesce(${like}, false)`);
        break;
      }
      case "contains": case "not contains": case "doesn't contain": {
        const v = await valueIn(f!, c.value);
        const x = isList ? sql`${(Array.isArray(v) ? v[0] : v) as string} = any(${col})` : sql`${col}::text ilike ${"%" + String(c.value) + "%"}`;
        parts.push(type === "contains" ? x : sql`not coalesce(${x}, false)`);
        break;
      }
      case "in": case "not in": {
        const vals = await Promise.all((Array.isArray(c.value) ? c.value : [c.value]).map((x) => valueIn(f!, x)));
        const x = sql`${col}::text = any(${vals.map((v) => (v instanceof Date ? v.toISOString() : String(v)))})`;
        parts.push(type === "in" ? x : sql`not coalesce(${x}, false)`);
        break;
      }
      default:
        throw new ApiError(400, "INVALID_DATA", `Unsupported constraint: ${c.constraint_type}`);
    }
  }
  // Wrapped in an object: awaiting a bare query fragment would run it.
  return { frag: parts.reduce((a, b) => sql`${a} and ${b}`) };
}

export async function list(t: TypeDef, q: { constraints?: Constraint[]; sort_field?: string; descending?: boolean; cursor?: number; limit?: number }) {
  const { frag: w } = await where(t, q.constraints ?? []);
  const sortCol = !q.sort_field ? "created_at" : q.sort_field === "Created Date" ? "created_at" : q.sort_field === "Modified Date" ? "updated_at" : fieldFor(t, q.sort_field)?.column;
  if (!sortCol) throw new ApiError(400, "INVALID_DATA", `Unrecognized sort field: ${q.sort_field}`);
  const cursor = Math.max(0, Math.floor(q.cursor ?? 0));
  const limit = Math.min(100, Math.max(1, Math.floor(q.limit ?? 100)));
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from app.${sql(t.table)} t where ${w}`;
  const rows = await sql<Row[]>`
    select * from app.${sql(t.table)} t where ${w}
     order by ${sql(sortCol)} ${sql.unsafe(q.descending ? "desc" : "asc")} nulls last, id
     limit ${limit} offset ${cursor}`;
  const results = await shape(t, rows);
  return { cursor, results, count: results.length, remaining: Math.max(0, n - cursor - results.length) };
}

async function find(t: TypeDef, id: string, tx: Tx = sql) {
  const [r] = await tx<Row[]>`select * from app.${sql(t.table)} where bubble_id = ${id} or id::text = ${id.toLowerCase()} limit 1`;
  if (!r) throw new ApiError(404, "MISSING_DATA", `Missing object of type ${t.key}: object with id ${id} does not exist`);
  return r;
}

export async function getOne(t: TypeDef, id: string) {
  return (await shape(t, [await find(t, id)]))[0];
}

export async function create(t: TypeDef, body: Row) {
  const { row, joins } = await rowIn(t, body);
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const cols = Object.keys(row);
    const [r] = cols.length
      ? await tx<{ id: string }[]>`insert into app.${sql(t.table)} ${sql(row as never, cols as never)} returning id`
      : await tx<{ id: string }[]>`insert into app.${sql(t.table)} default values returning id`;
    await writeJoins(tx, r.id, joins);
    return r.id;
  });
}

export async function update(t: TypeDef, id: string, body: Row) {
  const { row, joins } = await rowIn(t, body);
  await sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const r = await find(t, id, tx);
    const cols = Object.keys(row);
    if (cols.length) await tx`update app.${sql(t.table)} set ${sql(row as never, cols as never)} where id = ${r.id as string}`;
    await writeJoins(tx, r.id as string, joins);
  });
}

export async function remove(t: TypeDef, id: string) {
  const r = await find(t, id);
  await sql`delete from app.${sql(t.table)} where id = ${r.id as string}`;
}
