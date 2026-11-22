import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Nightly (00:30 or 01:30 Melbourne): deletes every carer's availability for days before today.
// Past availability is never used, so it isn't kept.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const gone = await sql`
    delete from app.availability
     where date < date_trunc('day', now() at time zone 'Australia/Melbourne') at time zone 'Australia/Melbourne'`;
  console.log("availability cleanup", gone.count);
  return NextResponse.json({ ok: true, deleted: gone.count });
}
