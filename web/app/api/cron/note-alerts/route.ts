import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { analyseNote, uncheckedNotes } from "@/lib/carer/noteAlert";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 10 minutes: any submitted progress note not yet checked for escalation (the check failed,
// or it came in before this existed) goes through the progress note AI.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const ids = await uncheckedNotes(10);
  const out: Record<string, string> = {};
  for (const id of ids) {
    try {
      out[id] = (await analyseNote(id)) ?? "skipped";
    } catch (e) {
      out[id] = `error: ${(e as Error).message}`;
    }
  }
  return NextResponse.json({ ok: true, checked: out });
}
