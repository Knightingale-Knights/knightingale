// Bubble -> Supabase one-way sync.
//
// Default mode ("fetch"): pulls objects changed since each type's watermark from
// the Bubble Data API into sync.bubble_raw. sync.apply_bubble() (pg_cron) turns
// them into app rows.
//
// Mode "reconcile" (daily): finds records deleted in Bubble. Compares each type's
// count with ours; on a mismatch or weekly, lists every id into sync.seen,
// re-checks missing ids one by one, then sync.finish_scan() removes them.
//
// Secrets: BUBBLE_API_TOKEN (required), BUBBLE_BASE_URL (optional, defaults to live;
// set it to the version-test URL to rehearse). Callers must send x-sync-secret
// matching Vault's bubble_sync_secret.
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
const TOKEN = Deno.env.get("BUBBLE_API_TOKEN");
const BASE = (Deno.env.get("BUBBLE_BASE_URL") ??
  "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");
const BUDGET_MS = 110_000;
const PAGE = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function bubble(path: string, params?: URLSearchParams) {
  const res = await fetch(`${BASE}/${path}${params ? `?${params}` : ""}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res;
}

async function page(apiPath: string, cursor: number, limit: number, sortField: string, constraints?: unknown[]) {
  const p = new URLSearchParams({
    cursor: String(cursor),
    limit: String(limit),
    sort_field: sortField,
    descending: "false",
  });
  if (constraints) p.set("constraints", JSON.stringify(constraints));
  const res = await bubble(apiPath, p);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).response as { results: Record<string, unknown>[]; count: number; remaining: number };
}

async function fetchChanges(t0: number, report: Record<string, number | string>) {
  let total = 0;
  const due = await sql`
    select bubble_type, api_path, watermark from sync.types
     where enabled and (backlog or last_run is null
            or last_run < now() - make_interval(mins => every_minutes) + interval '1 minute')
     order by backlog desc, last_run nulls first`;

  for (const t of due) {
    if (Date.now() - t0 > BUDGET_MS) break;
    const since = t.watermark ? new Date(new Date(t.watermark).getTime() - 1000).toISOString() : null;
    const constraints = since ? [{ key: "Modified Date", constraint_type: "greater than", value: since }] : undefined;
    let cursor = 0;
    let maxMod: string | null = null;
    let done = false;
    let count = 0;
    try {
      while (Date.now() - t0 < BUDGET_MS) {
        const r = await page(t.api_path, cursor, PAGE, "Modified Date", constraints);
        const rows = r.results ?? [];
        if (rows.length) {
          await sql`
            insert into sync.bubble_raw (bubble_id, type, data, modified_at)
            select x->>'_id', ${t.bubble_type}, x, (x->>'Modified Date')::timestamptz
              from jsonb_array_elements(${sql.json(rows as postgres.JSONValue)}::jsonb) x
            on conflict (bubble_id) do update
              set data = excluded.data, type = excluded.type, modified_at = excluded.modified_at,
                  fetched_at = now(), applied_at = null, error = null`;
          maxMod = (rows[rows.length - 1]["Modified Date"] as string) ?? maxMod;
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
  return total;
}

async function reconcile(t0: number, report: Record<string, number | string>) {
  let deleted = 0;
  // Types mid-scan first, then types not count-checked in the last 20 hours.
  const due = await sql`
    select bubble_type, api_path, scan_cursor, last_full_scan from sync.types
     where enabled and (scan_cursor is not null
            or last_count_check is null or last_count_check < now() - interval '20 hours')
     order by scan_cursor is null, last_count_check nulls first`;

  for (const t of due) {
    if (Date.now() - t0 > BUDGET_MS) break;
    try {
      let cursor: number | null = t.scan_cursor;
      if (cursor === null) {
        const r = await page(t.api_path, 0, 1, "Created Date");
        const theirs = (r.count ?? 0) + (r.remaining ?? 0);
        const [{ ours }] = await sql`select count(*)::int as ours from sync.bubble_raw where type = ${t.bubble_type}`;
        const weekly = t.last_full_scan && Date.now() - new Date(t.last_full_scan).getTime() > 7 * 86_400_000;
        await sql`
          update sync.types set bubble_count = ${theirs}, last_count_check = now(),
                 last_full_scan = coalesce(last_full_scan, case when ${theirs === ours} then now() end)
           where bubble_type = ${t.bubble_type}`;
        if (theirs === ours && !weekly) {
          report[t.bubble_type] = "ok";
          continue;
        }
        await sql`delete from sync.seen where bubble_type = ${t.bubble_type}`;
        cursor = 0;
      }

      // List every id, sorted by Created Date so new records land at the end.
      let complete = false;
      while (Date.now() - t0 < BUDGET_MS) {
        const r = await page(t.api_path, cursor, PAGE, "Created Date");
        const ids = (r.results ?? []).map((x) => x._id as string);
        if (ids.length) {
          await sql`
            insert into sync.seen (bubble_type, bubble_id)
            select ${t.bubble_type}, unnest(${ids}::text[]) on conflict do nothing`;
          cursor += ids.length;
        }
        if (!ids.length || (r.remaining ?? 0) === 0) {
          complete = true;
          break;
        }
      }
      if (!complete) {
        await sql`update sync.types set scan_cursor = ${cursor} where bubble_type = ${t.bubble_type}`;
        report[t.bubble_type] = `scanning (${cursor})`;
        break;
      }

      // Re-check each missing id directly: paging can skip ids if records were deleted mid-scan.
      const missing = await sql`
        select b.bubble_id from sync.bubble_raw b
         where b.type = ${t.bubble_type}
           and not exists (select 1 from sync.seen s where s.bubble_type = b.type and s.bubble_id = b.bubble_id)
         limit 500`;
      for (const m of missing) {
        const res = await bubble(`${t.api_path}/${m.bubble_id}`);
        if (res.ok) {
          await sql`insert into sync.seen values (${t.bubble_type}, ${m.bubble_id}) on conflict do nothing`;
        } else if (res.status !== 404) {
          throw new Error(`re-check HTTP ${res.status}`);
        }
        await res.body?.cancel();
      }

      const [{ n }] = await sql`select sync.finish_scan(${t.bubble_type}) as n`;
      report[t.bubble_type] = n < 0 ? "stopped: too many missing" : `deleted ${n}`;
      if (n > 0) deleted += n;
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      await sql`update sync.types set last_error = ${msg} where bubble_type = ${t.bubble_type}`;
      report[t.bubble_type] = `error: ${msg}`;
    }
  }
  return deleted;
}

Deno.serve(async (req) => {
  const [v] = await sql`select decrypted_secret as s from vault.decrypted_secrets where name = 'bubble_sync_secret'`;
  if (!v?.s || req.headers.get("x-sync-secret") !== v.s) return json({ error: "forbidden" }, 403);
  if (!TOKEN) return json({ error: "BUBBLE_API_TOKEN is not set" }, 500);

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "reconcile" ? "reconcile" : "fetch";

  const t0 = Date.now();
  const got = await sql`
    update sync.lock set running_until = now() + interval '3 minutes'
     where id = 1 and (running_until is null or running_until < now())
    returning id`;
  if (got.length === 0) return json({ skipped: "already running" });

  const [run] = await sql`insert into sync.runs (kind) values (${mode}) returning id`;
  const report: Record<string, number | string> = {};
  let total = 0;
  try {
    total = mode === "reconcile" ? await reconcile(t0, report) : await fetchChanges(t0, report);
  } finally {
    await sql`update sync.runs set finished_at = now(), rows = ${total}, detail = ${sql.json(report)} where id = ${run.id}`;
    await sql`update sync.lock set running_until = null where id = 1`;
  }
  return json({ mode, rows: total, report });
});
