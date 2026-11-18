// "About You": the carer's own words, shared only with clients they work with. Bubble keeps it in Carer Interests.
import { sql } from "@/lib/db";

export const ABOUT_FIELDS = [
  "why_care", "education", "skills", "hobbies", "animal", "pets", "tv_film", "film", "music", "musical_genre", "team", "sport",
] as const;
export type AboutKey = (typeof ABOUT_FIELDS)[number];
export type About = Record<AboutKey, string>;

/** The steps after the intro, as in Bubble. */
export const ABOUT_STEPS: { title: string; fields: { key: AboutKey; label: string; rows: number }[] }[] = [
  { title: "Why do you care?", fields: [{ key: "why_care", label: "", rows: 9 }] },
  { title: "Education / Skills", fields: [{ key: "education", label: "List your education courses:", rows: 4 }, { key: "skills", label: "List all your skills:", rows: 4 }] },
  { title: "Hobbies", fields: [{ key: "hobbies", label: "Do you have any hobbies outside work?", rows: 4 }] },
  { title: "Animals", fields: [{ key: "animal", label: "Your fave animal, why?", rows: 4 }, { key: "pets", label: "Tell us about any pets you've had.", rows: 4 }] },
  { title: "TV & Film", fields: [{ key: "tv_film", label: "Your fave TV show, why?", rows: 4 }, { key: "film", label: "Your fave movie, why?", rows: 4 }] },
  { title: "Music", fields: [{ key: "music", label: "Your fave band, why?", rows: 4 }, { key: "musical_genre", label: "Your fave musical genre, why?", rows: 4 }] },
  { title: "Sport", fields: [{ key: "team", label: "Your fave sports? Which team?", rows: 4 }, { key: "sport", label: "What sport do you play?", rows: 4 }] },
];

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
