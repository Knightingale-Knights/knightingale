import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { isMelbourneHour } from "@/lib/cron/at";
import { sendTemplateEmail } from "@/lib/postmark";

export const dynamic = "force-dynamic";

// Daily (Vercel Cron, 6:55am Melbourne): Paul gets the Postmark birthday email for each user whose birthday is today.
const TEMPLATE = 48691468;
const TO = "paul@knightingale.com.au";

export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isMelbourneHour(6) && !new URL(req.url).searchParams.has("now")) return NextResponse.json({ ok: true, skipped: "not 6:55am Melbourne" });
  const people = await sql<{ first_name: string | null; last_name: string | null; email: string | null; phone: string | null; birthday: string; age: number | null }[]>`
    select u.first_name, u.last_name, u.email, u.phone_number as phone,
           to_char(u.date_of_birth at time zone 'Australia/Melbourne', 'DD/MM/YYYY') as birthday,
           extract(year from age((now() at time zone 'Australia/Melbourne')::date, (u.date_of_birth at time zone 'Australia/Melbourne')::date))::int as age
      from app.users u
     where u.date_of_birth is not null
       and to_char(u.date_of_birth at time zone 'Australia/Melbourne', 'MM-DD') = to_char(now() at time zone 'Australia/Melbourne', 'MM-DD')`;
  if (!people.length) return NextResponse.json({ ok: true, people: 0 });
  if (!env.automationsLive) return NextResponse.json({ ok: true, people: people.length, sent: false, mode: "dry" });
  let sent = 0;
  for (const p of people) {
    const first = (p.first_name ?? "").trim();
    const full = [first, (p.last_name ?? "").trim()].filter(Boolean).join(" ");
    await sendTemplateEmail(TEMPLATE, TO, {
      name: full, date: p.birthday.slice(0, 5), number: p.phone ?? "",
    });
    sent++;
  }
  return NextResponse.json({ ok: true, people: people.length, sent });
}
