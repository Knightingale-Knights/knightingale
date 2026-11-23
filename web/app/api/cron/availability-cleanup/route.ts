import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";
import { bearerOk } from "@/lib/texts/auth";
import { accountNag } from "@/lib/account/nag";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Nightly (00:30 or 01:30 Melbourne):
// 1. Deletes every carer's availability for days before today. Past availability is never used, so it isn't kept.
// 2. A carer still missing documents two weeks after they were first flagged loses their future availability
//    (slots already booked stay). The two weeks start from the first night a document is found missing,
//    even if the carer hasn't signed in to see the reminder.
export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const gone = await sql`
    delete from app.availability
     where date < date_trunc('day', now() at time zone 'Australia/Melbourne') at time zone 'Australia/Melbourne'`;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
  const carers = await sql<{ id: string }[]>`
    select distinct a.carer as id from app.availability a
      join app.users u on u.id = a.carer and u.account_type = 'carer' and u.active and u.account_status
     where coalesce(a.accepted, '') <> 'YES'`;
  const cleared: string[] = [];
  for (const c of carers) {
    try {
      if (!(await accountNag(c.id, today, true)).blocked) continue;
      await sql`delete from app.availability where carer = ${c.id} and coalesce(accepted, '') <> 'YES'`;
      cleared.push(c.id);
    } catch (e) {
      console.error("availability cleanup: nag", c.id, e);
    }
  }
  console.log("availability cleanup", gone.count, "past slots;", cleared.length, "carers missing documents", cleared);
  return NextResponse.json({ ok: true, deleted: gone.count, missingDocs: cleared.length });
}
