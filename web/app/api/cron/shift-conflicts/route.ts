import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { currentStaff } from "@/lib/auth";
import { sendPlainEmail } from "@/lib/postmark";
import { addDays } from "@/lib/roster/rules";
import { bubbleNames, bubbleShifts } from "@/lib/klarra/bubble";
import { awayBetween, REASONS } from "@/lib/carer/away";
import { clock, conflicts, gaps, melbDay, toSlots, type Slot } from "@/lib/klarra/conflicts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAYS = 14;
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Saturdays at 6:15am Melbourne (after the recurring shifts are created at 5am): Klarra emails Paul
// only when, over the next two weeks, a carer has two shifts that overlap, a shift has no carer,
// or a carer is rostered while they've told us they're away (holiday or sick).
export async function GET(req: Request) {
  // Vercel Cron, or an admin checking it by hand (add ?dry=1 to see the counts without an email).
  if (!bearerOk(req, env.cronSecret) && !(await currentStaff())) return NextResponse.json({ ok: false }, { status: 401 });
  const today = melbDay(new Date().toISOString());
  const to = addDays(today, DAYS);
  const slots = toSlots(await bubbleShifts(today, to)).filter((s) => s.day >= today && s.day < to);
  const clash = conflicts(slots);
  const open = gaps(slots);
  const away = await awayBetween(today, to);
  const awayHits = slots.flatMap((s) => {
    const a = away.find((x) => x.carer_b === s.carer && s.day >= x.from_day && s.day <= x.to_day);
    return a ? [{ s, a }] : [];
  });
  const counts = { shifts: slots.length, conflicts: clash.length, gaps: open.length, away: awayHits.length };
  if (!clash.length && !open.length && !awayHits.length) return NextResponse.json({ ok: true, ...counts });

  const nm = await bubbleNames([...new Set(slots.flatMap((s) => [s.carer, s.who]).filter((x): x is string => Boolean(x)))]);
  const line = (s: Slot) => `${dayLabel(s.day)} ${clock(s.start)}-${clock(s.end)}, ${nm.get(s.who ?? "") ?? "unknown client"}`;
  const text = [
    "Hi Paul,",
    "",
    `I checked the shifts for the next ${DAYS} days after this week's recurring shifts were made.`,
    ...(clash.length ? ["", `CONFLICTS (${clash.length}): a carer booked on two shifts at the same time`, ...clash.flatMap(([a, b]) => [
      `- ${nm.get(a.carer!) ?? "A carer"}:`, `    ${line(a)}`, `    ${line(b)}`,
    ])] : []),
    ...(awayHits.length ? ["", `AWAY (${awayHits.length}): rostered while they've told us they're away`,
      ...awayHits.map(({ s, a }) => `- ${a.name} (${REASONS[a.reason as keyof typeof REASONS] ?? a.reason}): ${line(s)}`)] : []),
    ...(open.length ? ["", `GAPS (${open.length}): shifts with no carer yet`, ...open.map((s) => `- ${line(s)}`)] : []),
    "",
    "Klarra",
  ].join("\n");
  const subject = `Klarra: ${[
    clash.length ? plural(clash.length, "shift conflict") : "",
    awayHits.length ? plural(awayHits.length, "away clash", "away clashes") : "",
    open.length ? plural(open.length, "gap") : "",
  ].filter(Boolean).join(", ")}`;
  if (new URL(req.url).searchParams.get("dry") === "1") return NextResponse.json({ ok: true, ...counts, sent: false });
  await sendPlainEmail({ to: env.complianceAlertTo, subject, text, attachments: [] });
  return NextResponse.json({ ok: true, ...counts, sent: true });
}
