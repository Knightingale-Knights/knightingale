import { sql } from "@/lib/db";
import { copied, fromStorage } from "@/lib/files";

/** The bytes of a stored compliance file: a new-app upload (/files/<id>) or a Bubble file (copied to Storage, or fetched). */
export async function fileBytes(url: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const own = url.match(/^\/files\/([0-9a-f-]{36})$/i);
  if (own) {
    const [f] = await sql<{ bytes: Buffer; mime: string }[]>`select bytes, mime from app.compliance_files where id = ${own[1]}`;
    return f ? { bytes: Buffer.from(f.bytes), mime: f.mime } : null;
  }
  const abs = url.startsWith("//") ? `https:${url}` : url;
  const c = (await copied(abs)) ?? (await copied(url));
  const res = c ? await fromStorage(c.path) : await fetch(abs).catch(() => null);
  if (!res || !res.ok) return null;
  const mime = (c?.mime ?? res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  return { bytes: Buffer.from(await res.arrayBuffer()), mime };
}
