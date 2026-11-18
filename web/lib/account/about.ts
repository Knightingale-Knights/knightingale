// "About You": the carer's own words, shared only with clients they work with. Bubble keeps it in Carer Interests.
import { sql } from "@/lib/db";

import { ABOUT_FIELDS, type About, type AboutKey } from "./aboutSteps";
export { ABOUT_FIELDS, ABOUT_STEPS, type About, type AboutKey } from "./aboutSteps";

const empty = () => Object.fromEntries(ABOUT_FIELDS.map((k) => [k, ""])) as About;

export async function aboutOf(carer: string): Promise<About> {
  const [r] = await sql<Partial<About>[]>`
    select ${sql(ABOUT_FIELDS as unknown as string[])} from app.carer_interests where carer = ${carer} order by updated_at desc nulls last limit 1`;
  const out = empty();
  for (const k of ABOUT_FIELDS) out[k] = r?.[k] ?? "";
  return out;
}

export async function saveAbout(carer: string, input: Partial<About>) {
  const v = empty();
  for (const k of ABOUT_FIELDS) v[k] = String(input[k] ?? "").trim().slice(0, 3000);
  if (!v.why_care) throw new Error("Please tell us why you care.");
  const vals = Object.fromEntries(ABOUT_FIELDS.map((k) => [k, v[k] || null]));
  await sql.begin(async (txx) => {
    const tx = txx as unknown as typeof sql;
    const [r] = await tx<{ id: string }[]>`select id from app.carer_interests where carer = ${carer} order by updated_at desc nulls last limit 1 for update`;
    if (r) await tx`update app.carer_interests set ${tx(vals)}, updated_at = now() where id = ${r.id}`;
    else {
      const [n] = await tx<{ id: string }[]>`insert into app.carer_interests ${tx({ ...vals, carer, created_by: carer })} returning id`;
      await tx`update app.users set interests = ${n.id} where id = ${carer} and interests is null`;
    }
  });
}
