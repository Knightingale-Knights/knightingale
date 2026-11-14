import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { expiringSoon, markAlerted } from "@/lib/compliance/data";
import { sendPlainEmail } from "@/lib/postmark";
import { auDate, isoDate } from "@/lib/invoicing/rules";

export const dynamic = "force-dynamic";

// Daily (Vercel Cron, 9am Melbourne): one email listing documents that expire in the next 7 days,
// each listed once. Bubble sent one email per document. Only sends when AUTOMATIONS=live.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const items = await expiringSoon(isoDate(new Date()));
  if (!items.length) return NextResponse.json({ ok: true, items: 0 });
  if (!env.automationsLive) return NextResponse.json({ ok: true, items: items.length, sent: false, mode: "dry" });
  const text = ["These carer documents expire in the next 7 days:", "", ...items.map((i) => `${i.carer}: ${i.label}, ${auDate(i.expiry)}`), "", "Compliance: https://knightingale.com.au/compliance"].join("\n");
  await sendPlainEmail({ to: env.complianceAlertTo, subject: `Carer documents expiring soon (${items.length})`, text, attachments: [] });
  await markAlerted(items);
  return NextResponse.json({ ok: true, items: items.length, sent: true });
}
