import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { bearerOk } from "@/lib/texts/auth";
import { sendTemplateEmail } from "@/lib/postmark";

export const dynamic = "force-dynamic";

// Daily (Vercel Cron, about 8am Melbourne): Paul gets the Postmark birthday email for each user whose birthday is today.
const TEMPLATE = 48691468;
const TO = "paul@knightingale.com.au";

export async function GET(req: Request) {
  if (!bearerOk(req, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
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
      name: full, full_name: full, first_name: first, last_name: (p.last_name ?? "").trim(),
      email: p.email ?? "", phone: p.phone ?? "", birthday: p.birthday, age: p.age ?? "",
    });
    sent++;
  }
  return NextResponse.json({ ok: true, people: people.length, sent });
}
