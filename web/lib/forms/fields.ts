// Declarative participant forms (intake, staff questions): one list of fields drives the page,
// the save to our database, and the copy sent to Bubble.
import { sql } from "@/lib/db";
import { fromDay } from "@/lib/roster/queries";

export type Field =
  | { col: string; label: string; kind: "text" | "area" | "yesno" | "address" | "date" | "signature" | "planManager" | "check" }
  | { col: string; label: string; kind: "choice" | "multi"; set: string }
  | { col: string; label: string; kind: "fixed"; options: string[] };

export type Section = { title: string; note?: string; fields: Field[] };

export type Options = Record<string, { value: string; display: string }[]>;

/** Option-set choices for every set the sections use. */
export async function loadOptions(sections: Section[]): Promise<Options> {
  const sets = [...new Set(sections.flatMap((s) => s.fields.flatMap((f) => ("set" in f ? [f.set] : []))))];
  if (!sets.length) return {};
  const rows = await sql<{ set_key: string; value: string; display: string }[]>`
    select set_key, value, display from app.option_values where set_key = any(${sets}) order by set_key, sort`;
  const out: Options = {};
  for (const r of rows) (out[r.set_key] ??= []).push({ value: r.value, display: r.display });
  return out;
}

export async function planManagers() {
  return sql<{ id: string; name: string }[]>`select id, coalesce(name, '(no name)') as name from app.plan_managers order by name`;
}

/** Reads the posted form into column values. Unknown or blank fields become null. */
export function readForm(sections: Section[], f: FormData) {
  const v: Record<string, unknown> = {};
  for (const fld of sections.flatMap((s) => s.fields)) {
    const raw = f.getAll(fld.col).map((x) => String(x).trim()).filter(Boolean);
    const one = raw[0] ?? "";
    switch (fld.kind) {
      case "multi": v[fld.col] = raw; break;
      case "check": v[fld.col] = one === "on" || one === "true"; break;
      case "address": v[fld.col] = one ? { address: one } : null; break;
      case "date": v[fld.col] = /^\d{4}-\d{2}-\d{2}$/.test(one) ? fromDay(one) : null; break;
      case "signature": {
        // Keep the saved signature unless a new one was drawn or it was cleared.
        if (f.get(`${fld.col}__clear`) === "1") v[fld.col] = null;
        else if (one.startsWith("data:image/png;base64,")) v[fld.col] = one;
        break;
      }
      default: v[fld.col] = one || null;
    }
  }
  return v;
}

/** The record's current values. */
export async function readRecord(table: string, id: string | null) {
  if (!id) return {} as Record<string, unknown>;
  const [row] = await sql<Record<string, unknown>[]>`select * from ${sql(`app.${table}`)} where id = ${id}`;
  return row ?? {};
}

/** A stored date as the Melbourne yyyy-mm-dd a date input shows. */
export const melbDate = (d: unknown) =>
  d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date(d as string)) : "";

/** Column values ready for an insert or update (addresses as JSON). */
export function dbValues(sections: Section[], v: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of sections.flatMap((s) => s.fields)) {
    if (!(f.col in v)) continue;
    out[f.col] = f.kind === "address" && v[f.col] ? sql.json(v[f.col] as never) : v[f.col];
  }
  return out;
}

/** Bubble's display name for a column (they match, with spaces for underscores). */
export const bubbleKey = (col: string) => col.replace(/_/g, " ");

/** Turns saved column values into a Bubble Data API body. */
export async function bubbleBody(sections: Section[], v: Record<string, unknown>) {
  const fields = sections.flatMap((s) => s.fields);
  const sets = [...new Set(fields.flatMap((f) => ("set" in f ? [f.set] : [])))];
  const opt = sets.length
    ? await sql<{ set_key: string; value: string; display: string }[]>`select set_key, value, display from app.option_values where set_key = any(${sets})`
    : [];
  const show = (set: string, value: string) => opt.find((o) => o.set_key === set && o.value === value)?.display ?? value;
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.col in v)) continue;
    const x = v[f.col];
    const key = bubbleKey(f.col);
    if (f.kind === "multi") body[key] = (x as string[]).map((s) => show(f.set, s));
    else if (f.kind === "choice") body[key] = x == null ? null : show(f.set, String(x));
    else if (f.kind === "address") body[key] = x == null ? null : (x as { address?: string } & Record<string, unknown>).address ?? null;
    else if (f.kind === "date") body[key] = x == null ? null : new Date(x as Date).toISOString();
    else if (f.kind === "planManager") {
      if (x == null) body[key] = null;
      else {
        const [pm] = await sql<{ bubble_id: string | null }[]>`select bubble_id from app.plan_managers where id = ${String(x)}`;
        if (pm?.bubble_id) body[key] = pm.bubble_id;
      }
    } else if (f.kind === "signature") {
      if (x == null) body[key] = null;
      else if (String(x).startsWith("data:image/png;base64,")) {
        body[key] = { filename: `${f.col}.png`, contents: String(x).slice("data:image/png;base64,".length), private: false };
      }
    } else body[key] = x;
  }
  return body;
}
