import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { addEvent, editShift, findShifts } from "@/lib/klarra/roster";

export const dynamic = "force-dynamic";

// Klarra (Paul's admin texts): find shifts, move or retime a shift, add a participant event.
// Body: { action: "find_shifts" | "edit_shift" | "create_event", ...fields }. Errors come back as { ok: false, error }.
export async function POST(req: Request) {
  if (!bearerOk(req, env.klarraSecret)) return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string> & { action?: string };
  try {
    if (body.action === "find_shifts") return NextResponse.json({ ok: true, shifts: await findShifts({ carer: body.carer, participant: body.participant, from: body.from, to: body.to }) });
    if (body.action === "edit_shift") return NextResponse.json({ ok: true, ...(await editShift({ id: body.id, day: body.day, start: body.start, end: body.end })) });
    if (body.action === "create_event") return NextResponse.json({ ok: true, ...(await addEvent({ participant: body.participant, details: body.details, day: body.day, time: body.time, where: body.where })) });
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error).message ?? e) }, { status: 200 });
  }
}
