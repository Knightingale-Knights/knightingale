-- Some Bubble dates were entered as year 0 or earlier, which Postgres
-- rejects. Treat those values as blank, and keep fixing protocol-relative URLs.
create or replace function sync.fix_url(v jsonb) returns jsonb
language sql immutable as $$
  select case
    when jsonb_typeof(v) = 'string' and v #>> '{}' ~ '^(-\d+|0000)-\d\d-\d\dT' then 'null'::jsonb
    when jsonb_typeof(v) = 'string' and v #>> '{}' like '//%' then to_jsonb('https:' || (v #>> '{}'))
    when jsonb_typeof(v) = 'array' then coalesce((select jsonb_agg(sync.fix_url(e)) from jsonb_array_elements(v) e), '[]'::jsonb)
    else v end
$$;
