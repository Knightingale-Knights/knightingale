import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { pushShifts, unsentShifts } from "@/lib/klarra/push";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Hourly: any upcoming NDIS shift Klarra doesn't have yet (its push failed or was missed) is sent again.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!process.env.KLARRA_SYNC_URL) return NextResponse.json({ ok: true, skipped: "KLARRA_SYNC_URL not set" });
  const ids = await unsentShifts();
  await pushShifts(ids);
  return NextResponse.json({ ok: true, sent: ids.length });
}
