import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { currentStaff } from "@/lib/auth";
import { sendPlainEmail } from "@/lib/postmark";
import { addDays } from "@/lib/roster/rules";
import { clock, conflicts, gaps, melbDay, toSlots, type BubbleShift, type Slot } from "@/lib/klarra/conflicts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = (process.env.BUBBLE_API_BASE ?? "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");
const DAYS = 14;

async function bubble<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${BASE}/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}` }, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bubble ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Every Bubble shift dated between two Melbourne days. */
async function bubbleShifts(from: string, to: string): Promise<BubbleShift[]> {
  const constraints = JSON.stringify([
    { key: "date", constraint_type: "greater than", value: new Date(`${addDays(from, -1)}T12:00:00Z`).toISOString() },
    { key: "date", constraint_type: "less than", value: new Date(`${to}T12:00:00Z`).toISOString() },
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
async function names(ids: string[]): Promise<Map<string, string>> {
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

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

// Saturdays at 6:15am Melbourne (after the recurring shifts are created at 5am): Klarra emails Paul
// only when, over the next two weeks, a carer has two shifts that overlap or a shift has no carer.
export async function GET(req: Request) {
  // Vercel Cron, or an admin checking it by hand (add ?dry=1 to see the counts without an email).
  if (!bearerOk(req, env.cronSecret) && !(await currentStaff())) return NextResponse.json({ ok: false }, { status: 401 });
  const today = melbDay(new Date().toISOString());
  const to = addDays(today, DAYS);
  const slots = toSlots(await bubbleShifts(today, to)).filter((s) => s.day >= today && s.day < to);
  const clash = conflicts(slots);
  const open = gaps(slots);
  if (!clash.length && !open.length) return NextResponse.json({ ok: true, shifts: slots.length, conflicts: 0, gaps: 0 });

  const nm = await names([...new Set(slots.flatMap((s) => [s.carer, s.who]).filter((x): x is string => Boolean(x)))]);
  const line = (s: Slot) => `${dayLabel(s.day)} ${clock(s.start)}-${clock(s.end)}, ${nm.get(s.who ?? "") ?? "unknown client"}`;
  const text = [
    "Hi Paul,",
    "",
    `I checked the shifts for the next ${DAYS} days after this week's recurring shifts were made.`,
    ...(clash.length ? ["", `CONFLICTS (${clash.length}): a carer booked on two shifts at the same time`, ...clash.flatMap(([a, b]) => [
      `- ${nm.get(a.carer!) ?? "A carer"}:`, `    ${line(a)}`, `    ${line(b)}`,
    ])] : []),
    ...(open.length ? ["", `GAPS (${open.length}): shifts with no carer yet`, ...open.map((s) => `- ${line(s)}`)] : []),
    "",
    "Klarra",
  ].join("\n");
  const subject = `Klarra: ${[clash.length ? `${clash.length} shift conflict${clash.length === 1 ? "" : "s"}` : "", open.length ? `${open.length} gap${open.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ")}`;
  if (new URL(req.url).searchParams.get("dry") === "1") return NextResponse.json({ ok: true, shifts: slots.length, conflicts: clash.length, gaps: open.length, sent: false });
  await sendPlainEmail({ to: env.complianceAlertTo, subject, text, attachments: [] });
  return NextResponse.json({ ok: true, shifts: slots.length, conflicts: clash.length, gaps: open.length, sent: true });
}
