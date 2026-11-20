// Carer notices: the office writes a message, turns it on, and chooses who sees it (roles and/or named carers;
// nobody chosen = every active carer). It pops up on the carer pages until the carer taps "Got it".
import { sql } from "@/lib/db";

export type Notice = {
  id: string; title: string; body: string; active: boolean; roles: string[]; carers: string[];
  created_at: Date; updated_at: Date; reads: number; audience: number;
};

const ID = /^[0-9a-f-]{36}$/i;

/** Every notice, newest first, with how many carers it's for and how many have read it. */
export function allNotices() {
  return sql<Notice[]>`
    select n.id, n.title, n.body, n.active, n.roles, n.carers, n.created_at, n.updated_at,
           (select count(*)::int from app.carer_notice_reads r where r.notice = n.id) as reads,
           (select count(*)::int from app.users u
             where u.account_type = 'carer' and coalesce(u.active, false) and coalesce(u.account_status, false)
               and (cardinality(n.roles) = 0 or u.roles && n.roles)
               and (cardinality(n.carers) = 0 or u.id = any(n.carers))) as audience
      from app.carer_notices n order by n.created_at desc`;
}

export async function notice(id: string) {
  if (!ID.test(id)) return null;
  const [n] = await sql<Notice[]>`select *, 0 as reads, 0 as audience from app.carer_notices where id = ${id}`;
  return n ?? null;
}

/** Creates or updates a notice from the admin form. */
export async function saveNotice(f: FormData, by: string) {
  const title = String(f.get("title") ?? "").trim();
  const body = String(f.get("body") ?? "").trim();
  if (!title || !body) throw new Error("Give the notice a title and a message.");
  const roles = f.getAll("roles").map(String).filter((r) => ["rn", "en", "dsw", "pca"].includes(r));
  const carers = f.getAll("carers").map(String).filter((c) => ID.test(c));
  const v = { title, body, roles, carers, active: f.get("active") === "on", updated_at: new Date() };
  const id = String(f.get("id") ?? "");
  if (ID.test(id)) {
    await sql`update app.carer_notices set ${sql(v)} where id = ${id}`;
    return id;
  }
  const [r] = await sql<{ id: string }[]>`insert into app.carer_notices ${sql({ ...v, created_by: by })} returning id`;
  return r.id;
}

export async function setActive(id: string, on: boolean) {
  if (ID.test(id)) await sql`update app.carer_notices set active = ${on}, updated_at = now() where id = ${id}`;
}

export async function deleteNotice(id: string) {
  if (ID.test(id)) await sql`delete from app.carer_notices where id = ${id}`;
}

/** Starts a notice again: everyone sees it once more. */
export async function resetReads(id: string) {
  if (ID.test(id)) await sql`delete from app.carer_notice_reads where notice = ${id}`;
}

export type CarerNotice = { id: string; title: string; body: string };

/** The active notices this carer hasn't tapped "Got it" on yet, oldest first. */
export function noticesFor(carer: string) {
  return sql<CarerNotice[]>`
    select n.id, n.title, n.body
      from app.carer_notices n, app.users u
     where u.id = ${carer} and n.active
       and (cardinality(n.roles) = 0 or u.roles && n.roles)
       and (cardinality(n.carers) = 0 or u.id = any(n.carers))
       and not exists (select 1 from app.carer_notice_reads r where r.notice = n.id and r.carer = u.id)
     order by n.created_at`;
}

export async function markRead(notice: string, carer: string) {
  if (ID.test(notice)) await sql`insert into app.carer_notice_reads (notice, carer) values (${notice}, ${carer}) on conflict do nothing`;
}

/** Active, approved carers to choose from. */
export function carerChoices() {
  return sql<{ id: string; name: string; roles: string[] | null }[]>`
    select id, coalesce(nullif(trim(concat_ws(' ', first_name, last_name)), ''), email) as name, roles
      from app.users where account_type = 'carer' and coalesce(active, false) and coalesce(account_status, false)
     order by first_name, last_name`;
}
