// Profile photos are only ever shown small, so they are kept as a 320px WebP (about 20 KB) instead of the original.
import { createHash } from "node:crypto";
import sharp from "sharp";
import { sql } from "@/lib/db";

export const PHOTO_MIME = "image/webp";

/** Square 320px WebP, turned the right way up from the camera's orientation. */
export async function shrinkPhoto(bytes: Buffer | Uint8Array): Promise<Buffer> {
  return sharp(bytes, { failOn: "none" }).rotate().resize(320, 320, { fit: "cover" }).webp({ quality: 78 }).toBuffer();
}

const storageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/files/${path.split("/").map(encodeURIComponent).join("/")}`;
const auth = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { Authorization: `Bearer ${key}`, apikey: key };
};

/** Is this Bubble file someone's profile photo? */
export async function isProfilePhoto(url: string) {
  const [r] = await sql<{ ok: boolean }[]>`select exists (select 1 from app.users where profile_photo = ${url}) as ok`;
  return r.ok;
}

/**
 * Replaces a Bubble profile photo's stored copy with the small WebP and deletes the original copy.
 * Bubble's own file is untouched. Returns the small photo, or null if the original can't be read.
 */
export async function shrinkBubblePhoto(url: string, original: { path: string } | null): Promise<Buffer | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const src = original
    ? await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/files/${original.path.split("/").map(encodeURIComponent).join("/")}`, { headers: auth(), cache: "no-store" })
    : await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!src.ok) return null;
  let small: Buffer;
  try {
    small = await shrinkPhoto(Buffer.from(await src.arrayBuffer()));
  } catch {
    return null;
  }
  const path = `photos/${createHash("sha1").update(url).digest("hex")}.webp`;
  const up = await fetch(storageUrl(path), {
    method: "POST",
    headers: { ...auth(), "Content-Type": PHOTO_MIME, "x-upsert": "true", "cache-control": "max-age=31536000" },
    body: new Uint8Array(small),
  });
  if (!up.ok) return small; // still serve it; try saving again next time
  await sql`
    insert into app.file_copies (url, path, bytes, mime, status, copied_at)
    values (${url}, ${path}, ${small.length}, ${PHOTO_MIME}, 'copied', now())
    on conflict (url) do update set path = excluded.path, bytes = excluded.bytes, mime = excluded.mime,
      status = 'copied', error = null, copied_at = now()`;
  if (original && original.path !== path) await fetch(storageUrl(original.path), { method: "DELETE", headers: auth() });
  return small;
}
