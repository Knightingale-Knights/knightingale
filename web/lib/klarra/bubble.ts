// Reads Bubble's live roster (the source of truth until switch-over) for Klarra's shift checks.
import { sql } from "@/lib/db";
import { addDays } from "@/lib/roster/rules";
import { fromDay } from "@/lib/roster/queries";
import type { BubbleShift } from "./conflicts";

const BASE = (process.env.BUBBLE_API_BASE ?? "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");

async function bubble<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${BASE}/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}` }, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bubble ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** The same shifts from this app's roster, in Bubble's shape (ids are the Bubble id where there is one). */
async function appShifts(from: string, to: string, carerBubbleId?: string): Promise<BubbleShift[]> {
  const rows = await sql<{ id: string; date: Date; start: number | null; end: number | null; carer: string | null; who: string | null; cancelled: boolean }[]>`
    select coalesce(s.bubble_id, s.id::text) as id, s.date, s.start_time::float8 as start, s.end_time::float8 as "end",
           coalesce(c.bubble_id, c.id::text) as carer,
           coalesce(p.bubble_id, p.id::text, l.bubble_id, l.id::text) as who, coalesce(s.cancelled, false) as cancelled
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.locations l on l.id = s.location
     where s.date >= ${fromDay(from)} and s.date < ${fromDay(to)}
       and (${carerBubbleId ?? null}::text is null or c.bubble_id = ${carerBubbleId ?? null} or c.id::text = ${carerBubbleId ?? null})`;
  return rows.map((r) => ({
    _id: r.id, date: new Date(r.date).toISOString(), "start time": r.start ?? undefined, "end time": r.end ?? undefined,
    carer: r.carer ?? undefined, participant: r.who ?? undefined, cancelled: r.cancelled,
  }));
}

/** Every shift dated from one Melbourne day up to (not including) another, optionally for one carer.
 *  Reads Bubble until the switch (LAUNCHED=yes), then this app's roster. */
export async function bubbleShifts(from: string, to: string, carerBubbleId?: string): Promise<BubbleShift[]> {
  if (process.env.LAUNCHED === "yes") return appShifts(from, to, carerBubbleId);
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
  const uuidLike = /^[0-9a-f-]{36}$/i;
  const appIds = ids.filter((i) => !m.has(i) && uuidLike.test(i));
  if (appIds.length) {
    const more = await sql<{ b: string; name: string }[]>`
      select id::text as b, trim(concat_ws(' ', first_name, last_name)) as name from app.users where id = any(${appIds}::uuid[])
      union all select id::text, name from app.locations where id = any(${appIds}::uuid[])`;
    for (const r of more) if (r.name) m.set(r.b, r.name);
  }
  if (process.env.LAUNCHED === "yes") return m;
  for (const id of ids.filter((i) => !m.has(i))) {
    const u = await bubble<{ response: Record<string, string> }>(`user/${id}`).catch(() => null);
    const n = u ? [u.response["first name"], u.response["last name"]].filter(Boolean).join(" ") : "";
    if (n) m.set(id, n);
  }
  return m;
}
