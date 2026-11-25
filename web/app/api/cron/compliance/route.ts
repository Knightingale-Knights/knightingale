import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { expiryAlerts, markAlerted, type AlertKind, type ExpiryAlert } from "@/lib/compliance/data";
import { sendPlainEmail } from "@/lib/postmark";
import { auDate, isoDate } from "@/lib/invoicing/rules";
import { fileHref } from "@/lib/files";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KLARRA_FROM = "Klarra <care@knightingale.com.au>";
const SITE = "https://knightingale.com.au";
const SIGN_OFF = `Knightingale • Aged Care • NDIS
Klarra | Executive Assistant
✉️ care@knightingale.com.au
📞 +61 483 931 556
🌐 knightingale.com.au
Now Hiring RNs, ENs and Disability Support Workers
🏠 Home Care | 🏥 Residential Aged Care | ♿ NDIS
Bringing kind care to older adults.`;

const docLink = (a: ExpiryAlert) =>
  a.file ? `${SITE}${fileHref(a.file.startsWith("//") ? `https:${a.file}` : a.file)}` : `${SITE}/compliance/${a.carer_id}`;

/** Klarra emails the carer, with Paul in cc, and links straight to the document. */
async function notify(a: ExpiryAlert, expired: boolean) {
  const date = auDate(a.expiry);
  const verb = expired ? "expired" : "expires";
  await sendPlainEmail({
    from: KLARRA_FROM,
    to: a.email ?? env.complianceAlertTo,
    cc: a.email ? env.complianceAlertTo : undefined,
    subject: `${a.email ? "Your" : `${a.carer}'s`} ${a.label} ${verb} on ${date}`,
    text: [
      `Hi ${a.first ?? "there"},`,
      "",
      "Hope you're well.",
      "",
      `I wanted to give you a heads up that your ${a.label} ${verb} on ${date}.`,
      "",
      `Your current ${a.label}: ${docLink(a)}`,
      "",
      `Please upload a new ${a.label} when you have a moment so you can keep being rostered: ${SITE}/carer/account`,
      "",
      "All the best,",
      "",
      "Klarra",
      "",
      SIGN_OFF,
    ].join("\n"),
    attachments: [],
  });
}

// Daily (Vercel Cron, 6:55am Melbourne), active carers only. Klarra emails the carer (Paul in cc), with a link to
// the document, once per document at each stage: 2 weeks before it expires, 7 days before, and once it has expired.
// A document that reaches two stages on the same day gets one email (the later stage).
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isMelbourneHour(6) && !new URL(req.url).searchParams.has("now")) return NextResponse.json({ ok: true, skipped: "not 6:55am Melbourne" });
  const today = isoDate(new Date());
  const [expired, soon, twoWeeks, carerExpired] = await Promise.all([
    expiryAlerts(today, "expired"), expiryAlerts(today, "soon"), expiryAlerts(today, "carer"), expiryAlerts(today, "carer_expired"),
  ]);
  if (!env.automationsLive) {
    return NextResponse.json({ ok: true, expired: expired.length, soon: soon.length, carer: twoWeeks.length, sent: false, mode: "dry" });
  }

  const key = (a: ExpiryAlert) => `${a.doc}:${a.record}:${a.expiry}`;
  const sent = new Set<string>();
  const stage = async (items: ExpiryAlert[], isExpired: boolean, marks: AlertKind[]) => {
    const told: ExpiryAlert[] = [];
    for (const a of items) {
      if (sent.has(key(a))) { told.push(a); continue; }
      try {
        await notify(a, isExpired);
        sent.add(key(a));
        told.push(a);
      } catch (e) {
        console.error("document expiry email failed", e);
      }
    }
    for (const m of marks) await markAlerted(told, m);
    return told.length;
  };
  // Latest stage first, so a document due for two stages today gets one email.
  const nExpired = await stage([...expired, ...carerExpired], true, ["expired", "carer_expired"]);
  const nSoon = await stage(soon, false, ["soon", "carer"]);
  const nTwoWeeks = await stage(twoWeeks, false, ["carer"]);
  return NextResponse.json({ ok: true, expired: nExpired, soon: nSoon, twoWeeks: nTwoWeeks, sent: true });
}
