// Bubble -> Supabase one-way sync, fetch step.
// Pulls objects changed since each type's watermark from the Bubble Data API
// into sync.bubble_raw. sync.apply_bubble() (pg_cron) turns them into app rows.
//
// Secrets: BUBBLE_API_TOKEN (required), BUBBLE_BASE_URL (optional, defaults to live;
// set it to the version-test URL to rehearse). Callers must send x-sync-secret matching Vault's bubble_sync_secret.
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
const TOKEN = Deno.env.get("BUBBLE_API_TOKEN");
const BASE = (Deno.env.get("BUBBLE_BASE_URL") ??
  "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");
const BUDGET_MS = 110_000;
const PAGE = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const [v] = await sql`select decrypted_secret as s from vault.decrypted_secrets where name = 'bubble_sync_secret'`;
  if (!v?.s || req.headers.get("x-sync-secret") !== v.s) return json({ error: "forbidden" }, 403);
  if (!TOKEN) return json({ error: "BUBBLE_API_TOKEN is not set" }, 500);

  const t0 = Date.now();
  const got = await sql`
    update sync.lock set running_until = now() + interval '3 minutes'
     where id = 1 and (running_until is null or running_until < now())
    returning id`;
  if (got.length === 0) return json({ skipped: "already running" });

  const [run] = await sql`insert into sync.runs (kind) values ('fetch') returning id`;
  const report: Record<string, number | string> = {};
  let total = 0;

  try {
    const due = await sql`
      select bubble_type, api_path, watermark from sync.types
       where enabled and (backlog or last_run is null
              or last_run < now() - make_interval(mins => every_minutes) + interval '1 minute')
       order by backlog desc, last_run nulls first`;

    for (const t of due) {
      if (Date.now() - t0 > BUDGET_MS) break;
      const since = t.watermark ? new Date(new Date(t.watermark).getTime() - 1000).toISOString() : null;
      let cursor = 0;
      let maxMod: string | null = null;
      let done = false;
      let count = 0;
      try {
        while (Date.now() - t0 < BUDGET_MS) {
          const p = new URLSearchParams({
            cursor: String(cursor),
            limit: String(PAGE),
            sort_field: "Modified Date",
            descending: "false",
          });
          if (since) {
            p.set("constraints", JSON.stringify([{ key: "Modified Date", constraint_type: "greater than", value: since }]));
          }
          const res = await fetch(`${BASE}/${t.api_path}?${p}`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
          const r = (await res.json()).response;
          const rows = r.results ?? [];
          if (rows.length) {
            await sql`
              insert into sync.bubble_raw (bubble_id, type, data, modified_at)
              select x->>'_id', ${t.bubble_type}, x, (x->>'Modified Date')::timestamptz
                from jsonb_array_elements(${sql.json(rows)}::jsonb) x
              on conflict (bubble_id) do update
                set data = excluded.data, type = excluded.type, modified_at = excluded.modified_at,
                    fetched_at = now(), applied_at = null, error = null`;
            maxMod = rows[rows.length - 1]["Modified Date"] ?? maxMod;
            count += rows.length;
            cursor += rows.length;
          }
          if (!rows.length || (r.remaining ?? 0) === 0) {
            done = true;
            break;
          }
        }
        await sql`
          update sync.types
             set watermark = coalesce(${maxMod}::timestamptz, watermark),
                 last_run = now(), backlog = ${!done}, last_error = null
           where bubble_type = ${t.bubble_type}`;
        report[t.bubble_type] = count;
        total += count;
      } catch (e) {
        const msg = String((e as Error).message ?? e);
        await sql`update sync.types set last_run = now(), last_error = ${msg} where bubble_type = ${t.bubble_type}`;
        report[t.bubble_type] = `error: ${msg}`;
      }
    }
  } finally {
    await sql`update sync.runs set finished_at = now(), rows = ${total}, detail = ${sql.json(report)} where id = ${run.id}`;
    await sql`update sync.lock set running_until = null where id = 1`;
  }
  return json({ fetched: total, report });
});
