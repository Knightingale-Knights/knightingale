import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runTexts } from "@/lib/texts/data";
import { bearerOk } from "@/lib/texts/auth";

export const dynamic = "force-dynamic";

// Vercel Cron calls this every minute with "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const summary = await runTexts();
  return NextResponse.json({ ok: true, mode: env.smsMode, ...summary });
}
