// Admin "View as": an admin sees and uses the app as another user, like Bubble's Run as.
// The cookie holds the view-as session id, signed with LINK_SECRET and tied to the admin's email.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const VIEW_AS_COOKIE = "kg_view_as";
const HOURS = 8;

const sign = (session: string, adminEmail: string) =>
  createHmac("sha256", process.env.LINK_SECRET ?? "dev-view-as").update(`${session}:${adminEmail.toLowerCase()}`).digest("base64url").slice(0, 32);

export function viewAsToken(session: string, adminEmail: string) {
  return `${session}.${sign(session, adminEmail)}`;
}

/** The view-as session in the cookie, if it is valid for this admin. */
export async function viewAsSession(adminEmail: string): Promise<{ session: string; target: string } | null> {
  const raw = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!raw) return null;
  const [session, mac] = raw.split(".");
  if (!session || !mac || !/^[0-9a-f-]{36}$/i.test(session)) return null;
  const want = Buffer.from(sign(session, adminEmail));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [row] = await sql<{ target: string }[]>`
    select target from app.view_as_log
     where id = ${session} and ended_at is null and started_at > now() - make_interval(hours => ${HOURS})`;
  return row ? { session, target: row.target } : null;
}

export async function startViewAs(admin: { id: string; email: string }, target: string) {
  const [row] = await sql<{ id: string }[]>`insert into app.view_as_log (admin, target) values (${admin.id}, ${target}) returning id`;
  (await cookies()).set(VIEW_AS_COOKIE, viewAsToken(row.id, admin.email), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: HOURS * 3600,
  });
}

export async function stopViewAs(session: string | null) {
  if (session) await sql`update app.view_as_log set ended_at = now() where id = ${session} and ended_at is null`;
  (await cookies()).delete(VIEW_AS_COOKIE);
}

/** Records an action taken while viewing as someone. */
export async function logViewAsAction(session: string, page: string | null) {
  await sql`insert into app.view_as_actions (session, page) values (${session}, ${page ? page.slice(0, 300) : null})`;
}
