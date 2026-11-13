-- Schedule the Bubble sync. A random shared secret lives in Vault as
-- bubble_sync_secret; the edge function checks callers against it.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'bubble_sync_secret')
where not exists (select 1 from vault.secrets where name = 'bubble_sync_secret');

select cron.schedule('bubble-sync-fetch', '*/10 * * * *', $job$
  select net.http_post(
    url := 'https://zfirdbbyiagmrfsmcqrx.supabase.co/functions/v1/bubble-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bubble_sync_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000)
$job$);

select cron.schedule('bubble-sync-apply', '5-59/10 * * * *', $job$ select sync.apply_bubble() $job$);
