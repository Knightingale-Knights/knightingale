import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { expiryAlerts, markAlerted, type ExpiryAlert } from "@/lib/compliance/data";
import { sendPlainEmail } from "@/lib/postmark";
import { auDate, isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

// Daily (Vercel Cron, 6:55am Melbourne): one email listing active carers' documents that have expired or expire
// in the next 7 days. Each document is listed once as "expiring soon" and once more when it has expired.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isMelbourneHour(6) && !new URL(req.url).searchParams.has("now")) return NextResponse.json({ ok: true, skipped: "not 6:55am Melbourne" });
  const today = isoDate(new Date());
  const [expired, soon] = await Promise.all([expiryAlerts(today, "expired"), expiryAlerts(today, "soon")]);
  if (!expired.length && !soon.length) return NextResponse.json({ ok: true, expired: 0, soon: 0 });
  if (!env.automationsLive) return NextResponse.json({ ok: true, expired: expired.length, soon: soon.length, sent: false, mode: "dry" });
  const list = (items: ExpiryAlert[], verb: string) => items.map((i) => `${i.carer}: ${i.label}, ${verb} ${auDate(i.expiry)}`);
  const text = [
    ...(expired.length ? ["These active carers' documents have expired:", "", ...list(expired, "expired"), ""] : []),
    ...(soon.length ? ["These active carers' documents expire in the next 7 days:", "", ...list(soon, "expires"), ""] : []),
    "Compliance: https://knightingale.com.au/compliance",
  ].join("\n");
  const subject = [expired.length ? `${expired.length} expired` : "", soon.length ? `${soon.length} expiring soon` : ""].filter(Boolean).join(", ");
  await sendPlainEmail({ to: env.complianceAlertTo, subject: `Carer documents: ${subject}`, text, attachments: [] });
  await markAlerted(expired, "expired");
  await markAlerted(soon, "soon");
  return NextResponse.json({ ok: true, expired: expired.length, soon: soon.length, sent: true });
}
