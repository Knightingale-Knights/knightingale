// Participant group chats: one per NDIS participant, for their care team.
// Admins see every participant's chat. A carer sees the chats of participants they have a shift with
// from 30 days ago to 4 weeks ahead.
import { sql } from "@/lib/db";
import type { AppUser } from "@/lib/auth";

type Tx = typeof sql;
type Who = Pick<AppUser, "id" | "name" | "role">;

export const MAX_MESSAGE = 4000;
export class ChatError extends Error {}

const DAY = 24 * 3600_000;
const UNREAD_DEFAULT_DAYS = 7; // a chat never opened counts the last week's messages as unread

/** Participants this person can chat about (shift window for carers, everyone with a shift or a chat for admins). */
const visible = (u: Who, now: Date) => u.role === "admin"
  ? sql`select distinct s.participant as id from app.shifts s
         where s.participant is not null and s.date >= ${new Date(now.getTime() - 30 * DAY)} and s.date < ${new Date(now.getTime() + 28 * DAY)}
        union select g.participant from app.group_chats g where g.participant is not null and exists (select 1 from app.messages m where m.comms_book = g.id)`
  : sql`select distinct s.participant as id from app.shifts s
         where s.carer = ${u.id} and s.participant is not null and not coalesce(s.cancelled, false)
           and s.date >= ${new Date(now.getTime() - 30 * DAY)} and s.date < ${new Date(now.getTime() + 28 * DAY)}`;

export async function canSee(u: Who, participant: string, now = new Date(), tx: Tx = sql) {
  const [r] = await tx<{ ok: boolean }[]>`select exists (select 1 from (${visible(u, now)}) v where v.id = ${participant}) as ok`;
  return r.ok;
}

const unreadSince = (u: Who) => sql`coalesce(r.last_read_at, now() - make_interval(days => ${UNREAD_DEFAULT_DAYS}))`;

export type ChatSummary = { participant: string; name: string; chat: string | null; last_at: Date | null; last_text: string | null; unread: number };

export async function chatList(u: Who, now = new Date()): Promise<ChatSummary[]> {
  return sql<ChatSummary[]>`
    select p.id as participant,
           case when ${u.role} = 'admin' then trim(concat_ws(' ', p.first_name, p.last_name)) else split_part(p.first_name, ' ', 1) end as name,
           g.id as chat, last.created_at as last_at, last.content as last_text,
           (select count(*)::int from app.messages m
             where g.id is not null and m.comms_book = g.id and m.created_at > ${unreadSince(u)} and m.created_by is distinct from ${u.id}) as unread
      from (${visible(u, now)}) v
      join app.users p on p.id = v.id
      left join lateral (select id from app.group_chats where participant = p.id order by created_at limit 1) g on true
      left join app.chat_reads r on r.group_chat = g.id and r.user_id = ${u.id}
      left join lateral (select created_at, content from app.messages where comms_book = g.id order by created_at desc limit 1) last on true
     order by last.created_at desc nulls last, name`;
}

export async function unreadTotal(u: Who, now = new Date()) {
  const list = await chatList(u, now);
  return list.reduce((n, c) => n + c.unread, 0);
}

/** The participant's chat, made the first time someone needs it (as Bubble does when a shift is created). */
async function chatFor(participant: string, tx: Tx) {
  await tx`select pg_advisory_xact_lock(hashtext(${"chat:" + participant}))`;
  const [g] = await tx<{ id: string }[]>`select id from app.group_chats where participant = ${participant} order by created_at limit 1`;
  if (g) return g.id;
  const [n] = await tx<{ id: string }[]>`insert into app.group_chats (participant) values (${participant}) returning id`;
  return n.id;
}

export type ChatMessage = { id: string; at: Date; sender: string | null; content: string | null; mine: boolean };
export type Chat = { participant: string; name: string; messages: ChatMessage[] };

/** Opens a chat: its latest messages, oldest first, and marks it read for this person. */
export async function openChat(u: Who, participant: string, now = new Date()): Promise<Chat | null> {
  if (!(await canSee(u, participant, now))) return null;
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const [p] = await tx<{ name: string }[]>`
      select case when ${u.role} = 'admin' then trim(concat_ws(' ', first_name, last_name)) else split_part(first_name, ' ', 1) end as name
        from app.users where id = ${participant}`;
    const chat = await chatFor(participant, tx);
    const messages = await tx<ChatMessage[]>`
      select id, created_at as at, sender, content, created_by is not distinct from ${u.id} as mine from (
        select * from app.messages where comms_book = ${chat} order by created_at desc limit 200) m
       order by created_at`;
    await tx`insert into app.chat_reads (user_id, group_chat, last_read_at) values (${u.id}, ${chat}, ${now})
             on conflict (user_id, group_chat) do update set last_read_at = excluded.last_read_at`;
    return { participant, name: p?.name ?? "Participant", messages };
  });
}

export async function postMessage(u: Who, participant: string, text: string, now = new Date()) {
  const content = text.trim();
  if (!content) throw new ChatError("Write a message first.");
  if (content.length > MAX_MESSAGE) throw new ChatError(`Messages can be up to ${MAX_MESSAGE} characters.`);
  if (!(await canSee(u, participant, now))) throw new ChatError("You can't post in this chat.");
  return sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const chat = await chatFor(participant, tx);
    const sender = u.name.trim().split(/\s+/)[0] || "Knightingale";
    const [m] = await tx<{ id: string }[]>`
      insert into app.messages (comms_book, content, sender, created_by, created_at) values (${chat}, ${content}, ${sender}, ${u.id}, ${now}) returning id`;
    await tx`insert into app.chat_reads (user_id, group_chat, last_read_at) values (${u.id}, ${chat}, ${now})
             on conflict (user_id, group_chat) do update set last_read_at = excluded.last_read_at`;
    return m.id;
  });
}
