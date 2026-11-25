import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { expiryAlerts, markAlerted, type AlertKind, type ExpiryAlert } from "@/lib/compliance/data";
import { sendPlainEmail } from "@/lib/postmark";
import { auDate, isoDate } from "@/lib/invoicing/rules";
import { fileHref } from "@/lib/files";
import { sql } from "@/lib/db";
import { DOCS } from "@/lib/compliance/docs";
import { readExpiry } from "@/lib/compliance/expiryReader";
import { fileBytes } from "@/lib/compliance/fileBytes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Before any expiry email, Klarra reads the document itself: the date on file may be wrong (e.g. typed into Bubble).
 * If the document gives a different expiry, the record is corrected, and the email only goes if the corrected date
 * still falls in that email's window. A document that can't be read keeps the date on file.
 * Returns the alert to send (with the read date), or null to skip it.
 */
async function checked(a: ExpiryAlert, today: string, window: { from: string | null; to: string }): Promise<ExpiryAlert | null> {
  const d = DOCS.find((x) => x.key === a.doc);
  if (!d?.ai || !d.expiryCol || !a.file) return a;
  try {
    const f = await fileBytes(a.file);
    if (!f || !/^(application\/pdf|image\/(png|jpeg|gif|webp))$/.test(f.mime)) return a;
    const r = await readExpiry(f.bytes, f.mime, d.ai.label, d.ai.fallbackMonths, today, d.ai.fromIssueOnly ?? false);
    const read = r?.expiryDate && r.reason !== "document_type_mismatch" && r.confidence !== "low" ? r.expiryDate : null;
    if (!read || read === a.expiry) return a;
    await sql`update ${sql(`app.${d.table}`)} set ${sql(d.expiryCol)} = (${read}::date)::timestamp at time zone 'Australia/Melbourne', updated_at = now()
               where id = ${a.record}`;
    console.log("expiry corrected from the document", a.carer, a.label, a.expiry, "->", read);
    const inWindow = (window.from === null || read >= window.from) && read < window.to;
    return inWindow ? { ...a, expiry: read } : null;
  } catch (e) {
    console.error("expiry check failed", a.carer, a.label, e);
    return a;
  }
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
  const stage = async (items: ExpiryAlert[], isExpired: boolean, marks: AlertKind[], window: { from: string | null; to: string }) => {
    const told: ExpiryAlert[] = [];
    for (const found of items) {
      if (sent.has(key(found))) { told.push(found); continue; }
      const a = await checked(found, today, window);
      if (!a) continue; // the document itself shows a later expiry: record corrected, no email
      try {
        await notify(a, isExpired);
        sent.add(key(found));
        told.push(a); // marked under the date actually emailed about
      } catch (e) {
        console.error("document expiry email failed", e);
      }
    }
    for (const m of marks) await markAlerted(told, m);
    return told.length;
  };
  // Latest stage first, so a document due for two stages today gets one email.
  const nExpired = await stage([...expired, ...carerExpired], true, ["expired", "carer_expired"], { from: null, to: today });
  const nSoon = await stage(soon, false, ["soon", "carer"], { from: today, to: addDays(today, 7) });
  const nTwoWeeks = await stage(twoWeeks, false, ["carer"], { from: today, to: addDays(today, 14) });
  return NextResponse.json({ ok: true, expired: nExpired, soon: nSoon, twoWeeks: nTwoWeeks, sent: true });
}
