// The carer's chat with Klarra. Questions go to Klarra's help desk through helpdesk_app_inbox
// (Call-Klarra picks them up every few seconds); her replies, straight away or once Paul answers,
// are logged in helpdesk_messages, which is this chat. Texts with Klarra show here too.
import { sql } from "@/lib/db";
import { normalizePhone } from "@/lib/texts/rules";

export const KLARRA_MAX = 1000;
export class KlarraError extends Error {}

export type KlarraMessage = { id: string; mine: boolean; text: string; at: Date; pending?: boolean; sms: boolean };

async function phoneOf(userId: string) {
  const [u] = await sql<{ phone: string | null }[]>`select phone_number as phone from app.users where id = ${userId}`;
  return normalizePhone(u?.phone ?? "") || null;
}

export async function klarraChat(userId: string): Promise<{ messages: KlarraMessage[]; waiting: boolean; phone: string | null }> {
  const phone = await phoneOf(userId);
  if (!phone) return { messages: [], waiting: false, phone: null };
  const [msgs, inbox] = await Promise.all([
    sql<{ id: string; direction: string; body: string; created_at: Date; channel: string }[]>`
      select id::text, direction, body, created_at, channel from (
        select * from public.helpdesk_messages where phone = ${phone} order by created_at desc limit 100) m
       order by created_at`,
    sql<{ id: string; body: string; created_at: Date }[]>`
      select id::text, body, created_at from public.helpdesk_app_inbox
       where phone = ${phone} and claimed_at is null and error is null order by created_at`,
  ]);
  const messages: KlarraMessage[] = [
    ...msgs.map((m) => ({ id: `m${m.id}`, mine: m.direction === "in", text: m.body, at: m.created_at, sms: m.channel !== "app" })),
    ...inbox.map((m) => ({ id: `i${m.id}`, mine: true, text: m.body, at: m.created_at, pending: true, sms: false })),
  ];
  // Waiting for Klarra: a question not picked up yet, or the last thing said was the carer's.
  const last = msgs.at(-1);
  const recent = last ? Date.now() - new Date(last.created_at).getTime() < 25 * 60_000 : false;
  return { messages, waiting: inbox.length > 0 || (last?.direction === "in" && recent), phone };
}

export async function askKlarra(userId: string, text: string) {
  const body = text.trim();
  if (!body) throw new KlarraError("Type your question first.");
  if (body.length > KLARRA_MAX) throw new KlarraError(`Please keep it under ${KLARRA_MAX} characters.`);
  const phone = await phoneOf(userId);
  if (!phone) throw new KlarraError("Add your mobile number in Personal Details so Klarra knows it's you.");
  await sql`insert into public.helpdesk_app_inbox (phone, body) values (${phone}, ${body})`;
  await markKlarraRead(userId);
}

export async function markKlarraRead(userId: string) {
  await sql`insert into app.klarra_reads (user_id, last_read_at) values (${userId}, now())
            on conflict (user_id) do update set last_read_at = now()`;
}

/** Klarra's replies the carer hasn't seen (her "just a sec" holding line doesn't count). */
export async function klarraUnread(userId: string) {
  const phone = await phoneOf(userId);
  if (!phone) return 0;
  const [r] = await sql<{ n: number }[]>`
    select count(*)::int as n from public.helpdesk_messages m
     where m.phone = ${phone} and m.direction = 'out' and coalesce(m.source, '') <> 'holding'
       and m.created_at > coalesce((select last_read_at from app.klarra_reads where user_id = ${userId}), now() - interval '7 days')`;
  return r.n;
}

export async function klarraLast(userId: string) {
  const phone = await phoneOf(userId);
  if (!phone) return null;
  const [r] = await sql<{ body: string; created_at: Date }[]>`
    select body, created_at from public.helpdesk_messages where phone = ${phone} order by created_at desc limit 1`;
  return r ?? null;
}
