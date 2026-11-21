import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { lastMonth, queueMonth, sendBatch } from "@/lib/participants/monthlySummary";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 5 minutes in the Melbourne morning: on the 1st, from 6:55am, coordinators are sent last month's support
// summary for each of their participants, a few per run until all are done. Other days it does nothing.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const forced = new URL(req.url).searchParams.has("now");
  if (!forced && (Number(parts.day) !== 1 || minutes < 6 * 60 + 55)) return NextResponse.json({ ok: true, skipped: "not the 1st after 6:55am" });
  if (!env.automationsLive) return NextResponse.json({ ok: true, sent: false, mode: "dry" });
  const month = lastMonth();
  await queueMonth(month);
  const r = await sendBatch(month);
  return NextResponse.json({ ok: true, month, ...r });
}
