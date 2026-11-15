// The Bubble data model (types, fields, list fields), so the Bubble-compatible Data API can translate
// between Bubble's field names and the app's tables. bubble_map.json is written by scripts/gen_schema.py.
import raw from "./bubble_map.json";

type RawField = { column: string; type: string; display: string };
type RawTable = { table: string; display: string; fields: Record<string, RawField> };
type RawJoin = { bubble_type: string; bubble_field: string; display: string; table: string; owner_col: string; target_col: string; target_table: string };
const MAP = raw as unknown as { tables: Record<string, RawTable>; joins: RawJoin[] };

export type FieldKind = "text" | "number" | "boolean" | "date" | "address" | "file" | "option" | "ref" | "list" | "optionList" | "dateList";
export type Field = { display: string; column: string; kind: FieldKind; optionSet?: string; target?: string };
export type Join = { display: string; table: string; ownerCol: string; targetCol: string; target: string };
export type TypeDef = { key: string; display: string; table: string; fields: Field[]; joins: Join[] };

const tableOf = (bubbleType: string) => (bubbleType === "user" ? "users" : MAP.tables[bubbleType]?.table);

function kindOf(t: string): Pick<Field, "kind" | "optionSet" | "target"> {
  if (t === "text") return { kind: "text" };
  if (t === "number") return { kind: "number" };
  if (t === "boolean") return { kind: "boolean" };
  if (t === "date") return { kind: "date" };
  if (t === "geographic_address") return { kind: "address" };
  if (t === "file" || t === "image") return { kind: "file" };
  if (t.startsWith("option.")) return { kind: "option", optionSet: t.slice(7) };
  if (t === "user") return { kind: "ref", target: "users" };
  if (t.startsWith("custom.")) return { kind: "ref", target: tableOf(t.slice(7)) };
  if (t.startsWith("list.option.")) return { kind: "optionList", optionSet: t.slice(12) };
  if (t === "list.date") return { kind: "dateList" };
  return { kind: "list" }; // list.text, list.file, list.image
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, "");

const TYPES: TypeDef[] = Object.entries(MAP.tables).map(([key, t]) => ({
  key,
  display: t.display,
  table: t.table,
  fields: Object.values(t.fields).map((f) => ({ display: f.display, column: f.column, ...kindOf(f.type) })),
  joins: MAP.joins.filter((j) => j.bubble_type === key).map((j) => ({ display: j.display, table: j.table, ownerCol: j.owner_col, targetCol: j.target_col, target: j.target_table })),
}));

/** "shift", "ndis quarter", "questionnairesession", "riskassessment", "location1"... */
export function typeFor(name: string): TypeDef | null {
  const n = norm(decodeURIComponent(name));
  return TYPES.find((t) => norm(t.key) === n) ?? TYPES.find((t) => norm(t.display) === n) ?? null;
}

export const fieldFor = (t: TypeDef, key: string) => t.fields.find((f) => f.display === key) ?? t.fields.find((f) => f.display.toLowerCase() === key.toLowerCase()) ?? null;
export const joinFor = (t: TypeDef, key: string) => t.joins.find((j) => j.display === key) ?? t.joins.find((j) => j.display.toLowerCase() === key.toLowerCase()) ?? null;
