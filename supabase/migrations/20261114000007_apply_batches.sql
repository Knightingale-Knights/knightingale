-- Apply in batches so each run stays inside the statement timeout.
-- Pass 1 writes rows without references. sync.link_rows() then fills
-- references and join tables for those rows. When a backlog spans several
-- batches, a repair sweep re-links every row once the backlog is clear,
-- so references to rows that arrived in later batches are filled in.
drop function if exists sync.apply_bubble();

create or replace function sync.link_rows(p_ids text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cfg jsonb := (select value from sync.config where key = 'map');
  t record; j jsonb; r record; refcols text[]; refset text;
begin
  for t in select distinct s.bubble_type, s.app_table
             from sync.types s join sync.bubble_raw b on b.type = s.bubble_type
            where b.bubble_id = any (p_ids) loop
    select string_agg(format('%1$I = (select y.id from %2$s y where y.id = r.%1$I)', a.attname, c.confrelid::regclass), ', '),
           coalesce(array_agg(a.attname::text), '{}')
      into refset, refcols
      from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.conrelid = format('app.%I', t.app_table)::regclass and c.contype = 'f'
       and a.attname not in ('auth_user_id');
    if refset is null then continue; end if;
    for r in select bubble_id, data from sync.bubble_raw
              where type = t.bubble_type and bubble_id = any (p_ids) and applied_at is not null loop
      execute format(
        'update app.%1$I x set %2$s from jsonb_populate_record(null::app.%1$I, $1) r where x.id = r.id',
        t.app_table, refset)
      using sync.to_row(t.app_table, r.bubble_id, r.data, refcols);
    end loop;
  end loop;

  for j in select value from jsonb_array_elements(cfg->'joins') loop
    execute format(
      'delete from app.%1$I x using sync.bubble_raw b
        where b.type = %2$L and b.bubble_id = any ($1) and b.applied_at is not null
          and x.%3$I = sync.bid_uuid(b.bubble_id)',
      j->>2, j->>0, j->>3) using p_ids;
    execute format(
      'insert into app.%1$I (%3$I, %4$I)
       select distinct sync.bid_uuid(b.bubble_id), sync.bid_uuid(e)
         from sync.bubble_raw b
         cross join lateral jsonb_array_elements_text(
           case when jsonb_typeof(b.data->%5$L) = ''array'' then b.data->%5$L else ''[]''::jsonb end) e
        where b.type = %2$L and b.bubble_id = any ($1) and b.applied_at is not null
          and exists (select 1 from app.%6$I t where t.id = sync.bid_uuid(e))
       on conflict do nothing',
      j->>2, j->>0, j->>3, j->>4, j->>1, j->>5) using p_ids;
  end loop;
end $$;

create or replace function sync.apply_bubble(p_limit int default 5000) returns int
language plpgsql security definer set search_path = '' as $$
declare
  t record; r record;
  cols text; sets text; refcols text[];
  ids text[] := '{}'; n int := 0; run_id bigint; cur text;
begin
  -- One apply at a time.
  if not pg_try_advisory_xact_lock(424242) then
    return 0;
  end if;
  insert into sync.runs (kind) values ('apply') returning id into run_id;

  for t in select bubble_type, app_table from sync.types loop
    exit when n >= p_limit;
    if not exists (select 1 from sync.bubble_raw where type = t.bubble_type and applied_at is null) then
      continue;
    end if;
    select string_agg(quote_ident(column_name), ', '),
           string_agg(format('%1$I = excluded.%1$I', column_name), ', ') filter (where column_name not in ('id', 'created_at'))
      into cols, sets
      from information_schema.columns where table_schema = 'app' and table_name = t.app_table;
    select coalesce(array_agg(a.attname::text), '{}') into refcols
      from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.conrelid = format('app.%I', t.app_table)::regclass and c.contype = 'f'
       and a.attname not in ('auth_user_id');

    for r in select bubble_id, data from sync.bubble_raw
              where type = t.bubble_type and applied_at is null
              limit greatest(p_limit - n, 0) loop
      begin
        execute format(
          'insert into app.%1$I (%2$s) select %2$s from jsonb_populate_record(null::app.%1$I, $1) on conflict (id) do update set %3$s',
          t.app_table, cols, sets)
        using sync.to_row(t.app_table, r.bubble_id, r.data, refcols) - refcols;
        update sync.bubble_raw set applied_at = now(), error = null where bubble_id = r.bubble_id;
        ids := ids || r.bubble_id;
        n := n + 1;
      exception when others then
        update sync.bubble_raw set error = sqlerrm where bubble_id = r.bubble_id;
      end;
    end loop;
  end loop;

  if n > 0 then
    perform sync.link_rows(ids);
  end if;

  -- A full batch means more may be pending: schedule a repair sweep.
  if n >= p_limit then
    insert into sync.config values ('repair_cursor', '""'::jsonb)
    on conflict (key) do update set value = '""'::jsonb;
  elsif n = 0 then
    -- Backlog clear: run the repair sweep in batches if one is due.
    select value #>> '{}' into cur from sync.config where key = 'repair_cursor';
    if cur is not null then
      select coalesce(array_agg(bubble_id), '{}') into ids from (
        select bubble_id from sync.bubble_raw
         where applied_at is not null and bubble_id > cur
         order by bubble_id limit p_limit) s;
      if cardinality(ids) = 0 then
        delete from sync.config where key = 'repair_cursor';
      else
        perform sync.link_rows(ids);
        update sync.config set value = to_jsonb(ids[cardinality(ids)]) where key = 'repair_cursor';
        n := -cardinality(ids);
      end if;
    end if;
  end if;

  update sync.runs set finished_at = now(), rows = n where id = run_id;
  return n;
end $$;

revoke all on function sync.apply_bubble(int) from public;
revoke all on function sync.link_rows(text[]) from public;

select cron.unschedule('bubble-sync-apply');
select cron.schedule('bubble-sync-apply', '5-59/10 * * * *',
  $job$ set statement_timeout = '9min'; select sync.apply_bubble(5000) $job$);
