import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { sendWeeklyRoster } from "@/lib/roster/weekly";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// One-off (22 Nov 2026): rosters sent with the NDIS invoices before 10:21 UTC went to participants'
// own emails. This sends each again (week of Mon 23 Nov) to the support coordinator, or care@ when
// there is none. Each participant is recorded in app.roster_resends, so nobody gets it twice.
const WEEK = "2026-11-23";
const FIXED_AT = "2026-11-22T10:21:40Z";

export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const todo = await sql<{ participant: string }[]>`
    select distinct i.participant from app.invoices i
     where i.created_in_app and i.kind = 'ndis' and i.emailed_at is not null and i.emailed_at < ${FIXED_AT}
       and i.participant is not null
       and not exists (select 1 from app.roster_resends r where r.participant = i.participant)`;
  const sent: string[] = [];
  const failed: string[] = [];
  for (const { participant } of todo) {
    try {
      const r = await sendWeeklyRoster(participant, WEEK);
      await sql`insert into app.roster_resends (participant, week_start, sent_to) values (${participant}, ${WEEK}, ${r.to}) on conflict do nothing`;
      sent.push(`${participant} -> ${r.to}`);
    } catch (e) {
      failed.push(`${participant}: ${String((e as Error).message ?? e)}`);
    }
  }
  console.log("roster resend", { sent, failed });
  return NextResponse.json({ ok: true, sent, failed });
}
