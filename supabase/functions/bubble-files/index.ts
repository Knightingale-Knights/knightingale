// Copies Bubble's stored files into Supabase Storage (bucket "files") so they outlive Bubble.
// Each call claims up to `limit` pending rows in app.file_copies and copies them a few at a time.
// Callers must send x-sync-secret matching Vault's bubble_sync_secret (same as bubble-sync).
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const STORAGE = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/files`;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha1(s: string) {
  const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** bubble/<first 2 of hash>/<hash>-<file name>, so names stay readable and never collide. */
async function pathFor(url: string) {
  const h = await sha1(url);
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file").replace(/[^\w.\- ]+/g, "_").slice(-80);
  return `bubble/${h.slice(0, 2)}/${h}-${name}`;
}

async function copy(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (res.status === 403 || res.status === 404) return { status: "missing" as const, error: `HTTP ${res.status}` };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? "application/octet-stream";
  const path = await pathFor(url);
  const up = await fetch(`${STORAGE}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": mime, "x-upsert": "true", "cache-control": "max-age=31536000" },
    body: bytes,
  });
  if (!up.ok) throw new Error(`storage ${up.status}: ${(await up.text()).slice(0, 200)}`);
  return { status: "copied" as const, path, bytes: bytes.length, mime };
}

Deno.serve(async (req) => {
  const [v] = await sql`select decrypted_secret as s from vault.decrypted_secrets where name = 'bubble_sync_secret'`;
  if (!v?.s || req.headers.get("x-sync-secret") !== v.s) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body.limit) || 40, 1), 200);
  if (body.queue) await sql`select sync.queue_bubble_files()`;

  const claimed = await sql<{ url: string }[]>`
    update app.file_copies set attempts = attempts + 1, status = 'failed', error = 'in progress', claimed_at = now()
     where url in (select url from app.file_copies
                    where status = 'pending'
                       or (status = 'failed' and attempts < 3 and (error is distinct from 'in progress' or claimed_at < now() - interval '10 minutes'))
                    order by site desc, url limit ${limit} for update skip locked)
     returning url`;
  const out = { claimed: claimed.length, copied: 0, missing: 0, failed: 0 };
  const queue = [...claimed];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      try {
        const r = await copy(c.url);
        if (r.status === "copied") {
          await sql`update app.file_copies set status = 'copied', path = ${r.path}, bytes = ${r.bytes}, mime = ${r.mime}, error = null, copied_at = now() where url = ${c.url}`;
          out.copied++;
        } else {
          await sql`update app.file_copies set status = 'missing', error = ${r.error} where url = ${c.url}`;
          out.missing++;
        }
      } catch (e) {
        await sql`update app.file_copies set status = 'failed', error = ${String((e as Error).message ?? e).slice(0, 300)} where url = ${c.url}`;
        out.failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  const [left] = await sql<{ n: number }[]>`select count(*)::int as n from app.file_copies where status = 'pending' or (status = 'failed' and attempts < 3)`;
  return json({ ...out, remaining: left.n });
});
