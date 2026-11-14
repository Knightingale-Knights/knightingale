-- Deletion clean-up. Bubble's Data API can't report deletes, so once a day
-- the bubble-sync function (mode "reconcile") compares each type's count in
-- Bubble with ours. On a mismatch, or weekly, it lists every id for that type
-- into sync.seen, re-checks each missing id one by one (paging can skip ids
-- when records are deleted mid-scan), then sync.finish_scan() removes rows
-- Bubble no longer has.

alter table sync.types
  add column bubble_count int,
  add column last_count_check timestamptz,
  add column last_full_scan timestamptz,
  add column scan_cursor int;

create table sync.seen (
  bubble_type text not null,
  bubble_id text not null,
  primary key (bubble_type, bubble_id)
);
alter table sync.seen enable row level security;

create or replace function sync.finish_scan(p_type text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  tbl text := (select app_table from sync.types where bubble_type = p_type);
  seen_n int := (select count(*) from sync.seen where bubble_type = p_type);
  ours_n int := (select count(*) from sync.bubble_raw where type = p_type);
  gone text[];
begin
  -- Safety: never delete more than a third of a type in one sweep.
  select coalesce(array_agg(b.bubble_id), '{}') into gone
    from sync.bubble_raw b
   where b.type = p_type
     and not exists (select 1 from sync.seen s where s.bubble_type = p_type and s.bubble_id = b.bubble_id);
  if cardinality(gone) > greatest(10, ours_n / 3) then
    update sync.types set last_error = format('reconcile stopped: %s of %s rows missing in Bubble', cardinality(gone), ours_n),
                          scan_cursor = null
     where bubble_type = p_type;
    delete from sync.seen where bubble_type = p_type;
    return -1;
  end if;

  if cardinality(gone) > 0 then
    execute format('delete from app.%I where bubble_id = any ($1)', tbl) using gone;
    delete from sync.bubble_raw where type = p_type and bubble_id = any (gone);
  end if;
  delete from sync.seen where bubble_type = p_type;
  update sync.types set last_full_scan = now(), scan_cursor = null, bubble_count = seen_n
   where bubble_type = p_type;
  insert into sync.runs (kind, finished_at, rows, detail)
  values ('reconcile', now(), cardinality(gone), jsonb_build_object('type', p_type, 'deleted', to_jsonb(gone)));
  return cardinality(gone);
end $$;

revoke all on function sync.finish_scan(text) from public;

-- 03:00 to 05:59 Melbourne (16:00 to 18:59 UTC in daylight saving), every 10 minutes,
-- offset from the fetch job. Runs pick up where the last one stopped.
select cron.schedule('bubble-sync-reconcile', '3-59/10 16-18 * * *', $job$
  select net.http_post(
    url := 'https://zfirdbbyiagmrfsmcqrx.supabase.co/functions/v1/bubble-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bubble_sync_secret')),
    body := '{"mode":"reconcile"}'::jsonb,
    timeout_milliseconds := 150000)
$job$);
