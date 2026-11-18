// Reads Bubble's live roster (the source of truth until switch-over) for Klarra's shift checks.
import { sql } from "@/lib/db";
import { addDays } from "@/lib/roster/rules";
import type { BubbleShift } from "./conflicts";

const BASE = (process.env.BUBBLE_API_BASE ?? "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");

async function bubble<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${BASE}/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}` }, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bubble ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Every Bubble shift dated from one Melbourne day up to (not including) another, optionally for one carer. */
export async function bubbleShifts(from: string, to: string, carerBubbleId?: string): Promise<BubbleShift[]> {
  const constraints = JSON.stringify([
    { key: "date", constraint_type: "greater than", value: new Date(`${addDays(from, -1)}T12:00:00Z`).toISOString() },
    { key: "date", constraint_type: "less than", value: new Date(`${to}T12:00:00Z`).toISOString() },
    ...(carerBubbleId ? [{ key: "carer", constraint_type: "equals", value: carerBubbleId }] : []),
  ]);
  const out: BubbleShift[] = [];
  for (let cursor = 0; ; ) {
    const r = await bubble<{ response: { results: BubbleShift[]; remaining: number } }>("shift", { constraints, cursor: String(cursor), limit: "100" });
    out.push(...r.response.results);
    if (r.response.remaining <= 0) break;
    cursor += r.response.results.length;
  }
  return out;
}

/** Names for Bubble user and location ids: from our copy first, Bubble for anyone newer. */
export async function bubbleNames(ids: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  if (!ids.length) return m;
  const rows = await sql<{ b: string; name: string }[]>`
    select bubble_id as b, trim(concat_ws(' ', first_name, last_name)) as name from app.users where bubble_id = any(${ids})
    union all select bubble_id, name from app.locations where bubble_id = any(${ids})`;
  for (const r of rows) if (r.name) m.set(r.b, r.name);
  for (const id of ids.filter((i) => !m.has(i))) {
    const u = await bubble<{ response: Record<string, string> }>(`user/${id}`).catch(() => null);
    const n = u ? [u.response["first name"], u.response["last name"]].filter(Boolean).join(" ") : "";
    if (n) m.set(id, n);
  }
  return m;
}
