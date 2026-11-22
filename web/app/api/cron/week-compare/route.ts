import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { currentStaff } from "@/lib/auth";
import { sendPlainEmail } from "@/lib/postmark";
import { addDays } from "@/lib/roster/rules";
import { compareWeeks, compareWorkbook, summary } from "@/lib/roster/compare";
import { isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAUL = "paul@knightingale.com.au";

// Sundays at 5am Melbourne: Paul gets last week's and next week's shifts side by side in a spreadsheet.
export async function GET(req: Request) {
  // The cron, or an admin opening this address while signed in (sends it now, for a test run).
  const admin = !bearerOk(req, env.cronSecret) && (await currentStaff());
  if (!bearerOk(req, env.cronSecret) && !admin) return NextResponse.json({ ok: false }, { status: 401 });
  const forced = Boolean(admin) || new URL(req.url).searchParams.has("now");
  const today = isoDate(new Date());
  const sunday = new Date(`${today}T00:00:00Z`).getUTCDay() === 0;
  if (!forced && (!isMelbourneHour(5) || !sunday)) return NextResponse.json({ ok: true, skipped: "not Sunday 5am Melbourne" });
  if (!env.automationsLive) return NextResponse.json({ ok: true, sent: false, mode: "dry" });

  // Next week starts on the coming Monday.
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const nextMonday = addDays(today, 7 - dow);
  const c = await compareWeeks(nextMonday);
  const s = summary(c.rows);
  const file = await compareWorkbook(c);
  const lines = [
    "Last week's and next week's NDIS shifts are side by side in the attached spreadsheet, grouped by day.",
    "",
    `Same as last week: ${s.same}`,
    `Carer changed: ${s.carer}`,
    `Time changed: ${s.time}`,
    `New next week: ${s.added}`,
    `Not on next week: ${s.gone}`,
    `No carer yet: ${s.open}`,
    "",
    "Changes are highlighted in the Check column (orange: changed, green: new, red: missing or no carer).",
    "",
    "Roster: https://knightingale.com.au/roster",
  ];
  await sendPlainEmail({
    to: PAUL,
    subject: `NDIS shifts: last week vs next week (${s.carer + s.time + s.added + s.gone + s.open} to check)`,
    text: lines.join("\n"),
    attachments: [{ Name: `NDIS shifts week of ${nextMonday}.xlsx`, Content: file.toString("base64"), ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
  });
  return NextResponse.json({ ok: true, rows: c.rows.length, ...s });
}
