// Culture of Care progress: one app.care_culture_checklists row per carer (users.care_culture points to it).
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail } from "@/lib/postmark";
import { CULTURE_KEYS, type CultureKey } from "./videos";

export type CultureState = Record<CultureKey, boolean>;

const empty = () => Object.fromEntries(CULTURE_KEYS.map((k) => [k, false])) as CultureState;

export async function cultureState(userId: string): Promise<CultureState> {
  const [row] = await sql<Record<string, boolean | null>[]>`
    select c.* from app.users u join app.care_culture_checklists c on c.id = u.care_culture where u.id = ${userId}`;
  const s = empty();
  if (row) for (const k of CULTURE_KEYS) s[k] = Boolean(row[k]);
  return s;
}

/** Marks one video watched. Watching the last one tells Paul, as Bubble did, so he can book the Zoom. */
export async function markWatched(userId: string, key: CultureKey) {
  const first = await sql.begin(async (tx) => {
    let [u] = await tx<{ care_culture: string | null; first_name: string | null; last_name: string | null; email: string | null }[]>`
      select care_culture, first_name, last_name, email from app.users where id = ${userId} for update`;
    if (!u) throw new Error("Carer not found.");
    let id = u.care_culture;
    if (!id) {
      [{ id }] = await tx<{ id: string }[]>`insert into app.care_culture_checklists (carer, created_by) values (${userId}, ${userId}) returning id`;
      await tx`update app.users set care_culture = ${id} where id = ${userId}`;
    }
    const [was] = await tx<{ v: boolean | null }[]>`select ${tx(key)} as v from app.care_culture_checklists where id = ${id}`;
    await tx`update app.care_culture_checklists set ${tx(key)} = true, updated_at = now() where id = ${id}`;
    return !was?.v ? u : null;
  });
  if (key !== "future" || !first) return;
  const name = [first.first_name, first.last_name].filter(Boolean).join(" ");
  await sendPlainEmail({
    to: env.complianceAlertTo,
    subject: `CULTURE OF CARE COMPLETED (${name})`,
    text: `${first.first_name ?? name} completed Culture of Care!!\n\nSet a date and time with them to do the zoom!\n\n${first.email ?? ""}`,
    attachments: [],
  }).catch((e) => console.error("Culture of Care email failed", e));
}

/** How many of the Culture of Care videos the carer has finished, out of all of them. */
export async function cultureProgress(userId: string) {
  const s = await cultureState(userId);
  const done = CULTURE_KEYS.filter((k) => s[k]).length;
  return { done, total: CULTURE_KEYS.length, complete: done === CULTURE_KEYS.length };
}
