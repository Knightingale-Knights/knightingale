import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { expiryAlerts, markAlerted, type ExpiryAlert } from "@/lib/compliance/data";
import { sendPlainEmail } from "@/lib/postmark";
import { auDate, isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PAUL = "paul@knightingale.com.au";
const KLARRA_FROM = "Klarra <care@knightingale.com.au>";
const SIGN_OFF = `Knightingale • Aged Care • NDIS
Klarra | Executive Assistant
✉️ care@knightingale.com.au
📞 +61 483 931 556
🌐 knightingale.com.au
Now Hiring RNs, ENs and Disability Support Workers
🏠 Home Care | 🏥 Residential Aged Care | ♿ NDIS
Bringing kind care to older adults.`;

/** Klarra emails the carer (Paul in cc) two weeks before a document expires, and again once it has expired. */
async function headsUp(a: ExpiryAlert, expired: boolean) {
  if (!a.email) return false;
  const date = auDate(a.expiry);
  await sendPlainEmail({
    from: KLARRA_FROM,
    to: a.email,
    cc: PAUL,
    subject: `Your ${a.label} ${expired ? "expired" : "expires"} on ${date}`,
    text: [
      `Hi ${a.first ?? "there"},`,
      "",
      "Hope you're well.",
      "",
      `I wanted to give you a heads up that your ${a.label} ${expired ? "expired" : "expires"} on ${date}.`,
      "",
      `Please upload a new ${a.label} when you have a moment so you can keep being rostered - https://knightingale.com.au/carer/account`,
      "",
      "All the best,",
      "",
      "Klarra",
      "",
      SIGN_OFF,
    ].join("\n"),
    attachments: [],
  });
  return true;
}

// Daily (Vercel Cron, 6:55am Melbourne), active carers only:
// - the office gets one email listing documents that have expired or expire in the next 7 days (each listed once as
//   "expiring soon" and once more when it has expired);
// - each carer gets Klarra's email (Paul in cc) once per document 2 weeks before it expires, and once when it has expired.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isMelbourneHour(6) && !new URL(req.url).searchParams.has("now")) return NextResponse.json({ ok: true, skipped: "not 6:55am Melbourne" });
  const today = isoDate(new Date());
  const [expired, soon, carer, carerExpired] = await Promise.all([
    expiryAlerts(today, "expired"), expiryAlerts(today, "soon"), expiryAlerts(today, "carer"), expiryAlerts(today, "carer_expired"),
  ]);
  if (!env.automationsLive) {
    return NextResponse.json({ ok: true, expired: expired.length, soon: soon.length, carer: carer.length, carerExpired: carerExpired.length, sent: false, mode: "dry" });
  }

  if (expired.length || soon.length) {
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
  }

  const tell = async (items: ExpiryAlert[], isExpired: boolean) => {
    const told: ExpiryAlert[] = [];
    for (const a of items) {
      try {
        if (await headsUp(a, isExpired)) told.push(a);
      } catch (e) {
        console.error("carer document email failed", e);
      }
    }
    await markAlerted(told, isExpired ? "carer_expired" : "carer");
    return told.length;
  };
  const toldSoon = await tell(carer, false);
  const toldExpired = await tell(carerExpired, true);
  return NextResponse.json({ ok: true, expired: expired.length, soon: soon.length, carer: toldSoon, carerExpired: toldExpired, sent: true });
}
